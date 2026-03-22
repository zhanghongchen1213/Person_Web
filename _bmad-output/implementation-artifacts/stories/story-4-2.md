---
storyId: '4-2'
epicId: 4
title: '分析概览与浏览统计'
status: 'ready-for-dev'
priority: 'high'
storyPoints: 3
dependencies: ['4-1', '1-3']
blockedBy: ['4-1']
blocks: []
created: '2026-03-21'
---

# Story 4.2: 分析概览与浏览统计

## Story Description

**As a** 管理员,
**I want** 查看博客的分析概览和浏览统计数据,
**So that** 我可以做出数据驱动的内容策略决策。

## Background & Context

- Story 4.1 已完成页面浏览数据的记录（写入 page_views 表），本 Story 负责**读取和展示**统计数据
- Epic 1 已完成数据库迁移至 PostgreSQL（MemfireDB），日期函数使用 `to_char()` 替代 `DATE_FORMAT()`
- `server/db.ts` 中已实现 `getAnalyticsOverview()` 和 `getPageViewStats()` 函数
- `server/routers.ts` 中已定义 `analytics.overview` 和 `analytics.pageViewStats` tRPC 端点，均使用 LRU 缓存（1 分钟 TTL）
- `client/src/pages/AdminAnalytics.tsx` 已实现完整的管理后台分析页面，包含统计卡片、图表和排行榜
- 本 Story 需要验证现有实现的完整性，确认符合 FR23/FR24/FR25 要求，并补充缺失功能

## Current State Analysis

### 已有实现

#### 1. 后端数据库函数 (`server/db.ts`)

**`getAnalyticsOverview()`** -- 分析概览数据（FR23）：
- 总文章数（`totalArticles`）
- 已发布文章数（`publishedArticles`）
- 草稿文章数（`draftArticles`）
- 总浏览量（`totalViews`）-- 从 `page_views` 表 `count(*)` 获取
- 总用户数（`totalUsers`）
- 总分类数（`totalCategories`）
- 各分类文章数（`articlesByCategory`）-- 已发布文章 JOIN categories GROUP BY
- 月度发文趋势（`articlesByMonth`）-- 近 12 个月，使用 `TO_CHAR(publishedAt, 'YYYY-MM')` PostgreSQL 语法
- 热门文章（`topArticles`）-- 当前仅按发布时间排序，viewCount 固定为 0
- 使用 `Promise.all()` 并行查询提升性能
- **状态**: 已实现 (基本完整，`topArticles` 需优化)

**`getPageViewStats(days)`** -- 每日浏览统计（FR24/FR25）：
- 总浏览量（`totalViews`）
- 今日浏览量（`todayViews`）-- 使用 `DATE(viewedAt) = CURRENT_DATE`
- 每日浏览趋势（`dailyViews`）-- 使用 `DATE(viewedAt)` 聚合，支持独立访客统计（`COUNT(DISTINCT ip)`）
- 文章浏览排行（`articleViews`）-- 按浏览次数降序，TOP 20，关联 articles 表获取标题/slug
- 热门路径（`topPaths`）-- TOP 10
- 日期范围使用 `make_interval(days => ${days})` PostgreSQL 语法
- **状态**: 已实现 (完整)

#### 2. tRPC 端点 (`server/routers.ts`)

**`analytics.overview`** -- 管理员专用 query：
- 使用 `adminProcedure`（需 admin 角色）
- LRU 缓存 key: `analytics:overview`，TTL: 60 秒（1 分钟）
- **状态**: 已实现 ✅

**`analytics.pageViewStats`** -- 管理员专用 query：
- 使用 `adminProcedure`（需 admin 角色）
- 输入参数: `{ days: z.number().min(1).max(365).default(30) }`
- LRU 缓存 key: `analytics:pageViewStats:${days}`，TTL: 60 秒
- **状态**: 已实现 ✅

#### 3. 前端页面 (`client/src/pages/AdminAnalytics.tsx`)

