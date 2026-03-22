---
storyId: '1-2'
epicId: 1
title: '数据库驱动替换与连接配置'
status: 'ready-for-dev'
priority: 'critical'
storyPoints: 3
dependencies: ['1-1']
blockedBy: ['1-1']
blocks: ['1-3']
created: '2026-03-21'
---

# Story 1.2: 数据库驱动替换与连接配置

## Story Description

**As a** 开发者,
**I want** 将数据库驱动从 mysql2 替换为 pg（node-postgres）并配置连接池,
**So that** 后端可通过 SSL 安全连接到远程 MemfireDB 数据库。

## Background & Context

- 本项目 Story 1.1 已将 Drizzle ORM schema 从 MySQL 方言迁移至 PostgreSQL 方言
- 当前 `server/db.ts` 仍使用 `mysql2/promise` 驱动和 `drizzle-orm/mysql2` 适配器
- 目标数据库为 MemfireDB（托管 PostgreSQL），需使用 `pg` 驱动通过 SSL 连接
- MemfireDB 免费额度限制连接数，连接池最大连接数需设为 10
- 本 story 仅替换驱动和连接层，不涉及查询语法适配（Query 适配在 Story 1.3）

## Current State Analysis

### 现有文件: `server/db.ts`

当前驱动层使用以下 MySQL 特有构造：

| 构造 | 位置 | 说明 |
|------|------|------|
| `import { drizzle } from "drizzle-orm/mysql2"` | L2 | Drizzle ORM 的 MySQL 适配器 |
| `import mysql from "mysql2/promise"` | L3 | MySQL 驱动导入 |
| `mysql.Pool` 类型 | L21 | 连接池类型 |
| `mysql.createPool({uri, charset, connectionLimit})` | L27-31 | 创建 MySQL 连接池 |
| `drizzle(_pool)` | L32 | 使用 mysql2 适配器初始化 Drizzle |
| `pool.execute()` | 多处 | 原始 SQL 执行（fulltext index、import/export、page_views 建表） |
| `pool.getConnection()` | L1296 | 获取单独连接用于事务 |
| `connection.beginTransaction/commit/rollback/release` | L1299-1423 | MySQL 事务模式 |

### 现有文件: `package.json`

- 依赖 `"mysql2": "^3.15.0"`
- 无 `pg` 或 `@types/pg` 依赖

### 现有文件: `server/_core/sdk.ts`

- 通过 `import * as db from "../db"` 间接使用数据库
- 不直接引用 mysql2 驱动，无需修改

## Acceptance Criteria

**Given** 现有 server/db.ts 使用 mysql2 驱动和 drizzle-orm/mysql2
**When** 开发者完成驱动替换
**Then:**

- [ ] **AC-1**: 使用 `pg.Pool` 连接池替代 mysql2 连接
- [ ] **AC-2**: 连接池最大连接数设为 10（MemfireDB 免费额度限制）
- [ ] **AC-3**: SSL 配置为 `ssl: { rejectUnauthorized: false }`（远程数据库必须）
- [ ] **AC-4**: `DATABASE_URL` 环境变量指向 MemfireDB 连接串
- [ ] **AC-5**: `drizzle()` 初始化使用 `drizzle-orm/node-postgres` 适配器
- [ ] **AC-6**: `package.json` 中 `mysql2` 依赖替换为 `pg` 和 `@types/pg`
- [ ] **AC-7**: TypeScript 编译通过（`npx tsc --noEmit`）
- [ ] **AC-8**: 连接池可成功连接到 MemfireDB 并执行简单查询

## Tasks

### Task 1: 替换 npm 依赖（AC-6）

**操作**: 在项目根目录执行

```bash
# 移除 mysql2
pnpm remove mysql2

# 安装 pg 和类型定义
pnpm add pg
pnpm add -D @types/pg
```

**验证**:
- `package.json` 中无 `mysql2` 条目
- `package.json` dependencies 中包含 `"pg": "^8.x.x"`
- `package.json` devDependencies 中包含 `"@types/pg": "^8.x.x"`

