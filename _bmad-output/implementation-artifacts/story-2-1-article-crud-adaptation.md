---
storyId: '2-1'
epicId: 2
title: '文章 CRUD 操作适配'
status: 'ready-for-dev'
priority: 'high'
storyPoints: 5
dependencies: ['1-1', '1-2', '1-3']
blockedBy: ['1-3']
blocks: ['2-2']
created: '2026-03-21'
---

# Story 2.1: 文章 CRUD 操作适配

## Story Description

**As a** 管理员,
**I want** 在新的 PostgreSQL 数据库下创建、编辑、删除文章,
**So that** 我可以完整管理博客内容。

## Background & Context

- 本项目为 Brownfield 重构，Epic 1 已完成数据库迁移（Schema 迁移、驱动替换、查询语法适配）
- 当前 `server/db.ts` 中已包含文章相关的 CRUD 函数（`createArticle`、`updateArticle`、`deleteArticle`），已在 Story 1.3 中适配了 PostgreSQL 语法
- 当前 `server/routers.ts` 中已包含文章相关的 tRPC 路由（`article.create`、`article.update`、`article.delete`），已使用 `adminProcedure` 保护
- 本 Story 的核心目标是**验证并确认**文章 CRUD 操作在新 PostgreSQL 架构下完整可用，确保所有 PostgreSQL 特有模式（`.returning()`、手动 `updatedAt`、`onConflictDoUpdate`、缓存失效）正确工作
- 参考架构决策：ADR-02（Drizzle ORM 查询适配：`.returning()` 替代 `insertId`、`onConflictDoUpdate` 替代 `onDuplicateKeyUpdate`、应用层 `updatedAt`）

## Current State Analysis

### 现有文件: `server/db.ts` — 文章 CRUD 函数

| 函数 | 功能 | PostgreSQL 适配状态 |
|------|------|-------------------|
| `createArticle()` | 创建文章 | ✅ 已使用 `.returning({ id: articles.id })` |
| `updateArticle()` | 更新文章 | ✅ 已手动设置 `updatedAt: new Date()` |
| `deleteArticle()` | 删除文章 | ✅ 标准 Drizzle 删除，无方言差异 |
| `getArticleById()` | 按 ID 查询 | ✅ 标准查询 |
| `getArticleBySlug()` | 按 slug 查询 | ✅ 标准查询 |
| `getArticles()` | 列表查询（含搜索） | ✅ 已使用 PostgreSQL tsvector + ILIKE 降级 |

### 现有文件: `server/routers.ts` — 文章 tRPC 路由

| 路由 | 方法 | 保护级别 | 缓存失效 |
|------|------|---------|---------|
| `article.create` | mutation | adminProcedure | ✅ `invalidateArticleCache()` |
| `article.update` | mutation | adminProcedure | ✅ `invalidateArticleCache()` |
| `article.delete` | mutation | adminProcedure | ✅ `invalidateArticleCache()` |
| `article.list` | query | publicProcedure | LRU 缓存 5min TTL |
| `article.bySlug` | query | publicProcedure | 无缓存 |
| `article.byId` | query | adminProcedure | 无缓存 |
| `article.adminList` | query | adminProcedure | 无缓存 |

### 现有文件: `server/_core/cache.ts` — 缓存机制

- `invalidateArticleCache()`: 清除 `article:*`、`doc:tree:*` 模式的缓存键，以及 `sitemap:xml`
- `appCache`: 全局 LRU 缓存实例，容量 100 条目
- `generateArticleListKey()`: 基于查询参数生成缓存键

### 现有文件: `drizzle/schema.ts` — articles 表定义

- 已迁移至 `pgTable`，使用 `serial` 主键、`pgEnum` 枚举
- `updatedAt` 无 `onUpdateNow()`（PostgreSQL 不支持，需应用层处理）

## Acceptance Criteria

**Given** 管理员已通过 OAuth 登录并具有管理员权限
**When** 管理员执行文章操作
**Then:**

- [ ] **AC-1**: 可创建文章（标题、slug、摘要、正文、封面图、分类、类型、状态）（FR1）
- [ ] **AC-2**: 可编辑已有文章的所有字段（FR2）
- [ ] **AC-3**: 可删除文章（FR3）
- [ ] **AC-4**: 插入操作使用 `.returning({ id: articles.id })` 获取新文章 ID
- [ ] **AC-5**: 更新操作手动设置 `updatedAt: new Date()`
- [ ] **AC-6**: upsert 操作使用 `onConflictDoUpdate`
- [ ] **AC-7**: 文章写操作后调用 `invalidateArticleCache()` 清除缓存

