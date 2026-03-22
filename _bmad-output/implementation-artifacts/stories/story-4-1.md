---
storyId: '4-1'
epicId: 4
title: '页面浏览数据记录'
status: 'ready-for-dev'
priority: 'high'
storyPoints: 3
dependencies: ['1-2', '1-3']
blockedBy: ['1-3']
blocks: ['4-2']
created: '2026-03-21'
---

# Story 4.1: 页面浏览数据记录

## Story Description

**As a** 系统,
**I want** 自动记录页面浏览数据,
**So that** 管理员可以了解博客的访问情况。

## Background & Context

- Epic 1 已完成数据库迁移至 PostgreSQL（MemfireDB），驱动替换和查询语法适配均已完成
- `drizzle/schema.ts` 中已定义 `pageViews` 表（pgTable），包含 id、articleId、ip、userAgent、path、viewedAt 字段
- `server/db.ts` 中已实现 `ensurePageViewsTable()` 和 `recordPageView()` 函数
- `server/routers.ts` 中已定义 `analytics.recordView` tRPC mutation 端点
- `server/_core/index.ts` 启动时已调用 `ensurePageViewsTable()` 确保表存在
- 本 Story 需要验证现有实现的完整性，补充缺失功能（如前端调用集成、异步非阻塞记录、索引优化），并确保符合 FR22 要求

## Current State Analysis

### 已有实现

#### 1. Schema 定义 (`drizzle/schema.ts`)

`pageViews` 表已使用 PostgreSQL 方言定义：

```typescript
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  articleId: integer("articleId"),       // nullable: null = 一般页面浏览
  ip: varchar("ip", { length: 45 }),
  userAgent: varchar("userAgent", { length: 512 }),
  path: varchar("path", { length: 500 }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});
```

#### 2. 数据库函数 (`server/db.ts`)

**`ensurePageViewsTable()`** — 确保 page_views 表和索引存在：
- 使用 `pool.query()` 执行 PostgreSQL DDL
- 创建 `idx_page_views_viewed_at` 和 `idx_page_views_article_id` 索引
- 在服务器启动时异步调用

**`recordPageView()`** — 记录单条浏览数据：
- 使用 Drizzle ORM `db.insert(pageViews).values(...)` 插入
- User-Agent 截断至 512 字符
- 失败时静默处理，不影响用户体验

#### 3. tRPC 端点 (`server/routers.ts`)

**`analytics.recordView`** — 公开 mutation：
- 接受 `articleId`（可选）和 `path`（可选）
- 从请求头提取 IP（`x-forwarded-for` 或 `req.ip`）和 User-Agent
- 调用 `db.recordPageView()` 写入数据库

#### 4. 服务器启动 (`server/_core/index.ts`)

- 启动时调用 `ensurePageViewsTable()` 确保表存在
- 异步执行，不阻塞服务器启动

### 待完善部分

| 功能点 | 当前状态 | 需要补充 |
|--------|----------|----------|
| 前端集成调用 | 未实现 | 需在前端页面组件中调用 `analytics.recordView` |
| 异步非阻塞保证 | 部分实现 | `recordPageView` 已 try-catch 静默失败，但需确认前端调用也是 fire-and-forget |
| IP 提取准确性 | 基本实现 | 需考虑 Nginx 反向代理场景下 `x-forwarded-for` 的正确性 |
| 路径索引 | 未创建 | 可考虑为 `path` 列创建索引以加速 `topPaths` 查询 |
| 浏览去重 | 未实现 | 当前每次调用都记录，未做任何去重处理 |

## Acceptance Criteria

**Given** 读者访问博客页面
**When** 页面加载完成
**Then:**

- [ ] **AC-1**: 系统记录浏览数据：文章 ID、IP、User-Agent、路径、时间（FR22）
- [ ] **AC-2**: 浏览记录写入 page_views 表（PostgreSQL）
- [ ] **AC-3**: 记录操作异步执行，不阻塞页面响应
- [ ] **AC-4**: INSERT 语句使用 PostgreSQL 语法
- [ ] **AC-5**: page_views 表含有必要索引（viewedAt、articleId）以支持后续统计查询
- [ ] **AC-6**: 记录失败时不影响用户正常浏览体验（静默失败）
- [ ] **AC-7**: 前端页面加载时自动触发浏览记录

