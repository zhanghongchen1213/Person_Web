import { eq, desc, or, and, sql, ne, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  InsertUser,
  users,
  articles,
  categories,
  Article,
  Category,
  ContentType,
  backupSettings,
  BackupInterval,
  pageViews,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import * as fs from "fs";
import * as path from "path";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create pg connection pool with SSL for remote MemfireDB
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10, // MemfireDB 免费额度连接数限制
        ssl: { rejectUnauthorized: false }, // 远程数据库 SSL 必须
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Verify connection is working
      const testClient = await _pool.connect();
      testClient.release();

      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

export function getPool() {
  return _pool;
}

export async function ensureFulltextIndex() {
  const pool = getPool();
  if (!pool) return false;
  try {
    // Create GIN index for full-text search on articles (title + content)
    // Uses 'simple' config for better CJK (Chinese/Japanese/Korean) support
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_fulltext
      ON articles
      USING GIN (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("content", '')))
    `);

    // Verify index exists
    const result = await pool.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'articles' AND indexname = 'idx_articles_fulltext'
    `);

    if (result.rows.length === 0) {
      console.error("[Database] Fulltext index verification failed");
      return false;
    }

    return true;
  } catch (e) {
    console.error("[Database] Failed to create fulltext index:", e);
    return false;
  }
}

// User functions
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = [
      "name",
      "email",
      "loginMethod",
      "avatar",
      "bio",
    ] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    // Always update updatedAt on upsert (PostgreSQL has no ON UPDATE CURRENT_TIMESTAMP)
    updateSet.updatedAt = new Date();

    if (Object.keys(updateSet).length === 1) {
      // Only updatedAt was set, also update lastSignedIn
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Article functions
export interface ArticleWithRelations extends Article {
  author: { id: number; name: string | null; avatar: string | null };
  category: Category | null;
}

export async function getArticles(options: {
  limit?: number;
  page?: number;
  status?: "draft" | "published" | "archived";
  type?: ContentType;
  categorySlug?: string;
  search?: string;
  authorId?: number;
}): Promise<{
  articles: ArticleWithRelations[];
  total: number;
  totalPages: number;
}> {
  const db = await getDb();
  if (!db) return { articles: [], total: 0, totalPages: 0 };

  const {
    limit = 10,
    page = 1,
    status,
    type,
    categorySlug,
    search,
    authorId,
  } = options;
  const offset = (page - 1) * limit;

  // Build conditions
  const baseConditions = [];
  if (status) baseConditions.push(eq(articles.status, status));
  if (type) baseConditions.push(eq(articles.type, type));
  if (authorId) baseConditions.push(eq(articles.authorId, authorId));

  if (categorySlug) {
    const cat = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);
    if (cat.length > 0) baseConditions.push(eq(articles.categoryId, cat[0].id));
  }

  // Build search condition using PostgreSQL tsvector/tsquery with ILIKE fallback
  let conditions = [...baseConditions];
  let total = 0;
  if (search) {
    const sanitized = search.trim();

    if (sanitized.length > 0) {
      // Use plainto_tsquery for safe user input handling (prevents SQL injection)
      const ftsCondition = sql`to_tsvector('simple', coalesce(${articles.title}, '') || ' ' || coalesce(${articles.content}, '')) @@ plainto_tsquery('simple', ${sanitized})`;

      try {
        const ftsConditions = [...baseConditions, ftsCondition];
        const ftsWhere = ftsConditions.length > 0 ? and(...ftsConditions) : undefined;
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(articles)
          .where(ftsWhere);
        total = Number(countResult[0]?.count || 0);

        if (total > 0) {
          conditions = ftsConditions;
        }
      } catch {
        // tsquery failed, will fall through to ILIKE fallback
        total = 0;
      }
    }

    // Fallback to ILIKE if full-text search returned 0 results or failed
    if (total === 0) {
      const escapedSearch = search.replace(/[%_\\]/g, '\\$&');
      const likeCondition = or(
        sql`${articles.title} ILIKE ${'%' + escapedSearch + '%'}`,
        sql`${articles.content} ILIKE ${'%' + escapedSearch + '%'}`
      );
      conditions = [...baseConditions, likeCondition!];
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(and(...conditions));
      total = Number(countResult[0]?.count || 0);
    }
  } else {
    // No search term: count with base conditions only
    const whereForCount =
      baseConditions.length > 0 ? and(...baseConditions) : undefined;
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(whereForCount);
    total = Number(countResult[0]?.count || 0);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalPages = Math.ceil(total / limit);

  const articleList = await db
    .select()
    .from(articles)
    .where(whereClause)
    .orderBy(desc(articles.publishedAt), desc(articles.createdAt))
    .limit(limit)
    .offset(offset);

  if (articleList.length === 0) {
    return { articles: [], total, totalPages };
  }

  // Batch fetch authors (avoid N+1)
  const authorIds = Array.from(new Set(articleList.map(a => a.authorId)));
  const authorsResult = await db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
    })
    .from(users)
    .where(
      sql`${users.id} IN (${sql.join(
        authorIds.map(id => sql`${id}`),
        sql`, `
      )})`
    );
  const authorMap = new Map(authorsResult.map(a => [a.id, a]));

  // Batch fetch categories (avoid N+1)
  const categoryIds = Array.from(
    new Set(
      articleList
        .map(a => a.categoryId)
        .filter((id): id is number => id !== null)
    )
  );
  let categoryMap = new Map<number, Category>();
  if (categoryIds.length > 0) {
    const categoriesResult = await db
      .select()
      .from(categories)
      .where(
        sql`${categories.id} IN (${sql.join(
          categoryIds.map(id => sql`${id}`),
          sql`, `
        )})`
      );
    categoryMap = new Map(categoriesResult.map(c => [c.id, c]));
  }

  // Build articles with relations (in-memory, no additional queries)
  const articlesWithRelations: ArticleWithRelations[] = articleList.map(
    article => ({
      ...article,
      author: authorMap.get(article.authorId) || {
        id: article.authorId,
        name: null,
        avatar: null,
      },
      category: article.categoryId
        ? categoryMap.get(article.categoryId) || null
        : null,
    })
  );

  return { articles: articlesWithRelations, total, totalPages };
}