## Tasks

### Task 1: 验证 createArticle 数据库函数（AC-1, AC-4）

**File**: `server/db.ts`

**验证要点:**

1. 确认 `createArticle()` 函数使用 `.returning({ id: articles.id })` 获取新插入文章的 ID
2. 确认函数签名包含所有必需字段：title、slug、content、authorId
3. 确认函数签名包含所有可选字段：summary、coverImage、categoryId、status、type、order
4. 确认 status 为 "published" 时自动设置 `publishedAt: new Date()`
5. 确认返回值为新文章 ID（number 类型）

**现有代码已满足要求:**

```typescript
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
  // ...
  const result = await db.insert(articles).values({
    ...data,
    type: data.type ?? "blog",
    order: data.order ?? 0,
    publishedAt: data.status === "published" ? new Date() : null,
  }).returning({ id: articles.id });

  return result[0].id;
}
```

**验证方法:** TypeScript 编译检查 + 集成测试

### Task 2: 验证 updateArticle 数据库函数（AC-2, AC-5）

**File**: `server/db.ts`

**验证要点:**

1. 确认 `updateArticle()` 函数在所有更新中手动设置 `updatedAt: new Date()`
2. 确认支持编辑所有可变字段：title、slug、summary、content、coverImage、categoryId、status、type、order
3. 确认状态切换到 "published" 时，若之前未发布则自动设置 `publishedAt`
4. 确认函数不会覆盖未传入的字段（部分更新语义）

**现有代码已满足要求:**

```typescript
export async function updateArticle(id: number, data: { ... }): Promise<void> {
  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
  // publishedAt logic...
  await db.update(articles).set(updateData).where(eq(articles.id, id));
}
```

**验证方法:** TypeScript 编译检查 + 集成测试

### Task 3: 验证 deleteArticle 数据库函数（AC-3）

**File**: `server/db.ts`

**验证要点:**

1. 确认 `deleteArticle()` 函数通过 ID 删除文章
2. 确认删除不会导致外键约束错误（page_views 表的 articleId 为 nullable）
3. 确认删除操作无返回值要求

**现有代码已满足要求:**

```typescript
export async function deleteArticle(id: number): Promise<void> {
  await db.delete(articles).where(eq(articles.id, id));
}
```

**注意:** page_views 表中 `articleId` 为 nullable，删除文章不会因外键约束失败。但需确认是否需要级联删除关联的 page_views 记录。

**验证方法:** 集成测试（验证删除后关联 page_views 记录不受影响）

### Task 4: 验证 tRPC 路由 — article.create（AC-1, AC-4, AC-7）

**File**: `server/routers.ts`

**验证要点:**

1. 确认 `article.create` 使用 `adminProcedure` 保护（需管理员权限）
2. 确认 input 校验包含所有字段：title、slug、summary、content、coverImage、categoryId、status、type、order
3. 确认 `authorId` 从 `ctx.user.id` 获取（当前登录管理员）
4. 确认创建后调用 `invalidateArticleCache()` 清除缓存
5. 确认返回 `{ id: articleId }`

**现有代码已满足要求。**

**验证方法:** 手动 API 调用测试 + 单元测试

### Task 5: 验证 tRPC 路由 — article.update（AC-2, AC-5, AC-7）

**File**: `server/routers.ts`

**验证要点:**

1. 确认 `article.update` 使用 `adminProcedure` 保护
2. 确认 input 校验支持所有可编辑字段（均为 optional）
3. 确认更新后调用 `invalidateArticleCache()` 清除缓存
4. 确认返回 `{ success: true }`

**现有代码已满足要求。**

**验证方法:** 手动 API 调用测试 + 单元测试

### Task 6: 验证 tRPC 路由 — article.delete（AC-3, AC-7）

**File**: `server/routers.ts`

**验证要点:**

1. 确认 `article.delete` 使用 `adminProcedure` 保护
2. 确认 input 仅需 `{ id: number }`
3. 确认删除后调用 `invalidateArticleCache()` 清除缓存
4. 确认返回 `{ success: true }`

**现有代码已满足要求。**

**验证方法:** 手动 API 调用测试 + 单元测试

### Task 7: 补充 upsert 文章操作（AC-6）

**File**: `server/db.ts`

当前代码中**不存在**文章级别的 upsert 操作。用户 upsert（`upsertUser`）已使用 `onConflictDoUpdate`，但文章 CRUD 使用独立的 create/update 操作。

**需要评估是否需要新增文章 upsert:**

- 当前创建和更新是分离的，前端通过 `article.create` 和 `article.update` 分别调用
- 如果未来需要通过 slug 进行 upsert（如导入场景），可在此 story 中预留

