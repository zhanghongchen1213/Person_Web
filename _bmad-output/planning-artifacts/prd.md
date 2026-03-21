---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain-skipped', 'step-06-innovation-skipped', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete', 'validation-fixes', 'cicd-requirement-addition', 'codearts-reference-update']
inputDocuments:
  - '_bmad-output/implementation-artifacts/tech-spec-wip.md'
  - 'docs/CodeArts.md'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 1
classification:
  projectType: web_app
  domain: general
  complexity: medium
  projectContext: brownfield
---

# Product Requirements Document - Person_Web

**Author:** Administrator
**Date:** 2026-03-21

## Executive Summary

Person_Web 是一个现有的全栈个人博客系统，当前采用 React 19 + Express/tRPC + MySQL 单体架构通过 Docker Compose 一体化部署。本次重构将系统拆分为前后端完全分离的架构：前端静态资源部署至华为云 OBS+CDN（`zhcmqtt.top`），后端 API 独立运行于宝塔面板管理的云服务器（`api.zhcmqtt.top`，2C2G 配置，PM2 进程管理），数据库从 MySQL 8.0 迁移至 MemfireDB（PostgreSQL 兼容的 BaaS 服务）。

重构的核心目标是建立一个可扩展的多端统一后端基础设施。博客系统作为第一个落地服务验证架构可行性，未来将支撑微信小程序、H5 网页、APP（Android/iOS）、桌面端（Windows/macOS）四端共享同一个 API 后端和数据库，实现统一鉴权（微信 UnionID）、统一支付（微信支付/支付宝多端接口）、统一数据管理。

目标用户包括：博客读者（公开内容消费）、博客管理员（内容管理与数据分析）、未来多端 SaaS 服务用户。

### What Makes This Special

- **渐进式多端架构**：以博客重构为切入点，一次性建立支撑四端的后端基础设施，避免未来重复造轮子
- **零服务器前端**：OBS+CDN 部署前端，2C2G 服务器资源 100% 留给 API 服务
- **云端无数据库**：MemfireDB 托管数据库，消除云服务器数据库运维负担，宝塔面板专注于 Web 服务管理
- **类型安全保留**：保持 tRPC + Drizzle ORM 的端到端类型安全链路，仅将 Drizzle 方言从 MySQL 切换为 PostgreSQL
- **成本极低**：低流量场景下 OBS+CDN 按量计费几乎免费，MemfireDB 免费额度覆盖个人博客用量

## Project Classification

- **项目类型：** Web App（SPA + API 后端，多端扩展规划）
- **领域：** General（个人博客 + 未来 SaaS 平台）
- **复杂度：** Medium — 数据库迁移（MySQL→PostgreSQL）、架构重构（单体→前后端分离）、跨域认证调整
- **项目上下文：** Brownfield — 基于现有完整博客系统重构

## Success Criteria

### User Success

- 博客读者访问 `zhcmqtt.top` 时页面首屏加载时间 < 2 秒（CDN 加速后）
- 读者可正常浏览文章列表、文章详情、分类筛选、全文搜索，功能与重构前完全一致
- 管理员可通过 admin 后台完成文章 CRUD、分类管理、数据导入导出、数据分析，操作响应时间 < 500ms
- GitHub OAuth 登录流程在跨域（OBS 前端 → API 后端）架构下正常工作，用户无感知
- SEO 爬虫可正确索引博客内容（sitemap.xml、robots.txt、Open Graph meta 标签均可用）

### Business Success

- 重构完成后博客功能 100% 平移，零功能丢失
- 月度云服务成本控制在 50 元以内（OBS+CDN 按量计费 + 2C2G 服务器 + MemfireDB 免费额度）
- 重构后的后端 API 架构可在不修改核心代码的情况下接入新的前端客户端（小程序、APP）
- 3 个月内完成博客重构并稳定上线
- 6 个月内基于同一后端 API 上线至少一个新端（微信小程序或 H5）

### Technical Success

