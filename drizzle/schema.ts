import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Content type enum for distinguishing between blog posts and documentation
 */
export const contentTypeEnum = ["blog", "doc"] as const;
export type ContentType = (typeof contentTypeEnum)[number];

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  bio: text("bio"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categories table for article classification
 * 预设分类：嵌入式、ROS、深度学习、DIY、其他
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // 图标名称，用于前端展示
  sortOrder: int("sortOrder").default(0).notNull(), // 排序顺序
  type: mysqlEnum("type", contentTypeEnum).default("blog").notNull(), // 分类类型：博客或文档
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Articles table for blog posts
 * 移除了 viewCount，专注于内容展示
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  summary: text("summary"),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  authorId: int("authorId").notNull(),
  categoryId: int("categoryId"), // 分类（建议填写）
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  type: mysqlEnum("type", contentTypeEnum).default("blog").notNull(), // 内容类型：博客或文档
  order: int("order").default(0).notNull(), // 排序权重，用于文档排序
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Backup settings table for automatic backup configuration
 * Single-row configuration table
 */
export const backupIntervalEnum = ["weekly", "monthly", "quarterly"] as const;
export type BackupInterval = (typeof backupIntervalEnum)[number];

export const backupSettings = mysqlTable("backup_settings", {
  id: int("id").autoincrement().primaryKey(),
  enabled: int("enabled").default(0).notNull(), // 0 = false, 1 = true
  interval: mysqlEnum("interval", backupIntervalEnum).default("monthly").notNull(),
  lastBackupAt: timestamp("lastBackupAt"),
  nextBackupAt: timestamp("nextBackupAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BackupSettings = typeof backupSettings.$inferSelect;
export type InsertBackupSettings = typeof backupSettings.$inferInsert;

/**
 * Page views table for tracking article and page visits
 */
export const pageViews = mysqlTable("page_views", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId"), // nullable: null = general page view
  ip: varchar("ip", { length: 45 }),
  userAgent: varchar("userAgent", { length: 512 }),
  path: varchar("path", { length: 500 }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;