**如需新增 `upsertArticle()` 函数:**

```typescript
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
      categoryId: data.categoryId ?? null,
      status: data.status ?? "draft",
      type: data.type ?? "blog",
      order: data.order ?? 0,
      updatedAt: new Date(),
    },
  }).returning({ id: articles.id });

  return result[0].id;
}
```

**决策:** 本 story 中实现 `upsertArticle()` 函数，为后续数据导入（Epic 5）和内容管理扩展做准备。

### Task 8: 为 upsertArticle 添加 tRPC 路由（AC-6, AC-7）

**File**: `server/routers.ts`

在 `article` router 中新增 `upsert` mutation：

```typescript
// Upsert article by slug (admin)
upsert: adminProcedure
  .input(
    z.object({
      title: z.string().min(1).max(255),
      slug: z.string().min(1).max(255),
      summary: z.string().optional(),
      content: z.string().min(1),
      coverImage: z.string().optional(),
      categoryId: z.number().optional(),
      status: z.enum(["draft", "published", "archived"]).default("draft"),
      type: z.enum(["blog", "doc"]).default("blog"),
      order: z.number().default(0),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const articleId = await db.upsertArticle({
      ...input,
      authorId: ctx.user.id,
    });

    // Invalidate article cache
    invalidateArticleCache();

    return { id: articleId };
  }),
```

### Task 9: 验证缓存失效机制（AC-7）

**File**: `server/_core/cache.ts`

**验证要点:**

1. 确认 `invalidateArticleCache()` 清除以下缓存模式：
   - `article:*` — 文章列表缓存
   - `doc:tree:*` — 文档树缓存
   - `sitemap:xml` — sitemap 缓存
2. 确认所有文章写操作（create、update、delete、upsert）后都调用了 `invalidateArticleCache()`
3. 确认缓存清除是同步操作，不会阻塞响应

**现有代码已满足要求:**

```typescript
export function invalidateArticleCache(): void {
  appCache.deletePattern(/^article:/);
  appCache.deletePattern(/^doc:tree:/);
  appCache.delete("sitemap:xml");
}
```

**验证方法:** 单元测试验证缓存清除行为

### Task 10: 编写集成测试 — 文章创建流程（AC-1, AC-4, AC-7）

**File**: `server/__tests__/article-crud.test.ts`（新建）

**测试用例:**

1. 管理员可成功创建文章，返回新文章 ID
2. 创建文章后可通过 ID 查询到该文章
3. 创建时传入 status="published" 会自动设置 publishedAt
4. 创建时不传 status 默认为 "draft"
5. 非管理员调用 create 返回 FORBIDDEN 错误
6. 创建文章后 article 缓存被清除

### Task 11: 编写集成测试 — 文章编辑流程（AC-2, AC-5, AC-7）

**File**: `server/__tests__/article-crud.test.ts`

**测试用例:**

1. 管理员可成功更新文章标题
2. 管理员可成功更新文章所有字段
3. 更新后 updatedAt 字段值大于更新前
4. 部分更新不会覆盖未传入的字段
5. 将 status 从 "draft" 改为 "published" 会设置 publishedAt
6. 非管理员调用 update 返回 FORBIDDEN 错误
7. 更新文章后 article 缓存被清除

### Task 12: 编写集成测试 — 文章删除流程（AC-3, AC-7）

**File**: `server/__tests__/article-crud.test.ts`

**测试用例:**

1. 管理员可成功删除文章
2. 删除后通过 ID 查询返回 null
3. 删除不存在的文章不抛出异常（幂等性）
4. 非管理员调用 delete 返回 FORBIDDEN 错误
5. 删除文章后 article 缓存被清除
6. 删除文章后关联的 page_views 记录不受影响

### Task 13: 编写集成测试 — 文章 upsert 流程（AC-6, AC-7）

**File**: `server/__tests__/article-crud.test.ts`

**测试用例:**

1. upsert 新文章（slug 不存在）→ 创建新文章并返回 ID
2. upsert 已有文章（slug 已存在）→ 更新文章并返回已有 ID
3. upsert 更新时 updatedAt 被正确设置
4. upsert 后缓存被清除

### Task 14: TypeScript 编译验证

执行以下命令确认无类型错误：

```bash
npx tsc --noEmit
```

**预期结果:** 编译通过，无错误输出。

### Task 15: 端到端手动验证

通过浏览器或 API 工具完成以下操作：

