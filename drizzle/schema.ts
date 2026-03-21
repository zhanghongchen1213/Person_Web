import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// ---- Enum definitions (pgEnum must be defined before table usage) ----

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const contentTypeEnum = pgEnum("content_type", ["blog", "doc"]);

export const statusEnum = pgEnum("status", ["draft", "published", "archived"]);

export const backupIntervalEnum = pgEnum("backup_interval", ["weekly", "monthly", "quarterly"]);

/**
 * Content type enum for distinguishing between blog posts and documentation
 */
export type ContentType = "blog" | "doc";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  bio: text("bio"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categories table for article classification
 * 预设分类：嵌入式、ROS、深度学习、DIY、其他
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // 图标名称，用于前端展示
  sortOrder: integer("sortOrder").default(0).notNull(), // 排序顺序
  type: contentTypeEnum("type").default("blog").notNull(), // 分类类型：博客或文档
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Articles table for blog posts
 * 移除了 viewCount，专注于内容展示
 */
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  summary: text("summary"),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  authorId: integer("authorId").notNull(),
  categoryId: integer("categoryId"), // 分类（建议填写）
  status: statusEnum("status").default("draft").notNull(),
  type: contentTypeEnum("type").default("blog").notNull(), // 内容类型：博客或文档
  order: integer("order").default(0).notNull(), // 排序权重，用于文档排序
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Backup settings table for automatic backup configuration
 * Single-row configuration table
 */
export type BackupInterval = "weekly" | "monthly" | "quarterly";

export const backupSettings = pgTable("backup_settings", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").default(false).notNull(),
  interval: backupIntervalEnum("interval").default("monthly").notNull(),
  lastBackupAt: timestamp("lastBackupAt"),
  nextBackupAt: timestamp("nextBackupAt"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BackupSettings = typeof backupSettings.$inferSelect;
export type InsertBackupSettings = typeof backupSettings.$inferInsert;

/**
 * Page views table for tracking article and page visits
 */
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  articleId: integer("articleId"), // nullable: null = general page view
  ip: varchar("ip", { length: 45 }),
  userAgent: varchar("userAgent", { length: 512 }),
  path: varchar("path", { length: 500 }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;
