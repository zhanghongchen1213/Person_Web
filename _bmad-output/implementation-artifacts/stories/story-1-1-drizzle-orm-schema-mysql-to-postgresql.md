---
storyId: '1-1'
epicId: 1
title: 'Drizzle ORM Schema 从 MySQL 迁移至 PostgreSQL'
status: 'ready-for-dev'
priority: 'critical'
storyPoints: 3
dependencies: []
blockedBy: []
blocks: ['1-2', '1-3']
created: '2026-03-21'
---

# Story 1.1: Drizzle ORM Schema 从 MySQL 迁移至 PostgreSQL

## Story Description

**As a** 开发者,
**I want** 将 Drizzle ORM schema 从 MySQL 方言迁移至 PostgreSQL 方言,
**So that** 系统可使用托管 PostgreSQL 数据库（MemfireDB）存储所有数据。

## Background & Context

- 本项目为 Brownfield 重构，当前 schema 使用 Drizzle ORM 的 MySQL 方言（`drizzle-orm/mysql-core`）
- 目标数据库为 MemfireDB（托管 PostgreSQL），需将所有表定义迁移至 PostgreSQL 方言（`drizzle-orm/pg-core`）
- 这是 Epic 1 的第一个 story，后续所有 story（驱动替换、查询适配等）都依赖本 story 完成
- 参考架构决策：ADR-02（Drizzle ORM schema 方言迁移）

## Current State Analysis

### 现有文件: `drizzle/schema.ts`

当前 schema 包含 5 张表，使用以下 MySQL 特有构造：

| MySQL 构造 | 出现位置 | 数量 |
|------------|---------|------|
| `mysqlTable` | users, categories, articles, backupSettings, pageViews | 5 |
| `mysqlEnum` | users.role, categories.type, articles.status, articles.type, backupSettings.interval | 5 |
| `int().autoincrement().primaryKey()` | 所有表的 id 字段 | 5 |
| `onUpdateNow()` | users.updatedAt, articles.updatedAt, backupSettings.updatedAt | 3 |
| `int("enabled").default(0)` | backupSettings.enabled | 1 |

### 现有文件: `drizzle.config.ts`

- `dialect: "mysql"`
- `schema: "./drizzle/schema.ts"`
- `out: "./drizzle/migrations"`

### 现有文件: `drizzle/relations.ts`

- 当前为空文件（仅有 `import {} from "./schema"`），无需修改

## Acceptance Criteria

**Given** 现有 drizzle/schema.ts 使用 MySQL 方言（mysqlTable, mysqlEnum 等）
**When** 开发者完成 schema 迁移
**Then:**

- [ ] **AC-1**: 所有表定义使用 `pgTable` 替代 `mysqlTable`
- [ ] **AC-2**: 所有自增主键使用 `serial("id").primaryKey()` 替代 `int("id").autoincrement().primaryKey()`
- [ ] **AC-3**: 所有枚举使用 `pgEnum` 替代 `mysqlEnum`，并在 schema 顶部独立定义
- [ ] **AC-4**: 所有 `onUpdateNow()` 被移除（后续在应用层处理 updatedAt）
- [ ] **AC-5**: `int("enabled").default(0)` 布尔模拟改为 `boolean("enabled").default(false)`
- [ ] **AC-6**: `drizzle.config.ts` 中 `dialect` 从 `"mysql"` 改为 `"postgresql"`
- [ ] **AC-7**: TypeScript 编译通过（`npx tsc --noEmit`），无类型错误
- [ ] **AC-8**: `npx drizzle-kit generate` 可成功生成 PostgreSQL 迁移文件

## Tasks

### Task 1: 修改 import 语句（AC-1, AC-2, AC-3, AC-5）

**File**: `drizzle/schema.ts`

**Before:**
```typescript
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
```

**After:**
```typescript
import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
```

**变更说明:**
- `mysqlTable` -> `pgTable`
- `mysqlEnum` -> `pgEnum`
- `int` -> `serial`（主键）/ `integer`（普通整数字段）
- 新增 `boolean` 导入（替代 int 布尔模拟）
- 新增 `serial` 导入（自增主键）
- 移除 `int`，改为 `integer`（PostgreSQL 风格）

