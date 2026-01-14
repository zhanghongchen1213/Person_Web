import { eq, desc, like, or, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, articles, categories, Article, Category } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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
  categorySlug?: string;
  search?: string;
  authorId?: number;
}): Promise<{ articles: ArticleWithRelations[]; total: number; totalPages: number }> {
  const db = await getDb();
  if (!db) return { articles: [], total: 0, totalPages: 0 };

  const { limit = 10, page = 1, status, categorySlug, search, authorId } = options;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [];
  if (status) conditions.push(eq(articles.status, status));
  if (authorId) conditions.push(eq(articles.authorId, authorId));
  if (search) {
    conditions.push(
      or(
        like(articles.title, `%${search}%`),
        like(articles.content, `%${search}%`)
      )
    );
  }

  // Get category ID if slug provided
  if (categorySlug) {
    const cat = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
    if (cat.length > 0) {
      conditions.push(eq(articles.categoryId, cat[0].id));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(whereClause);
  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  // Get articles
  const articleList = await db.select()
    .from(articles)
    .where(whereClause)
    .orderBy(desc(articles.publishedAt), desc(articles.createdAt))
    .limit(limit)
    .offset(offset);

  // Get related data
  const articlesWithRelations: ArticleWithRelations[] = await Promise.all(
    articleList.map(async (article) => {
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
    })
  );

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
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(articles).values({
    ...data,
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

// Category functions
export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createCategory(data: { 
  name: string; 
  slug: string; 
  description?: string;
  icon?: string;
  sortOrder?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(categories).values(data);
  return Number(result[0].insertId);
}

export async function updateCategory(id: number, data: { 
  name?: string; 
  slug?: string; 
  description?: string;
  icon?: string;
  sortOrder?: number;
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

// Get articles count by category
export async function getArticleCountByCategory(): Promise<Array<{ categoryId: number; categoryName: string; count: number }>> {
  const db = await getDb();
  if (!db) return [];

  const allCategories = await db.select().from(categories).orderBy(categories.sortOrder);
  
  const result = await Promise.all(
    allCategories.map(async (cat) => {
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(and(eq(articles.categoryId, cat.id), eq(articles.status, "published")));
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        count: Number(countResult[0]?.count || 0),
      };
    })
  );

  return result;
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

    return await Promise.all(result.map(async (article) => {
      const authorResult = await db.select({ id: users.id, name: users.name, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, article.authorId))
        .limit(1);
      const author = authorResult[0] || { id: article.authorId, name: null, avatar: null };

      let category: Category | null = null;
      if (article.categoryId) {
        const catResult = await db.select().from(categories).where(eq(categories.id, article.categoryId)).limit(1);
        category = catResult[0] || null;
      }

      return { ...article, author, category };
    }));
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

  return await Promise.all(result.map(async (article) => {
    const authorResult = await db.select({ id: users.id, name: users.name, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, article.authorId))
      .limit(1);
    const author = authorResult[0] || { id: article.authorId, name: null, avatar: null };

    let category: Category | null = null;
    if (article.categoryId) {
      const catResult = await db.select().from(categories).where(eq(categories.id, article.categoryId)).limit(1);
      category = catResult[0] || null;
    }

    return { ...article, author, category };
  }));
}

// Initialize default categories
export async function initDefaultCategories(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const defaultCategories = [
    { name: "嵌入式", slug: "embedded", description: "嵌入式系统开发相关", icon: "Cpu", sortOrder: 1 },
    { name: "ROS", slug: "ros", description: "机器人操作系统相关", icon: "Bot", sortOrder: 2 },
    { name: "深度学习", slug: "deep-learning", description: "深度学习与人工智能", icon: "Brain", sortOrder: 3 },
    { name: "DIY", slug: "diy", description: "DIY项目与创客", icon: "Wrench", sortOrder: 4 },
    { name: "编程语言", slug: "programming", description: "编程语言学习笔记", icon: "Code", sortOrder: 5 },
    { name: "工具与环境", slug: "tools", description: "开发工具与环境配置", icon: "Settings", sortOrder: 6 },
    { name: "其他", slug: "other", description: "其他技术文章", icon: "FileText", sortOrder: 99 },
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
