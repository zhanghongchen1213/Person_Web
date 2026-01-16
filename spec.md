# 项目规格说明书 (Project Specification): Person_Web

> 生成时间: 2026-01-16
> 来源: Build Plan Agent
> 核心目标: 个人博客 + 技术文档展示平台
> 目标基础设施: 华为云 (Ubuntu 22.04, 2核 2GB)

## 1. 项目概况与价值 (Overview & Value)
本项目旨在构建一个高性能、全栈式的个人网站，主要服务于两大核心场景：
1.  **个人博客 (Personal Blog)**: 以时间轴线展示个人思考与动态。
2.  **文档中心 (Documentation Hub)**: 类似 GitBook 的结构化技术文档展示，支持层级目录与沉浸式阅读。

**关键约束 (Constraints):**
-   **内容生产**: 不使用 Git 同步。管理员直接在后台通过**在线 Markdown 编辑器**撰写和发布内容。
-   **硬件限制**: 服务器配置为 **2 vCPU / 2GB RAM**。系统设计必须极度关注内存占用和 CPU 效率。

## 2. 架构决策 (Architecture Decisions)

### 2.1 技术栈 (T3 Modified)
-   **前端**: React 19, Vite 7, Tailwind CSS v4, Shadcn/ui。
-   **后端**: Node.js (Express), tRPC v11 (全链路类型安全)。
-   **数据库**: MySQL 8.0 (通过 Drizzle ORM 管理)。
-   **认证**: OAuth 2.0 (Manus) + RBAC (管理员/访客)。

### 2.2 文档引擎实现 (Documentation Engine)
为了在不依赖 Git 的情况下实现 "GitBook" 体验：
-   **数据模型**:
    -   复用 `Category` 作为“文档集/书”的概念 (例如：“Python 笔记”是一个 Category)。
    -   在 `Article` 表中增加 `order` (排序) 和 `is_documentation` (类型) 字段。
    -   文档内容的层级结构通过 `Category` -> `Article` (Flat List with manual order) 实现，暂不支持无限极嵌套，以简化管理。
-   **编辑器**:
    -   升级为 **分栏 Markdown 编辑器** (左侧源码 | 右侧预览)。
    -   支持 **Markdown 粘贴自动格式化**。
-   **阅读器 (Frontend)**:
    -   **布局**: 三栏式布局 (左侧：章节目录 | 中间：正文 | 右侧：页内 TOC)。
    -   **渲染**: 使用 `react-markdown` + `rehype-highlight` (代码高亮) + `rehype-slug` (锚点)。

### 2.3 性能策略 (针对 2C/2G)
-   **运行时**: 使用 `PM2` 的 `cluster` 模式 (限制最大 2 个实例) 或 `fork` 模式，防止内存溢出 (OOM)。
-   **缓存层**: 实现 **应用层内存缓存 (LRU Cache)**。
    -   对于公开的博客/文档读取接口，必须走缓存。
    -   避免每次访问都穿透到 MySQL。
-   **静态资源**: Nginx 负责 Gzip/Brotli 压缩和静态资源 (JS/CSS/Images) 的强缓存。

## 3. 量化非功能性需求 (NFRs)

| 指标 (Metric) | 目标值 (Target) | 备注/约束 |
| :--- | :--- | :--- |
| **首屏内容绘制 (FCP)** | < 1.0s | 用户留存的关键 |
| **最大内容绘制 (LCP)** | < 1.5s | 需通过 Nginx 压缩和图片优化达标 |
| **API 响应 (读)** | TP99 < 200ms | 必须命中内存缓存 |
| **API 响应 (写)** | < 500ms | 直接写入数据库 |
| **安全性** | SSL Labs A级 | 开启 HSTS, TLS 1.3, 安全 Headers |
| **并发用户数** | 50+ | 受限于 2GB 内存，需严控单次请求内存 |

## 4. 数据模型变更 (Schema Changes)
-   **表 `articles`**:
    -   新增 `order` (int, default 0): 用于文档章节排序。
    -   新增 `type` (enum: 'blog', 'doc'): 区分普通博客与技术文档。
-   **表 `categories`**:
    -   新增 `type` (enum: 'blog', 'doc'): 区分博客分类与文档集。

## 5. 技术债务与风险 (Debt & Risks)
-   **[Temporary] 图片存储**: 目前直接存放在本地磁盘 (`/uploads`)。
    -   *风险*: 占用服务器磁盘，备份迁移困难。
    -   *缓解*: 编写定期清理脚本；规划在 Phase 3 迁移到对象存储 (OBS)。
-   **[Temporary] 搜索引擎**: 使用 SQL `LIKE` 进行模糊查询。
    -   *风险*: 数据量大时性能差。
    -   *缓解*: 当前数据量级 (<1000篇) 下可接受。

## 6. 执行计划里程碑 (Implementation Milestones)

### Phase 1: 核心重构与规则适配
-   [ ] 更新 `rules/` 目录下的所有规则文件。
-   [ ] 执行数据库 Schema 迁移 (添加 `order`, `type` 字段)。

### Phase 2: 文档引擎开发
-   [ ] 前端：实现文档模式的三栏布局 (Sidebar, TOC)。
-   [ ] 后台：升级编辑器，支持 Markdown 粘贴与预览。
-   [ ] 后端：实现文档排序与检索逻辑。

### Phase 3: 性能优化与部署
-   [ ] 后端：实现 tRPC 接口的 LRU 缓存装饰器。
-   [ ] 部署：配置 Nginx (SSL, Gzip) 与 PM2 守护进程。
-   [ ] 验证：在华为云服务器上进行压力测试。

### 审计机制 (Audit Mechanism)
-   **触发时机**: Phase 3 结束，上线前。
-   **检查项**: 运行 Lighthouse CI 评分 > 90；运行 `autocannon` 确保 20 并发下无错误。