已实现完整的分析仪表盘：
- **权限控制**: 检查 `isAdmin`，非管理员显示"无权限"提示
- **统计卡片**: 6 张卡片（总浏览量、今日浏览、文章总数、已发布、分类数、用户数）
- **每日浏览趋势图**: AreaChart（Recharts），展示浏览量 + 独立访客双线
- **月度发文趋势图**: BarChart，展示近 12 个月发文数
- **分类分布饼图**: PieChart（环形图）+ 图例
- **文章浏览排行**: 带进度条的排行列表，展示 TOP 20 文章
- **时间范围切换**: 7 天 / 30 天 / 90 天快捷按钮
- **手动刷新**: RefreshCw 按钮
- **自动刷新**: 60 秒定时轮询
- **加载骨架屏**: SkeletonDashboard 组件
- **状态**: 已实现 ✅

#### 4. 缓存策略 (`server/_core/cache.ts`)

- 全局 LRU 缓存实例 `appCache`，最大 100 条目
- 分析数据缓存 TTL: 1 分钟（60 * 1000 ms）
- 缓存 key 格式: `analytics:overview`, `analytics:pageViewStats:${days}`
- **状态**: 已实现 ✅

### 待完善部分

| 功能点 | 当前状态 | 需要补充 |
|--------|----------|----------|
| topArticles 浏览排行 | overview 中 viewCount 固定为 0 | 应关联 page_views 表，按真实浏览量排序 |
| 日期范围 365 天支持 | 后端支持 1-365 | 前端仅提供 7/30/90 三个快捷选项，可考虑增加 365 天选项或自定义输入 |
| 空状态处理 | 图表显示"暂无数据" | 已实现 ✅ |
| 错误处理 | 依赖 tRPC 默认错误 | 可考虑增加前端错误边界 |
| topPaths 展示 | 后端已返回数据 | 前端未展示 topPaths 数据 |

## Acceptance Criteria

**Given** 管理员访问 /admin/analytics 页面
**When** 页面加载
**Then:**

- [ ] **AC-1**: 可查看分析概览：总文章数、总浏览量、分类数等（FR23）
- [ ] **AC-2**: 可查看指定时间范围（1-365 天）的每日页面浏览统计（FR24）
- [ ] **AC-3**: 可查看文章级别的浏览统计排行（FR25）
- [ ] **AC-4**: 日期聚合使用 PostgreSQL `to_char()` / `DATE()` 替代 MySQL `DATE_FORMAT()`
- [ ] **AC-5**: 分析数据使用 LRU 缓存（1 分钟 TTL）
- [ ] **AC-6**: 非管理员用户无法访问分析数据（权限控制）
- [ ] **AC-7**: 页面加载时显示骨架屏，数据就绪后渲染图表
- [ ] **AC-8**: 支持手动刷新和自动刷新（60 秒轮询）

## Tasks

### Task 1: 验证后端 getAnalyticsOverview 函数（AC-1, AC-4）

**目标**: 确认分析概览函数实现完整且使用正确的 PostgreSQL 语法

**子任务:**

1.1 **验证概览数据完整性** (`server/db.ts`)

确认 `getAnalyticsOverview()` 返回所有 FR23 要求的数据：
- `totalArticles` -- `count(*)` from articles ✅
- `publishedArticles` -- `count(*)` from articles WHERE status='published' ✅
- `draftArticles` -- `count(*)` from articles WHERE status='draft' ✅
- `totalViews` -- `count(*)` from page_views ✅
- `totalUsers` -- `count(*)` from users ✅
- `totalCategories` -- `count(*)` from categories ✅
- `articlesByCategory` -- GROUP BY categories.name ✅
- `articlesByMonth` -- `TO_CHAR(publishedAt, 'YYYY-MM')` PostgreSQL 语法 ✅
- **状态**: 已实现 ✅

1.2 **验证 PostgreSQL 日期函数** (`server/db.ts`)

确认所有日期聚合使用 PostgreSQL 语法：
- `TO_CHAR(publishedAt, 'YYYY-MM')` 替代 MySQL `DATE_FORMAT(publishedAt, '%Y-%m')` ✅
- `NOW() - INTERVAL '12 months'` 用于月度范围过滤 ✅
- **状态**: 已实现 ✅

1.3 **优化 topArticles 按真实浏览量排序**