## Tasks

### Task 1: 验证后端 page_views 表定义与 DDL（AC-2, AC-4, AC-5）

**目标**: 确认现有实现完整且正确

**子任务:**

1.1 **验证 Schema 定义** (`drizzle/schema.ts`)
- 确认 `pageViews` 表包含所有必需字段：
  - `id` — SERIAL PRIMARY KEY
  - `articleId` — INTEGER, nullable
  - `ip` — VARCHAR(45), nullable
  - `userAgent` — VARCHAR(512), nullable
  - `path` — VARCHAR(500), nullable
  - `viewedAt` — TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- **状态**: 已实现 ✅

1.2 **验证 ensurePageViewsTable 函数** (`server/db.ts`)
- 确认 DDL 使用 PostgreSQL 语法（`SERIAL`, `INTEGER`, `TIMESTAMP`）
- 确认创建索引：`idx_page_views_viewed_at`, `idx_page_views_article_id`
- **状态**: 已实现 ✅

1.3 **补充 path 列索引** (`server/db.ts`)

在 `ensurePageViewsTable()` 中追加 path 索引创建，以支持 `getPageViewStats()` 中的 `topPaths` 查询：

**File**: `server/db.ts`

在 `ensurePageViewsTable()` 函数中追加：

```typescript
await pool.query(`CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (path)`);
```

**验证**:
- [ ] `ensurePageViewsTable()` 创建 3 个索引：viewedAt、articleId、path
- [ ] 服务器启动日志无索引创建错误

### Task 2: 验证后端记录函数（AC-1, AC-4, AC-6）

**目标**: 确认 `recordPageView()` 函数实现正确

**子任务:**

2.1 **验证 recordPageView 函数** (`server/db.ts`)

确认以下行为：
- 使用 Drizzle ORM 的 `db.insert(pageViews).values(...)` — PostgreSQL 语法 ✅
- `articleId` 可选，null 表示非文章页面浏览 ✅
- `userAgent` 截断至 512 字符（`.slice(0, 512)`）✅
- 空 catch 块静默处理错误，不中断用户体验 ✅
- **状态**: 已实现 ✅

2.2 **验证 tRPC 端点** (`server/routers.ts`)

确认 `analytics.recordView` 端点：
- 为 `publicProcedure`（无需认证）✅
- 接受 `articleId`（number, optional）和 `path`（string, optional）✅
- 从 `ctx.req` 提取 IP 和 User-Agent ✅
- **状态**: 已实现 ✅

2.3 **增强 IP 提取逻辑** (`server/routers.ts`)

当前 IP 提取逻辑：
```typescript
const ip = ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString() || null;
```

优化为取 `x-forwarded-for` 的第一个 IP（Nginx 反代场景下可能包含多个 IP）：

**File**: `server/routers.ts`

**Before:**
```typescript
const ip = ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString() || null;
```

**After:**
```typescript
const forwardedFor = ctx.req.headers["x-forwarded-for"]?.toString();
const ip = forwardedFor?.split(",")[0]?.trim() || ctx.req.ip || null;
```

**说明**: Nginx 反向代理场景下，`x-forwarded-for` 可能包含多个 IP（格式：`client, proxy1, proxy2`），应取第一个作为真实客户端 IP。同时优先使用 `x-forwarded-for`，因为 `req.ip` 在反代后可能是 `127.0.0.1`。

### Task 3: 前端浏览记录集成（AC-3, AC-7）

**目标**: 在前端页面组件中调用 `analytics.recordView`，实现自动浏览记录

**子任务:**

3.1 **创建浏览记录 Hook**

创建一个可复用的 React Hook，在页面加载时自动记录浏览数据。

**File**: 新建 `client/src/hooks/usePageView.ts`

```typescript
import { useEffect } from "react";
import { trpc } from "@/lib/trpc"; // 根据实际路径调整

/**
 * Hook to record a page view on mount.
 * Fire-and-forget: does not block rendering or throw on failure.
 *
 * @param articleId - Optional article ID for article detail pages
 */
export function usePageView(articleId?: number) {
  const recordView = trpc.analytics.recordView.useMutation();

  useEffect(() => {
    // Fire-and-forget: call mutation without awaiting result
    recordView.mutate(
      {
        articleId,
        path: window.location.pathname,
      },
      {
        // Silently ignore errors - analytics should never break UX
        onError: () => {},
      }
    );
    // Only fire on mount (and when articleId changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);
}
```