- Drizzle ORM schema 从 MySQL 方言完整迁移至 PostgreSQL 方言，所有表结构和关系保持一致
- API 响应时间 P95 < 200ms（不含 MemfireDB 网络延迟场景下 < 100ms）
- 2C2G 服务器上 Node.js 进程内存占用 < 400MB（PM2 监控）
- 前后端通过 CORS 配置实现跨域通信，Cookie 认证基于 `.zhcmqtt.top` 根域共享
- 数据库迁移零数据丢失，MySQL 全部数据完整迁移至 MemfireDB
- 代码推送到代码仓库后，CI/CD 流水线从触发到部署完成 < 10 分钟
- 流水线部署成功率 > 95%（非代码缺陷导致的失败）

### Measurable Outcomes

| 指标 | 当前基线 | 重构目标 | 测量方式 |
|------|---------|---------|---------|
| 首屏加载时间 | ~3s（单服务器） | < 2s | Lighthouse / WebPageTest |
| API P95 响应时间 | ~150ms（本地 MySQL） | < 200ms（远程 MemfireDB） | PM2 日志 + 性能中间件 |
| 服务器内存占用 | ~1.3GB（MySQL + App） | < 400MB（仅 App） | PM2 监控 |
| 月度成本 | ~60 元（含 Docker MySQL） | < 50 元 | 华为云账单 |
| 功能覆盖率 | 100%（基线） | 100% | 手动验收清单 |
| CI/CD 部署耗时 | 手动部署 ~30min | < 10min | 流水线执行日志 |

## Product Scope

### MVP - Minimum Viable Product

核心目标：完成前后端分离重构，博客功能 100% 平移上线，并建立 CI/CD 自动化部署流水线。

1. **数据库迁移**：ORM schema 从 MySQL 方言迁移至 PostgreSQL 方言，数据完整迁移至托管数据库
2. **后端 API 独立化**：后端从单体中剥离，配置跨域支持、进程管理器部署
3. **前端静态化部署**：构建产物部署至对象存储 + CDN
4. **认证系统适配**：OAuth 跨域回调、JWT Cookie 根域共享
5. **SEO 保持**：sitemap.xml、robots.txt、Open Graph 标签在新架构下正常工作
6. **全文搜索迁移**：从 MySQL 全文索引迁移至 PostgreSQL 全文搜索
7. **服务器面板配置**：反向代理 API、SSL 证书、进程管理
8. **CI/CD 流水线**：配置 CodeArts Pipeline（含 Repo/Build/Deploy），实现代码推送后自动触发流水线，串行执行：代码检查 → 前端构建 → 后端构建+测试 → 上传前端至 OBS → 刷新 CDN → SSH 部署后端至宝塔服务器 → 执行数据库迁移 → 健康检查。平台负责编排，仓库中的脚本负责落地动作

### Growth Features (Post-MVP)

1. **多端 API 扩展**：为小程序/APP 添加统一鉴权接口（微信 UnionID）
2. **支付基础设施**：微信支付/支付宝多端支付接口接入
3. **博客功能增强**：RSS 订阅、文章标签系统、阅读统计、TOC 目录导航、评论系统

### Vision (Future)

1. **四端统一平台**：微信小程序、H5、APP、桌面端四端共享后端 API
2. **SaaS 多服务架构**：基于子域名的多 SaaS 服务矩阵（博客、工具、电商等）
3. **Webhook 中枢**：统一接收支付平台回调，跨端状态同步
4. **独立数据库升级**：流量增长后迁移至独立 PostgreSQL 实例

### MVP Strategy & Philosophy

**MVP 方式**：平台型 MVP — 先验证前后端分离架构的可行性，100% 平移现有功能，不新增任何功能。

**资源需求**：1 名全栈开发者（Administrator），预估 2-4 周完成。

### Risk Mitigation Strategy