### Task 2: 定义 pgEnum 枚举类型（AC-3）

**File**: `drizzle/schema.ts`

在所有表定义之前、import 之后，独立定义所有 pgEnum：

```typescript
// ---- Enum definitions (pgEnum must be defined before table usage) ----

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const contentTypeEnumPg = pgEnum("content_type", ["blog", "doc"]);

export const statusEnum = pgEnum("status", ["draft", "published", "archived"]);

export const backupIntervalEnumPg = pgEnum("backup_interval", ["weekly", "monthly", "quarterly"]);
```

**注意事项:**
- pgEnum 第一个参数为数据库中的枚举类型名称，需全局唯一
- 保留现有的 `contentTypeEnum` 和 `backupIntervalEnum` 常量数组（用于 TypeScript 类型推导），pgEnum 变量使用不同名称避免冲突
- pgEnum 在 PostgreSQL 中会创建独立的 TYPE，而非内联在列定义中

### Task 3: 迁移 users 表（AC-1, AC-2, AC-3, AC-4）

**File**: `drizzle/schema.ts`

**Before:**
```typescript
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
```

**After:**
```typescript
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // onUpdateNow removed
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
```

**变更点:**
- `mysqlTable` -> `pgTable`
- `int("id").autoincrement().primaryKey()` -> `serial("id").primaryKey()`
- `mysqlEnum("role", [...])` -> `roleEnum("role")`（引用顶部定义的 pgEnum）
- `.onUpdateNow()` 移除（updatedAt 将在应用层 Story 1.3 中处理）

### Task 4: 迁移 categories 表（AC-1, AC-2, AC-3）

**File**: `drizzle/schema.ts`

**Before:**
```typescript
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  type: mysqlEnum("type", contentTypeEnum).default("blog").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

**After:**
```typescript
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: integer("sortOrder").default(0).notNull(),
  type: contentTypeEnumPg("type").default("blog").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

**变更点:**
- `mysqlTable` -> `pgTable`
- `int("id").autoincrement().primaryKey()` -> `serial("id").primaryKey()`
- `int("sortOrder")` -> `integer("sortOrder")`（非主键整数字段用 integer）
- `mysqlEnum("type", contentTypeEnum)` -> `contentTypeEnumPg("type")`

### Task 5: 迁移 articles 表（AC-1, AC-2, AC-3, AC-4）

**File**: `drizzle/schema.ts`

