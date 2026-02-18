---
title: '个人博客功能扩展套件'
slug: 'blog-feature-expansion'
created: '2026-02-19'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 19', 'TypeScript', 'Vite 7', 'TailwindCSS 4', 'tRPC 11', 'Drizzle ORM', 'MySQL 8', 'Express', 'Docker', 'Forge Storage(S3兼容)']
files_to_modify: ['drizzle/schema.ts', 'server/db.ts', 'server/_core/index.ts', 'server/_core/cache.ts', 'client/src/App.tsx', 'client/src/main.tsx', 'client/src/pages/ArticleDetail.tsx', 'client/src/pages/Articles.tsx', 'client/src/pages/Home.tsx', 'vite.config.ts', 'docker-compose.yml']
code_patterns: ['单文件tRPC router嵌套: router({article:router({...})})', 'Drizzle mysqlTable+mysqlEnum schema', 'publicProcedure/protectedProcedure/adminProcedure 三级权限', 'LRUCache appCache+generateXxxKey+invalidateXxxCache', 'wouter Switch/Route 集中路由(直接import非懒加载)', 'db.ts封装全部查询+batchFetch避免N+1', 'superjson transformer序列化Date', 'performanceMiddleware性能监控']
test_patterns: ['Vitest: server/article.test.ts, auth.logout.test.ts, _core/cache.test.ts', '无前端组件测试']
---

# Tech-Spec: 个人博客功能扩展套件

**Created:** 2026-02-19

## Overview

### Problem Statement

当前个人博客项目已具备基础的文章 CRUD、分类管理、OAuth 登录、存储和 Docker 部署能力，但缺少现代个人博客的关键功能：无 SEO 优化（分享链接无预览卡片、搜索引擎收录差）、无 Sitemap、长文章无目录导航、搜索能力有限（LIKE 模糊匹配，中文搜索效果差）。这些缺失导致博客的可发现性和阅读体验有明显短板。

### Solution

基于现有 React 19 + tRPC + Drizzle + Docker 技术栈，实现 4 个高价值功能模块。每个功能模块独立可部署，不破坏现有功能。

### Scope

**In Scope:**
- SEO 优化（Meta 标签 + Open Graph + 爬虫预注入）
- Sitemap 自动生成 + robots.txt
- 文章目录导航（TOC）
- 全文搜索增强（MySQL FULLTEXT + ngram 中文分词）

**Out of Scope:**
- RSS 订阅源
- CI/CD 自动部署
- 文章标签系统
- 阅读统计
- 文章系列/专栏
- 图片管理
- 评论系统
- 多语言国际化（i18n）
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
- **部署**: 多阶段 Dockerfile（builder→runner），`docker-compose.yml` 编排 MySQL 8（768MB）+ App（512MB），2C2G 服务器优化
- **存储**: `server/storage.ts` 通过 Forge API（S3 兼容）实现文件上传/下载，非直接 AWS S3 SDK

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `server/_core/index.ts` | Express 服务器入口，注册 OAuth/tRPC/Vite 中间件，Sitemap 路由需在 tRPC 之前注册 |
| `server/_core/cache.ts` | LRUCache 实现 + 缓存键生成 + 失效函数，需新增 sitemap 缓存键和失效逻辑 |
| `server/db.ts` | 数据库查询函数（1146行），封装全部 CRUD + 批量查询，搜索函数需改用 FULLTEXT |
| `drizzle/schema.ts` | 数据库 schema（users/articles/categories/backupSettings 四表），需添加 FULLTEXT 索引 |
| `client/src/main.tsx` | React 入口，trpc.Provider + QueryClientProvider，SEO 需包裹 HelmetProvider |
| `client/src/pages/ArticleDetail.tsx` | 文章详情页（215行），需集成 TOC 组件 |
| `client/src/pages/Articles.tsx` | 文章列表页（241行），已有搜索功能，需升级为 FULLTEXT 搜索 |
| `client/src/pages/Home.tsx` | 首页，需集成 SEO meta 标签 |
| `docker-compose.yml` | Docker 编排：MySQL(768MB) + App(512MB)，需添加 ngram 配置 |
| `vite.config.ts` | 路径别名 @/client/src、@shared/shared、构建输出 dist/public |

### Technical Decisions

1. **SEO**: `react-helmet-async` 管理客户端 meta 标签，Express 中间件为爬虫 UA（Googlebot/Bingbot 等）预注入 og 标签到 HTML 模板，弥补 SPA 客户端渲染的 SEO 短板
2. **Sitemap**: Express 静态路由 `/sitemap.xml`（在 tRPC 中间件之前注册），appCache 缓存 1 小时，`invalidateArticleCache()` 时同步清除 sitemap 缓存。同时提供 `/robots.txt`
3. **TOC 导航**: 纯前端，解析 `<Streamdown>` 渲染后的 DOM heading 生成锚点目录，无需后端改动。ArticleDetail 页面改为两栏布局（内容+TOC侧栏）
4. **全文搜索**: MySQL FULLTEXT 索引（title+content）WITH PARSER ngram，`MATCH AGAINST IN BOOLEAN MODE` 替代当前 `LIKE` 模糊搜索。docker-compose.yml 需添加 `--ngram-token-size=2`

## Implementation Plan

### Tasks