export async function getArticleBySlug(
  slug: string
): Promise<ArticleWithRelations | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);
  if (result.length === 0) return null;

  const article = result[0];

  // Get author
  const authorResult = await db
    .select({ id: users.id, name: users.name, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, article.authorId))
    .limit(1);
  const author = authorResult[0] || {
    id: article.authorId,
    name: null,
    avatar: null,
  };

  // Get category
  let category: Category | null = null;
  if (article.categoryId) {
    const catResult = await db
      .select()
      .from(categories)
      .where(eq(categories.id, article.categoryId))
      .limit(1);
    category = catResult[0] || null;
  }

  return { ...article, author, category };
}

export async function getArticleById(
  id: number
): Promise<ArticleWithRelations | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  if (result.length === 0) return null;

  const article = result[0];

  // Get author
  const authorResult = await db
    .select({ id: users.id, name: users.name, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, article.authorId))
    .limit(1);
  const author = authorResult[0] || {
    id: article.authorId,
    name: null,
    avatar: null,
  };

  // Get category
  let category: Category | null = null;
  if (article.categoryId) {
    const catResult = await db
      .select()
      .from(categories)
      .where(eq(categories.id, article.categoryId))
      .limit(1);
    category = catResult[0] || null;
  }

  return { ...article, author, category };
}

