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

## 5. 技术分类管理 (Category Management)

### 5.1 简化分类策略
技术分类采用扁平化设计，不使用复杂的层级结构：

**预设分类 (大主题)**:
- 全栈开发 (fullstack)
- 嵌入式开发 (embedded)
- ROS开发 (ros)
- 深度学习 (deep-learning)
- DIY (diy)

**分类特性**:
- 管理员在 Write 页面可直接手写输入新分类名称
- 分类自动创建：输入不存在的分类名时，系统自动创建
- 不需要分类简介字段（description 字段保留但非必填）
- 分类仅作为文章的标签使用，无层级关系

### 5.2 分类数据模型
复用现有 `categories` 表，简化使用方式：
- `name`: 分类名称（必填，如"全栈开发"）
- `slug`: URL 友好标识（自动生成）
- `description`: 简介（可选，不强制）
- `type`: 分类类型（blog/doc）

## 6. 文章管理页面 (Article Management Page)

### 6.1 功能概述
创建独立的文章管理页面 (`/admin/articles`)，供管理员集中管理所有已发布和草稿文章。

### 6.2 功能需求

**文章列表展示**:
- 显示管理员发布的全部文章（包括草稿、已发布、已归档）
- 列表字段：标题、分类、状态、发布日期、创建日期
- 支持按状态筛选（全部/草稿/已发布/已归档）
- 支持按分类筛选
- 支持分页显示

**文章操作**:
1. **删除文章**: 点击删除按钮，弹出确认对话框后删除
2. **编辑文章**: 点击编辑按钮，跳转到 `/write/:id` 编辑页面
3. **修改发布日期**: 支持手动修改文章的 `publishedAt` 字段

### 6.3 API 接口需求

**新增接口**:
- `article.updatePublishedAt`: 单独更新文章发布日期
  - 输入: `{ id: number, publishedAt: Date }`
  - 权限: admin

**复用接口**:
- `article.adminList`: 获取管理员的所有文章
- `article.delete`: 删除文章
- `article.update`: 更新文章

### 6.4 页面路由
- 路径: `/admin/articles`
- 权限: 仅管理员可访问
- 导航: 在 Navbar 中为管理员添加入口

## 7. 技术债务与风险 (Debt & Risks)
-   **[Temporary] 图片存储**: 目前直接存放在本地磁盘 (`/uploads`)。
    -   *风险*: 占用服务器磁盘，备份迁移困难。
    -   *缓解*: 编写定期清理脚本；规划在 Phase 3 迁移到对象存储 (OBS)。
-   **[Temporary] 搜索引擎**: 使用 SQL `LIKE` 进行模糊查询。
    -   *风险*: 数据量大时性能差。
    -   *缓解*: 当前数据量级 (<1000篇) 下可接受。

## 8. Docker 容器化部署规范 (Docker Deployment Specification)

### 8.1 部署目标
-   **目标域名**: `zhcmqtt.top`
-   **目标服务器**: 华为云 Ubuntu 22.04 (2C2G)
-   **容器化方案**: Docker + Docker Compose
-   **反向代理**: Nginx (宿主机或容器)

### 8.2 容器架构设计

```
                    [Internet]
                        |
                        v
              +------------------+
              |     Nginx        |  <- 宿主机 Nginx (SSL 终止, 反向代理)
              |   (Port 80/443)  |
              +------------------+
                        |
                        v
        +-------------------------------+
        |      Docker Network           |
        |  +-------------------------+  |
        |  |   App Container         |  |
        |  |   (Node.js:3000)        |  |
        |  +-------------------------+  |
        |              |                |
        |              v                |
        |  +-------------------------+  |
        |  |   MySQL Container       |  |
        |  |   (MySQL:3306)          |  |
        |  +-------------------------+  |
        +-------------------------------+
```

### 8.3 Dockerfile 规范

**多阶段构建策略:**
1.  **Stage 1 (builder)**: 安装依赖并构建项目
2.  **Stage 2 (runner)**: 仅包含运行时必需文件

**基础镜像选择:**
-   构建阶段: `node:22-alpine`
-   运行阶段: `node:22-alpine` (体积小，适合 2G 内存限制)