- [ ] Task 1: SEO 优化 - Meta 标签与 Open Graph
  - File: `client/src/components/SEOHead.tsx`（新建）, `server/_core/index.ts`, `client/src/main.tsx`, `client/src/pages/ArticleDetail.tsx`, `client/src/pages/Articles.tsx`, `client/src/pages/Home.tsx`
  - Action: 安装 `react-helmet-async`，创建 `SEOHead` 组件注入 title/description/og:image 等 meta 标签；在各页面组件中集成；在 `main.tsx` 包裹 `HelmetProvider`；Express 中间件检测爬虫 UA 并在 `index.html` 的 `<head>` 中预注入 og 标签
  - Notes: 爬虫 UA 检测列表：Googlebot、Bingbot、Twitterbot、facebookexternalhit、LinkedInBot、Slackbot

- [ ] Task 2: Sitemap 自动生成
  - File: `server/_core/index.ts`, `server/_core/sitemap.ts`（新建）, `server/_core/cache.ts`
  - Action: 创建 `generateSitemap()` 函数，查询所有已发布文章/分类生成含 lastmod/changefreq/priority 的 XML sitemap；Express 注册 `GET /sitemap.xml` 和 `GET /robots.txt` 路由（在 tRPC 之前）；appCache 缓存 1 小时；在 `invalidateArticleCache()` 中同步清除 sitemap 缓存
  - Notes: robots.txt 内容指向 sitemap URL

- [ ] Task 3: 文章目录导航（TOC）
  - File: `client/src/components/TableOfContents.tsx`（新建）, `client/src/pages/ArticleDetail.tsx`
  - Action: 创建 TOC 组件，解析 Streamdown 渲染后 DOM 的 h2/h3 标题生成锚点导航；固定在文章详情页右侧（桌面端 sticky sidebar，移动端隐藏或折叠）；使用 IntersectionObserver 滚动时高亮当前章节
  - Notes: 纯前端实现，无后端改动；文章无 h2/h3 时不渲染 TOC

- [ ] Task 4: 全文搜索增强
  - File: `drizzle/schema.ts`, `server/db.ts`, `client/src/pages/Articles.tsx`, `docker-compose.yml`
  - Action: SQL 迁移添加 `ALTER TABLE articles ADD FULLTEXT INDEX ft_title_content (title, content) WITH PARSER ngram`；`db.ts` 搜索函数改用 `MATCH AGAINST IN BOOLEAN MODE` 替代 `LIKE`；前端搜索增加防抖（300ms）；docker-compose.yml MySQL 服务添加 `command: --ngram-token-size=2`
  - Notes: ngram_token_size=2 适合中文分词；搜索关键词需转义特殊字符防止 SQL 错误

### Acceptance Criteria

- [ ] AC 1: Given 任意页面加载, When 查看 HTML head, Then 包含正确的 title/description/og:image meta 标签
- [ ] AC 2: Given 爬虫（Googlebot）请求文章页, When 服务端响应, Then HTML 中已预注入 og:title/og:description/og:image 标签
- [ ] AC 3: Given 博客有已发布文章和分类, When 访问 `/sitemap.xml`, Then 返回包含所有公开 URL 的有效 XML sitemap（含 lastmod/changefreq/priority）
- [ ] AC 4: Given 访问 `/robots.txt`, When 请求完成, Then 返回包含 Sitemap 指向的有效 robots.txt
- [ ] AC 5: Given 文章包含 h2/h3 标题, When 查看文章详情页（桌面端）, Then 右侧显示 TOC 目录导航，点击可跳转，滚动时高亮当前章节
- [ ] AC 6: Given 文章无 h2/h3 标题, When 查看文章详情页, Then TOC 组件不渲染
- [ ] AC 7: Given 用户在搜索框输入中文关键词, When 搜索执行, Then 返回基于 FULLTEXT 索引的相关结果，中文分词正常工作
- [ ] AC 8: Given 搜索关键词为空或特殊字符, When 执行搜索, Then 返回空结果，不触发 SQL 错误

## Additional Context

### Dependencies

- `react-helmet-async` - 页面 meta 标签管理（Task 1）
- 无新增数据库服务依赖，所有功能基于现有 MySQL 8

### Testing Strategy

- **手动测试**: 每个功能模块完成后，通过浏览器验证 UI 和 API 响应
- **Sitemap**: 使用在线 XML 验证器验证输出格式
- **SEO**: 使用 Google Rich Results Test 验证 meta 标签；curl 模拟爬虫 UA 验证服务端预注入
- **搜索**: 验证中文关键词搜索结果准确性
- **数据库迁移**: 在 Docker 开发环境中先行验证 FULLTEXT 索引

### Notes

- **实施顺序**: Task 1 → Task 2 → Task 3 → Task 4，每个 Task 独立可交付
- **FULLTEXT 索引**: MySQL 8 InnoDB 原生支持，中文分词需在 docker-compose.yml 中配置 `--ngram-token-size=2`
- **向后兼容**: 无数据库结构变更（仅添加索引），不影响现有功能
- **资源限制**: 2C2G 服务器，MySQL 768MB + App 512MB，LRUCache 容量 100
- **SEO 爬虫兼容**: Express 中间件为爬虫 UA 预注入 meta 标签，弥补 SPA 客户端渲染的 SEO 短板