**技术风险**：
- 托管数据库网络延迟可能导致 API 响应变慢 → 缓解：LRU 缓存层保留，热数据本地缓存
- PostgreSQL 中文全文搜索精度不确定 → 缓解：先用 LIKE 模糊搜索兜底，逐步优化全文搜索配置
- 跨域 Cookie 可能被浏览器安全策略阻止 → 缓解：Cookie SameSite=None + Secure + 根域设置

- 流水线部署失败时不影响当前线上服务的可用性 → 缓解：流水线阶段串行执行，任一阶段失败则中止后续操作
- 数据库迁移脚本可能导致数据不一致 → 缓解：迁移脚本幂等设计，支持回滚；生产迁移前在测试环境验证
- SSH 从流水线执行机无法连接宝塔服务器 → 缓解：服务器 SSH 白名单预先配置 CodeArts 执行机 IP 段
- 前端上传 OBS 后出现 403/AccessDenied → 缓解：提前验证 OBS 桶策略（公共读）、CDN 回源地址配置
- 后端部署成功但接口 502 → 缓解：流水线末尾添加 /health 健康检查阶段，失败时告警

**市场风险**：
- 个人博客流量低，架构过度设计 → 缓解：MVP 仅做架构迁移不加新功能，验证后再扩展

**资源风险**：
- 单人开发，迁移过程中博客可能短暂不可用 → 缓解：先在本地完成全部开发测试，一次性切换

## User Journeys

### Journey 1: 小明 — 博客读者的阅读体验

**人物**：小明，25 岁，软件开发工程师，经常通过搜索引擎发现技术博客文章。

**开场**：小明在百度搜索「React tRPC 全栈开发」，搜索结果中出现 zhcmqtt.top 的一篇文章，因为 sitemap.xml 和 Open Graph 标签正确配置，搜索引擎完整展示了文章标题和摘要。

**过程**：
1. 点击链接，页面通过 CDN 加速秒开（< 2 秒），文章内容完整渲染，代码高亮清晰
2. 阅读过程中，通过文章右侧 TOC 目录导航快速跳转到感兴趣的章节
3. 文章底部看到相关文章推荐，点击进入另一篇同分类文章
4. 通过顶部导航进入文章列表页，使用分类筛选和全文搜索找到更多感兴趣的内容
5. 发现博客提供 RSS 订阅，复制 feed.xml 链接添加到自己的 RSS 阅读器

**高潮**：小明发现这个博客内容质量高、加载速度快、搜索精准，决定长期关注。

**结果**：小明成为博客的稳定读者，每周通过 RSS 获取新文章推送。整个体验中，他完全感知不到前端来自 CDN、API 来自另一台服务器、数据库在云端——架构对用户完全透明。

### Journey 2: Administrator — 博客管理员的日常管理

**人物**：Administrator（你），博客的唯一管理员，负责内容发布和系统维护。

**开场**：Administrator 需要发布一篇新文章并查看近期博客数据。

**过程**：
1. 访问 zhcmqtt.top，点击登录按钮，触发 GitHub OAuth 流程——浏览器跳转到 GitHub 授权页面，授权后回调到 `api.zhcmqtt.top`，后端设置根域 Cookie，重定向回前端页面，登录完成
2. 进入 admin 后台（/admin/articles），看到文章列表，包含草稿、已发布、已归档状态
3. 点击「新建文章」，在 Markdown 编辑器中撰写内容，实时预览渲染效果，选择分类，设置封面图（从云端图库选择）
4. 点击「发布」，API 请求发送到 `api.zhcmqtt.top`，后端写入数据库，清除相关缓存，文章即时上线
5. 切换到 /admin/analytics，查看过去 30 天的页面浏览趋势图，了解哪些文章最受欢迎
6. 进入 /admin/database，执行数据导出备份，JSON 文件下载到本地

**高潮**：整个管理流程流畅，API 响应 < 500ms，跨域认证无感知。

**结果**：Administrator 完成了日常内容管理，对重构后的系统稳定性和性能感到满意。进程管理器监控显示后端进程内存稳定在 300MB 以内。

### Journey 3: Administrator — 数据库迁移与架构切换