**关键配置:**
-   使用 `pnpm` 作为包管理器
-   设置 `NODE_ENV=production`
-   暴露端口 `3000`
-   健康检查: `curl -f http://localhost:3000/api/trpc/system.health`

### 8.4 docker-compose.yml 规范

**服务定义:**

| 服务名 | 镜像 | 端口映射 | 依赖 | 资源限制 |
|--------|------|----------|------|----------|
| `app` | 自建镜像 | 3000:3000 | mysql | mem: 512MB |
| `mysql` | mysql:8.0 | 3306:3306 | - | mem: 768MB |

**网络配置:**
-   创建自定义 bridge 网络 `person_web_network`
-   服务间通过服务名通信 (如 `mysql:3306`)

**数据持久化:**
-   MySQL 数据: `mysql_data:/var/lib/mysql`
-   上传文件: `./uploads:/app/uploads`

**环境变量管理:**
-   使用 `.env.production` 文件
-   敏感信息不提交到 Git

### 8.5 Nginx 配置规范

**功能需求:**
1.  **域名绑定**: `zhcmqtt.top` 和 `www.zhcmqtt.top`
2.  **SSL/HTTPS**: 使用 Let's Encrypt 免费证书
3.  **HTTP 自动跳转 HTTPS**
4.  **反向代理**: 将请求转发到 Docker 容器 (localhost:3000)
5.  **静态资源缓存**: JS/CSS/Images 强缓存 (1年)
6.  **Gzip 压缩**: 开启文本类型压缩

**安全 Headers:**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 8.6 环境变量清单

| 变量名 | 用途 | 示例值 | 必填 |
|--------|------|--------|------|
| `DATABASE_URL` | MySQL 连接字符串 | `mysql://user:pass@mysql:3306/db` | Yes |
| `NODE_ENV` | 运行环境 | `production` | Yes |
| `JWT_SECRET` | JWT 签名密钥 | `your-secret-key` | Yes |
| `OWNER_OPEN_ID` | 管理员 OpenID | `admin-openid` | Yes |
| `PORT` | 应用端口 | `3000` | No |

### 8.7 部署流程概述

1.  **本地构建**: `docker build -t person-web:latest .`
2.  **镜像推送**: 推送到私有仓库或直接传输到服务器
3.  **服务器准备**: 安装 Docker, Docker Compose, Nginx
4.  **SSL 证书**: 使用 Certbot 申请 Let's Encrypt 证书
5.  **启动服务**: `docker-compose up -d`
6.  **数据库迁移**: 首次启动后执行 Drizzle 迁移
7.  **Nginx 配置**: 配置反向代理并重载

## 9. 执行计划里程碑 (Implementation Milestones)

### Phase 1: 核心重构与规则适配 [已完成]
-   [x] 更新 `rules/` 目录下的所有规则文件。
-   [x] 执行数据库 Schema 迁移 (添加 `order`, `type` 字段)。

### Phase 2: 文档引擎开发 [已完成]
-   [x] 前端：实现文档模式的三栏布局 (Sidebar, TOC)。
-   [x] 后台：升级编辑器，支持 Markdown 粘贴与预览。
-   [x] 后端：实现文档排序与检索逻辑。

### Phase 2.5: 管理功能增强 [新增]
-   [ ] 简化技术分类：Write 页面支持手写输入分类名称。
-   [ ] 分类自动创建：输入新分类时自动创建。
-   [ ] 文章管理页面：创建 `/admin/articles` 管理页面。
-   [ ] 文章操作：支持删除、编辑、修改发布日期。

### Phase 3: Docker 容器化与部署
-   [ ] 编写 Dockerfile (多阶段构建)。
-   [ ] 编写 docker-compose.yml (App + MySQL)。
-   [ ] 编写 Nginx 配置文件 (SSL, 反向代理)。
-   [ ] 编写部署脚本和文档。

### Phase 4: 性能优化与上线
-   [ ] 后端：实现 tRPC 接口的 LRU 缓存装饰器。
-   [ ] 部署：在华为云服务器上部署并配置 SSL。
-   [ ] 验证：运行 Lighthouse 和压力测试。

### 审计机制 (Audit Mechanism)
-   **触发时机**: Phase 4 结束，上线前。
-   **检查项**: 运行 Lighthouse CI 评分 > 90；运行 `autocannon` 确保 20 并发下无错误。
