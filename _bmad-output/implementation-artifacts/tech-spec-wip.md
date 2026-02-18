---
title: '个人博客功能扩展套件'
slug: 'blog-feature-expansion'
created: '2026-02-19'
status: 'review'
stepsCompleted: [1, 2, 3]
tech_stack: ['React 19', 'TypeScript', 'Vite 7', 'TailwindCSS 4', 'tRPC 11', 'Drizzle ORM', 'MySQL 8', 'Express', 'Docker', 'Forge Storage(S3兼容)']
files_to_modify: ['drizzle/schema.ts', 'server/routers.ts', 'server/db.ts', 'server/_core/index.ts', 'server/_core/cache.ts', 'client/src/App.tsx', 'client/src/pages/ArticleDetail.tsx', 'client/src/pages/Articles.tsx', 'vite.config.ts', '.github/workflows/deploy.yml']
code_patterns: ['单文件tRPC router嵌套: router({article:router({...})})', 'Drizzle mysqlTable+mysqlEnum schema', 'publicProcedure/protectedProcedure/adminProcedure 三级权限', 'LRUCache appCache+generateXxxKey+invalidateXxxCache', 'wouter Switch/Route 集中路由(直接import非懒加载)', 'db.ts封装全部查询+batchFetch避免N+1', 'superjson transformer序列化Date', 'performanceMiddleware性能监控']
test_patterns: ['Vitest: server/article.test.ts, auth.logout.test.ts, _core/cache.test.ts', '无前端组件测试']
---

# Tech-Spec: 个人博客功能扩展套件

**Created:** 2026-02-19

## Overview

### Problem Statement

当前个人博客项目已具备基础的文章 CRUD、分类管理、OAuth 登录、S3 存储和 Docker 部署能力，但缺少现代个人博客的关键功能：无 RSS 订阅、无 SEO 优化、无 CI/CD 自动部署、无标签系统、无阅读统计、无文章目录导航、搜索能力有限。这些缺失导致博客的可发现性、用户体验和运维效率均有明显短板。

### Solution

基于现有 React 19 + tRPC + Drizzle + Docker 技术栈，分批次实现 10 个高价值功能模块，按优先级从 P0 到 P2 递进交付。每个功能模块独立可部署，不破坏现有功能。

### Scope

**In Scope:**
- P0: RSS/Atom 订阅源生成、SEO 优化与 Sitemap、CI/CD GitHub Actions 部署流水线
- P1: 文章标签系统、阅读统计与访客分析、文章目录导航(TOC)、全文搜索增强
- P2: 文章系列/专栏功能、图片管理与优化、Giscus 评论集成

**Out of Scope:**
- 用户注册系统（保持 GitHub OAuth 单一登录）
- 多语言国际化（i18n）
- 电商/付费功能
- 移动端 App

## Context for Development

### Codebase Patterns