当前 `topArticles` 仅按 `publishedAt` 排序，`viewCount` 固定为 0。应改为从 `page_views` 表统计真实浏览量。

**File**: `server/db.ts`

**Before** (getAnalyticsOverview 函数中 topResult 部分):
```typescript
// Top 10 published articles (by recency since viewCount was removed)
const topResult = await db
  .select({
    title: articles.title,
    slug: articles.slug,
  })
  .from(articles)
  .where(eq(articles.status, "published"))
  .orderBy(desc(articles.publishedAt))
  .limit(10);
```

**After:**
```typescript
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
```

同时更新 return 语句：

**Before:**
```typescript
topArticles: topResult.map(r => ({
  title: r.title,
  slug: r.slug,
  viewCount: 0,
})),
```

**After:**
```typescript
topArticles: topResult.map(r => ({
  title: r.title,
  slug: r.slug,
  viewCount: Number(r.viewCount),
})),
```

**验证**:
- [ ] topArticles 返回按浏览量降序排列的文章
- [ ] 无浏览记录的文章 viewCount 为 0
- [ ] LEFT JOIN 确保没有浏览记录的文章也被包含

### Task 2: 验证后端 getPageViewStats 函数（AC-2, AC-3, AC-4）

**目标**: 确认每日浏览统计和文章浏览排行实现正确

**子任务:**

2.1 **验证每日浏览统计** (`server/db.ts`)

确认 `getPageViewStats(days)` 的 dailyViews 查询：
- 使用 `DATE(viewedAt)` 提取日期部分 ✅
- 使用 `make_interval(days => ${days})` PostgreSQL 语法计算日期范围 ✅
- 返回 `views`（总浏览量）和 `uniqueVisitors`（独立访客，`COUNT(DISTINCT ip)`）✅
- 按日期升序排列 ✅
- **状态**: 已实现 ✅

2.2 **验证文章浏览排行** (`server/db.ts`)

确认 `articleViews` 查询：
- 从 `page_views` 表按 `articleId` 分组统计 ✅
- 过滤 `articleId IS NOT NULL` ✅
- 按浏览量降序排列，限制 TOP 20 ✅
- 关联 `articles` 表获取 `title` 和 `slug`（使用批量 IN 查询避免 N+1）✅
- **状态**: 已实现 ✅

2.3 **验证今日浏览量**

确认 `todayViews` 使用 PostgreSQL 标准 `CURRENT_DATE`：
```typescript
sql`DATE(${pageViews.viewedAt}) = CURRENT_DATE`
```
- **状态**: 已实现 ✅

2.4 **验证时间范围参数**

确认 tRPC 端点接受 1-365 天范围：
```typescript
z.object({ days: z.number().min(1).max(365).default(30) }).optional()
```
- **状态**: 已实现 ✅

### Task 3: 验证缓存策略（AC-5）

**目标**: 确认分析数据使用 LRU 缓存且 TTL 正确

**子任务:**

3.1 **验证 overview 缓存** (`server/routers.ts`)

确认 `analytics.overview` 端点：
- 缓存 key: `analytics:overview` ✅
- TTL: `60 * 1000`（1 分钟）✅
- 缓存命中时直接返回，不查询数据库 ✅
- **状态**: 已实现 ✅

3.2 **验证 pageViewStats 缓存** (`server/routers.ts`)

确认 `analytics.pageViewStats` 端点：
- 缓存 key: `analytics:pageViewStats:${days}`（按天数区分）✅
- TTL: `60 * 1000`（1 分钟）✅
- 不同天数参数使用不同缓存条目 ✅
- **状态**: 已实现 ✅

3.3 **验证缓存容量**

确认全局 `appCache` 容量为 100 条目（`new LRUCache(100)`）：
- 分析缓存与文章/分类缓存共享 LRU 缓存空间 ✅
- 分析缓存不会因为频繁切换天数参数而挤占其他缓存 ✅（3 个常用天数 + 1 个 overview = 4 个条目）
- **状态**: 已实现 ✅

### Task 4: 验证权限控制（AC-6）

**目标**: 确认分析端点和页面仅管理员可访问