### Task 2: 替换 import 语句（AC-1, AC-5）

**File**: `server/db.ts`

**Before:**
```typescript
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
```

**After:**
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
```

**变更说明:**
- `drizzle-orm/mysql2` -> `drizzle-orm/node-postgres`（Drizzle ORM 的 PostgreSQL 适配器）
- `mysql2/promise` -> `pg`（node-postgres 驱动）
- 使用命名导入 `{ Pool }` 而非默认导入

### Task 3: 替换连接池类型声明（AC-1）

**File**: `server/db.ts`

**Before:**
```typescript
let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;
```

**After:**
```typescript
let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;
```

**变更说明:**
- `mysql.Pool` -> `Pool`（来自 pg 模块的 Pool 类型）

### Task 4: 替换 getDb() 连接池创建逻辑（AC-1, AC-2, AC-3, AC-4, AC-5）

**File**: `server/db.ts`

**Before:**
```typescript
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create mysql2 connection pool with proper charset configuration
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        charset: "utf8mb4",
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
```

**After:**
```typescript
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create pg connection pool with SSL for remote MemfireDB
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10, // MemfireDB 免费额度连接数限制
        ssl: { rejectUnauthorized: false }, // 远程数据库 SSL 必须
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}
```

**变更说明:**
- `mysql.createPool({uri, charset, connectionLimit})` -> `new Pool({connectionString, max, ssl})`
- `uri` -> `connectionString`（pg 的连接字符串参数名）
- `charset: "utf8mb4"` 移除（PostgreSQL 默认 UTF-8，无需指定）
- `connectionLimit: 10` -> `max: 10`（pg.Pool 的最大连接数参数名）
- 新增 `ssl: { rejectUnauthorized: false }`（远程 MemfireDB 必须）
- `drizzle(_pool) as unknown as ReturnType<typeof drizzle>` -> `drizzle(_pool)`（node-postgres 适配器类型兼容，无需强制转换）

### Task 5: 替换 getPool() 返回类型（AC-1）

**File**: `server/db.ts`

**Before:**
```typescript
export function getPool() {
  return _pool;
}
```

**After:**
```typescript
export function getPool() {
  return _pool;
}
```

**说明:** 函数体无需修改，但返回类型自动从 `mysql.Pool | null` 变为 `Pool | null`，因为 Task 3 已更改 `_pool` 的类型声明。

### Task 6: 适配 ensureFulltextIndex()（AC-1）

**File**: `server/db.ts`

**Before:**
```typescript
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
```

**After:**
```typescript
export async function ensureFulltextIndex() {
  // PostgreSQL uses GIN/GiST indexes for full-text search instead of MySQL FULLTEXT.
  // Full-text search index creation will be handled in Story 1.3 (query syntax adaptation).
  // This function is intentionally left as a no-op for now.
  return;
}
```

**变更说明:**
- MySQL 的 FULLTEXT INDEX 在 PostgreSQL 中不存在
- PostgreSQL 使用 `tsvector` + GIN 索引实现全文搜索
- 全文搜索索引的创建将在 Story 1.3 中处理，本 story 仅将此函数设为 no-op

### Task 7: 适配 ensurePageViewsTable()（AC-1）

**File**: `server/db.ts`

**Before:**
```typescript
export async function ensurePageViewsTable(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS page_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        articleId INT,
        ip VARCHAR(45),
        userAgent VARCHAR(512),
        path VARCHAR(500),
        viewedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.warn("[Database] Failed to ensure page_views table:", e);
  }
}
```

**After:**
```typescript
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
  } catch (e) {
    console.warn("[Database] Failed to ensure page_views table:", e);
  }
}
```

**变更说明:**
- `pool.execute()` -> `pool.query()`（pg.Pool 使用 `query` 方法）
- `INT AUTO_INCREMENT PRIMARY KEY` -> `SERIAL PRIMARY KEY`
- `INT` -> `INTEGER`
- camelCase 列名加双引号（PostgreSQL 对大小写敏感的标识符需要引号）

### Task 8: 适配 importAllData() 中的事务和原始 SQL（AC-1）

**File**: `server/db.ts`

这是最复杂的任务，需要将 MySQL 的事务模式和 `connection.execute()` 转换为 pg 的事务模式。

**Before（核心事务结构）:**
```typescript
const pool = getPool();
if (!pool) throw new Error("Cannot access database connection pool");