- **tRPC 路由**: 单文件 `server/routers.ts` 中 `router()` 嵌套，按领域分组（article/category/doc/database/auth）。三级权限：`publicProcedure`（匿名）、`protectedProcedure`（登录用户）、`adminProcedure`（管理员，role=admin）。输入用 `z.object()` 校验，`superjson` 序列化 Date 等类型
- **数据库层**: `drizzle/schema.ts` 用 `mysqlTable()` + `mysqlEnum()` 定义表结构，`server/db.ts` 封装所有查询函数（getArticles/getArticleBySlug 等），批量查询用 `batchFetchArticleRelations()` 避免 N+1。迁移通过 `drizzle-kit` 管理
- **缓存层**: `server/_core/cache.ts` 导出 `LRUCache` 类（容量100，支持 TTL），全局实例 `appCache`。读操作用 `generateXxxKey()` 生成缓存键，写操作后调用 `invalidateArticleCache()` / `invalidateCategoryCache()` 按正则清除
- **前端路由**: `wouter` 的 `Switch/Route` 在 `App.tsx` 集中定义，页面组件直接 import（非懒加载）。Provider 层级：ErrorBoundary → ThemeProvider → TooltipProvider → Router
- **页面结构**: 每个页面组件包含 `<Navbar />` + `<main>` + `<Footer />`，用 TailwindCSS 4 的 brutalist 设计风格（`border-2 border-border`、`font-bold uppercase tracking-wider`）
- **API 调用**: `client/src/lib/trpc.ts` 导出 `trpc = createTRPCReact<AppRouter>()`，`main.tsx` 配置 `httpBatchLink` 指向 `/api/trpc`，客户端用 `trpc.xxx.useQuery()` / `useMutation()`
- **认证**: GitHub OAuth + Mock OAuth（开发环境）→ JWT cookie → `server/_core/context.ts` 解析注入 `ctx.user`
- **部署**: 多阶段 Dockerfile（builder→runner），`docker-compose.yml` 编排 MySQL 8（768MB）+ App（512MB），2C2G 服务器优化。之前的 CI/CD workflow 已被 revert，需重新创建
- **存储**: `server/storage.ts` 通过 Forge API（S3 兼容）实现文件上传/下载，非直接 AWS S3 SDK

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `drizzle/schema.ts` | 数据库 schema（users/articles/categories/backupSettings 四表），需新增 tags/articleTags/viewStats 表 |
| `server/routers.ts` | 单文件 tRPC 路由入口（455行），所有 router 定义在此，需新增 tag/stats/feed/series router |
| `server/db.ts` | 数据库查询函数（1146行），封装全部 CRUD + 批量查询 + 导入导出，需新增标签/统计/系列查询 |
| `server/_core/index.ts` | Express 服务器入口，注册 OAuth/tRPC/Vite 中间件，RSS/Sitemap 路由需在 tRPC 之前注册 |
| `server/_core/trpc.ts` | tRPC 初始化，定义 publicProcedure/protectedProcedure/adminProcedure + performanceMiddleware |
| `server/_core/cache.ts` | LRUCache 实现 + 缓存键生成 + 失效函数，需新增 feed/sitemap/tag 缓存键和失效逻辑 |
| `server/storage.ts` | Forge Storage API 封装（storagePut/storageGet），图片管理功能复用此模块 |
| `client/src/App.tsx` | wouter 路由定义（12个路由），需新增标签页/系列页/图片管理页路由 |
| `client/src/main.tsx` | React 入口，trpc.Provider + QueryClientProvider，SEO 需包裹 HelmetProvider |
| `client/src/pages/ArticleDetail.tsx` | 文章详情页（215行），需集成 TOC/Giscus/阅读统计/系列导航 |
| `client/src/pages/Articles.tsx` | 文章列表页（241行），已有分类筛选+搜索，需集成标签筛选 |
| `client/src/contexts/ThemeContext.tsx` | Context 模式参考：createContext + Provider + useXxx hook |
| `docker-compose.yml` | Docker 编排：MySQL(768MB) + App(512MB)，2C2G 资源限制 |
| `Dockerfile` | 多阶段构建：node:22-alpine，pnpm，CI/CD 复用 |
| `vite.config.ts` | 路径别名 @/client/src、@shared/shared、构建输出 dist/public |

### Technical Decisions

1. **RSS/Sitemap**: Express 静态路由 `/feed.xml` `/sitemap.xml`（在 tRPC 中间件之前注册），appCache 缓存 1 小时，`invalidateArticleCache()` 时同步清除 feed/sitemap 缓存
2. **标签系统**: 多对多关系，`tags`（id/name/slug/createdAt）+ `article_tags`（articleId/tagId）两张表，遵循现有 mysqlTable 定义模式。tRPC 在 `routers.ts` 新增 `tag: router({...})`
3. **阅读统计**: `view_stats` 表（id/articleId/ip/userAgent/createdAt），tRPC 新增 `stats: router({record, byArticle})`，publicProcedure 记录，同 IP 24h 去重
4. **TOC 导航**: 纯前端，解析 `<Streamdown>` 渲染后的 DOM heading 生成锚点目录，无需后端改动。ArticleDetail 页面改为两栏布局（内容+TOC侧栏）
5. **全文搜索**: MySQL FULLTEXT 索引（title+content），`MATCH AGAINST` 替代当前 `LIKE` 模糊搜索。中文需配置 `ngram_parser`，通过 SQL 迁移添加索引
6. **文章系列**: `series` 表 + articles 增加 `seriesId`/`seriesOrder` 字段（nullable，向后兼容），tRPC 新增 `series: router({...})`
7. **图片管理**: 复用 `server/storage.ts` 的 Forge Storage API，tRPC 新增 `image: router({list, delete})`，admin 页面展示/删除/复制链接
8. **Giscus 评论**: 纯前端 `<script>` 标签集成，零后端改动，通过 `VITE_GISCUS_*` 环境变量配置 repo/category
9. **CI/CD**: `.github/workflows/deploy.yml` 新建（之前的已被 revert），GitHub Actions + `appleboy/ssh-action` SSH 部署，复用现有 Dockerfile + docker-compose
10. **SEO**: `react-helmet-async` 管理客户端 meta 标签，Express 中间件为爬虫 UA 预注入 og 标签到 HTML 模板

## Implementation Plan

### Tasks