**子任务:**

4.1 **验证后端权限** (`server/routers.ts`)

确认两个分析端点均使用 `adminProcedure`：
```typescript
analytics: router({
  overview: adminProcedure.query(async () => { ... }),
  pageViewStats: adminProcedure.input(...).query(async ({ input }) => { ... }),
  recordView: publicProcedure.input(...).mutation(...)  // 记录浏览是公开的
})
```
- `overview` 和 `pageViewStats` 使用 `adminProcedure` ✅
- `recordView` 使用 `publicProcedure`（公开端点，任何人可调用）✅
- `adminProcedure` 检查 `ctx.user.role !== "admin"` 抛出 `FORBIDDEN` ✅
- **状态**: 已实现 ✅

4.2 **验证前端权限** (`client/src/pages/AdminAnalytics.tsx`)

确认前端页面权限检查：
- 检查 `isAuthenticated && user?.role === "admin"` ✅
- 非管理员显示"无权限"提示页面 ✅
- tRPC query 设置 `enabled: isAdmin` 条件 ✅
- **状态**: 已实现 ✅

### Task 5: 验证前端页面（AC-1, AC-2, AC-3, AC-7, AC-8）

**目标**: 确认前端分析仪表盘页面完整且功能正确

**子任务:**

5.1 **验证统计卡片** (StatCards 组件)

确认展示 FR23 要求的概览数据：
- 总浏览量（来自 `viewStats.totalViews`）✅
- 今日浏览（来自 `viewStats.todayViews`）✅
- 文章总数（来自 `overview.totalArticles`）✅
- 已发布数（来自 `overview.publishedArticles`）✅
- 分类数（来自 `overview.totalCategories`）✅
- 用户数（来自 `overview.totalUsers`）✅
- **状态**: 已实现 ✅

5.2 **验证每日浏览趋势图** (DailyViewsChart 组件)

确认 FR24 每日浏览统计展示：
- 使用 Recharts AreaChart ✅
- 展示浏览量（views）和独立访客（uniqueVisitors）双线 ✅
- X 轴为日期，格式化显示月-日 ✅
- 支持 Tooltip 悬停查看详情 ✅
- 空数据时显示"暂无数据" ✅
- **状态**: 已实现 ✅

5.3 **验证文章浏览排行** (ArticleViewsRanking 组件)

确认 FR25 文章级浏览统计排行：
- 展示文章排名序号、标题、浏览次数 ✅
- 带进度条可视化比例 ✅
- 支持滚动浏览（`max-h-[280px] overflow-y-auto`）✅
- 空数据时显示"暂无数据" ✅
- **状态**: 已实现 ✅

5.4 **验证时间范围切换**

确认支持指定时间范围查询（FR24）：
- 快捷按钮: 7 天、30 天、90 天 ✅
- 切换天数后触发 `pageViewStats` 重新查询 ✅
- 当前选中按钮高亮显示 ✅
- **状态**: 已实现 ✅

5.5 **增加 365 天选项**

FR24 要求支持 1-365 天范围，当前前端仅提供 7/30/90 三个选项。建议增加 365 天选项。

**File**: `client/src/pages/AdminAnalytics.tsx`

**Before:**
```typescript
const DATE_RANGES = [
  { label: "7天", days: 7 },
  { label: "30天", days: 30 },
  { label: "90天", days: 90 },
] as const;
```

**After:**
```typescript
const DATE_RANGES = [
  { label: "7天", days: 7 },
  { label: "30天", days: 30 },
  { label: "90天", days: 90 },
  { label: "1年", days: 365 },
] as const;
```

5.6 **验证骨架屏加载** (AC-7)

确认数据加载期间显示骨架屏：
- `SkeletonDashboard` 组件模拟 6 张统计卡片 + 2 个图表区域 ✅
- `isLoading = overviewLoading || viewStatsLoading` 控制显示 ✅
- **状态**: 已实现 ✅

5.7 **验证刷新机制** (AC-8)

