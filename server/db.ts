import { eq, desc, like, or, and, sql, ne, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, articles, categories, Article, Category, ContentType, backupSettings, BackupInterval } from "../drizzle/schema";
import { ENV } from './_core/env';
import * as fs from "fs";
import * as path from "path";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create mysql2 connection pool with proper charset configuration
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        charset: 'utf8mb4',
        connectionLimit: 10,
      });
      _db = drizzle(_pool) as unknown as ReturnType<typeof drizzle>;
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
  if (!pool) return;
  try {
    const [rows] = await pool.execute(
      "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'articles' AND INDEX_NAME = 'ft_title_content'"
    );
    if ((rows as Record<string, unknown>[]).length === 0) {
      await pool.execute(
        "ALTER TABLE articles ADD FULLTEXT INDEX ft_title_content (title, content) WITH PARSER ngram"
      );
    }
  } catch (e) {
    console.warn("[Database] Failed to create fulltext index:", e);
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

    const textFields = ["name", "email", "loginMethod", "avatar", "bio"] as const;
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
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
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
}): Promise<{ articles: ArticleWithRelations[]; total: number; totalPages: number }> {
  const db = await getDb();
  if (!db) return { articles: [], total: 0, totalPages: 0 };

  const { limit = 10, page = 1, status, type, categorySlug, search, authorId } = options;
  const offset = (page - 1) * limit;

  // Build conditions
  const baseConditions = [];
  if (status) baseConditions.push(eq(articles.status, status));
  if (type) baseConditions.push(eq(articles.type, type));
  if (authorId) baseConditions.push(eq(articles.authorId, authorId));

  if (categorySlug) {
    const cat = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
    if (cat.length > 0) baseConditions.push(eq(articles.categoryId, cat[0].id));
  }

  const escapedSearch = search?.replace(/[+\-*~<>()@"]/g, " ").trim();
  const ftCondition = escapedSearch
    ? sql`MATCH(${articles.title}, ${articles.content}) AGAINST(${escapedSearch} IN BOOLEAN MODE)`
    : null;
  const likeCondition = search
    ? or(like(articles.title, `%${search}%`), like(articles.content, `%${search}%`))
    : null;

  let conditions = [...baseConditions];
  let total = 0;

  if (ftCondition) {
    try {
      const ftWhere = and(...conditions, ftCondition);
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(articles).where(ftWhere);
      total = Number(countResult[0]?.count || 0);
      if (total > 0) conditions.push(ftCondition);
    } catch {
      // FULLTEXT index missing or query failed
    }
  }

  if (total === 0 && likeCondition) {
    conditions = [...baseConditions, likeCondition];
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(articles).where(and(...conditions));
    total = Number(countResult[0]?.count || 0);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalPages = Math.ceil(total / limit);

  const articleList = await db.select()
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
  const authorsResult = await db.select({
    id: users.id,
    name: users.name,
    avatar: users.avatar,
  })
    .from(users)
    .where(sql`${users.id} IN (${sql.join(authorIds.map(id => sql`${id}`), sql`, `)})`);
  const authorMap = new Map(authorsResult.map(a => [a.id, a]));

  // Batch fetch categories (avoid N+1)
  const categoryIds = Array.from(new Set(articleList.map(a => a.categoryId).filter((id): id is number => id !== null)));
  let categoryMap = new Map<number, Category>();
  if (categoryIds.length > 0) {
    const categoriesResult = await db.select()
      .from(categories)
      .where(sql`${categories.id} IN (${sql.join(categoryIds.map(id => sql`${id}`), sql`, `)})`);
    categoryMap = new Map(categoriesResult.map(c => [c.id, c]));
  }

  // Build articles with relations (in-memory, no additional queries)
  const articlesWithRelations: ArticleWithRelations[] = articleList.map(article => ({
    ...article,
    author: authorMap.get(article.authorId) || { id: article.authorId, name: null, avatar: null },
    category: article.categoryId ? categoryMap.get(article.categoryId) || null : null,
  }));

  return { articles: articlesWithRelations, total, totalPages };
}

export async function getArticleBySlug(slug: string): Promise<ArticleWithRelations | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  if (result.length === 0) return null;

  const article = result[0];

  // Get author
  const authorResult = await db.select({ id: users.id, name: users.name, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, article.authorId))
    .limit(1);
  const author = authorResult[0] || { id: article.authorId, name: null, avatar: null };

  // Get category
  let category: Category | null = null;
  if (article.categoryId) {
    const catResult = await db.select().from(categories).where(eq(categories.id, article.categoryId)).limit(1);
    category = catResult[0] || null;
  }

  return { ...article, author, category };
}

export async function getArticleById(id: number): Promise<ArticleWithRelations | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (result.length === 0) return null;

  const article = result[0];

  // Get author
  const authorResult = await db.select({ id: users.id, name: users.name, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, article.authorId))
    .limit(1);
  const author = authorResult[0] || { id: article.authorId, name: null, avatar: null };

  // Get category
  let category: Category | null = null;
  if (article.categoryId) {
    const catResult = await db.select().from(categories).where(eq(categories.id, article.categoryId)).limit(1);
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
  });

  return Number(result[0].insertId);
}