export async function createArticle(data: {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  coverImage?: string;
  authorId: number;
  categoryId?: number;
  status?: "draft" | "published" | "archived";
  type?: ContentType;
  order?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(articles).values({
    ...data,
    type: data.type ?? "blog",
    order: data.order ?? 0,
    publishedAt: data.status === "published" ? new Date() : null,
  }).returning({ id: articles.id });

  return result[0].id;
}

export async function updateArticle(
  id: number,
  data: {
    title?: string;
    slug?: string;
    summary?: string;
    content?: string;
    coverImage?: string;
    categoryId?: number;
    status?: "draft" | "published" | "archived";
    type?: ContentType;
    order?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };

  if (data.status === "published") {
    // Check if already published
    const existing = await db
      .select({ publishedAt: articles.publishedAt })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);
    if (!existing[0]?.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  await db.update(articles).set(updateData).where(eq(articles.id, id));
}

export async function deleteArticle(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(articles).where(eq(articles.id, id));
}

export async function upsertArticle(data: {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  coverImage?: string;
  authorId: number;
  categoryId?: number;
  status?: "draft" | "published" | "archived";
  type?: ContentType;
  order?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(articles).values({
    ...data,
    type: data.type ?? "blog",
    order: data.order ?? 0,
    publishedAt: data.status === "published" ? new Date() : null,
  }).onConflictDoUpdate({
    target: articles.slug,
    set: {
      title: data.title,
      summary: data.summary ?? null,
      content: data.content,
      coverImage: data.coverImage ?? null,
      authorId: data.authorId,
      categoryId: data.categoryId ?? null,
      status: data.status ?? "draft",
      type: data.type ?? "blog",
      order: data.order ?? 0,
      updatedAt: new Date(),
      publishedAt: data.status === "published" ? new Date() : undefined,
    },
  }).returning({ id: articles.id });

  return result[0].id;
}

export async function updateArticlePublishedAt(
  id: number,
  publishedAt: Date
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(articles).set({ publishedAt, updatedAt: new Date() }).where(eq(articles.id, id));
}

// Category functions

/**
 * Generate a URL-friendly slug from a category name
 * Converts Chinese and special characters to a safe format
 * Includes Unicode normalization and control character filtering
 */
function generateSlug(name: string): string {
  // Unicode normalization (NFC) and trim
  const normalized = name.normalize('NFC').trim();

  return normalized
    .toLowerCase()
    // Replace spaces with hyphens
    .replace(/[\s]+/g, "-")
    // Remove control characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    // Keep only alphanumeric, Chinese characters, and hyphens
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    // Replace multiple hyphens with single hyphen
    .replace(/--+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique slug with timestamp suffix to avoid race conditions.
 * Uses database unique constraint + onConflictDoUpdate for atomicity.
 */
function generateUniqueSlug(baseName: string): string {
  const baseSlug = generateSlug(baseName);
  const timestamp = Date.now().toString(36).slice(-4);
  return `${baseSlug}-${timestamp}`;
}

export async function getCategories(options?: {
  type?: ContentType;
}): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];

  if (options?.type) {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.type, options.type))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  return await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Find or create a category by name
 * If a category with the given name exists, return it
 * Otherwise, create a new category with auto-generated slug
 * Uses database-level case-insensitive query for efficiency
 */
export async function findOrCreateCategory(data: {
  name: string;
  type: ContentType;
}): Promise<Category> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Use database-level case-insensitive query for efficiency
  const existing = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.type, data.type),
        sql`LOWER(${categories.name}) = LOWER(${data.name})`
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Category doesn't exist, create with unique slug
  const slug = generateUniqueSlug(data.name);
  const result = await db.insert(categories).values({
    name: data.name,
    slug,
    type: data.type,
    sortOrder: 0,
  }).onConflictDoUpdate({
    target: categories.slug,
    set: {
      name: data.name,
      type: data.type,
    },
  }).returning();

  if (result.length === 0) {
    throw new Error("Failed to create category");
  }

  return result[0];
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  type?: ContentType;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Use onConflictDoUpdate to handle slug conflicts gracefully
  const result = await db.insert(categories).values({
    ...data,
    type: data.type ?? "blog",
  }).onConflictDoUpdate({
    target: categories.slug,
    set: {
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      sortOrder: data.sortOrder ?? 0,
      type: data.type ?? "blog",
    },
  }).returning({ id: categories.id });
  return result[0].id;
}

export async function updateCategory(
  id: number,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
    type?: ContentType;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if category has articles
  const articleCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(eq(articles.categoryId, id));

  if (Number(articleCount[0]?.count || 0) > 0) {
    throw new Error("Cannot delete category with existing articles");
  }

  await db.delete(categories).where(eq(categories.id, id));
}

// Analytics overview for admin dashboard
export async function getAnalyticsOverview(): Promise<{
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  totalUsers: number;
  totalCategories: number;
  articlesByCategory: Array<{ name: string; count: number }>;
  articlesByMonth: Array<{ month: string; count: number }>;
  topArticles: Array<{ title: string; slug: string; viewCount: number }>;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      totalViews: 0,
      totalUsers: 0,
      totalCategories: 0,
      articlesByCategory: [],
      articlesByMonth: [],
      topArticles: [],
    };
  }

  const [
    totalResult,
    publishedResult,
    draftResult,
    userResult,
    categoryResult,
    viewsResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(articles),
    db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.status, "published")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.status, "draft")),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(categories),
    db.select({ count: sql<number>`count(*)` }).from(pageViews),
  ]);

  // Articles by category (published only)
  const byCategoryResult = await db
    .select({
      name: categories.name,
      count: sql<number>`count(*)`,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.status, "published"))
    .groupBy(categories.name);

  // Articles by month (last 12 months, published only)
  const byMonthResult = await db
    .select({
      month: sql<string>`TO_CHAR(${articles.publishedAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)`,
    })
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        sql`${articles.publishedAt} >= NOW() - INTERVAL '12 months'`
      )
    )
    .groupBy(sql`TO_CHAR(${articles.publishedAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${articles.publishedAt}, 'YYYY-MM')`);

  // Top 10 published articles by actual page view count
  const topResult = await db
    .select({
      title: articles.title,
      slug: articles.slug,
      viewCount: sql<number>`count(${pageViews.id})`,
    })
    .from(articles)
    .leftJoin(pageViews, eq(articles.id, pageViews.articleId))
    .where(eq(articles.status, "published"))
    .groupBy(articles.id, articles.title, articles.slug)
    .orderBy(sql`count(${pageViews.id}) DESC`)
    .limit(10);

  return {
    totalArticles: Number(totalResult[0]?.count || 0),
    publishedArticles: Number(publishedResult[0]?.count || 0),
    draftArticles: Number(draftResult[0]?.count || 0),
    totalViews: Number(viewsResult[0]?.count || 0),
    totalUsers: Number(userResult[0]?.count || 0),
    totalCategories: Number(categoryResult[0]?.count || 0),
    articlesByCategory: byCategoryResult.map(r => ({
      name: r.name,
      count: Number(r.count),
    })),
    articlesByMonth: byMonthResult.map(r => ({
      month: r.month,
      count: Number(r.count),
    })),
    topArticles: topResult.map(r => ({
      title: r.title,
      slug: r.slug,
      viewCount: Number(r.viewCount),
    })),
  };
}