**人物**：Administrator，执行从旧架构到新架构的迁移工作。

**开场**：当前博客运行在 Docker Compose（MySQL + App）上，需要迁移到新架构。

**过程**：
1. 在旧系统中通过 /admin/database 导出全部数据为 JSON
2. 本地开发环境中，将 ORM schema 从 MySQL 方言改写为 PostgreSQL 方言
3. 配置托管数据库连接串，运行 schema 推送命令将表结构推送到远程数据库
4. 编写数据迁移脚本，将 JSON 数据导入托管数据库，验证数据完整性
5. 后端配置跨域支持（允许 `zhcmqtt.top` 源），调整 OAuth 回调 URL 指向 `api.zhcmqtt.top`
6. 构建前端产物，上传至对象存储，配置 CDN 加速域名
7. 在服务器面板中配置反向代理（`api.zhcmqtt.top` → `localhost:3000`），配置 SSL 证书
8. 通过进程管理器启动后端，验证所有 API 端点正常响应
9. 逐项验收功能清单：文章 CRUD、分类管理、搜索、OAuth 登录、数据分析、备份导出

**高潮**：全部功能验收通过，旧 Docker 容器停止，DNS 切换完成。

**结果**：博客成功迁移到新架构，MySQL Docker 容器被移除，服务器释放约 900MB 内存。网站访问速度因 CDN 加速反而更快。

### Journey 4: 未来开发者 — 新端接入后端 API

**人物**：Administrator 在 6 个月后，准备基于同一后端 API 开发微信小程序。

**开场**：博客后端 API 已稳定运行数月，需要验证多端接入的可行性。

**过程**：
1. 在后端新增微信登录接口，通过微信开放平台获取 UnionID
2. 在 users 表中新增 `unionId` 字段，建立与 openId 的映射关系
3. 小程序前端调用同一套 API（文章列表、文章详情、分类列表等），数据来自同一个数据库
4. 用户在小程序中登录后，打开 Web 端博客，因 UnionID 统一，身份自动关联
5. 后端新增小程序支付接口，商户私钥安全存储在服务器中

**高潮**：小程序上线后，小程序用户和 Web 用户数据完全打通，订单状态跨端同步。

**结果**：验证了「一次重构，多端复用」的架构设想，后端核心代码零修改即支撑了新端接入。

### Journey 5: Administrator — CI/CD 自动化部署体验

**人物**：Administrator，完成一次代码修改后推送代码。

**开场**：Administrator 修复了一个博客文章排序的 bug，需要将修复部署到生产环境。

**过程**：
1. 在本地完成代码修改和测试，提交到代码仓库主分支
2. 代码推送自动触发 CI/CD 流水线，流水线开始执行
3. 流水线自动安装项目依赖
4. 自动运行测试套件，确认所有测试通过
5. 自动构建前端产物
6. 自动将前端构建产物上传至对象存储桶
7. 自动刷新 CDN 缓存，确保用户访问到最新前端版本
8. 自动通过 SSH 连接云服务器，拉取最新后端代码并重启进程
9. 自动执行数据库迁移脚本，将托管数据库表结构升级到最新版本
10. 流水线执行完成，所有阶段显示绿色通过

**高潮**：从代码推送到全部部署完成不到 10 分钟，Administrator 无需手动执行任何部署步骤。

**结果**：bug 修复已自动上线，读者立即能看到正确的文章排序。Administrator 对「一次推送，全自动部署」的体验感到满意，彻底告别手动部署的繁琐流程。

### Journey Requirements Summary

| 旅程 | 揭示的核心能力需求 |
|------|-------------------|
| 读者阅读体验 | CDN 静态部署、SEO 优化、全文搜索、RSS 订阅、内容渲染 |
| 管理员日常管理 | 跨域 OAuth 认证、API 跨域通信、Markdown 编辑器、数据分析、数据备份 |
| 数据库迁移 | ORM schema 迁移、数据导入导出、跨域配置、反向代理、进程管理部署 |
| CI/CD 自动化部署 | 代码仓库集成、流水线触发、依赖安装、测试运行、前端构建上传、CDN 刷新、后端部署重启、数据库迁移 |
| 多端接入 | UnionID 统一鉴权、支付接口扩展、API 复用、数据跨端共享 |

