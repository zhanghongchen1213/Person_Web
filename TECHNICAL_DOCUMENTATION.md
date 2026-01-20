# Person_Web 全栈开发文档

> 前端技术：React 19 + TypeScript + Vite + TailwindCSS
> 后端技术：Node.js (Express + tRPC) + TypeScript
> 数据库：MySQL 8.0 + Drizzle ORM

## 1. 项目概述 (Overview)

### 1.1 产品简介

Person_Web 是一个现代化的个人博客系统，支持博客文章和技术文档两种内容类型。系统采用全栈 TypeScript 开发，提供了完整的内容管理功能，包括文章创建、分类管理、GitHub OAuth 认证等核心功能。

**核心特性**：
- ✅ 博客与文档双模式支持
- ✅ GitHub OAuth 安全认证
- ✅ Markdown 编辑器与实时预览
- ✅ 分类管理与文章归档
- ✅ 响应式设计，支持移动端
- ✅ Docker 容器化部署
- ✅ 内存优化，适配 2C2G 服务器

**目标用户**：
- 个人开发者搭建技术博客
- 技术团队构建知识库
- 开源项目文档站点

### 1.2 技术选型

#### 前端技术栈
- **框架**: React 19 (最新版本，支持 Server Components)
- **构建工具**: Vite 7.1.7 (快速构建，HMR 支持)
- **路由**: Wouter 3.3.5 (轻量级路由库)
- **状态管理**: TanStack Query 5.90.2 (服务端状态管理)
- **UI 组件**: Radix UI (无障碍组件库)
- **样式方案**: TailwindCSS 4.1.14 (原子化 CSS)
- **表单处理**: React Hook Form 7.64.0 + Zod 4.1.12
- **Markdown**: React Markdown 10.1.0 + Rehype Highlight

#### 后端技术栈
- **运行时**: Node.js 22 (LTS 版本)
- **框架**: Express 4.21.2 (Web 服务器)
- **API 层**: tRPC 11.6.0 (类型安全的 RPC 框架)
- **ORM**: Drizzle ORM 0.44.5 (轻量级 TypeScript ORM)
- **认证**: Jose 6.1.0 (JWT 处理)
- **文件上传**: AWS SDK S3 (支持对象存储)

#### 基础设施
- **数据库**: MySQL 8.0 (关系型数据库)
- **容器化**: Docker + Docker Compose
- **Web 服务器**: Nginx (反向代理 + HTTPS)
- **SSL 证书**: Let's Encrypt (免费 HTTPS 证书)
- **包管理器**: pnpm 10.4.1 (快速、节省磁盘空间)

## 2. 系统架构 (System Architecture)