#### P0 - 核心基础设施

- [ ] Task 1: RSS/Atom 订阅源
  - File: `server/_core/index.ts`（新增路由）, `server/_core/feed.ts`（新建）
  - Action: 创建 `generateFeed()` 函数，查询最新 20 篇已发布文章，生成 RSS 2.0 XML；Express 注册 `GET /feed.xml` 路由；appCache 缓存 1 小时，文章写操作时失效
  - Notes: 使用 `feed` npm 包生成标准 RSS/Atom XML

- [ ] Task 2: SEO 优化 - Meta 标签与 Open Graph
  - File: `client/src/components/SEOHead.tsx`（新建）, `client/src/pages/ArticleDetail.tsx`, `client/src/pages/Articles.tsx`, `client/src/pages/Home.tsx`
  - Action: 安装 `react-helmet-async`，创建 `SEOHead` 组件注入 title/description/og:image 等 meta 标签；在各页面组件中集成
  - Notes: 需在 `client/src/main.tsx` 包裹 `HelmetProvider`

- [ ] Task 3: Sitemap 自动生成
  - File: `server/_core/index.ts`, `server/_core/sitemap.ts`（新建）
  - Action: 创建 `generateSitemap()` 函数，查询所有已发布文章/分类生成 XML sitemap；Express 注册 `GET /sitemap.xml` 路由；appCache 缓存 1 小时
  - Notes: 同时生成 `robots.txt` 路由指向 sitemap

- [ ] Task 4: CI/CD GitHub Actions 部署流水线
  - File: `.github/workflows/deploy.yml`（新建）
  - Action: 创建 GitHub Actions workflow：push to main → build Docker image → SSH 部署到云服务器 → docker-compose up
  - Notes: 使用 `appleboy/ssh-action` 进行 SSH 部署，secrets 配置 SSH_HOST/SSH_KEY/SSH_USER

#### P1 - 用户体验增强

- [ ] Task 5: 文章标签系统 - 数据库层
  - File: `drizzle/schema.ts`, `server/db.ts`
  - Action: 新增 `tags` 表（id/name/slug/createdAt）和 `article_tags` 联表（articleId/tagId）；在 `db.ts` 新增 `getTags()`、`getTagBySlug()`、`getArticlesByTag()`、`setArticleTags()` 查询函数
  - Notes: Drizzle 迁移 `npm run db:push`

- [ ] Task 6: 文章标签系统 - API 与前端
  - File: `server/routers.ts`, `client/src/pages/Articles.tsx`, `client/src/pages/ArticleDetail.tsx`, `client/src/pages/Write.tsx`
  - Action: tRPC 新增 `tag` router（list/bySlug/articlesBy）；文章列表页增加标签筛选；文章详情页显示标签；写作页增加标签选择器
  - Notes: 依赖 Task 5 完成

- [ ] Task 7: 阅读统计与访客分析
  - File: `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts`, `client/src/pages/ArticleDetail.tsx`
  - Action: 新增 `view_stats` 表（id/articleId/ip/userAgent/createdAt）；tRPC 新增 `stats.record`（mutation）和 `stats.byArticle`（query）；文章详情页加载时调用记录 API，显示阅读次数
  - Notes: 同一 IP 24 小时内同一文章只计一次

- [ ] Task 8: 文章目录导航（TOC）
  - File: `client/src/components/TableOfContents.tsx`（新建）, `client/src/pages/ArticleDetail.tsx`
  - Action: 创建 TOC 组件，解析文章 markdown 的 h2/h3 标题生成锚点导航；固定在文章详情页右侧；滚动时高亮当前章节
  - Notes: 纯前端实现，解析 Streamdown 渲染后的 DOM heading

- [ ] Task 9: 全文搜索增强
  - File: `drizzle/schema.ts`（添加 FULLTEXT 索引）, `server/db.ts`, `client/src/pages/Articles.tsx`
  - Action: 为 articles 表的 title/content 字段添加 MySQL FULLTEXT 索引；`db.ts` 搜索函数改用 `MATCH AGAINST` 替代 `LIKE`；前端搜索增加防抖和搜索结果高亮
  - Notes: 需要 SQL 迁移添加索引

#### P2 - 进阶功能

- [ ] Task 10: 文章系列/专栏功能
  - File: `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts`, `client/src/pages/ArticleDetail.tsx`, `client/src/components/SeriesNav.tsx`（新建）
  - Action: 新增 `series` 表（id/name/slug/description/coverImage/createdAt）；articles 表新增 `seriesId`/`seriesOrder` 字段；tRPC 新增 `series` router；文章详情页底部显示系列导航
  - Notes: 可选功能，不影响现有文章