const connection = await pool.getConnection();

try {
  await connection.beginTransaction();

  await connection.execute("DELETE FROM page_views");
  // ... more execute calls with parameterized queries ...
  await connection.execute(
    `INSERT INTO users (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, user.openId, ...]
  );

  await connection.commit();
  return { ... };
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

**After（核心事务结构）:**
```typescript
const pool = getPool();
if (!pool) throw new Error("Cannot access database connection pool");

const client = await pool.connect();

try {
  await client.query("BEGIN");

  await client.query("DELETE FROM page_views");
  // ... more query calls with parameterized queries using $1, $2, ... ...
  await client.query(
    `INSERT INTO users (id, "openId", name, email, avatar, bio, "loginMethod", role, "createdAt", "updatedAt", "lastSignedIn")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [user.id, user.openId, ...]
  );

  await client.query("COMMIT");
  return { ... };
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}
```

**关键变更:**

| MySQL (mysql2) | PostgreSQL (pg) | 说明 |
|----------------|-----------------|------|
| `pool.getConnection()` | `pool.connect()` | 获取客户端连接 |
| `connection.beginTransaction()` | `client.query("BEGIN")` | 开始事务 |
| `connection.execute(sql, params)` | `client.query(sql, params)` | 执行查询 |
| `connection.commit()` | `client.query("COMMIT")` | 提交事务 |
| `connection.rollback()` | `client.query("ROLLBACK")` | 回滚事务 |
| `connection.release()` | `client.release()` | 释放连接 |
| 参数占位符 `?` | 参数占位符 `$1, $2, ...` | PostgreSQL 使用编号占位符 |
| 列名直接使用 | camelCase 列名加双引号 | PostgreSQL 大小写敏感 |

**详细参数化查询转换示例:**

Users 插入:
```typescript
// Before (MySQL)
await connection.execute(
  `INSERT INTO users (id, openId, name, email, avatar, bio, loginMethod, role, createdAt, updatedAt, lastSignedIn)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [user.id, user.openId, user.name, user.email, user.avatar, user.bio,
   user.loginMethod, user.role, toMySQLDatetime(user.createdAt),
   toMySQLDatetime(user.updatedAt), toMySQLDatetime(user.lastSignedIn)]
);

// After (PostgreSQL)
await client.query(
  `INSERT INTO users (id, "openId", name, email, avatar, bio, "loginMethod", role, "createdAt", "updatedAt", "lastSignedIn")
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
  [user.id, user.openId, user.name, user.email, user.avatar, user.bio,
   user.loginMethod, user.role, user.createdAt, user.updatedAt, user.lastSignedIn]
);
```

Categories 插入:
```typescript
// Before (MySQL)
await connection.execute(
  `INSERT INTO categories (id, name, slug, description, icon, sortOrder, type, createdAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.sortOrder,
   cat.type, toMySQLDatetime(cat.createdAt)]
);

// After (PostgreSQL)
await client.query(
  `INSERT INTO categories (id, name, slug, description, icon, "sortOrder", type, "createdAt")
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
  [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.sortOrder,
   cat.type, cat.createdAt]
);
```

Articles 插入:
```typescript
// Before (MySQL)
await connection.execute(
  `INSERT INTO articles (id, title, slug, summary, content, coverImage, authorId, categoryId, status, type, \`order\`, publishedAt, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [article.id, article.title, article.slug, article.summary, article.content,
   article.coverImage, article.authorId, article.categoryId, article.status,
   article.type, article.order, toMySQLDatetime(article.publishedAt),
   toMySQLDatetime(article.createdAt), toMySQLDatetime(article.updatedAt)]
);

// After (PostgreSQL)
await client.query(
  `INSERT INTO articles (id, title, slug, summary, content, "coverImage", "authorId", "categoryId", status, type, "order", "publishedAt", "createdAt", "updatedAt")
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
  [article.id, article.title, article.slug, article.summary, article.content,
   article.coverImage, article.authorId, article.categoryId, article.status,
   article.type, article.order, article.publishedAt, article.createdAt,
   article.updatedAt]
);
```

Page Views 插入:
```typescript
// Before (MySQL)
await connection.execute(
  `INSERT INTO page_views (id, articleId, ip, userAgent, path, viewedAt)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [pv.id, pv.articleId, pv.ip, pv.userAgent, pv.path,
   toMySQLDatetime(pv.viewedAt)]
);

// After (PostgreSQL)
await client.query(
  `INSERT INTO page_views (id, "articleId", ip, "userAgent", path, "viewedAt")
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [pv.id, pv.articleId, pv.ip, pv.userAgent, pv.path, pv.viewedAt]
);
```

Backup Settings 插入:
```typescript
// Before (MySQL)
await connection.execute(
  `INSERT INTO backup_settings (id, enabled, \`interval\`, lastBackupAt, nextBackupAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [bs.id, bs.enabled, bs.interval, toMySQLDatetime(bs.lastBackupAt),
   toMySQLDatetime(bs.nextBackupAt), toMySQLDatetime(bs.updatedAt)]
);

// After (PostgreSQL)
await client.query(
  `INSERT INTO backup_settings (id, enabled, "interval", "lastBackupAt", "nextBackupAt", "updatedAt")
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [bs.id, bs.enabled, bs.interval, bs.lastBackupAt,
   bs.nextBackupAt, bs.updatedAt]
);
```

### Task 9: 移除 toMySQLDatetime 辅助函数

**File**: `server/db.ts`

**Before:**
```typescript
/** Convert ISO datetime string or Date to MySQL-compatible format */
function toMySQLDatetime(
  value: string | Date | null | undefined
): string | null {
  if (value == null) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}
```

**After:** 删除此函数。

**变更说明:**
- MySQL 需要 `YYYY-MM-DD HH:mm:ss` 格式的日期字符串
- PostgreSQL 的 `pg` 驱动原生支持 JavaScript `Date` 对象和 ISO 8601 字符串，无需手动转换
- Task 8 中的所有 `toMySQLDatetime(...)` 调用改为直接传递原始值

### Task 10: 适配 DELETE 语句中的表名引用

**File**: `server/db.ts`

`importAllData()` 函数中的 DELETE 语句，表名中包含下划线的无需引号，但需确认 PostgreSQL 兼容性：

```typescript
// 这些 DELETE 语句在 PostgreSQL 中无需修改（表名全小写/下划线无需引号）
await client.query("DELETE FROM page_views");
await client.query("DELETE FROM articles");
await client.query("DELETE FROM categories");
await client.query("DELETE FROM users");
await client.query("DELETE FROM backup_settings");
```

### Task 11: 重置序列值（PostgreSQL 特有）

**File**: `server/db.ts`

在 `importAllData()` 中，由于 PostgreSQL 的 `SERIAL` 类型使用序列（sequence）来生成自增 ID，当导入包含指定 ID 的数据时，需要在数据导入后重置序列值，否则后续插入会因 ID 冲突而失败。

在 `await client.query("COMMIT")` 之前添加：

```typescript
// Reset sequences to max id + 1 for each table with SERIAL primary key
await client.query(`SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false)`);
await client.query(`SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 0) + 1, false)`);
await client.query(`SELECT setval('articles_id_seq', COALESCE((SELECT MAX(id) FROM articles), 0) + 1, false)`);
await client.query(`SELECT setval('page_views_id_seq', COALESCE((SELECT MAX(id) FROM page_views), 0) + 1, false)`);
await client.query(`SELECT setval('backup_settings_id_seq', COALESCE((SELECT MAX(id) FROM backup_settings), 0) + 1, false)`);
```

**说明:** PostgreSQL 的 `SERIAL` 列自动创建名为 `{table}_{column}_seq` 的序列。`setval` 的第三个参数 `false` 表示下次 `nextval()` 调用将返回设置的值本身。

### Task 12: 验证 TypeScript 编译（AC-7）

执行以下命令确认无类型错误：

```bash
npx tsc --noEmit
```

**预期结果:** 编译通过，无与驱动替换相关的错误。

**可能的类型问题:**
- `pg.Pool.query()` 返回 `QueryResult` 类型，与 mysql2 的 `[rows, fields]` 不同
- `importAllData` 中原始 SQL 的返回类型处理可能需要调整

### Task 13: 连接测试（AC-8）

创建临时测试脚本或在开发环境中验证：

```bash
# 确保 .env 中 DATABASE_URL 指向 MemfireDB
# 格式: postgresql://user:password@host:port/database
DATABASE_URL="postgresql://username:password@host.memfiredb.com:5432/dbname"
```

验证步骤：
1. 启动开发服务器 `pnpm dev`
2. 确认日志无连接错误
3. 访问需要数据库的 API 端点，确认响应正常

## Technical Notes

### mysql2 vs pg 连接池 API 对比

| 特性 | mysql2 (Before) | pg (After) |
|------|-----------------|------------|
| 导入 | `import mysql from "mysql2/promise"` | `import { Pool } from "pg"` |
| 创建池 | `mysql.createPool({uri, connectionLimit})` | `new Pool({connectionString, max, ssl})` |
| 连接字符串参数 | `uri` | `connectionString` |
| 最大连接数参数 | `connectionLimit` | `max` |
| SSL 配置 | 通过 uri 参数或 ssl 选项 | `ssl: { rejectUnauthorized: false }` |
| 获取连接 | `pool.getConnection()` | `pool.connect()` |
| 执行查询 | `pool.execute(sql, params)` | `pool.query(sql, params)` |
| 参数占位符 | `?` | `$1, $2, $3, ...` |
| 事务开始 | `connection.beginTransaction()` | `client.query("BEGIN")` |
| 事务提交 | `connection.commit()` | `client.query("COMMIT")` |
| 事务回滚 | `connection.rollback()` | `client.query("ROLLBACK")` |
| 释放连接 | `connection.release()` | `client.release()` |
| 返回值格式 | `[rows, fields]` 元组 | `QueryResult { rows, rowCount, ... }` |

### Drizzle ORM 适配器对比

| 特性 | mysql2 适配器 | node-postgres 适配器 |
|------|--------------|---------------------|
| 导入路径 | `drizzle-orm/mysql2` | `drizzle-orm/node-postgres` |
| 初始化 | `drizzle(pool)` | `drizzle(pool)` |
| 返回类型 | MySQL 特有方法 | PostgreSQL 特有方法 |

### DATABASE_URL 格式

```
# MySQL (Before)
mysql://user:password@host:3306/database

# PostgreSQL (After - MemfireDB)
postgresql://user:password@host.memfiredb.com:5432/database?sslmode=require
```

### camelCase 列名注意事项

PostgreSQL 默认将未引用的标识符转为小写。由于现有 schema 使用 camelCase 列名（如 `openId`, `authorId`, `coverImage`），在原始 SQL 中必须用双引号包裹这些列名：

```sql
-- MySQL: 不区分大小写，无需引号
INSERT INTO users (id, openId, loginMethod) VALUES (?, ?, ?)

-- PostgreSQL: camelCase 列名需要双引号
INSERT INTO users (id, "openId", "loginMethod") VALUES ($1, $2, $3)
```

**注意:** 通过 Drizzle ORM 执行的查询会自动处理引号，只有原始 SQL（`pool.query()` / `client.query()`）需要手动添加。

## Testing Requirements

### 验证清单

1. **依赖验证**
   - [ ] `package.json` 无 `mysql2` 依赖
   - [ ] `package.json` 包含 `pg` 和 `@types/pg`
   - [ ] `pnpm install` 成功，无错误

2. **代码验证**
   - [ ] `server/db.ts` 无 `mysql2` 或 `drizzle-orm/mysql2` 的 import
   - [ ] `server/db.ts` 使用 `drizzle-orm/node-postgres` 和 `pg`
   - [ ] 连接池使用 `max: 10` 和 `ssl: { rejectUnauthorized: false }`
   - [ ] `toMySQLDatetime` 函数已删除
   - [ ] 所有原始 SQL 的参数占位符从 `?` 改为 `$N`
   - [ ] 所有原始 SQL 中的 camelCase 列名加双引号

3. **静态类型检查**
   - [ ] `npx tsc --noEmit` 通过

4. **运行时验证**
   - [ ] 连接池可成功建立到 MemfireDB 的连接
   - [ ] 简单查询（如 `SELECT 1`）可正常执行
   - [ ] 数据导入/导出事务流程正常

5. **手动审查**
   - [ ] grep 整个 server 目录确认无 mysql2 残留引用
   - [ ] 确认 `ensureFulltextIndex` 已标记为 no-op
   - [ ] 确认 `ensurePageViewsTable` 使用 PostgreSQL DDL 语法
   - [ ] 确认 `importAllData` 中序列重置逻辑正确

## Dependencies

### 前置依赖

- **Story 1.1**: Drizzle ORM Schema 从 MySQL 迁移至 PostgreSQL（schema 必须先迁移完成）

### 被阻塞的后续 Story

- **Story 1.3**: 数据库查询语法适配（依赖驱动替换完成，需要适配 MySQL 特有 SQL 语法如 FULLTEXT、DATE_FORMAT 等）

### 包依赖变更

| 操作 | 包名 | 版本 | 类型 |
|------|------|------|------|
| 移除 | `mysql2` | `^3.15.0` | dependencies |
| 新增 | `pg` | `^8.x` | dependencies |
| 新增 | `@types/pg` | `^8.x` | devDependencies |

### 不需要变更的包

- `drizzle-orm` (0.44.5+) 已包含 `node-postgres` 适配器
- `drizzle-kit` (0.31.4+) 已支持 PostgreSQL

## Dev Notes

### 实施顺序建议

1. 替换 npm 依赖（Task 1）
2. 修改 import 和类型声明（Task 2-3）
3. 替换连接池创建逻辑（Task 4-5）
4. 适配原始 SQL 函数（Task 6-10）
5. 添加序列重置逻辑（Task 11）
6. 删除 `toMySQLDatetime`（Task 9）
7. 运行类型检查（Task 12）
8. 连接测试（Task 13）

### 风险与注意事项

- **中风险**: `importAllData()` 函数包含大量原始 SQL，参数占位符和列名引号的转换容易遗漏
- **中风险**: PostgreSQL 的序列重置是新增逻辑，序列名称需与 Drizzle 生成的一致
- **低风险**: `ensureFulltextIndex` 设为 no-op 后，全文搜索功能暂时不可用（在 Story 1.3 中恢复）
- **注意**: 本 story 完成后，部分查询可能仍使用 MySQL 语法（如 `DATE_FORMAT`、`MATCH...AGAINST`），这些将在 Story 1.3 中修复
- **注意**: `upsertUser` 中的 `onDuplicateKeyUpdate` 是 MySQL 特有的 Drizzle API，需在 Story 1.3 中替换为 `onConflictDoUpdate`

### 变更影响范围

本 story 仅修改以下文件：
- `package.json` - 依赖替换
- `pnpm-lock.yaml` - 自动更新
- `server/db.ts` - 驱动和连接层替换

以下文件**不需要修改**：
- `server/_core/sdk.ts` - 通过 db 模块间接使用，无直接驱动引用
- `drizzle/schema.ts` - 已在 Story 1.1 中完成迁移
- `drizzle.config.ts` - 已在 Story 1.1 中完成迁移
- 其他 server 端路由/控制器文件 - 通过 Drizzle ORM API 操作，无直接驱动引用