确认手动刷新和自动刷新：
- 手动刷新: `handleRefresh` 调用 `refetchOverview()` + `refetchViewStats()`，按钮带旋转动画 ✅
- 自动刷新: `setInterval(handleRefresh, 60_000)` 每 60 秒自动刷新 ✅
- 组件卸载时清除定时器 `clearInterval` ✅
- **状态**: 已实现 ✅

### Task 6: 增加 topPaths 展示（可选增强）

**目标**: 后端已返回 `topPaths` 数据，但前端未展示。可选择性增加热门路径面板。

**子任务:**

6.1 **新增 TopPathsTable 组件**

**File**: `client/src/pages/AdminAnalytics.tsx`

在 `ArticleViewsRanking` 组件后新增：

```typescript
/* ---- Top Paths Table ---- */
function TopPathsTable({
  data,
}: {
  data: Array<{ path: string; views: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">热门路径</CardTitle>
        <CardDescription>浏览量最高的页面路径</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            暂无数据
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {data.map((item, i) => (
              <div key={item.path} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-5 text-right shrink-0">
                  {i + 1}
                </span>
                <code className="truncate flex-1 text-xs bg-muted px-1 py-0.5 rounded">
                  {item.path}
                </code>
                <span className="font-medium shrink-0">{item.views}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

6.2 **在页面布局中引入 TopPathsTable**

在 Charts Row 2 之后增加一行：

```tsx
{/* Charts Row 3 - Optional */}
<div className="grid gap-6 lg:grid-cols-2">
  <TopPathsTable data={viewStats?.topPaths ?? []} />
</div>
```

**注意**: 此 Task 为可选增强，不影响 AC 验收。

## Technical Notes

### 数据流

```
管理员访问 /admin/analytics
  -> 前端 AdminAnalytics 组件挂载
    -> tRPC query: analytics.overview (adminProcedure)
    -> tRPC query: analytics.pageViewStats({ days }) (adminProcedure)
      -> 检查 LRU 缓存（key: analytics:overview / analytics:pageViewStats:${days}）
        -> 缓存命中: 直接返回缓存数据
        -> 缓存未命中: 查询 PostgreSQL -> 写入缓存 (TTL: 60s) -> 返回
    -> 前端渲染统计卡片 + 图表 + 排行
  -> 60 秒后自动刷新（或手动点击刷新按钮）
```

### 查询性能优化

| 查询 | 优化策略 | 备注 |
|------|----------|------|
| 概览统计 | `Promise.all()` 并行 6 个 count 查询 | 减少总查询时间 |
| 每日浏览 | `DATE(viewedAt)` + `idx_page_views_viewed_at` 索引 | 索引加速日期范围查询 |
| 文章浏览排行 | 批量 IN 查询关联 articles | 避免 N+1 问题 |
| 热门路径 | `idx_page_views_path` 索引 | 索引加速 GROUP BY path |
| 缓存层 | LRU 缓存 1 分钟 TTL | 减少重复数据库查询 |

### PostgreSQL 语法对照

| 功能 | MySQL 语法 | PostgreSQL 语法（当前使用）|
|------|-----------|--------------------------|
| 日期格式化 | `DATE_FORMAT(col, '%Y-%m')` | `TO_CHAR(col, 'YYYY-MM')` |
| 日期提取 | `DATE(col)` | `DATE(col)` (通用) |
| 当前日期 | `CURDATE()` | `CURRENT_DATE` |
| 日期区间 | `DATE_SUB(NOW(), INTERVAL ? DAY)` | `NOW() - make_interval(days => ?)` |
| 当前时间 | `NOW()` | `NOW()` (通用) |

### 缓存策略详解

```
缓存实例: appCache (LRU, 100 条目, 共享)

分析相关缓存条目:
  analytics:overview          -> TTL 60s -> getAnalyticsOverview() 结果
  analytics:pageViewStats:7   -> TTL 60s -> getPageViewStats(7) 结果
  analytics:pageViewStats:30  -> TTL 60s -> getPageViewStats(30) 结果
  analytics:pageViewStats:90  -> TTL 60s -> getPageViewStats(90) 结果
  analytics:pageViewStats:365 -> TTL 60s -> getPageViewStats(365) 结果