// Stats - simplified without view count
export async function getStats(): Promise<{
  articleCount: number;
  categoryCount: number;
}> {
  const db = await getDb();
  if (!db) return { articleCount: 0, categoryCount: 0 };

  const [articleResult, categoryResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.status, "published")),
    db.select({ count: sql<number>`count(*)` }).from(categories),
  ]);

  return {
    articleCount: Number(articleResult[0]?.count || 0),
    categoryCount: Number(categoryResult[0]?.count || 0),
  };
}

// Archive - get articles grouped by year and month
export async function getArchive(): Promise<
  Array<{
    year: number;
    month: number;
    count: number;
    articles: Array<{
      id: number;
      title: string;
      slug: string;
      publishedAt: Date | null;
      categoryName: string | null;
    }>;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const articleList = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      publishedAt: articles.publishedAt,
      categoryId: articles.categoryId,
    })
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt));

  // Get all categories for lookup
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map(c => [c.id, c.name]));

  // Group by year and month
  const grouped = new Map<
    string,
    {
      year: number;
      month: number;
      count: number;
      articles: Array<{
        id: number;
        title: string;
        slug: string;
        publishedAt: Date | null;
        categoryName: string | null;
      }>;
    }
  >();

  for (const article of articleList) {
    const date = article.publishedAt
      ? new Date(article.publishedAt)
      : new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;

    if (!grouped.has(key)) {
      grouped.set(key, { year, month, count: 0, articles: [] });
    }
    const group = grouped.get(key)!;
    group.count++;
    group.articles.push({
      ...article,
      categoryName: article.categoryId
        ? categoryMap.get(article.categoryId) || null
        : null,
    });
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

// Get articles count by category (optimized with GROUP BY to avoid N+1)
export async function getArticleCountByCategory(): Promise<
  Array<{ categoryId: number; categoryName: string; categorySlug: string; count: number }>
> {
  const db = await getDb();
  if (!db) return [];

  // Get all categories
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  // Get counts in a single query using GROUP BY
  const countResults = await db
    .select({
      categoryId: articles.categoryId,
      count: sql<number>`count(*)`,
    })
    .from(articles)
    .where(eq(articles.status, "published"))
    .groupBy(articles.categoryId);

  // Build count map
  const countMap = new Map<number, number>();
  for (const row of countResults) {
    if (row.categoryId !== null) {
      countMap.set(row.categoryId, Number(row.count));
    }
  }

  // Combine with categories
  return allCategories.map(cat => ({
    categoryId: cat.id,
    categoryName: cat.name,
    categorySlug: cat.slug,
    count: countMap.get(cat.id) || 0,
  }));
}

/**
 * Helper function to batch fetch article relations (authors and categories).
 * Avoids N+1 problem by using IN queries.
 */
async function batchFetchArticleRelations(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  articleList: Article[]
): Promise<ArticleWithRelations[]> {
  if (articleList.length === 0) return [];

  // Batch fetch authors
  const authorIds = Array.from(new Set(articleList.map(a => a.authorId)));
  const authorsResult = await db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
    })
    .from(users)
    .where(
      sql`${users.id} IN (${sql.join(
        authorIds.map(id => sql`${id}`),
        sql`, `
      )})`
    );
  const authorMap = new Map(authorsResult.map(a => [a.id, a]));

  // Batch fetch categories
  const categoryIds = Array.from(
    new Set(
      articleList
        .map(a => a.categoryId)
        .filter((id): id is number => id !== null)
    )
  );
  let categoryMap = new Map<number, Category>();
  if (categoryIds.length > 0) {
    const categoriesResult = await db
      .select()
      .from(categories)
      .where(
        sql`${categories.id} IN (${sql.join(
          categoryIds.map(id => sql`${id}`),
          sql`, `
        )})`
      );
    categoryMap = new Map(categoriesResult.map(c => [c.id, c]));
  }

  // Build result
  return articleList.map(article => ({
    ...article,
    author: authorMap.get(article.authorId) || {
      id: article.authorId,
      name: null,
      avatar: null,
    },
    category: article.categoryId
      ? categoryMap.get(article.categoryId) || null
      : null,
  }));
}

// Get related articles (same category, excluding current article)
export async function getRelatedArticles(
  articleId: number,
  categoryId: number | null,
  limit: number = 4
): Promise<ArticleWithRelations[]> {
  const db = await getDb();
  if (!db) return [];

  // If no category, return latest published articles
  if (!categoryId) {
    const result = await db
      .select()
      .from(articles)
      .where(and(eq(articles.status, "published"), ne(articles.id, articleId)))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return await batchFetchArticleRelations(db, result);
  }

  // Get articles from same category
  const result = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        eq(articles.categoryId, categoryId),
        ne(articles.id, articleId)
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit);

  return await batchFetchArticleRelations(db, result);
}