1. 以管理员身份登录
2. 创建一篇新文章（填写所有字段）→ 确认返回文章 ID
3. 编辑刚创建的文章（修改标题和内容）→ 确认 updatedAt 更新
4. 查看文章列表 → 确认新文章出现在列表中
5. 删除文章 → 确认从列表中消失
6. 再次查看列表 → 确认缓存已失效，列表更新

## Technical Notes

### PostgreSQL 查询适配关键点

| 适配项 | MySQL (Before) | PostgreSQL (After) | 当前状态 |
|--------|---------------|-------------------|---------|
| 获取插入 ID | `result.insertId` | `.returning({ id: articles.id })` | ✅ 已适配 |
| 更新时间戳 | `onUpdateNow()` 自动处理 | 手动 `updatedAt: new Date()` | ✅ 已适配 |
| upsert 语法 | `onDuplicateKeyUpdate` | `onConflictDoUpdate` | ⚠️ 需新增 |
| 缓存失效 | 同 | `invalidateArticleCache()` | ✅ 已实现 |

### 文件变更清单

| 文件 | 变更类型 | 描述 |
|------|---------|------|
| `server/db.ts` | 新增函数 | 添加 `upsertArticle()` 函数 |
| `server/routers.ts` | 新增路由 | 添加 `article.upsert` mutation |
| `server/__tests__/article-crud.test.ts` | 新建文件 | 文章 CRUD 集成测试 |

### 缓存失效策略

文章写操作后，缓存失效范围：

```
invalidateArticleCache()
├── 删除 article:* → 文章列表缓存（按分页、筛选条件）
├── 删除 doc:tree:* → 文档导航树缓存
└── 删除 sitemap:xml → SEO sitemap 缓存
```

这确保了文章变更后，所有可能展示文章内容的缓存都被刷新。

### 权限模型

```
publicProcedure  → 所有用户（包括未登录）
protectedProcedure → 已登录用户
adminProcedure  → 已登录 + role === "admin" 的用户
```

文章 CRUD 操作全部使用 `adminProcedure`，确保只有管理员可以执行写操作。

## Testing Requirements

### 验证清单

1. **静态类型检查**
   - `npx tsc --noEmit` 通过
   - 新增函数/路由的类型签名正确

2. **单元测试**
   - `createArticle()` 返回正确的 ID 类型
   - `updateArticle()` 包含 `updatedAt` 更新
   - `deleteArticle()` 正确执行删除
   - `upsertArticle()` 新增/更新逻辑正确
   - `invalidateArticleCache()` 清除正确的缓存模式

3. **集成测试**
   - 文章创建 → 查询 → 更新 → 删除 完整流程
   - upsert 新建和更新两种路径
   - 权限校验（非管理员被拒绝）
   - 缓存失效验证

4. **端到端验证**
   - 通过浏览器完成文章 CRUD 全流程
   - 验证列表页缓存在写操作后正确刷新

## Dependencies

### 前置依赖

- **Story 1.1**: Drizzle ORM Schema 从 MySQL 迁移至 PostgreSQL（articles 表定义）
- **Story 1.2**: 数据库驱动替换与连接配置（pg 驱动 + 连接池）
- **Story 1.3**: 数据库查询语法适配（`.returning()`、`updatedAt` 手动设置）

### 被阻塞的后续 Story

- **Story 2.2**: 文章状态管理与发布日期修改（依赖本 story 的文章 CRUD 基础能力）

### 包依赖

- 无新增包依赖（所有需要的包已在 Epic 1 中安装）

## Dev Notes

### 实施顺序建议

1. 先验证现有 CRUD 函数（Task 1-3）— 确认 Epic 1 的适配工作正确
2. 验证现有 tRPC 路由（Task 4-6）— 确认路由层集成正确
3. 新增 upsertArticle 函数和路由（Task 7-8）— 补充缺失的 upsert 能力
4. 验证缓存机制（Task 9）
5. 编写测试（Task 10-13）
6. 编译验证（Task 14）
7. 端到端手动验证（Task 15）

### 风险与注意事项

- **低风险**: 大部分代码已在 Epic 1 中适配完成，本 story 主要是验证和补充
- **新增 upsert**: `upsertArticle()` 使用 `articles.slug` 作为冲突检测目标，需确保 slug 字段有 unique 约束（schema 中已定义 `.unique()`）
- **注意**: 删除文章时，page_views 中的关联记录（`articleId` 外键）不会被自动删除。当前 `articleId` 列为 nullable 且无外键约束，因此不会导致删除失败。如需清理孤立记录，可在后续 story 中处理
- **缓存一致性**: `invalidateArticleCache()` 是同步操作，在数据库写入成功后立即执行，确保后续读请求不会命中过期缓存