### 2.1 逻辑架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层 (Client)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  浏览器访客   │  │  管理员用户   │  │  移动端用户   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    接入层 (Gateway Layer)                     │
│                  Nginx (反向代理 + SSL 终止)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                   应用层 (Application Layer)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React SPA (Port 3000)                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  Pages   │  │Components│  │  Hooks   │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓ tRPC                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Express + tRPC Server (Port 3000)            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  Routers │  │   Auth   │  │  Cache   │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ SQL
┌─────────────────────────────────────────────────────────────┐
│                    数据层 (Data Layer)                        │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   MySQL 8.0         │  │   File Storage      │          │
│  │   (Port 3306)       │  │   (uploads/)        │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```bash
Person_Web/
├── client/                      # 前端项目根目录
│   ├── src/                     # 源代码目录
│   │   ├── pages/              # 页面组件
│   │   │   ├── Home.tsx        # 首页（文章列表）
│   │   │   ├── Article.tsx     # 文章详情页
│   │   │   ├── Write.tsx       # 文章编辑页（管理员）
│   │   │   ├── Category.tsx    # 分类页面
│   │   │   ├── Archive.tsx     # 归档页面
│   │   │   └── Docs.tsx        # 文档页面
│   │   ├── components/         # 公共组件
│   │   │   ├── ui/            # UI 基础组件（Radix UI）
│   │   │   ├── Header.tsx     # 页面头部
│   │   │   ├── Footer.tsx     # 页面底部
│   │   │   ├── MarkdownEditor.tsx  # Markdown 编辑器
│   │   │   └── ArticleCard.tsx     # 文章卡片
│   │   ├── lib/               # 工具函数
│   │   │   ├── trpc.ts        # tRPC 客户端配置
│   │   │   ├── utils.ts       # 通用工具函数
│   │   │   └── hooks.ts       # 自定义 Hooks
│   │   ├── App.tsx            # 应用根组件
│   │   └── main.tsx           # 应用入口
│   ├── public/                # 静态资源
│   └── index.html             # HTML 模板
│
├── server/                     # 后端项目根目录
│   ├── _core/                 # 核心功能模块
│   │   ├── index.ts          # 服务器入口
│   │   ├── trpc.ts           # tRPC 配置
│   │   ├── auth.ts           # 认证中间件
│   │   ├── cookies.ts        # Cookie 处理
│   │   ├── cache.ts          # 缓存管理
│   │   └── systemRouter.ts   # 系统路由
│   ├── routers.ts            # tRPC 路由定义
│   └── db.ts                 # 数据库操作层
│
├── drizzle/                   # 数据库相关
│   ├── schema.ts             # 数据库表结构定义
│   └── migrations/           # 数据库迁移文件
│
├── deploy/                    # 部署相关
│   ├── nginx/                # Nginx 配置文件
│   │   └── default.conf      # 默认配置模板
│   └── scripts/              # 部署脚本
│       ├── setup-server.sh   # 服务器环境配置
│       ├── setup-network.sh  # 网络环境配置（国内镜像）
│       ├── setup-env.sh      # 环境变量配置
│       ├── setup-domain.sh   # 域名配置
│       ├── setup-ssl.sh      # SSL 证书申请
│       └── deploy.sh         # 一键部署脚本
│
├── shared/                    # 前后端共享代码
│   └── const.ts              # 常量定义
│
├── uploads/                   # 上传文件目录
├── patches/                   # pnpm 补丁文件
│
├── .env.production           # 生产环境变量
├── docker-compose.yml        # Docker Compose 配置
├── Dockerfile                # Docker 镜像构建文件
├── vite.config.ts            # Vite 构建配置
├── package.json              # 项目依赖
├── pnpm-lock.yaml            # 依赖锁定文件
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 项目说明文档
```

### 2.3 数据流向

#### 2.3.1 用户访问流程（访客模式）

```
用户浏览器 → Nginx (HTTPS) → Express Server → tRPC Router
                                                    ↓
                                              publicProcedure
                                                    ↓
                                              Cache Check
                                                    ↓
                                         Cache Hit? → Yes → 返回缓存数据
                                                    ↓ No
                                              Database Query
                                                    ↓
                                              Store in Cache
                                                    ↓
                                              返回数据给前端
```

#### 2.3.2 管理员操作流程

```
管理员浏览器 → GitHub OAuth → 获取 Token → Cookie 存储
                                                    ↓
                                              后续请求携带 Cookie
                                                    ↓
                                              Auth Middleware 验证
                                                    ↓
                                              adminProcedure
                                                    ↓
                                              Database Operation
                                                    ↓
                                              Invalidate Cache
                                                    ↓
                                              返回操作结果
```

## 3. API 接口文档 (API Reference)

本项目使用 **tRPC** 作为 API 层，提供类型安全的端到端通信。所有 API 路由定义在 `server/routers.ts` 文件中。

### 3.1 认证模块 (Auth)

#### 3.1.1 获取当前用户信息
- **路由**: `auth.me`
- **类型**: Query (查询)
- **权限**: Public (公开访问)
- **请求参数**: 无
- **响应数据**:
  ```typescript
  {
    id: number;
    openId: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    role: "user" | "admin";
  } | null
  ```
- **说明**: 返回当前登录用户信息，未登录返回 null

#### 3.1.2 用户登出
- **路由**: `auth.logout`
- **类型**: Mutation (变更)
- **权限**: Public (公开访问)
- **请求参数**: 无
- **响应数据**:
  ```typescript
  { success: true }
  ```
