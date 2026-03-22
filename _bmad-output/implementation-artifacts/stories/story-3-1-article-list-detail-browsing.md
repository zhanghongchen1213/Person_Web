---
story_id: 3-1-article-list-detail-browsing
epic_id: epic-3
epic_name: 内容消费与阅读体验
status: ready-for-dev
priority: high
created_date: 2026-03-22
---

# Story 3.1: 文章列表与详情页浏览

## User Story

As a 读者,
I want 浏览分页的文章列表并阅读文章详情,
So that 我可以发现和阅读感兴趣的博客内容。

## Related Requirements

- FR9: 读者可浏览分页的文章列表（支持按分类、类型、状态筛选）
- FR10: 读者可通过 slug 访问文章详情页
- NFR1: 前端首屏加载时间 < 2 秒（通过 CDN 加速，Lighthouse 测量）
- NFR5: 缓存容量 100 条目，文章列表 TTL 5 分钟，分类 TTL 10 分钟
- NFR14: 前端静态资源通过 CDN 多节点分发，理论无并发上限
- NFR25-NFR28: WCAG 2.1 AA 可访问性标准

## Acceptance Criteria

### AC1: 文章列表分页浏览

**Given** 读者访问博客首页或文章列表页
**When** 页面加载
**Then** 显示分页的文章列表，每页显示固定数量（默认 10 篇）
**And** 列表展示文章标题、摘要、封面图、发布日期、分类信息
**And** 分页控件包含上一页/下一页按钮和页码跳转

### AC2: 文章列表筛选功能

**Given** 读者在文章列表页
**When** 读者选择筛选条件
**Then** 可按分类筛选文章
**And** 可按文章类型筛选（blog/doc）
**And** 可按状态筛选（只显示 published 状态的文章给普通读者）
**And** 筛选条件可通过 URL 参数持久化，支持分享

### AC3: 文章详情页访问

**Given** 读者点击文章标题或访问 /article/:slug 路径
**When** 页面加载
**Then** 通过 slug 正确获取并显示文章详情
**And** 文章内容完整渲染（支持 Markdown/HTML）
**And** 显示文章元数据：标题、发布日期、分类、阅读时长估计

### AC4: 性能优化 - 缓存机制

**Given** 文章列表 API 被请求
**When** 相同查询条件在 5 分钟内再次被请求
**Then** 从 LRU 缓存返回结果，不重复查询数据库
**And** 缓存键包含查询参数（分页、筛选条件）
**And** 缓存命中时响应时间 < 50ms

### AC5: 性能优化 - 分页查询

**Given** 文章列表数据量较大
**When** 执行分页查询
**Then** 使用 PostgreSQL LIMIT + OFFSET 实现分页
**And** 关联查询使用 JOIN 批量获取分类信息，避免 N+1 问题
**And** 只选择需要的字段，不返回完整文章内容（列表页）

### AC6: 可访问性支持

**Given** 读者使用辅助技术浏览
**When** 访问文章列表和详情页
**Then** 页面结构使用语义化 HTML 标签（article, nav, main 等）
**And** 图片包含描述性 alt 属性
**And** 交互元素支持键盘导航（Tab 顺序、Enter 激活）
**And** 色彩对比度符合 WCAG 2.1 AA 标准（≥ 4.5:1）

## Tasks

### Task 1: 后端 API 开发

**Subtask 1.1: 文章列表查询 API**
- [ ] 创建/更新获取文章列表的 tRPC procedure
- [ ] 实现分页参数解析（page, pageSize）
- [ ] 实现筛选参数处理（category, type, status）
- [ ] 使用 Drizzle ORM 构建查询，包含 JOIN 获取分类信息
- [ ] 添加默认排序（按发布日期倒序）

**Subtask 1.2: 文章详情查询 API**
- [ ] 创建/更新通过 slug 获取文章详情的 tRPC procedure
- [ ] 验证文章状态（已发布文章才可被公开访问）
- [ ] 处理文章不存在的情况，返回友好错误

**Subtask 1.3: 缓存集成**
- [ ] 在文章列表查询中集成 LRU 缓存
- [ ] 设置缓存 TTL 为 5 分钟
- [ ] 实现缓存键生成策略（包含查询参数哈希）
- [ ] 在文章写操作（创建/更新/删除）后清除相关缓存

### Task 2: 前端文章列表页开发

**Subtask 2.1: 文章列表组件**
- [ ] 创建 ArticleList 组件
- [ ] 实现文章卡片布局（标题、摘要、封面图、元数据）
- [ ] 实现空状态展示（无文章时）
- [ ] 实现加载状态骨架屏