## Web App Specific Requirements

### Project-Type Overview

本项目属于 Web App 类型（SPA + API 后端），需关注以下 Web App 特定需求：SPA 路由、浏览器兼容性、SEO 策略、实时性、无障碍访问。

### Technical Architecture Considerations

- **SPA 架构**：React 19 SPA 通过 Vite 构建为静态资源，部署至 OBS+CDN，客户端路由使用 wouter
- **浏览器支持**：Chrome 90+、Firefox 90+、Safari 15+、Edge 90+（覆盖 95% 用户）
- **SEO 策略**：SPA 对搜索引擎不友好，需通过以下方式补偿：
  - 后端 SEO 中间件为爬虫 UA 注入 Open Graph meta 标签到 HTML 模板
  - sitemap.xml 和 robots.txt 由后端 API 动态生成
  - 构建时预渲染关键页面的 HTML（可选，使用 vite-plugin-ssr）
- **实时性**：当前无实时需求，所有数据通过 tRPC query/mutation 同步获取
- **响应式设计**：移动端优先，TailwindCSS 4 响应式断点覆盖手机、平板、桌面端

### API Architecture

- **协议**：tRPC over HTTP（httpBatchLink），JSON 序列化 + superjson 处理 Date 类型
- **认证**：JWT Token 存储于 HttpOnly Cookie，根域 `.zhcmqtt.top` 共享
- **权限模型**：三级权限（公开 / 已认证 / 管理员）
- **速率限制**：200 请求/15 分钟
- **缓存**：LRU 内存缓存，文章列表 5 分钟 TTL、分类 10 分钟 TTL、分析 1 分钟 TTL
- **CORS**：允许 `zhcmqtt.top` 源，携带 credentials

### Implementation Considerations

- **构建分离**：前端构建产物独立输出，不再由后端框架托管静态文件
- **环境变量分离**：前端仅使用公开前缀变量（API 基地址、App ID），后端使用全部服务端变量
- **API 基地址配置**：前端 API client URL 从相对路径改为 `https://api.zhcmqtt.top/api/trpc`
- **健康检查**：后端暴露 `/health` 端点供面板和进程管理器监控
- **日志**：进程管理器管理日志输出，性能中间件记录慢查询（>500ms）

### CI/CD Pipeline Architecture

基于 `docs/CodeArts.md` 参考文档，CI/CD 流水线采用「平台编排 + 代码脚本」联合模式：

- **平台侧（CodeArts）负责**：触发时机、任务编排顺序、云服务调用（OBS/CDN/SSH）
- **代码仓库侧负责**：前端构建脚本、后端部署脚本（`scripts/deploy_backend.sh`）、数据库迁移脚本（`scripts/migrate_db.sh`）

**流水线 8 阶段编排**：
1. 代码检查（可选，lint/format）
2. 前端构建（`npm ci && npm run build`，输出 `dist/`）
3. 后端构建 + 测试（`npm ci && npm run build && npm test`）
4. 上传前端到 OBS（CodeArts Build「上传文件到 OBS」步骤，产物路径 `dist/**` → 目标桶根目录）
5. 刷新 CDN 缓存（调用华为云 CDN 刷新 API，刷新 `https://zhcmqtt.top/`）
6. 部署后端到宝塔服务器（SSH 执行 `scripts/deploy_backend.sh`：git pull → npm ci → npm run build → 重启进程）
7. 执行数据库迁移（SSH 执行 `scripts/migrate_db.sh`：运行 ORM 迁移命令，幂等执行）
8. 健康检查（`curl https://api.zhcmqtt.top/health`，失败则标记流水线失败）

**凭据管理**：SSH 私钥、OBS AK/SK、CDN 鉴权、DATABASE_URL 统一通过 CodeArts 参数/凭据管理