**设计决策:**
- 使用 `useEffect` 在组件挂载时触发
- `mutate()` 为 fire-and-forget，不使用 `mutateAsync`
- `onError` 设为空函数，确保分析失败不影响页面
- 依赖项仅包含 `articleId`，避免重复记录

3.2 **在文章详情页集成**

在文章详情页组件中使用 `usePageView` Hook。

**File**: 文章详情页组件（如 `client/src/pages/ArticleDetail.tsx` 或类似路径）

在组件顶部添加：

```typescript
import { usePageView } from "@/hooks/usePageView";

// 在组件内部，article 数据获取后
usePageView(article?.id);
```

3.3 **在其他页面集成（可选）**

对于非文章页面（首页、归档页、分类页等），可选择性添加不带 `articleId` 的浏览记录：

```typescript
usePageView(); // 仅记录 path，articleId 为 null
```

**建议**: 优先在文章详情页集成，其他页面可在后续迭代中添加。

### Task 4: 确保异步非阻塞（AC-3）

**目标**: 验证整个链路的异步非阻塞特性

**子任务:**

4.1 **后端异步保证**

确认 `recordPageView()` 函数：
- 内部使用 `async/await` 但不向上抛出异常（空 catch 块）✅
- tRPC mutation 返回 `{ success: true }` 不等待写入确认（当前实现是 await 写入后返回）

**优化考虑**: 当前 `analytics.recordView` 端点在 `await db.recordPageView()` 完成后才返回响应。虽然 `recordPageView` 本身已 try-catch，但可考虑进一步优化为不等待数据库写入：

**File**: `server/routers.ts`

**Before:**
```typescript
recordView: publicProcedure
  .input(z.object({
    articleId: z.number().optional(),
    path: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const forwardedFor = ctx.req.headers["x-forwarded-for"]?.toString();
    const ip = forwardedFor?.split(",")[0]?.trim() || ctx.req.ip || null;
    const userAgent = ctx.req.headers["user-agent"] || null;
    await db.recordPageView({
      articleId: input.articleId,
      ip,
      userAgent,
      path: input.path,
    });
    return { success: true };
  }),
```

**After:**
```typescript
recordView: publicProcedure
  .input(z.object({
    articleId: z.number().optional(),
    path: z.string().optional(),
  }))
  .mutation(({ input, ctx }) => {
    const forwardedFor = ctx.req.headers["x-forwarded-for"]?.toString();
    const ip = forwardedFor?.split(",")[0]?.trim() || ctx.req.ip || null;
    const userAgent = ctx.req.headers["user-agent"] || null;
    // Fire-and-forget: don't await DB write to minimize response latency
    db.recordPageView({
      articleId: input.articleId,
      ip,
      userAgent,
      path: input.path,
    });
    return { success: true };
  }),
```

**变更说明:**
- 移除 `async` 和 `await`，使数据库写入在后台执行
- 立即返回 `{ success: true }`，不等待 INSERT 完成
- `recordPageView` 内部已有 try-catch，不会产生未捕获异常

4.2 **前端异步保证**

确认 `usePageView` Hook：
- 使用 `mutate()` 而非 `mutateAsync()`（不返回 Promise）
- `onError` 回调为空函数
- 不影响组件渲染或路由切换

### Task 5: Express trust proxy 配置（AC-1）

**目标**: 确保 `req.ip` 在 Nginx 反向代理后返回真实客户端 IP

**File**: `server/_core/index.ts`

在 Express app 创建后、中间件注册前添加：

```typescript
// Trust first proxy (Nginx reverse proxy) for correct req.ip
app.set("trust proxy", 1);
```

**说明**: Express 默认不信任代理头，`req.ip` 会返回代理服务器 IP（如 `127.0.0.1`）。设置 `trust proxy` 后，Express 会从 `X-Forwarded-For` 头解析真实客户端 IP。

**位置**: 在 `const app = express();` 之后、健康检查端点之前。

