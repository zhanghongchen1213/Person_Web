---
storyId: '1-3'
epicId: 1
title: '数据库查询语法适配（MySQL → PostgreSQL）'
status: 'ready-for-dev'
priority: 'high'
storyPoints: 3
dependencies: ['1-1', '1-2']
blockedBy: ['1-2']
blocks: []
created: '2026-03-21'
---

# Story 1.3: 数据库查询语法适配（MySQL → PostgreSQL）

## Story Description

**As a** 开发者,
**I want** 将 server/db.ts 中所有 MySQL 特有的查询语法适配为 PostgreSQL 语法,
**So that** 所有数据库操作在 PostgreSQL 上正确运行。

## Background & Context

- Story 1-1 已完成 Drizzle ORM schema 从 MySQL 方言迁移至 PostgreSQL 方言
- Story 1-2 已完成驱动替换（mysql2 → pg）和连接配置
- Story 1-2 的开发过程中已顺带修复了大部分 MySQL 语法问题
- 本 story 需完成剩余的查询语法适配工作

### Story 1-2 中已完成的适配（无需重复）

| 适配项 | 函数 | 状态 |
|--------|------|------|
| `onDuplicateKeyUpdate` → `onConflictDoUpdate` | `upsertUser` | ✅ 已完成 |
| `insertId` → `.returning()` | `createArticle`, `createCategory`, `findOrCreateCategory` | ✅ 已完成 |
| `DATE_FORMAT` → `TO_CHAR` | `getAnalyticsOverview` | ✅ 已完成 |
| `CURDATE` → `CURRENT_DATE` | `getPageViewStats` | ✅ 已完成 |
| `DATE_SUB` → `make_interval` / `INTERVAL` | `getPageViewStats`, `getAnalyticsOverview` | ✅ 已完成 |
| `MATCH AGAINST` → 已标记为 `null`（全文搜索 TODO） | `getArticles` | ✅ 已标记 |

## Current State Analysis

经过对当前 `server/db.ts` 的完整审查，以下是仍需处理的 MySQL 语法残留和适配项：

### 残留问题 1: 全文搜索未实现（PostgreSQL tsvector/tsquery）

**位置**: `server/db.ts` 第 191-216 行

当前状态：MySQL 的 `MATCH AGAINST` 全文搜索已被设为 `null`，搜索降级为 `LIKE` 查询。需要实现 PostgreSQL 原生全文搜索。

```typescript
// 当前代码（第 191-193 行）
// TODO: Story 1.3 - 替换为 PostgreSQL tsvector/tsquery 全文搜索
// MySQL MATCH AGAINST 语法在 PostgreSQL 中不可用，暂时禁用走 LIKE 降级路径
const ftCondition = null;
```

### 残留问题 2: ensureFulltextIndex() 为空操作

**位置**: `server/db.ts` 第 53-58 行

当前状态：函数被设为 no-op，需要实现 PostgreSQL GIN 索引创建逻辑。

```typescript
// 当前代码
export async function ensureFulltextIndex() {
  // PostgreSQL uses GIN/GiST indexes for full-text search instead of MySQL FULLTEXT.
  // Full-text search index creation will be handled in Story 1.3 (query syntax adaptation).
  // This function is intentionally left as a no-op for now.
  return;
}
```

### 残留问题 3: updatedAt 未在写操作中手动设置

MySQL 的 `ON UPDATE CURRENT_TIMESTAMP` 特性在 PostgreSQL 中不存在。Schema 中 `updatedAt` 字段仅有 `defaultNow()`（仅影响 INSERT），UPDATE 操作不会自动更新此字段。

**受影响的函数:**

| 函数 | 表 | 是否设置 updatedAt | 状态 |
|------|----|--------------------|------|
| `updateArticle` | articles | ❌ 未设置 | 需修复 |
| `upsertUser` (update 分支) | users | ❌ 未设置 | 需修复 |
| `updateBackupSettings` | backup_settings | ❌ 未设置 | 需修复 |
| `updateLastBackupTime` | backup_settings | ❌ 未设置 | 需修复 |
| `updateCategory` | categories | N/A（无 updatedAt 字段） | 无需修改 |