export async function updateArticle(id: number, data: {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  coverImage?: string;
  categoryId?: number;
  status?: "draft" | "published" | "archived";
  type?: ContentType;
  order?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = { ...data };
  
  if (data.status === "published") {
    // Check if already published
    const existing = await db.select({ publishedAt: articles.publishedAt })
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

export async function updateArticlePublishedAt(id: number, publishedAt: Date): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(articles).set({ publishedAt }).where(eq(articles.id, id));
}

// Category functions

/**
 * Generate a URL-friendly slug from a category name
 * Converts Chinese and special characters to a safe format
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w\u4e00-\u9fa5-]/g, '') // Keep only alphanumeric, Chinese characters, and hyphens
    .replace(/--+/g, '-')             // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');         // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a number if needed
 */
async function generateUniqueSlug(baseName: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let slug = generateSlug(baseName);
  let counter = 1;

  // Check if slug exists, if so, append counter
  while (true) {
    const existing = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    if (existing.length === 0) break;
    slug = `${generateSlug(baseName)}-${counter}`;
    counter++;
  }

  return slug;
}

export async function getCategories(options?: { type?: ContentType }): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];

  if (options?.type) {
    return await db.select().from(categories)
      .where(eq(categories.type, options.type))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  return await db.select().from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Find or create a category by name
 * If a category with the given name exists, return it
 * Otherwise, create a new category with auto-generated slug
 */
export async function findOrCreateCategory(data: {
  name: string;
  type: ContentType;
}): Promise<Category> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // First, try to find existing category by name (case-insensitive)
  // Get all categories of the same type and filter in memory
  const allCategories = await db.select().from(categories)
    .where(eq(categories.type, data.type));

  const existing = allCategories.find(
    cat => cat.name.toLowerCase() === data.name.toLowerCase()
  );

  if (existing) {
    return existing;
  }

  // Category doesn't exist, create new one
  const slug = await generateUniqueSlug(data.name);
  const result = await db.insert(categories).values({
    name: data.name,
    slug,
    type: data.type,
    sortOrder: 0,
  });

  const newId = Number(result[0].insertId);

  // Fetch and return the newly created category
  const newCategory = await db.select().from(categories).where(eq(categories.id, newId)).limit(1);
  if (newCategory.length === 0) {
    throw new Error("Failed to create category");
  }

  return newCategory[0];
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

  const result = await db.insert(categories).values({
    ...data,
    type: data.type ?? "blog",
  });
  return Number(result[0].insertId);
}

export async function updateCategory(id: number, data: {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  type?: ContentType;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if category has articles
  const articleCount = await db.select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(eq(articles.categoryId, id));
  
  if (Number(articleCount[0]?.count || 0) > 0) {
    throw new Error("Cannot delete category with existing articles");
  }

  await db.delete(categories).where(eq(categories.id, id));
}

// Stats - simplified without view count
export async function getStats(): Promise<{
  articleCount: number;
  categoryCount: number;
}> {
  const db = await getDb();
  if (!db) return { articleCount: 0, categoryCount: 0 };

  const [articleResult, categoryResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(articles).where(eq(articles.status, "published")),
    db.select({ count: sql<number>`count(*)` }).from(categories),
  ]);

  return {
    articleCount: Number(articleResult[0]?.count || 0),
    categoryCount: Number(categoryResult[0]?.count || 0),
  };
}

// Archive - get articles grouped by year and month
export async function getArchive(): Promise<Array<{
  year: number;
  month: number;
  count: number;
  articles: Array<{ id: number; title: string; slug: string; publishedAt: Date | null; categoryName: string | null }>;
}>> {
  const db = await getDb();
  if (!db) return [];

  const articleList = await db.select({
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
  const grouped = new Map<string, {
    year: number;
    month: number;
    count: number;
    articles: Array<{ id: number; title: string; slug: string; publishedAt: Date | null; categoryName: string | null }>;
  }>();

  for (const article of articleList) {
    const date = article.publishedAt ? new Date(article.publishedAt) : new Date();
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
      categoryName: article.categoryId ? categoryMap.get(article.categoryId) || null : null,
    });
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

// Get articles count by category (optimized with GROUP BY to avoid N+1)
export async function getArticleCountByCategory(): Promise<Array<{ categoryId: number; categoryName: string; count: number }>> {
  const db = await getDb();
  if (!db) return [];

  // Get all categories
  const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder));

  // Get counts in a single query using GROUP BY
  const countResults = await db.select({
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
  const authorsResult = await db.select({
    id: users.id,
    name: users.name,
    avatar: users.avatar,
  })
    .from(users)
    .where(sql`${users.id} IN (${sql.join(authorIds.map(id => sql`${id}`), sql`, `)})`);
  const authorMap = new Map(authorsResult.map(a => [a.id, a]));

  // Batch fetch categories
  const categoryIds = Array.from(
    new Set(articleList.map(a => a.categoryId).filter((id): id is number => id !== null))
  );
  let categoryMap = new Map<number, Category>();
  if (categoryIds.length > 0) {
    const categoriesResult = await db.select()
      .from(categories)
      .where(sql`${categories.id} IN (${sql.join(categoryIds.map(id => sql`${id}`), sql`, `)})`);
    categoryMap = new Map(categoriesResult.map(c => [c.id, c]));
  }

  // Build result
  return articleList.map(article => ({
    ...article,
    author: authorMap.get(article.authorId) || { id: article.authorId, name: null, avatar: null },
    category: article.categoryId ? categoryMap.get(article.categoryId) || null : null,
  }));
}

// Get related articles (same category, excluding current article)
export async function getRelatedArticles(articleId: number, categoryId: number | null, limit: number = 4): Promise<ArticleWithRelations[]> {
  const db = await getDb();
  if (!db) return [];

  // If no category, return latest published articles
  if (!categoryId) {
    const result = await db.select()
      .from(articles)
      .where(and(
        eq(articles.status, "published"),
        ne(articles.id, articleId)
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return await batchFetchArticleRelations(db, result);
  }

  // Get articles from same category
  const result = await db.select()
    .from(articles)
    .where(and(
      eq(articles.status, "published"),
      eq(articles.categoryId, categoryId),
      ne(articles.id, articleId)
    ))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);

  return await batchFetchArticleRelations(db, result);
}

// Initialize default categories
export async function initDefaultCategories(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const defaultCategories = [
    { name: "全栈开发", slug: "fullstack", description: "", icon: "Code", sortOrder: 1 },
    { name: "嵌入式开发", slug: "embedded", description: "", icon: "Cpu", sortOrder: 2 },
    { name: "ROS开发", slug: "ros", description: "", icon: "Bot", sortOrder: 3 },
    { name: "深度学习", slug: "deep-learning", description: "", icon: "Brain", sortOrder: 4 },
    { name: "DIY", slug: "diy", description: "", icon: "Wrench", sortOrder: 5 },
  ];

  for (const cat of defaultCategories) {
    try {
      // Check if category exists
      const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
      if (existing.length === 0) {
        await db.insert(categories).values(cat);
      }
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

  const docCategories = await db.select()
    .from(categories)
    .where(and(...categoryConditions))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  if (docCategories.length === 0) return [];

  // Step 2: Get all published doc articles for these categories (single query - avoids N+1)
  const categoryIds = docCategories.map(c => c.id);
  const docArticles = await db.select({
    id: articles.id,
    title: articles.title,
    slug: articles.slug,
    order: articles.order,
    summary: articles.summary,
    categoryId: articles.categoryId,
  })
    .from(articles)
    .where(and(
      eq(articles.type, "doc"),
      eq(articles.status, "published"),
      sql`${articles.categoryId} IN (${sql.join(categoryIds.map(id => sql`${id}`), sql`, `)})`
    ))
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
  };
}

export interface DatabaseStats {
  userCount: number;
  articleCount: number;
  categoryCount: number;
}

/**
 * Get database statistics for preview
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const db = await getDb();
  if (!db) return { userCount: 0, articleCount: 0, categoryCount: 0 };

  const [userResult, articleResult, categoryResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(articles),
    db.select({ count: sql<number>`count(*)` }).from(categories),
  ]);

  return {
    userCount: Number(userResult[0]?.count || 0),
    articleCount: Number(articleResult[0]?.count || 0),
    categoryCount: Number(categoryResult[0]?.count || 0),
  };
}

/**
 * Export all data from database
 */
export async function exportAllData(): Promise<{ exportData: DatabaseExportData; stats: DatabaseStats }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [usersData, articlesData, categoriesData] = await Promise.all([
    db.select().from(users),
    db.select().from(articles),
    db.select().from(categories),
  ]);

  const exportData: DatabaseExportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: {
      users: usersData,
      articles: articlesData,
      categories: categoriesData,
    },
  };

  const stats: DatabaseStats = {
    userCount: usersData.length,
    articleCount: articlesData.length,
    categoryCount: categoriesData.length,
  };

  return { exportData, stats };
}

/**
 * Import all data to database (replaces existing data)
 * Uses transaction to ensure atomicity
 */
export async function importAllData(data: DatabaseExportData): Promise<DatabaseStats> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate version
  if (data.version !== "1.0") {
    throw new Error(`Unsupported data version: ${data.version}. Expected: 1.0`);
  }

  // Use raw connection for transaction
  const pool = getPool();
  if (!pool) throw new Error("Cannot access database connection pool");

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Delete in order: articles → categories → users (respect foreign key dependencies)
    await connection.execute("DELETE FROM articles");
    await connection.execute("DELETE FROM categories");
    await connection.execute("DELETE FROM users");

    // Insert in order: users → categories → articles
    if (data.data.users.length > 0) {
      for (const user of data.data.users) {
        await connection.execute(
          `INSERT INTO users (id, openId, name, email, avatar, bio, loginMethod, role, createdAt, updatedAt, lastSignedIn)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, user.openId, user.name, user.email, user.avatar, user.bio, user.loginMethod, user.role, user.createdAt, user.updatedAt, user.lastSignedIn]
        );
      }
    }

    if (data.data.categories.length > 0) {
      for (const cat of data.data.categories) {
        await connection.execute(
          `INSERT INTO categories (id, name, slug, description, icon, sortOrder, type, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.sortOrder, cat.type, cat.createdAt]
        );
      }
    }

    if (data.data.articles.length > 0) {
      for (const article of data.data.articles) {
        await connection.execute(
          `INSERT INTO articles (id, title, slug, summary, content, coverImage, authorId, categoryId, status, type, \`order\`, publishedAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [article.id, article.title, article.slug, article.summary, article.content, article.coverImage, article.authorId, article.categoryId, article.status, article.type, article.order, article.publishedAt, article.createdAt, article.updatedAt]
        );
      }
    }

    await connection.commit();

    return {
      userCount: data.data.users.length,
      articleCount: data.data.articles.length,
      categoryCount: data.data.categories.length,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getCategoryWithArticles(
  slug: string,
  options?: {
    limit?: number;
    page?: number;
    status?: "draft" | "published" | "archived";
  }
): Promise<{ category: CategoryWithArticles; total: number; totalPages: number } | null> {
  const db = await getDb();
  if (!db) return null;

  const { limit = 10, page = 1, status = "published" } = options || {};
  const offset = (page - 1) * limit;

  // Step 1: Get category
  const categoryResult = await db.select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (categoryResult.length === 0) return null;
  const category = categoryResult[0];

  // Step 2: Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(and(
      eq(articles.categoryId, category.id),
      eq(articles.status, status)
    ));
  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  // Step 3: Get articles with sorting based on category type
  const orderByClause = category.type === "doc"
    ? [asc(articles.order), asc(articles.title)]
    : [desc(articles.publishedAt), desc(articles.createdAt)];

  const articleList = await db.select()
    .from(articles)
    .where(and(
      eq(articles.categoryId, category.id),
      eq(articles.status, status)
    ))
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
  const authorsResult = await db.select({
    id: users.id,
    name: users.name,
    avatar: users.avatar,
  })
    .from(users)
    .where(sql`${users.id} IN (${sql.join(authorIds.map(id => sql`${id}`), sql`, `)})`);

  const authorMap = new Map(authorsResult.map(a => [a.id, a]));

  // Step 5: Build articles with relations
  const articlesWithRelations: ArticleWithRelations[] = articleList.map(article => ({
    ...article,
    author: authorMap.get(article.authorId) || { id: article.authorId, name: null, avatar: null },
    category,
  }));

  return {
    category: { ...category, articles: articlesWithRelations, articleCount: total },
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
    return { enabled: false, interval: "monthly", lastBackupAt: null, nextBackupAt: null };
  }

  const result = await db.select().from(backupSettings).limit(1);
  if (result.length === 0) {
    // Create default settings
    await db.insert(backupSettings).values({ enabled: 0, interval: "monthly" });
    return { enabled: false, interval: "monthly", lastBackupAt: null, nextBackupAt: null };
  }

  const settings = result[0];
  return {
    enabled: settings.enabled === 1,
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
      enabled: enabled ? 1 : 0,
      interval,
      nextBackupAt,
    });
  } else {
    await db.update(backupSettings).set({
      enabled: enabled ? 1 : 0,
      interval,
      nextBackupAt,
    }).where(eq(backupSettings.id, existing[0].id));
  }

  return { enabled, interval, lastBackupAt: existing[0]?.lastBackupAt || null, nextBackupAt };
}

export async function updateLastBackupTime(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const settings = await getBackupSettings();
  const nextBackupAt = calculateNextBackupTime(settings.interval);

  await db.update(backupSettings).set({
    lastBackupAt: new Date(),
    nextBackupAt,
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

export async function saveBackupFile(data: DatabaseExportData): Promise<string> {
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

async function cleanupOldBackups(): Promise<void> {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith("auto-backup-") && f.endsWith(".json"))
    .map(f => ({ name: f, path: path.join(BACKUP_DIR, f), mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  if (files.length > MAX_BACKUP_FILES) {
    const toDelete = files.slice(MAX_BACKUP_FILES);
    for (const file of toDelete) {
      fs.unlinkSync(file.path);
    }
  }
}