### Task 6: Drizzle ORM 迁移生成（AC-2）

**目标**: 确保 page_views 表通过 Drizzle 迁移脚本同步到数据库

**子任务:**

6.1 **生成迁移文件**

```bash
npx drizzle-kit generate
```

确认生成的迁移 SQL 包含 `page_views` 表的 `CREATE TABLE` 语句。

6.2 **执行迁移**

```bash
npx drizzle-kit push
```

或通过 `migrate_db.sh` 脚本执行。

**注意**: `ensurePageViewsTable()` 是运行时的兜底保障，正式部署应通过 Drizzle 迁移管理表结构。

## Technical Notes

### 数据流

```
用户浏览页面
  → 前端 usePageView Hook (useEffect 触发)
    → tRPC mutation analytics.recordView (fire-and-forget)
      → Express 提取 IP + User-Agent
        → db.recordPageView() (fire-and-forget, 静默失败)
          → INSERT INTO page_views (PostgreSQL)
```

### page_views 表索引策略

| 索引名 | 列 | 用途 |
|--------|------|------|
| `idx_page_views_viewed_at` | `viewedAt` | 支持日期范围查询（每日统计） |
| `idx_page_views_article_id` | `articleId` | 支持文章级浏览统计 |
| `idx_page_views_path` | `path` | 支持热门路径统计 |

### IP 地址存储

- `VARCHAR(45)` 支持 IPv4（最长 15 字符）和 IPv6（最长 45 字符）
- 通过 Nginx `X-Forwarded-For` 头获取真实客户端 IP
- Express `trust proxy` 设置确保 `req.ip` 正确

### 异步非阻塞设计

两层 fire-and-forget 保障：
1. **前端层**: `mutate()` 不等待响应，`onError` 静默处理
2. **后端层**: 不 await 数据库写入，立即返回响应；`recordPageView` 内部 try-catch 静默失败

### 与 Story 4.2 的关系

本 Story 负责**写入**浏览数据，Story 4.2 负责**读取和展示**浏览统计：
- Story 4.2 依赖 `getPageViewStats()` 和 `getAnalyticsOverview()` 函数（已在 `server/db.ts` 中实现）
- Story 4.2 使用 `analytics.overview` 和 `analytics.pageViewStats` 端点（已在 `server/routers.ts` 中定义）

## Testing Requirements

### 单元测试

#### 1. recordPageView 函数测试

**File**: `server/__tests__/page-view.test.ts`

```typescript
describe("recordPageView", () => {
  it("should insert a page view record with all fields", async () => {
    await recordPageView({
      articleId: 1,
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0...",
      path: "/blog/test-article",
    });
    // Verify record exists in page_views table
  });

  it("should handle null articleId for general page views", async () => {
    await recordPageView({
      articleId: null,
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0...",
      path: "/",
    });
    // Verify record with null articleId
  });

  it("should truncate long User-Agent strings to 512 chars", async () => {
    const longUA = "A".repeat(1000);
    await recordPageView({
      articleId: null,
      ip: null,
      userAgent: longUA,
      path: "/",
    });
    // Verify userAgent is truncated to 512 chars
  });

  it("should not throw on database failure", async () => {
    // Mock database failure
    // Verify no exception is thrown
  });

  it("should set viewedAt to current timestamp by default", async () => {
    await recordPageView({ path: "/test" });
    // Verify viewedAt is approximately now
  });
});
```

#### 2. IP 提取逻辑测试

```typescript
describe("analytics.recordView IP extraction", () => {
  it("should extract first IP from x-forwarded-for header", () => {
    // Mock request with x-forwarded-for: "1.2.3.4, 5.6.7.8"
    // Verify recorded IP is "1.2.3.4"
  });

  it("should fallback to req.ip when x-forwarded-for is absent", () => {
    // Mock request without x-forwarded-for
    // Verify recorded IP is req.ip value
  });

  it("should record null IP when no IP info available", () => {
    // Mock request with no IP info
    // Verify recorded IP is null
  });
});
```

### 集成测试

#### 3. tRPC 端点测试