### 残留问题 4: 全文搜索相关的死代码

**位置**: `server/db.ts` 第 190-216 行

`getArticles` 函数中存在 `ftCondition` 相关的 dead code 分支（第 204-216 行），由于 `ftCondition` 始终为 `null`，该分支永远不会执行。实现全文搜索后应清理此逻辑。

## Acceptance Criteria

**Given** 现有代码中包含 MySQL 特有语法残留
**When** 开发者完成查询语法适配
**Then:**

- [ ] **AC-1**: 全文搜索使用 PostgreSQL `tsvector/tsquery` 替代 MySQL `MATCH AGAINST`
- [ ] **AC-2**: `ensureFulltextIndex()` 创建 PostgreSQL GIN 索引（基于 `title` 和 `content` 列）
- [ ] **AC-3**: 所有写操作中手动设置 `updatedAt: new Date()`（替代 MySQL `ON UPDATE CURRENT_TIMESTAMP`）
- [ ] **AC-4**: 全文搜索相关的死代码已清理
- [ ] **AC-5**: 所有适配后的查询可正确执行并返回预期结果
- [ ] **AC-6**: TypeScript 编译通过（`npx tsc --noEmit`）

## Tasks

### Task 1: 实现 ensureFulltextIndex() — PostgreSQL GIN 索引（AC-2）

**File**: `server/db.ts`

**Before:**
```typescript
export async function ensureFulltextIndex() {
  // PostgreSQL uses GIN/GiST indexes for full-text search instead of MySQL FULLTEXT.
  // Full-text search index creation will be handled in Story 1.3 (query syntax adaptation).
  // This function is intentionally left as a no-op for now.
  return;
}
```