**上线策略**：先跑通最小链路（前端 OBS + 后端部署），确认稳定后再启用自动数据库迁移阶段

## Functional Requirements

### Content Management

- FR1: 管理员可创建文章（标题、slug、摘要、正文、封面图、分类、类型、状态）
- FR2: 管理员可编辑已有文章的所有字段
- FR3: 管理员可删除文章
- FR4: 管理员可将文章状态在草稿、已发布、已归档之间切换
- FR5: 管理员可修改文章的发布日期
- FR6: 管理员可创建、编辑、删除分类（名称、slug、描述、图标、排序、类型）
- FR7: 管理员可初始化一组预定义的默认分类（包含技术、生活、随笔等 5 个分类）
- FR8: 系统可在创建文章时，若指定分类不存在则自动创建该分类

### Content Consumption

- FR9: 读者可浏览分页的文章列表（支持按分类、类型、状态筛选）
- FR10: 读者可通过 slug 访问文章详情页
- FR11: 读者可查看文章归档视图（按时间分组）
- FR12: 读者可查看各分类下的文章数量统计
- FR13: 读者可获取当前文章的相关推荐文章
- FR14: 读者可浏览文档类型内容的树形导航结构
- FR15: 读者可通过全文搜索查找文章

### Authentication & Authorization

- FR16: 用户可通过 GitHub OAuth 登录系统
- FR17: 系统可在跨域架构下完成 OAuth 回调并设置根域认证凭证
- FR18: 系统可通过认证凭证识别已登录用户身份
- FR19: 系统可区分普通用户和管理员角色
- FR20: 系统可识别并赋予博客所有者管理员权限
- FR21: 用户可退出登录（清除认证凭证）

### Analytics & Monitoring

- FR22: 系统可记录页面浏览数据（文章 ID、IP、User-Agent、路径、时间）
- FR23: 管理员可查看分析概览（总文章数、总浏览量、分类数等）
- FR24: 管理员可查看指定时间范围的每日页面浏览统计（1-365 天）
- FR25: 管理员可查看文章级别的浏览统计

### Data Management

- FR26: 管理员可导出全部数据为 JSON 格式
- FR27: 管理员可从 JSON 文件导入数据（恢复备份）
- FR28: 管理员可查看数据库统计信息（表大小、行数、页面浏览量、备份配置数）
- FR29: 管理员可配置自动备份计划（启用/禁用、间隔：周/月/季度）
- FR30: 系统可按配置的间隔自动执行数据库备份

### SEO & Discovery

- FR31: 系统可生成包含所有公开 URL 的 XML sitemap
- FR32: 系统可提供 robots.txt 文件
- FR33: 系统可为页面注入 Open Graph meta 标签（针对爬虫 UA）
- FR34: 系统可生成 RSS/Atom 订阅源

### Deployment & Operations

- FR35: 前端构建产物可独立部署至对象存储服务
- FR36: 后端 API 可通过进程管理器独立运行在云服务器上
- FR37: 系统可支持前端从不同域名访问 API（跨域支持）
- FR38: API 域名可通过反向代理路由到后端服务
- FR39: 系统可暴露健康检查端点供监控使用

### CI/CD Automation

- FR40: 代码推送到代码仓库指定分支后，系统可自动触发 CI/CD 流水线
- FR41: 流水线可自动安装项目依赖并运行测试套件，测试失败时中止流水线并通知开发者
- FR42: 流水线可自动构建前端产物并上传至指定对象存储桶
- FR43: 流水线可在前端上传完成后自动刷新 CDN 缓存
- FR44: 流水线可自动连接云服务器，部署后端代码并重启后端进程
- FR45: 流水线可自动执行数据库迁移脚本，将托管数据库表结构升级到最新版本
- FR46: 流水线执行完成后，系统可向开发者发送部署结果通知（成功/失败）
- FR47: 流水线可在后端部署完成后自动执行健康检查，验证服务可用性
- FR48: 仓库中需包含前端构建脚本、后端部署脚本、数据库迁移脚本，流水线通过执行这些脚本完成落地动作
- FR49: 流水线支持按阶段串行编排：代码检查 → 前端构建 → 后端构建+测试 → 上传 OBS → 刷新 CDN → 部署后端 → 数据库迁移 → 健康检查