```typescript
describe("analytics.recordView endpoint", () => {
  it("should accept and record page view with articleId", async () => {
    const result = await caller.analytics.recordView({
      articleId: 1,
      path: "/blog/test",
    });
    expect(result).toEqual({ success: true });
  });

  it("should accept page view without articleId", async () => {
    const result = await caller.analytics.recordView({
      path: "/",
    });
    expect(result).toEqual({ success: true });
  });

  it("should not require authentication", async () => {
    // Call without auth context
    // Verify no UNAUTHORIZED error
  });
});
```

### 前端测试

#### 4. usePageView Hook 测试

```typescript
describe("usePageView", () => {
  it("should call recordView mutation on mount", () => {
    renderHook(() => usePageView(42));
    // Verify mutation was called with { articleId: 42, path: current path }
  });

  it("should call without articleId for general pages", () => {
    renderHook(() => usePageView());
    // Verify mutation was called with { path: current path }
  });

  it("should not re-trigger on re-render with same articleId", () => {
    const { rerender } = renderHook(
      ({ id }) => usePageView(id),
      { initialProps: { id: 42 } }
    );
    rerender({ id: 42 });
    // Verify mutation was called only once
  });

  it("should re-trigger when articleId changes", () => {
    const { rerender } = renderHook(
      ({ id }) => usePageView(id),
      { initialProps: { id: 42 } }
    );
    rerender({ id: 99 });
    // Verify mutation was called twice
  });
});
```

### 验证清单

1. **数据库层**
   - [ ] page_views 表存在且结构正确
   - [ ] 索引 `idx_page_views_viewed_at` 存在
   - [ ] 索引 `idx_page_views_article_id` 存在
   - [ ] 索引 `idx_page_views_path` 存在
   - [ ] INSERT 使用 PostgreSQL 语法（Drizzle ORM 自动处理）

2. **后端 API**
   - [ ] `analytics.recordView` 端点可正常接收请求
   - [ ] IP 从 `x-forwarded-for` 正确提取
   - [ ] User-Agent 正确截断
   - [ ] 响应立即返回，不等待 DB 写入

3. **前端集成**
   - [ ] 文章详情页加载时自动记录浏览
   - [ ] 记录操作不阻塞页面渲染
   - [ ] 记录失败不影响用户体验

4. **端到端验证**
   - [ ] 访问文章详情页后，page_views 表中有对应记录
   - [ ] 记录包含正确的 articleId、IP、User-Agent、path、viewedAt
   - [ ] 多次访问产生多条记录

## Dependencies

### 前置依赖

- **Story 1.2**: 数据库驱动替换（pg 驱动已安装）
- **Story 1.3**: 数据库查询语法适配（PostgreSQL 查询语法已适配）

### 被阻塞的后续 Story

- **Story 4.2**: 分析概览与浏览统计（依赖 page_views 数据的写入）

## Dev Notes

### 实施顺序建议

1. 验证现有后端实现（Task 1-2）— 确认已有代码无误
2. 补充 path 索引（Task 1.3）
3. 增强 IP 提取逻辑（Task 2.3）
4. 配置 Express trust proxy（Task 5）
5. 优化为异步非阻塞（Task 4.1）
6. 创建前端 Hook 并集成（Task 3）
7. 运行测试验证（Testing Requirements）
8. 确认 Drizzle 迁移同步（Task 6）

### 风险与注意事项

- **低风险**: 现有后端实现基本完整，主要工作在前端集成和细节优化
- **低风险**: fire-and-forget 模式下极少数浏览记录可能丢失（数据库瞬时不可用），可接受
- **注意**: `trust proxy` 设置需与 Nginx 配置匹配，避免 IP 欺骗
- **注意**: 当前无浏览去重逻辑，同一用户刷新页面会产生多条记录 — 这是预期行为，去重可在 Story 4.2 的统计层处理

### 变更影响范围

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `server/db.ts` | 小改 | 补充 path 索引 |
| `server/routers.ts` | 小改 | 优化 IP 提取、移除 await |
| `server/_core/index.ts` | 小改 | 添加 trust proxy 配置 |
| `client/src/hooks/usePageView.ts` | 新增 | 浏览记录 Hook |
| 文章详情页组件 | 小改 | 集成 usePageView |
| `server/__tests__/page-view.test.ts` | 新增 | 单元测试 |