// Initialize default categories
export async function initDefaultCategories(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const defaultCategories = [
    {
      name: "技术",
      slug: "tech",
      description: "技术相关文章",
      icon: "Code",
      sortOrder: 1,
      type: "blog" as const,
    },
    {
      name: "生活",
      slug: "life",
      description: "生活随想",
      icon: "Heart",
      sortOrder: 2,
      type: "blog" as const,
    },
    {
      name: "随笔",
      slug: "essay",
      description: "随笔文章",
      icon: "FileText",
      sortOrder: 3,
      type: "blog" as const,
    },
    {
      name: "开源",
      slug: "opensource",
      description: "开源项目相关",
      icon: "GitBranch",
      sortOrder: 4,
      type: "blog" as const,
    },
    {
      name: "其他",
      slug: "other",
      description: "其他分类",
      icon: "MoreHorizontal",
      sortOrder: 5,
      type: "blog" as const,
    },
  ];

  for (const cat of defaultCategories) {
    try {
      await db.insert(categories).values(cat).onConflictDoUpdate({
        target: categories.slug,
        set: {
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          sortOrder: cat.sortOrder,
          type: cat.type,
        },
      });
    } catch (error) {
      console.warn(`Failed to create category ${cat.name}:`, error);
    }
  }
}

/**
 * Document tree item type for documentation navigation
 */
export interface DocTreeItem {
  id: number;
  title: string;
  slug: string;
  order: number;
  summary: string | null;
}

/**
 * Document tree structure: category with its articles sorted by order
 */
export interface DocTree {
  category: Category;
  articles: DocTreeItem[];
}

/**
 * Get document tree for documentation navigation.
 * Returns categories of type 'doc' with their articles sorted by order field.
 * Uses batch query to avoid N+1 problem.
 *
 * @param categorySlug - Optional: filter by specific category slug
 * @returns Array of DocTree objects
 */
export async function getDocTree(categorySlug?: string): Promise<DocTree[]> {
  const db = await getDb();
  if (!db) return [];

  // Step 1: Get all doc-type categories (single query)
  const categoryConditions = [eq(categories.type, "doc")];
  if (categorySlug) {
    categoryConditions.push(eq(categories.slug, categorySlug));
  }

  const docCategories = await db
    .select()
    .from(categories)
    .where(and(...categoryConditions))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  if (docCategories.length === 0) return [];

  // Step 2: Get all published doc articles for these categories (single query - avoids N+1)
  const categoryIds = docCategories.map(c => c.id);
  const docArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      order: articles.order,
      summary: articles.summary,
      categoryId: articles.categoryId,
    })
    .from(articles)
    .where(
      and(
        eq(articles.type, "doc"),
        eq(articles.status, "published"),
        sql`${articles.categoryId} IN (${sql.join(
          categoryIds.map(id => sql`${id}`),
          sql`, `
        )})`
      )
    )
    .orderBy(asc(articles.order), asc(articles.title));

  // Step 3: Group articles by category (in-memory, O(n))
  const articlesByCategory = new Map<number, DocTreeItem[]>();
  for (const article of docArticles) {
    if (article.categoryId === null) continue;

    if (!articlesByCategory.has(article.categoryId)) {
      articlesByCategory.set(article.categoryId, []);
    }
    articlesByCategory.get(article.categoryId)!.push({
      id: article.id,
      title: article.title,
      slug: article.slug,
      order: article.order,
      summary: article.summary,
    });
  }

  // Step 4: Build result
  return docCategories.map(category => ({
    category,
    articles: articlesByCategory.get(category.id) || [],
  }));
}

/**
 * Category with articles for enhanced category query
 */
export interface CategoryWithArticles extends Category {
  articles: ArticleWithRelations[];
  articleCount: number;
}

/**
 * Get category by slug with its articles.
 * Uses optimized batch queries to avoid N+1 problem.
 *
 * @param slug - Category slug
 * @param options - Query options
 * @returns CategoryWithArticles or null
 */
// ============================================
// Database Export/Import Functions
// ============================================

export interface DatabaseExportData {
  version: string;
  exportedAt: string;
  data: {
    users: Array<typeof users.$inferSelect>;
    articles: Array<typeof articles.$inferSelect>;
    categories: Array<typeof categories.$inferSelect>;
    pageViews?: Array<typeof pageViews.$inferSelect>;
    backupSettings?: Array<typeof backupSettings.$inferSelect>;
  };
}

export interface DatabaseStats {
  userCount: number;
  articleCount: number;
  categoryCount: number;
  pageViewCount: number;
  backupSettingsCount: number;
}