- [ ] Task 11: 图片管理与优化
  - File: `server/routers.ts`, `client/src/pages/admin/ImageManager.tsx`（新建）, `client/src/App.tsx`
  - Action: tRPC 新增 `image` router（list/delete），调用 Forge Storage API；新建 admin 图片管理页面，展示已上传图片列表，支持删除和复制链接
  - Notes: 复用现有 `server/storage.ts` 的 storagePut/storageGet

- [ ] Task 12: Giscus 评论集成
  - File: `client/src/components/GiscusComments.tsx`（新建）, `client/src/pages/ArticleDetail.tsx`
  - Action: 创建 Giscus 组件，通过 `<script>` 标签加载 giscus.app；在文章详情页底部集成；通过环境变量配置 repo/repoId/category
  - Notes: 零后端改动，需用户在 GitHub 仓库启用 Discussions

### Acceptance Criteria

#### P0 验收标准

- [ ] AC 1: Given 博客有已发布文章, When 访问 `/feed.xml`, Then 返回有效的 RSS 2.0 XML，包含最新 20 篇文章的标题/摘要/链接
- [ ] AC 2: Given 新文章发布, When RSS 缓存失效后再次访问 `/feed.xml`, Then 新文章出现在 feed 中
- [ ] AC 3: Given 任意页面加载, When 查看 HTML head, Then 包含正确的 title/description/og:image meta 标签
- [ ] AC 4: Given 博客有已发布文章和分类, When 访问 `/sitemap.xml`, Then 返回包含所有公开 URL 的有效 XML sitemap
- [ ] AC 5: Given 代码推送到 main 分支, When GitHub Actions 触发, Then 自动构建 Docker 镜像并部署到云服务器

#### P1 验收标准

- [ ] AC 6: Given 文章已关联标签, When 访问文章列表页, Then 可通过标签筛选文章，且标签显示在文章卡片上
- [ ] AC 7: Given 写作页面打开, When 编辑文章, Then 可选择/创建标签并关联到文章
- [ ] AC 8: Given 用户访问文章详情页, When 页面加载完成, Then 阅读次数 +1（同 IP 24h 内不重复计数），且页面显示总阅读次数
- [ ] AC 9: Given 文章包含 h2/h3 标题, When 查看文章详情页, Then 右侧显示 TOC 目录导航，点击可跳转，滚动时高亮当前章节
- [ ] AC 10: Given 用户在搜索框输入关键词, When 搜索执行, Then 返回基于 FULLTEXT 索引的相关结果，响应时间 < 200ms

#### P2 验收标准

- [ ] AC 11: Given 文章属于某系列, When 查看文章详情页, Then 底部显示系列导航（上一篇/下一篇/系列目录）
- [ ] AC 12: Given 管理员访问图片管理页, When 页面加载, Then 显示 S3 中所有已上传图片列表，支持删除和复制链接
- [ ] AC 13: Given 文章详情页加载, When Giscus 配置正确, Then 文章底部显示 GitHub Discussions 评论区，支持登录评论

## Additional Context

### Dependencies

- `feed` - RSS/Atom XML 生成（Task 1）
- `react-helmet-async` - 页面 meta 标签管理（Task 2）
- `appleboy/ssh-action` - GitHub Actions SSH 部署（Task 4）
- 无新增数据库服务依赖，所有功能基于现有 MySQL 8

### Testing Strategy

- **手动测试**: 每个功能模块完成后，通过浏览器验证 UI 和 API 响应
- **RSS/Sitemap**: 使用在线 XML 验证器验证输出格式
- **CI/CD**: 通过 GitHub Actions 日志验证构建和部署流程
- **数据库迁移**: 在 Docker 开发环境中先行验证 schema 变更
- **SEO**: 使用 Google Rich Results Test 验证 meta 标签

### Notes

- **实施顺序**: 严格按 P0→P1→P2 顺序，每个 Task 独立可交付
- **风险点**: CI/CD 部署依赖云服务器 SSH 配置，需提前配置 GitHub Secrets；之前的 deploy.yml 已被 revert（commit 0c5115b）
- **FULLTEXT 索引**: MySQL 8 默认支持 InnoDB FULLTEXT，中文分词需配置 `ngram_parser`
- **Giscus**: 需要目标 GitHub 仓库启用 Discussions 功能
- **向后兼容**: 所有数据库变更均为新增表/字段，不修改现有数据结构
- **资源限制**: 2C2G 服务器，MySQL 768MB + App 512MB，新功能需注意内存占用（LRUCache 容量100）