**Subtask 2.2: 分页组件**
- [ ] 创建 Pagination 组件
- [ ] 实现上一页/下一页按钮
- [ ] 实现页码显示和跳转
- [ ] 处理边界情况（第一页、最后一页）

**Subtask 2.3: 筛选组件**
- [ ] 创建 ArticleFilter 组件
- [ ] 实现分类下拉选择器
- [ ] 实现类型筛选（全部/博客/文档）
- [ ] 筛选条件同步到 URL 参数

**Subtask 2.4: 页面集成**
- [ ] 创建/更新文章列表页面路由
- [ ] 集成列表、分页、筛选组件
- [ ] 处理 URL 参数初始化筛选状态
- [ ] 实现响应式布局（移动端适配）

### Task 3: 前端文章详情页开发

**Subtask 3.1: 文章详情组件**
- [ ] 创建 ArticleDetail 组件
- [ ] 实现文章标题和元数据展示
- [ ] 集成 Markdown/HTML 渲染器
- [ ] 实现代码块语法高亮
- [ ] 处理文章内图片懒加载

**Subtask 3.2: 页面集成**
- [ ] 创建/更新文章详情页面路由（/article/:slug）
- [ ] 处理文章不存在的情况（404 页面）
- [ ] 实现页面 SEO meta 标签（标题、描述）

### Task 4: 测试

**Subtask 4.1: 单元测试**
- [ ] 测试文章列表 API 的分页逻辑
- [ ] 测试筛选参数解析
- [ ] 测试缓存命中/失效逻辑
- [ ] 测试组件渲染（列表、分页、筛选）

**Subtask 4.2: 集成测试**
- [ ] 测试完整的文章列表浏览流程
- [ ] 测试文章详情访问流程
- [ ] 测试筛选条件持久化到 URL

**Subtask 4.3: 性能测试**
- [ ] 验证缓存响应时间 < 50ms
- [ ] 验证首屏加载时间 < 2 秒（Lighthouse）
- [ ] 测试大数据量下的分页性能

## Technical Notes

### API 接口设计

```typescript
// 文章列表查询参数
interface ArticleListParams {
  page?: number;        // 默认 1
  pageSize?: number;    // 默认 10
  category?: string;    // 分类 slug
  type?: 'blog' | 'doc';
  status?: 'draft' | 'published' | 'archived';  // 默认 published（公开接口）
}

// 文章列表响应
interface ArticleListResponse {
  articles: ArticleSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 文章摘要（列表用）
interface ArticleSummary {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverImage?: string;
  publishedAt: Date;
  category: {
    name: string;
    slug: string;
  };
  type: 'blog' | 'doc';
}
```

### 数据库查询优化

```typescript
// 列表查询示例（server/db.ts）
const articles = await db
  .select({
    id: articlesTable.id,
    title: articlesTable.title,
    slug: articlesTable.slug,
    summary: articlesTable.summary,
    coverImage: articlesTable.coverImage,
    publishedAt: articlesTable.publishedAt,
    type: articlesTable.type,
    category: {
      name: categoriesTable.name,
      slug: categoriesTable.slug,
    },
  })
  .from(articlesTable)
  .leftJoin(categoriesTable, eq(articlesTable.categoryId, categoriesTable.id))
  .where(and(
    eq(articlesTable.status, 'published'),
    categoryFilter,
    typeFilter
  ))
  .orderBy(desc(articlesTable.publishedAt))
  .limit(pageSize)
  .offset((page - 1) * pageSize);
```

### 缓存键策略

```typescript
// 缓存键格式
const cacheKey = `articles:list:${hash({ page, pageSize, category, type, status })}`;
```

## Dependencies

- **上游依赖:**
  - Epic 1 完成（数据库基础设施、认证、跨域）
  - Epic 2 完成（文章 CRUD、分类管理）

- **下游依赖:**
  - Story 3.2（归档视图、分类统计、相关推荐）依赖本 Story 的文章列表/详情 API
  - Story 3.4（全文搜索）依赖本 Story 的文章列表组件

## Definition of Done

- [ ] 所有 Task 和 Subtask 完成
- [ ] 文章列表分页浏览功能正常工作
- [ ] 文章详情页可通过 slug 访问
- [ ] 筛选功能正常工作，URL 参数同步
- [ ] LRU 缓存集成，5 分钟 TTL 生效
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试通过
- [ ] 性能测试达标（首屏 < 2s，缓存响应 < 50ms）
- [ ] 可访问性检查通过（语义化 HTML、键盘导航、色彩对比度）
- [ ] 代码审查通过

## Estimation

- **Story Points:** 8
- **Estimated Hours:** 16-20 小时