**Before:**
```typescript
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  summary: text("summary"),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  authorId: int("authorId").notNull(),
  categoryId: int("categoryId"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  type: mysqlEnum("type", contentTypeEnum).default("blog").notNull(),
  order: int("order").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

**After:**
```typescript
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  summary: text("summary"),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  authorId: integer("authorId").notNull(),
  categoryId: integer("categoryId"),
  status: statusEnum("status").default("draft").notNull(),
  type: contentTypeEnumPg("type").default("blog").notNull(),
  order: integer("order").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // onUpdateNow removed
});
```

**变更点:**
- `mysqlTable` -> `pgTable`
- `int("id").autoincrement().primaryKey()` -> `serial("id").primaryKey()`
- `int("authorId")` -> `integer("authorId")`
- `int("categoryId")` -> `integer("categoryId")`
- `int("order")` -> `integer("order")`
- `mysqlEnum("status", [...])` -> `statusEnum("status")`
- `mysqlEnum("type", contentTypeEnum)` -> `contentTypeEnumPg("type")`
- `.onUpdateNow()` 移除

### Task 6: 迁移 backupSettings 表（AC-1, AC-2, AC-3, AC-4, AC-5）

**File**: `drizzle/schema.ts`

**Before:**
```typescript
export const backupSettings = mysqlTable("backup_settings", {
  id: int("id").autoincrement().primaryKey(),
  enabled: int("enabled").default(0).notNull(),
  interval: mysqlEnum("interval", backupIntervalEnum).default("monthly").notNull(),
  lastBackupAt: timestamp("lastBackupAt"),
  nextBackupAt: timestamp("nextBackupAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

**After:**
```typescript
export const backupSettings = pgTable("backup_settings", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").default(false).notNull(),
  interval: backupIntervalEnumPg("interval").default("monthly").notNull(),
  lastBackupAt: timestamp("lastBackupAt"),
  nextBackupAt: timestamp("nextBackupAt"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // onUpdateNow removed
});
```

**变更点:**
- `mysqlTable` -> `pgTable`
- `int("id").autoincrement().primaryKey()` -> `serial("id").primaryKey()`
- `int("enabled").default(0)` -> `boolean("enabled").default(false)`（AC-5 核心变更）
- `mysqlEnum("interval", backupIntervalEnum)` -> `backupIntervalEnumPg("interval")`
- `.onUpdateNow()` 移除

### Task 7: 迁移 pageViews 表（AC-1, AC-2）

**File**: `drizzle/schema.ts`

**Before:**
```typescript
export const pageViews = mysqlTable("page_views", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId"),
  ip: varchar("ip", { length: 45 }),
  userAgent: varchar("userAgent", { length: 512 }),
  path: varchar("path", { length: 500 }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});
```

**After:**
```typescript
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  articleId: integer("articleId"),
  ip: varchar("ip", { length: 45 }),
  userAgent: varchar("userAgent", { length: 512 }),
  path: varchar("path", { length: 500 }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});
```

**变更点:**
- `mysqlTable` -> `pgTable`
- `int("id").autoincrement().primaryKey()` -> `serial("id").primaryKey()`
- `int("articleId")` -> `integer("articleId")`

### Task 8: 更新 drizzle.config.ts（AC-6）

**File**: `drizzle.config.ts`

**Before:**
```typescript
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
```

**After:**
```typescript
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
```

**变更点:**
- `dialect: "mysql"` -> `dialect: "postgresql"`

### Task 9: 清理旧迁移文件

**目录**: `drizzle/migrations/`

- 删除所有现有的 MySQL 迁移文件（`0000_*.sql`, `0001_*.sql` 及 `meta/` 下对应文件）
- 保留 `.gitkeep` 文件
- 后续通过 `npx drizzle-kit generate` 生成新的 PostgreSQL 迁移

**原因:** 旧迁移文件是 MySQL DDL 语法，无法在 PostgreSQL 上执行，保留会导致混淆。

### Task 10: 验证 TypeScript 编译（AC-7）

执行以下命令确认无类型错误：

```bash
npx tsc --noEmit
```

**预期结果:** 编译通过，无错误输出。

**可能的类型问题:**
- `backupSettings.enabled` 类型从 `number` 变为 `boolean`，需检查 `server/db.ts` 中是否有对 `enabled` 做数字比较（如 `=== 0` 或 `=== 1`）的代码，这些将在 Story 1.3 中处理
- `serial()` 的推断类型与 `int().autoincrement()` 略有不同，但通常兼容

### Task 11: 生成迁移文件（AC-8）

```bash
npx drizzle-kit generate
```

**预期结果:** 在 `drizzle/migrations/` 下生成新的 PostgreSQL DDL 迁移文件，包含：
- `CREATE TYPE` 语句（pgEnum 定义）
- `CREATE TABLE` 语句（所有 5 张表）
- `SERIAL` 类型主键
- `BOOLEAN` 类型字段

## Technical Notes

### MySQL vs PostgreSQL 关键差异

| 特性 | MySQL (Before) | PostgreSQL (After) |
|------|---------------|-------------------|
| 表定义 | `mysqlTable()` | `pgTable()` |
| 自增主键 | `int().autoincrement()` | `serial()` |
| 枚举 | `mysqlEnum()` 内联定义 | `pgEnum()` 顶部独立定义为 TYPE |
| 自动更新时间 | `onUpdateNow()` 内建支持 | 无内建支持，需应用层处理 |
| 布尔类型 | 无原生布尔，用 `int` 模拟 | 原生 `boolean` 类型 |
| 方言配置 | `dialect: "mysql"` | `dialect: "postgresql"` |

### pgEnum 命名约定

PostgreSQL 枚举在数据库中创建为独立的 TYPE 对象，名称全局唯一。本次迁移使用以下命名：

| pgEnum 变量名 | 数据库 TYPE 名称 | 值 |
|---------------|-----------------|-----|
| `roleEnum` | `role` | `["user", "admin"]` |
| `contentTypeEnumPg` | `content_type` | `["blog", "doc"]` |
| `statusEnum` | `status` | `["draft", "published", "archived"]` |
| `backupIntervalEnumPg` | `backup_interval` | `["weekly", "monthly", "quarterly"]` |

### onUpdateNow 移除的影响

移除 `onUpdateNow()` 后，以下表的 `updatedAt` 字段不再自动更新：
- `users.updatedAt`
- `articles.updatedAt`
- `backupSettings.updatedAt`

**后续处理（Story 1.3）:** 在所有写操作中手动设置 `updatedAt: new Date()`。

### boolean 类型变更的影响

`backupSettings.enabled` 从 `int` (0/1) 改为 `boolean` (true/false)：
- TypeScript 推断类型从 `number` 变为 `boolean`
- 数据库查询中 `enabled === 0` 需改为 `enabled === false`
- 这些代码变更将在 Story 1.3（查询语法适配）中处理

## Testing Requirements

### 验证清单

1. **静态类型检查**
   - `npx tsc --noEmit` 通过（允许与本 story 无关的预存错误）
   - schema.ts 中无 `mysqlTable`、`mysqlEnum`、`onUpdateNow` 残留

2. **迁移生成验证**
   - `npx drizzle-kit generate` 成功执行
   - 生成的 SQL 文件包含 `CREATE TYPE` 和 `CREATE TABLE` 语句
   - 生成的 SQL 使用 `SERIAL` 而非 `INT AUTO_INCREMENT`
   - 生成的 SQL 包含 `BOOLEAN` 类型

3. **Schema 完整性**
   - 所有 5 张表成功迁移（users, categories, articles, backup_settings, page_views）
   - 所有字段保留（名称、约束、默认值不变，除 AC 指定的变更外）
   - 所有导出类型（User, Article, Category 等）仍可正常推断

4. **手动审查**
   - 确认无 `drizzle-orm/mysql-core` 的 import 残留
   - 确认所有 pgEnum 在表定义之前声明
   - 确认 drizzle.config.ts 的 dialect 已更新

## Dependencies

### 前置依赖

- 无（这是 Epic 1 的第一个 story）

### 被阻塞的后续 Story

- **Story 1.2**: 数据库驱动替换与连接配置（需要 schema 先迁移完成）
- **Story 1.3**: 数据库查询语法适配（依赖 schema 类型变更，特别是 boolean 和 onUpdateNow 移除）

### 包依赖

- 当前 `drizzle-orm` 版本 0.44.6 已包含 `pg-core` 模块，无需升级
- 当前 `drizzle-kit` 已支持 PostgreSQL dialect，无需升级
- **注意**: `drizzle-kit` 的 `dialect: "postgresql"` 需要 `pg` 驱动才能执行 `push`/`migrate`，但 `generate` 不需要。驱动替换在 Story 1.2 中处理。

## Dev Notes

### 实施顺序建议

1. 先修改 import 语句（Task 1）
2. 定义 pgEnum（Task 2）
3. 逐表迁移（Task 3-7），每迁移一张表后确认无语法错误
4. 更新 drizzle.config.ts（Task 8）
5. 清理旧迁移文件（Task 9）
6. 运行类型检查（Task 10）
7. 生成新迁移（Task 11）

### 风险与注意事项

- **低风险**: schema 迁移是纯声明式变更，不涉及运行时逻辑
- **注意**: 本 story 完成后，项目暂时无法连接数据库（因为驱动仍是 mysql2），这是预期行为，将在 Story 1.2 中解决
- **注意**: `enabled` 类型变更可能导致现有查询代码出现 TypeScript 错误，这些错误将在 Story 1.3 中修复