/**
 * Get database statistics for preview
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const db = await getDb();
  if (!db)
    return {
      userCount: 0,
      articleCount: 0,
      categoryCount: 0,
      pageViewCount: 0,
      backupSettingsCount: 0,
    };

  const [
    userResult,
    articleResult,
    categoryResult,
    pageViewResult,
    backupSettingsResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(articles),
    db.select({ count: sql<number>`count(*)` }).from(categories),
    db.select({ count: sql<number>`count(*)` }).from(pageViews),
    db.select({ count: sql<number>`count(*)` }).from(backupSettings),
  ]);

  return {
    userCount: Number(userResult[0]?.count || 0),
    articleCount: Number(articleResult[0]?.count || 0),
    categoryCount: Number(categoryResult[0]?.count || 0),
    pageViewCount: Number(pageViewResult[0]?.count || 0),
    backupSettingsCount: Number(backupSettingsResult[0]?.count || 0),
  };
}

/**
 * Export all data from database
 */
export async function exportAllData(): Promise<{
  exportData: DatabaseExportData;
  stats: DatabaseStats;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [
    usersData,
    articlesData,
    categoriesData,
    pageViewsData,
    backupSettingsData,
  ] = await Promise.all([
    db.select().from(users),
    db.select().from(articles),
    db.select().from(categories),
    db.select().from(pageViews),
    db.select().from(backupSettings),
  ]);

  const exportData: DatabaseExportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: {
      users: usersData,
      articles: articlesData,
      categories: categoriesData,
      pageViews: pageViewsData,
      backupSettings: backupSettingsData,
    },
  };

  const stats: DatabaseStats = {
    userCount: usersData.length,
    articleCount: articlesData.length,
    categoryCount: categoriesData.length,
    pageViewCount: pageViewsData.length,
    backupSettingsCount: backupSettingsData.length,
  };

  return { exportData, stats };
}

/**
 * Import all data to database (replaces existing data)
 * Uses transaction to ensure atomicity
 */
export async function importAllData(
  data: DatabaseExportData
): Promise<DatabaseStats> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate version
  if (data.version !== "1.0") {
    throw new Error(`Unsupported data version: ${data.version}. Expected: 1.0`);
  }

  // Use raw connection for transaction
  const pool = getPool();
  if (!pool) throw new Error("Cannot access database connection pool");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Delete in order: pageViews → articles → categories → users, backupSettings (respect foreign key dependencies)
    await client.query("DELETE FROM page_views");
    await client.query("DELETE FROM articles");
    await client.query("DELETE FROM categories");
    await client.query("DELETE FROM users");
    await client.query("DELETE FROM backup_settings");

    // Insert in order: users → categories → articles
    if (data.data.users.length > 0) {
      for (const user of data.data.users) {
        await client.query(
          `INSERT INTO users (id, "openId", name, email, avatar, bio, "loginMethod", role, "createdAt", "updatedAt", "lastSignedIn")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            user.id,
            user.openId,
            user.name,
            user.email,
            user.avatar,
            user.bio,
            user.loginMethod,
            user.role,
            user.createdAt,
            user.updatedAt,
            user.lastSignedIn,
          ]
        );
      }
    }

    if (data.data.categories.length > 0) {
      for (const cat of data.data.categories) {
        await client.query(
          `INSERT INTO categories (id, name, slug, description, icon, "sortOrder", type, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            cat.id,
            cat.name,
            cat.slug,
            cat.description,
            cat.icon,
            cat.sortOrder,
            cat.type,
            cat.createdAt,
          ]
        );
      }
    }

    if (data.data.articles.length > 0) {
      for (const article of data.data.articles) {
        await client.query(
          `INSERT INTO articles (id, title, slug, summary, content, "coverImage", "authorId", "categoryId", status, type, "order", "publishedAt", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            article.id,
            article.title,
            article.slug,
            article.summary,
            article.content,
            article.coverImage,
            article.authorId,
            article.categoryId,
            article.status,
            article.type,
            article.order,
            article.publishedAt,
            article.createdAt,
            article.updatedAt,
          ]
        );
      }
    }

    // Import pageViews (optional for backward compatibility)
    if (data.data.pageViews && data.data.pageViews.length > 0) {
      for (const pv of data.data.pageViews) {
        await client.query(
          `INSERT INTO page_views (id, "articleId", ip, "userAgent", path, "viewedAt")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            pv.id,
            pv.articleId,
            pv.ip,
            pv.userAgent,
            pv.path,
            pv.viewedAt,
          ]
        );
      }
    }

    // Import backupSettings (optional for backward compatibility)
    if (data.data.backupSettings && data.data.backupSettings.length > 0) {
      for (const bs of data.data.backupSettings) {
        await client.query(
          `INSERT INTO backup_settings (id, enabled, "interval", "lastBackupAt", "nextBackupAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            bs.id,
            bs.enabled,
            bs.interval,
            bs.lastBackupAt,
            bs.nextBackupAt,
            bs.updatedAt,
          ]
        );
      }
    }

    // Reset sequences to max id + 1 for each table with SERIAL primary key
    // Use pg_get_serial_sequence() to dynamically resolve sequence names
    const tables = [
      { table: 'users', column: 'id' },
      { table: 'categories', column: 'id' },
      { table: 'articles', column: 'id' },
      { table: 'page_views', column: 'id' },
      { table: 'backup_settings', column: 'id' },
    ];
    for (const { table, column } of tables) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence($1, $2), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`,
        [table, column]
      );
    }

    await client.query("COMMIT");

    return {
      userCount: data.data.users.length,
      articleCount: data.data.articles.length,
      categoryCount: data.data.categories.length,
      pageViewCount: data.data.pageViews?.length ?? 0,
      backupSettingsCount: data.data.backupSettings?.length ?? 0,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getCategoryWithArticles(
  slug: string,
  options?: {
    limit?: number;
    page?: number;
    status?: "draft" | "published" | "archived";
  }
): Promise<{
  category: CategoryWithArticles;
  total: number;
  totalPages: number;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const { limit = 10, page = 1, status = "published" } = options || {};
  const offset = (page - 1) * limit;

  // Step 1: Get category
  const categoryResult = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (categoryResult.length === 0) return null;
  const category = categoryResult[0];

  // Step 2: Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(
      and(eq(articles.categoryId, category.id), eq(articles.status, status))
    );
  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  // Step 3: Get articles with sorting based on category type
  const orderByClause =
    category.type === "doc"
      ? [asc(articles.order), asc(articles.title)]
      : [desc(articles.publishedAt), desc(articles.createdAt)];

  const articleList = await db
    .select()
    .from(articles)
    .where(
      and(eq(articles.categoryId, category.id), eq(articles.status, status))
    )
    .orderBy(...orderByClause)
    .limit(limit)
    .offset(offset);

  if (articleList.length === 0) {
    return {
      category: { ...category, articles: [], articleCount: total },
      total,
      totalPages,
    };
  }

  // Step 4: Batch fetch authors (avoid N+1)
  const authorIds = Array.from(new Set(articleList.map(a => a.authorId)));
  const authorsResult = await db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
    })
    .from(users)
    .where(
      sql`${users.id} IN (${sql.join(
        authorIds.map(id => sql`${id}`),
        sql`, `
      )})`
    );

  const authorMap = new Map(authorsResult.map(a => [a.id, a]));

  // Step 5: Build articles with relations
  const articlesWithRelations: ArticleWithRelations[] = articleList.map(
    article => ({
      ...article,
      author: authorMap.get(article.authorId) || {
        id: article.authorId,
        name: null,
        avatar: null,
      },
      category,
    })
  );

  return {
    category: {
      ...category,
      articles: articlesWithRelations,
      articleCount: total,
    },
    total,
    totalPages,
  };
}