最多占用 5 个缓存槽位（1 overview + 4 天数变体）
```

### 与 Story 4.1 的关系

- Story 4.1 负责**写入**浏览数据（`recordPageView` + 前端 `usePageView` Hook）
- Story 4.2 负责**读取和展示**浏览统计（`getAnalyticsOverview` + `getPageViewStats` + AdminAnalytics 页面）
- Story 4.2 依赖 Story 4.1 写入的 `page_views` 表数据

## Testing Requirements

### 单元测试

#### 1. getAnalyticsOverview 函数测试

**File**: `server/__tests__/analytics-overview.test.ts`

```typescript
describe("getAnalyticsOverview", () => {
  it("should return complete overview with all required fields", async () => {
    const result = await getAnalyticsOverview();
    expect(result).toHaveProperty("totalArticles");
    expect(result).toHaveProperty("publishedArticles");
    expect(result).toHaveProperty("draftArticles");
    expect(result).toHaveProperty("totalViews");
    expect(result).toHaveProperty("totalUsers");
    expect(result).toHaveProperty("totalCategories");
    expect(result).toHaveProperty("articlesByCategory");
    expect(result).toHaveProperty("articlesByMonth");
    expect(result).toHaveProperty("topArticles");
  });

  it("should return zero counts when database is empty", async () => {
    const result = await getAnalyticsOverview();
    expect(result.totalArticles).toBe(0);
    expect(result.totalViews).toBe(0);
    expect(result.totalCategories).toBe(0);
  });

  it("should correctly count published vs draft articles", async () => {
    // Insert test articles with different statuses
    // Verify publishedArticles and draftArticles counts
  });

  it("should return topArticles sorted by actual view count", async () => {
    // Insert articles and page views
    // Verify topArticles[0] has the highest viewCount
  });

  it("should return articlesByMonth using TO_CHAR format YYYY-MM", async () => {
    // Insert articles with publishedAt in last 12 months
    // Verify month format is 'YYYY-MM' (e.g., '2026-03')
  });

  it("should return safe defaults when database is unavailable", async () => {
    // Mock database unavailable
    const result = await getAnalyticsOverview();
    expect(result.totalArticles).toBe(0);
    expect(result.articlesByCategory).toEqual([]);
  });
});
```

#### 2. getPageViewStats 函数测试

**File**: `server/__tests__/analytics-pageviews.test.ts`

```typescript
describe("getPageViewStats", () => {
  it("should return daily views for specified number of days", async () => {
    // Insert page views across multiple days
    const result = await getPageViewStats(7);
    expect(result.dailyViews.length).toBeGreaterThan(0);
    expect(result.dailyViews[0]).toHaveProperty("date");
    expect(result.dailyViews[0]).toHaveProperty("views");
    expect(result.dailyViews[0]).toHaveProperty("uniqueVisitors");
  });

  it("should correctly calculate today's views", async () => {
    // Insert page views for today
    const result = await getPageViewStats(1);
    expect(result.todayViews).toBeGreaterThan(0);
  });

  it("should return article views ranked by view count descending", async () => {
    // Insert page views for multiple articles
    const result = await getPageViewStats(30);
    if (result.articleViews.length >= 2) {
      expect(result.articleViews[0].views).toBeGreaterThanOrEqual(
        result.articleViews[1].views
      );
    }
  });

  it("should enrich articleViews with title and slug", async () => {
    // Insert article and page views
    const result = await getPageViewStats(30);
    for (const av of result.articleViews) {
      expect(av.title).toBeTruthy();
      expect(av.slug).toBeTruthy();
    }
  });

  it("should calculate unique visitors using DISTINCT ip", async () => {
    // Insert multiple page views with same and different IPs
    // Verify uniqueVisitors < views when IPs repeat
  });

  it("should limit articleViews to top 20", async () => {
    const result = await getPageViewStats(365);
    expect(result.articleViews.length).toBeLessThanOrEqual(20);
  });

  it("should limit topPaths to top 10", async () => {
    const result = await getPageViewStats(30);
    expect(result.topPaths.length).toBeLessThanOrEqual(10);
  });

  it("should handle days parameter from 1 to 365", async () => {
    // Test boundary values
    const result1 = await getPageViewStats(1);
    expect(result1).toBeDefined();
    const result365 = await getPageViewStats(365);
    expect(result365).toBeDefined();
  });

  it("should return safe defaults when database is unavailable", async () => {
    const result = await getPageViewStats(30);
    expect(result.totalViews).toBe(0);
    expect(result.dailyViews).toEqual([]);
    expect(result.articleViews).toEqual([]);
  });
});
```

### 集成测试

#### 3. tRPC 端点测试

**File**: `server/__tests__/analytics-endpoints.test.ts`

```typescript
describe("analytics tRPC endpoints", () => {
  describe("analytics.overview", () => {
    it("should require admin authentication", async () => {
      // Call without auth - expect UNAUTHORIZED
      await expect(publicCaller.analytics.overview()).rejects.toThrow("UNAUTHORIZED");
    });

    it("should reject non-admin users", async () => {
      // Call with regular user - expect FORBIDDEN
      await expect(userCaller.analytics.overview()).rejects.toThrow("FORBIDDEN");
    });

    it("should return overview data for admin users", async () => {
      const result = await adminCaller.analytics.overview();
      expect(result).toHaveProperty("totalArticles");
      expect(result).toHaveProperty("totalViews");
    });

    it("should use cache on repeated calls", async () => {
      const result1 = await adminCaller.analytics.overview();
      const result2 = await adminCaller.analytics.overview();
      // Both should return same data (cached)
      expect(result1).toEqual(result2);
    });
  });

  describe("analytics.pageViewStats", () => {
    it("should require admin authentication", async () => {
      await expect(
        publicCaller.analytics.pageViewStats({ days: 30 })
      ).rejects.toThrow("UNAUTHORIZED");
    });

    it("should accept days parameter 1-365", async () => {
      const result = await adminCaller.analytics.pageViewStats({ days: 7 });
      expect(result).toBeDefined();
    });

    it("should reject days > 365", async () => {
      await expect(
        adminCaller.analytics.pageViewStats({ days: 400 })
      ).rejects.toThrow();
    });

    it("should reject days < 1", async () => {
      await expect(
        adminCaller.analytics.pageViewStats({ days: 0 })
      ).rejects.toThrow();
    });

    it("should default to 30 days when no input provided", async () => {
      const result = await adminCaller.analytics.pageViewStats();
      expect(result).toBeDefined();
    });

    it("should cache different days separately", async () => {
      // Verify analytics:pageViewStats:7 and analytics:pageViewStats:30 are separate
    });
  });
});
```

### 前端测试

#### 4. AdminAnalytics 页面测试

**File**: `client/src/__tests__/AdminAnalytics.test.tsx`

```typescript
describe("AdminAnalytics", () => {
  it("should show loading skeleton while data is fetching", () => {
    // Mock loading state
    // Verify Skeleton components are rendered
  });

  it("should display permission denied for non-admin users", () => {
    // Mock non-admin user
    // Verify "无权限" text is displayed
  });

  it("should render all 6 stat cards", () => {
    // Mock admin user with data
    // Verify 6 cards: 总浏览量, 今日浏览, 文章总数, 已发布, 分类数, 用户数
  });

  it("should render daily views chart", () => {
    // Mock data with dailyViews
    // Verify AreaChart is rendered
  });

  it("should render article views ranking", () => {
    // Mock data with articleViews
    // Verify ranking list items
  });

  it("should switch days when date range button is clicked", async () => {
    // Click "7天" button
    // Verify pageViewStats query is called with days=7
  });

  it("should refresh data when refresh button is clicked", async () => {
    // Click refresh button
    // Verify both queries are refetched
  });

  it("should display empty state when no data", () => {
    // Mock empty data
    // Verify "暂无数据" messages in charts
  });

  it("should set up auto-refresh interval for admin users", () => {
    // Verify setInterval is called with 60000ms
    // Verify clearInterval on unmount
  });
});
```

### 验证清单

1. **后端数据层**
   - [ ] `getAnalyticsOverview()` 返回所有 FR23 要求的字段
   - [ ] `getPageViewStats(days)` 正确按日期聚合浏览数据
   - [ ] `topArticles` 按真实浏览量排序（Task 1.3 优化后）
   - [ ] 日期函数使用 PostgreSQL 语法（`TO_CHAR`, `CURRENT_DATE`, `make_interval`）
   - [ ] 数据库不可用时返回安全默认值

2. **缓存层**
   - [ ] `analytics:overview` 缓存 TTL 为 60 秒
   - [ ] `analytics:pageViewStats:${days}` 缓存 TTL 为 60 秒
   - [ ] 不同 days 参数使用不同缓存 key
   - [ ] 缓存命中时不查询数据库

3. **API 权限层**
   - [ ] `analytics.overview` 使用 adminProcedure
   - [ ] `analytics.pageViewStats` 使用 adminProcedure
   - [ ] 未认证用户返回 UNAUTHORIZED
   - [ ] 非管理员用户返回 FORBIDDEN

4. **前端展示层**
   - [ ] 统计卡片展示 6 项概览数据
   - [ ] 每日浏览趋势图正确渲染（AreaChart）
   - [ ] 文章浏览排行正确渲染（排名 + 进度条）
   - [ ] 月度发文趋势图正确渲染（BarChart）
   - [ ] 分类分布饼图正确渲染（PieChart）
   - [ ] 时间范围切换功能正常
   - [ ] 手动刷新功能正常
   - [ ] 自动刷新（60 秒）功能正常
   - [ ] 非管理员显示"无权限"页面
   - [ ] 加载中显示骨架屏

5. **端到端验证**
   - [ ] 访问 /admin/analytics 页面，数据正确展示
   - [ ] 切换 7天/30天/90天/365天 后图表更新
   - [ ] 文章浏览排行与 page_views 实际数据一致
   - [ ] 概览数据与数据库实际数据一致

## Dependencies

### 前置依赖

- **Story 4.1**: 页面浏览数据记录（page_views 表数据写入）
- **Story 1.3**: 数据库查询语法适配（PostgreSQL 语法）

### 被阻塞的后续 Story

- 无（本 Story 为 Epic 4 的最后一个 Story）

## Dev Notes

### 实施顺序建议

1. 验证后端函数实现（Task 1-2）-- 确认已有代码无误
2. 优化 topArticles 查询（Task 1.3）-- 使用真实浏览量排序
3. 验证缓存策略（Task 3）-- 确认 TTL 和 key 正确
4. 验证权限控制（Task 4）-- 确认 admin 权限
5. 验证前端页面（Task 5）-- 确认图表渲染正确
6. 增加 365 天选项（Task 5.5）-- 前端小改
7. 可选: 增加 topPaths 展示（Task 6）-- 前端增强
8. 运行测试验证（Testing Requirements）

### 风险与注意事项

- **低风险**: 核心功能已基本完整实现，主要工作在验证和细节优化
- **低风险**: topArticles 优化涉及 LEFT JOIN，需注意大数据量时的查询性能（已有缓存保护）
- **注意**: 前端 AdminAnalytics.tsx 文件当前有重复内容（整个文件被复制了两次），需在实施前先清理
- **注意**: 365 天范围查询可能涉及大量数据，但 1 分钟缓存可有效减轻数据库压力
- **注意**: `uniqueVisitors` 基于 IP 地址去重，代理/NAT 场景下准确性有限（可接受）

### 变更影响范围

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `server/db.ts` | 小改 | 优化 topArticles 查询（LEFT JOIN page_views） |
| `client/src/pages/AdminAnalytics.tsx` | 小改 | 增加 365 天选项，清理重复代码 |
| `client/src/pages/AdminAnalytics.tsx` | 可选 | 增加 TopPathsTable 组件 |
| `server/__tests__/analytics-overview.test.ts` | 新增 | 概览函数单元测试 |
| `server/__tests__/analytics-pageviews.test.ts` | 新增 | 浏览统计函数单元测试 |
| `server/__tests__/analytics-endpoints.test.ts` | 新增 | tRPC 端点集成测试 |
| `client/src/__tests__/AdminAnalytics.test.tsx` | 新增 | 前端页面测试 |