**After:**
```typescript
export async function ensureFulltextIndex() {
  const pool = getPool();
  if (!pool) return;
  try {
    // Create GIN index for full-text search on articles (title + content)
    // Uses 'simple' config for better CJK (Chinese/Japanese/Korean) support
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_fulltext
      ON articles
      USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '')))
    `);
  } catch (e) {
    console.warn("[Database] Failed to create fulltext index:", e);
  }
}
```

**变更说明:**
- MySQL 的 `FULLTEXT INDEX ... WITH PARSER ngram` 替换为 PostgreSQL 的 `GIN` 索引
- 使用 `to_tsvector('simple', ...)` 构建文本搜索向量
- 使用 `'simple'` 配置（而非 `'english'`），因为博客内容主要为中文，`simple` 配置对 CJK 字符更友好
- `coalesce()` 确保 NULL 值不会导致索引失败
- `CREATE INDEX IF NOT EXISTS` 确保幂等性

### Task 2: 实现 PostgreSQL 全文搜索（AC-1, AC-4）

**File**: `server/db.ts`

替换 `getArticles` 函数中的搜索逻辑。

**Before（第 190-235 行）:**
```typescript
const escapedSearch = search?.replace(/[+\-*~<>()@"]/g, " ").trim();
// TODO: Story 1.3 - 替换为 PostgreSQL tsvector/tsquery 全文搜索
// MySQL MATCH AGAINST 语法在 PostgreSQL 中不可用，暂时禁用走 LIKE 降级路径
const ftCondition = null;
const likeCondition = search
  ? or(
      like(articles.title, `%${search}%`),
      like(articles.content, `%${search}%`)
    )
  : null;

let conditions = [...baseConditions];
let total = 0;

if (ftCondition) {
  try {
    const ftWhere = and(...conditions, ftCondition);
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(ftWhere);
    total = Number(countResult[0]?.count || 0);
    if (total > 0) conditions.push(ftCondition);
  } catch {
    // FULLTEXT index missing or query failed
  }
}

if (total === 0 && likeCondition) {
  conditions = [...baseConditions, likeCondition];
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(and(...conditions));
  total = Number(countResult[0]?.count || 0);
}

if (total === 0 && !search) {
  const whereForCount =
    baseConditions.length > 0 ? and(...baseConditions) : undefined;
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(whereForCount);
  total = Number(countResult[0]?.count || 0);
}
```

**After:**
```typescript
// Build search condition using PostgreSQL tsvector/tsquery with LIKE fallback
let searchCondition = null;
if (search) {
  const sanitized = search.replace(/[&|!():*<>]/g, " ").trim();
  if (sanitized.length > 0) {
    // Split into words and join with & (AND) for tsquery
    const tsQueryTerms = sanitized
      .split(/\s+/)
      .filter(t => t.length > 0)
      .map(t => `'${t.replace(/'/g, "''")}'`)
      .join(" & ");

    try {
      // Try full-text search first (requires GIN index from ensureFulltextIndex)
      searchCondition = sql`to_tsvector('simple', coalesce(${articles.title}, '') || ' ' || coalesce(${articles.content}, '')) @@ to_tsquery('simple', ${tsQueryTerms})`;
    } catch {
      // Fallback to LIKE if tsquery fails
      searchCondition = or(
        like(articles.title, `%${search}%`),
        like(articles.content, `%${search}%`)
      );
    }
  } else {
    // Empty search after sanitization, use LIKE fallback
    searchCondition = or(
      like(articles.title, `%${search}%`),
      like(articles.content, `%${search}%`)
    );
  }
}

const conditions = searchCondition
  ? [...baseConditions, searchCondition]
  : [...baseConditions];

const whereClauseForCount =
  conditions.length > 0 ? and(...conditions) : undefined;
const countResult = await db
  .select({ count: sql<number>`count(*)` })
  .from(articles)
  .where(whereClauseForCount);
const total = Number(countResult[0]?.count || 0);
```

**变更说明:**
- MySQL `MATCH(title, content) AGAINST(? IN BOOLEAN MODE)` 替换为 PostgreSQL `to_tsvector() @@ to_tsquery()`
- 使用 `'simple'` 文本搜索配置以支持中文内容
- 搜索词使用 `&`（AND）连接，确保多词搜索时所有词必须匹配
- 对搜索输入进行转义，防止 tsquery 语法错误
- 移除了 `ftCondition` / `likeCondition` 的双路径逻辑，简化为单一搜索路径
- 保留 LIKE 作为 fallback

### Task 3: updateArticle 添加 updatedAt（AC-3）

**File**: `server/db.ts`

**Before（第 434 行）:**
```typescript
const updateData: Record<string, unknown> = { ...data };
```

**After:**
```typescript
const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
```

**变更说明:**
- MySQL 中 `updatedAt` 通过 schema 定义的 `ON UPDATE CURRENT_TIMESTAMP` 自动更新
- PostgreSQL 无此特性，需在每次 UPDATE 操作中手动设置

### Task 4: upsertUser 添加 updatedAt（AC-3）

**File**: `server/db.ts`

**Before（第 113-115 行）:**
```typescript
if (Object.keys(updateSet).length === 0) {
  updateSet.lastSignedIn = new Date();
}
```

**After:**
```typescript
// Always update updatedAt on upsert (PostgreSQL has no ON UPDATE CURRENT_TIMESTAMP)
updateSet.updatedAt = new Date();

if (Object.keys(updateSet).length === 1) {
  // Only updatedAt was set, also update lastSignedIn
  updateSet.lastSignedIn = new Date();
}
```

**变更说明:**
- 在 `onConflictDoUpdate` 的 `set` 中始终包含 `updatedAt: new Date()`
- 调整空检查逻辑：由于 `updatedAt` 始终存在，改为检查 `length === 1`

### Task 5: updateBackupSettings 添加 updatedAt（AC-3）

**File**: `server/db.ts`

**Before（第 1599-1606 行）:**
```typescript
await db
  .update(backupSettings)
  .set({
    enabled,
    interval,
    nextBackupAt,
  })
  .where(eq(backupSettings.id, existing[0].id));
```

**After:**
```typescript
await db
  .update(backupSettings)
  .set({
    enabled,
    interval,
    nextBackupAt,
    updatedAt: new Date(),
  })
  .where(eq(backupSettings.id, existing[0].id));
```

### Task 6: updateLastBackupTime 添加 updatedAt（AC-3）

**File**: `server/db.ts`

**Before（第 1624-1627 行）:**
```typescript
await db.update(backupSettings).set({
  lastBackupAt: new Date(),
  nextBackupAt,
});
```

**After:**
```typescript
await db.update(backupSettings).set({
  lastBackupAt: new Date(),
  nextBackupAt,
  updatedAt: new Date(),
});
```

### Task 7: 验证 TypeScript 编译（AC-6）

```bash
npx tsc --noEmit
```

**预期结果:** 编译通过，无类型错误。

### Task 8: 功能验证（AC-5）

验证步骤：

1. **全文搜索验证**
   - 启动开发服务器
   - 确认 `ensureFulltextIndex()` 成功创建 GIN 索引（无错误日志）
   - 测试文章搜索功能，确认搜索返回正确结果
   - 测试中文搜索词
   - 测试多词搜索

2. **updatedAt 验证**
   - 更新一篇文章，确认 `updatedAt` 字段已更新
   - 执行用户 upsert，确认 `updatedAt` 字段已更新
   - 修改备份设置，确认 `updatedAt` 字段已更新

3. **回归验证**
   - 确认文章 CRUD 操作正常
   - 确认分类 CRUD 操作正常
   - 确认用户登录/更新正常
   - 确认数据导入/导出正常
   - 确认页面访问统计正常

## Technical Notes

### PostgreSQL 全文搜索 vs MySQL FULLTEXT 对比

| 特性 | MySQL FULLTEXT | PostgreSQL FTS |
|------|----------------|----------------|
| 索引类型 | FULLTEXT INDEX | GIN / GiST INDEX |
| 搜索语法 | `MATCH(cols) AGAINST(term IN BOOLEAN MODE)` | `to_tsvector(config, text) @@ to_tsquery(config, term)` |
| 中文支持 | `WITH PARSER ngram` | `'simple'` 配置（或安装 `pg_jieba` / `zhparser` 扩展） |
| 布尔运算 | `+term1 -term2` | `term1 & !term2` |
| 索引创建 | `ALTER TABLE ... ADD FULLTEXT INDEX` | `CREATE INDEX ... USING GIN(to_tsvector(...))` |

### 中文全文搜索注意事项

- PostgreSQL 默认的 `'english'` / `'simple'` 文本搜索配置不支持中文分词
- `'simple'` 配置按空格分词，对中文的支持有限但基本可用
- 如需更好的中文搜索体验，后续可安装 `zhparser` 或 `pg_jieba` 扩展
- MemfireDB 作为托管服务，扩展安装能力可能受限
- 当前实现：全文搜索 + LIKE fallback 双保险策略

### updatedAt 自动更新替代方案

MySQL 的 `ON UPDATE CURRENT_TIMESTAMP` 在 PostgreSQL 中有以下替代方案：

| 方案 | 优缺点 |
|------|--------|
| **方案 A: 应用层手动设置**（本 story 采用） | 简单直接，无需 DB 权限，但需确保所有写操作都包含 |
| 方案 B: PostgreSQL 触发器 | 自动化，但需要 DB 管理权限，MemfireDB 可能不支持 |
| 方案 C: Drizzle ORM 中间件 | 统一处理，但增加复杂度 |

选择方案 A 的原因：
- 最简单且可控
- 不依赖数据库特性
- 与 MemfireDB 托管环境兼容
- 写操作数量有限，手动设置不会增加显著负担

## Testing Requirements

### 验证清单

1. **全文搜索**
   - [ ] `ensureFulltextIndex()` 成功创建 GIN 索引
   - [ ] 搜索英文关键词返回正确结果
   - [ ] 搜索中文关键词返回正确结果（至少通过 LIKE fallback）
   - [ ] 多词搜索正确工作
   - [ ] 空搜索词不触发全文搜索
   - [ ] 特殊字符被正确转义，不导致 SQL 注入

2. **updatedAt 更新**
   - [ ] `updateArticle` 操作后 `updatedAt` 已更新
   - [ ] `upsertUser` 操作后 `updatedAt` 已更新
   - [ ] `updateBackupSettings` 操作后 `updatedAt` 已更新
   - [ ] `updateLastBackupTime` 操作后 `updatedAt` 已更新

3. **回归测试**
   - [ ] 文章列表查询正常（含分页）
   - [ ] 文章搜索功能正常
   - [ ] 文章 CRUD 正常
   - [ ] 分类 CRUD 正常
   - [ ] 用户登录/注册正常
   - [ ] 数据统计/分析正常
   - [ ] 数据导入/导出正常
   - [ ] 页面访问记录正常

4. **静态检查**
   - [ ] `npx tsc --noEmit` 通过
   - [ ] 无 MySQL 特有语法残留（grep 检查）

## Dependencies

### 前置依赖

- **Story 1-1**: Drizzle ORM Schema MySQL → PostgreSQL 迁移（✅ 已完成）
- **Story 1-2**: 数据库驱动替换（mysql2 → pg）（✅ 已完成）

### 被阻塞的后续 Story

- 无直接阻塞的后续 story

### 包依赖变更

无。所有必要的包已在 Story 1-2 中安装。

## Dev Notes

### 实施顺序建议

1. 实现 `ensureFulltextIndex()` GIN 索引（Task 1）
2. 实现全文搜索逻辑（Task 2）
3. 为所有写操作添加 `updatedAt`（Task 3-6）
4. TypeScript 编译检查（Task 7）
5. 功能验证（Task 8）

### 风险与注意事项

- **中风险**: PostgreSQL `'simple'` 文本搜索配置对中文支持有限，可能需要后续优化
- **低风险**: `updatedAt` 手动设置可能在未来新增的写操作中被遗忘，建议添加代码审查检查点
- **低风险**: GIN 索引在大数据量时可能影响写入性能，当前数据量下无需担忧
- **注意**: MemfireDB 作为托管 PostgreSQL，某些扩展（如 `zhparser`）可能不可用

### 变更影响范围

本 story 仅修改以下文件：
- `server/db.ts` — 全文搜索实现 + updatedAt 修复

以下文件**不需要修改**：
- `drizzle/schema.ts` — 已在 Story 1-1 中完成
- `package.json` — 无新增依赖
- `server/_core/sdk.ts` — 通过 db 模块间接使用
- 前端文件 — 搜索 API 接口不变

### MySQL 语法残留最终审查

完成本 story 后，`server/db.ts` 中应不再包含任何 MySQL 特有语法：

| MySQL 语法 | PostgreSQL 替代 | 完成 Story |
|------------|-----------------|-----------|
| `mysql2/promise` | `pg` | 1-2 |
| `drizzle-orm/mysql2` | `drizzle-orm/node-postgres` | 1-2 |
| `onDuplicateKeyUpdate` | `onConflictDoUpdate` | 1-2 |
| `insertId` | `.returning()` | 1-2 |
| `DATE_FORMAT()` | `TO_CHAR()` | 1-2 |
| `CURDATE()` | `CURRENT_DATE` | 1-2 |
| `DATE_SUB()` | `make_interval()` / `INTERVAL` | 1-2 |
| `AUTO_INCREMENT` | `SERIAL` | 1-2 |
| `?` 参数占位符 | `$N` 编号占位符 | 1-2 |
| `MATCH AGAINST` | `to_tsvector @@ to_tsquery` | **1-3** |
| `FULLTEXT INDEX` | `GIN INDEX` | **1-3** |
| `ON UPDATE CURRENT_TIMESTAMP` | 手动 `updatedAt: new Date()` | **1-3** |