// ============================================
// Backup Settings Functions
// ============================================

const BACKUP_DIR = path.join(process.cwd(), "backups");
const MAX_BACKUP_FILES = 10;

export async function ensureBackupDir(): Promise<void> {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export interface BackupSettingsData {
  enabled: boolean;
  interval: BackupInterval;
  lastBackupAt: Date | null;
  nextBackupAt: Date | null;
}

export async function getBackupSettings(): Promise<BackupSettingsData> {
  const db = await getDb();
  if (!db) {
    return {
      enabled: false,
      interval: "monthly",
      lastBackupAt: null,
      nextBackupAt: null,
    };
  }

  const result = await db.select().from(backupSettings).limit(1);
  if (result.length === 0) {
    // Create default settings
    await db.insert(backupSettings).values({ enabled: false, interval: "monthly" });
    return {
      enabled: false,
      interval: "monthly",
      lastBackupAt: null,
      nextBackupAt: null,
    };
  }

  const settings = result[0];
  return {
    enabled: settings.enabled,
    interval: settings.interval,
    lastBackupAt: settings.lastBackupAt,
    nextBackupAt: settings.nextBackupAt,
  };
}

export async function updateBackupSettings(
  enabled: boolean,
  interval: BackupInterval
): Promise<BackupSettingsData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const nextBackupAt = enabled ? calculateNextBackupTime(interval) : null;

  const existing = await db.select().from(backupSettings).limit(1);
  if (existing.length === 0) {
    await db.insert(backupSettings).values({
      enabled,
      interval,
      nextBackupAt,
    });
  } else {
    await db
      .update(backupSettings)
      .set({
        enabled,
        interval,
        nextBackupAt,
        updatedAt: new Date(),
      })
      .where(eq(backupSettings.id, existing[0].id));
  }

  return {
    enabled,
    interval,
    lastBackupAt: existing[0]?.lastBackupAt || null,
    nextBackupAt,
  };
}

export async function updateLastBackupTime(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const settings = await getBackupSettings();
  const nextBackupAt = calculateNextBackupTime(settings.interval);

  await db.update(backupSettings).set({
    lastBackupAt: new Date(),
    nextBackupAt,
    updatedAt: new Date(),
  });
}