## Non-Functional Requirements

### Performance

- NFR1: 前端首屏加载时间 < 2 秒（通过 CDN 加速，Lighthouse 测量）
- NFR2: API P95 响应时间 < 200ms（性能日志测量）
- NFR3: 全文搜索响应时间 < 300ms
- NFR4: 后端进程内存占用 < 400MB（进程管理器监控，设置自动重启阈值 400M）
- NFR5: 缓存容量 100 条目，文章列表 TTL 5 分钟，分类 TTL 10 分钟

### Security

- NFR6: 认证 Token 存储于 HttpOnly + Secure + SameSite Cookie
- NFR7: 所有 API 端点通过 HTTPS 访问（SSL 证书由服务器面板管理）
- NFR8: API 速率限制 200 请求/15 分钟
- NFR9: HTTP 响应包含安全头（CSP、X-Frame-Options、HSTS 等）
- NFR10: 数据库连接使用 SSL 加密（远程托管数据库连接）
- NFR11: 敏感配置（认证密钥、OAuth Secret、数据库连接串）通过环境变量管理，不硬编码
- NFR35: CI/CD 流水线中的机密信息（SSH 私钥、数据库连接串、OBS 鉴权、CDN 刷新密钥）统一通过流水线平台的参数/凭据管理，不写入代码仓库

### Scalability

- NFR12: 系统支持 100 并发用户访问（2C2G 服务器 + CDN 分流静态请求）
- NFR13: 数据库连接池最大 10 连接（托管数据库免费额度限制）
- NFR14: 前端静态资源通过 CDN 多节点分发，理论无并发上限
- NFR15: 后端架构支持未来水平扩展（集群模式或多服务器负载均衡）

### Reliability

- NFR16: API 服务可用性 > 99%（服务器面板 + 进程管理器自动重启保障）
- NFR17: 进程管理器配置内存阈值自动重启，防止内存泄漏导致服务中断
- NFR18: 数据库自动备份（可配置周/月/季度间隔）
- NFR19: 数据迁移过程零数据丢失（迁移前后行数校验）
- NFR29: CI/CD 流水线从代码推送到部署完成 < 10 分钟（流水线执行日志测量）
- NFR30: 流水线部署成功率 > 95%（排除代码缺陷导致的测试失败）
- NFR31: 流水线中任意阶段失败时，后续阶段不执行，系统保持上一次成功部署的状态
- NFR32: 数据库迁移脚本支持幂等执行，重复运行不产生副作用
- NFR36: 流水线建议先跑通最小链路（前端 OBS + 后端部署），确认稳定后再启用自动数据库迁移阶段

### Accessibility

- NFR25: 网站符合 WCAG 2.1 AA 标准，确保色彩对比度比率 ≥ 4.5:1（正文文本）
- NFR26: 所有交互元素支持键盘导航（Tab 顺序、Enter/Space 激活、Escape 关闭）
- NFR27: 页面结构支持屏幕阅读器（语义化 HTML 标签、ARIA 标签、alt 属性）
- NFR28: 表单元素具有关联的 label 标签，错误提示可被辅助技术识别

### Integration

- NFR20: 前端通过类型安全的 RPC 协议与后端通信
- NFR21: GitHub OAuth 通过标准 OAuth 2.0 协议集成
- NFR22: 托管数据库通过 PostgreSQL 标准协议连接
- NFR23: 前端静态资源通过 S3 兼容 API 上传至对象存储
- NFR24: 图片存储通过现有云端图库 API 集成
- NFR33: CI/CD 流水线通过代码仓库 Webhook 触发，支持基于分支的触发规则
- NFR34: 流水线通过 SSH 协议安全连接云服务器执行部署命令