- **说明**: 清除用户 Session Cookie，完成登出操作

### 3.2 文章模块 (Article)

#### 3.2.1 获取文章列表（公开）
- **路由**: `article.list`
- **类型**: Query
- **权限**: Public
- **缓存**: 5 分钟 TTL
- **请求参数**:
  ```typescript
  {
    limit?: number;        // 每页数量 (1-50，默认 10)
    page?: number;         // 页码 (默认 1)
    status?: "draft" | "published" | "archived";  // 状态筛选
    type?: "blog" | "doc"; // 类型筛选
    categorySlug?: string; // 分类筛选
    search?: string;       // 搜索关键词
  }
  ```
- **响应数据**:
  ```typescript
  {
    articles: Array<{
      id: number;
      title: string;
      slug: string;
      summary: string | null;
      coverImage: string | null;
      status: "draft" | "published" | "archived";
      type: "blog" | "doc";
      publishedAt: Date | null;
      createdAt: Date;
      author: { name: string; avatar: string };
      category: { name: string; slug: string } | null;
    }>;
    total: number;
    page: number;
    limit: number;
  }
  ```

#### 3.2.2 根据 Slug 获取文章详情（公开）
- **路由**: `article.bySlug`
- **类型**: Query
- **权限**: Public
- **请求参数**:
  ```typescript
  { slug: string }
  ```
- **响应数据**:
  ```typescript
  {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    content: string;
    coverImage: string | null;
    authorId: number;
    categoryId: number | null;
    status: "draft" | "published" | "archived";
    type: "blog" | "doc";
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }
  ```

#### 3.2.3 获取文章统计信息（公开）
- **路由**: `article.stats`
- **类型**: Query
- **权限**: Public
- **请求参数**: 无
- **响应数据**:
  ```typescript
  {
    totalArticles: number;
    totalCategories: number;
    totalDocs: number;
  }
  ```

#### 3.2.4 获取文章归档（公开）
- **路由**: `article.archive`
- **类型**: Query
- **权限**: Public
- **请求参数**: 无
- **响应数据**:
  ```typescript
  Array<{
    year: number;
    month: number;
    count: number;
    articles: Array<{
      id: number;
      title: string;
      slug: string;
      publishedAt: Date;
    }>;
  }>
  ```

#### 3.2.5 创建文章（管理员）
- **路由**: `article.create`
- **类型**: Mutation
- **权限**: Admin Only
- **请求参数**:
  ```typescript
  {
    title: string;              // 标题 (1-255 字符)
    slug: string;               // URL 别名 (1-255 字符)
    summary?: string;           // 摘要
    content: string;            // 内容 (Markdown)
    coverImage?: string;        // 封面图片 URL
    categoryId?: number;        // 分类 ID
    status?: "draft" | "published" | "archived";  // 状态 (默认 draft)
    type?: "blog" | "doc";      // 类型 (默认 blog)
    order?: number;             // 排序权重 (默认 0)
  }
  ```
- **响应数据**:
  ```typescript
  { id: number }
  ```
- **副作用**: 清除文章列表缓存

#### 3.2.6 更新文章（管理员）
- **路由**: `article.update`
- **类型**: Mutation
- **权限**: Admin Only
- **请求参数**:
  ```typescript
  {
    id: number;                 // 文章 ID
    title?: string;
    slug?: string;
    summary?: string;
    content?: string;
    coverImage?: string;
    categoryId?: number;
    status?: "draft" | "published" | "archived";
    type?: "blog" | "doc";
    order?: number;
  }
  ```
- **响应数据**:
  ```typescript
  { success: true }
  ```
- **副作用**: 清除文章列表缓存

#### 3.2.7 删除文章（管理员）
- **路由**: `article.delete`
- **类型**: Mutation
- **权限**: Admin Only
- **请求参数**:
  ```typescript
  { id: number }
  ```
- **响应数据**:
  ```typescript
  { success: true }
  ```
- **副作用**: 清除文章列表缓存