function calculateNextBackupTime(interval: BackupInterval): Date {
  const now = new Date();
  const next = new Date(now);

  switch (interval) {
    case "weekly":
      // Next Sunday at 00:00
      next.setDate(now.getDate() + (7 - now.getDay()));
      break;
    case "monthly":
      // First day of next month at 00:00
      next.setMonth(now.getMonth() + 1, 1);
      break;
    case "quarterly": {
      // First day of next quarter at 00:00
      const currentQuarter = Math.floor(now.getMonth() / 3);
      next.setMonth((currentQuarter + 1) * 3, 1);
      break;
    }
  }

  next.setHours(0, 0, 0, 0);
  return next;
}

export async function saveBackupFile(
  data: DatabaseExportData
): Promise<string> {
  await ensureBackupDir();

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `auto-backup-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");

  // Clean up old backups
  await cleanupOldBackups();

  return filepath;
}

// ============================================
// Page View Tracking Functions
// ============================================

export async function ensurePageViewsTable(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        "articleId" INTEGER,
        ip VARCHAR(45),
        "userAgent" VARCHAR(512),
        path VARCHAR(500),
        "viewedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views ("viewedAt")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_page_views_article_id ON page_views ("articleId")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (path)`);
  } catch (e) {
    console.warn("[Database] Failed to ensure page_views table:", e);
  }
}

export async function recordPageView(data: {
  articleId?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  path?: string | null;
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(pageViews).values({
      articleId: data.articleId ?? null,
      ip: data.ip ?? null,
      userAgent: data.userAgent?.slice(0, 512) ?? null,
      path: data.path?.slice(0, 500) ?? null,
    });
  } catch {
    // silently fail - don't break user experience for analytics
  }
}

export async function getPageViewStats(days: number = 30): Promise<{
  totalViews: number;
  todayViews: number;
  dailyViews: Array<{ date: string; views: number; uniqueVisitors: number }>;
  articleViews: Array<{
    articleId: number;
    title: string;
    slug: string;
    views: number;
  }>;
  topPaths: Array<{ path: string; views: number }>;
}> {
  // Issue 1 Fix: Validate days parameter to prevent SQL injection
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error("Invalid days parameter: must be integer between 1 and 365");
  }

  const db = await getDb();
  if (!db) {
    return {
      totalViews: 0,
      todayViews: 0,
      dailyViews: [],
      articleViews: [],
      topPaths: [],
    };
  }

  const [totalResult, todayResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(pageViews),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pageViews)
      .where(sql`DATE(${pageViews.viewedAt}) = CURRENT_DATE`),
  ]);

  // Daily views for last N days
  const dailyResult = await db
    .select({
      date: sql<string>`DATE(${pageViews.viewedAt})`,
      views: sql<number>`count(*)`,
      uniqueVisitors: sql<number>`count(DISTINCT ${pageViews.ip})`,
    })
    .from(pageViews)
    .where(
      sql`${pageViews.viewedAt} >= NOW() - make_interval(days => ${days})`
    )
    .groupBy(sql`DATE(${pageViews.viewedAt})`)
    .orderBy(sql`DATE(${pageViews.viewedAt})`);

  // Issue 4 Fix: Use single JOIN query instead of N+1 pattern
  const articleViews = await db
    .select({
      articleId: pageViews.articleId,
      title: articles.title,
      slug: articles.slug,
      views: sql<number>`count(*)`,
    })
    .from(pageViews)
    .leftJoin(articles, eq(pageViews.articleId, articles.id))
    .where(
      and(
        sql`${pageViews.articleId} IS NOT NULL`,
        sql`${pageViews.viewedAt} >= NOW() - make_interval(days => ${days})`
      )
    )
    .groupBy(pageViews.articleId, articles.title, articles.slug)
    .orderBy(sql`count(*) DESC`)
    .limit(20)
    .then(results =>
      results
        .filter(r => r.articleId && r.title && r.slug)
        .map(r => ({
          articleId: r.articleId!,
          title: r.title!,
          slug: r.slug!,
          views: Number(r.views),
        }))
    );

  // Top paths
  const topPathsResult = await db
    .select({
      path: pageViews.path,
      views: sql<number>`count(*)`,
    })
    .from(pageViews)
    .where(sql`${pageViews.path} IS NOT NULL`)
    .groupBy(pageViews.path)
    .orderBy(sql`count(*) DESC`)
    .limit(10);

  return {
    totalViews: Number(totalResult[0]?.count || 0),
    todayViews: Number(todayResult[0]?.count || 0),
    dailyViews: dailyResult.map(r => ({
      date: String(r.date),
      views: Number(r.views),
      uniqueVisitors: Number(r.uniqueVisitors),
    })),
    articleViews,
    topPaths: topPathsResult.map(r => ({
      path: String(r.path),
      views: Number(r.views),
    })),
  };
}

async function cleanupOldBackups(): Promise<void> {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith("auto-backup-") && f.endsWith(".json"))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  if (files.length > MAX_BACKUP_FILES) {
    const toDelete = files.slice(MAX_BACKUP_FILES);
    for (const file of toDelete) {
      fs.unlinkSync(file.path);
    }
  }
}
