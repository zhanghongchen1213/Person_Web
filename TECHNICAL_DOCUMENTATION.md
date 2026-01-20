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

### 3.3 分类模块 (Category)

#### 3.3.1 获取分类列表（公开）
- **路由**: `category.list`
- **类型**: Query
- **权限**: Public
- **缓存**: 10 分钟 TTL
- **请求参数**:
  ```typescript
  {
    type?: "blog" | "doc";  // 类型筛选
  }
  ```
- **响应数据**:
  ```typescript
  Array<{
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    sortOrder: number;
    type: "blog" | "doc";
    createdAt: Date;
  }>
  ```

#### 3.3.2 根据 Slug 获取分类详情（公开）
- **路由**: `category.bySlug`
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
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    sortOrder: number;
    type: "blog" | "doc";
  }
  ```

#### 3.3.3 创建分类（管理员）
- **路由**: `category.create`
- **类型**: Mutation
- **权限**: Admin Only
- **请求参数**:
  ```typescript
  {
    name: string;           // 分类名称 (1-100 字符)
    slug: string;           // URL 别名 (1-100 字符)
    description?: string;   // 描述
    icon?: string;          // 图标名称
    sortOrder?: number;     // 排序顺序
    type?: "blog" | "doc";  // 类型 (默认 blog)
  }
  ```
- **响应数据**:
  ```typescript
  { id: number }
  ```
- **副作用**: 清除分类列表缓存

#### 3.3.4 更新分类（管理员）
- **路由**: `category.update`
- **类型**: Mutation
- **权限**: Admin Only
- **请求参数**:
  ```typescript
  {
    id: number;
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
    type?: "blog" | "doc";
  }
  ```
- **响应数据**:
  ```typescript
  { success: true }
  ```
- **副作用**: 清除分类列表缓存

#### 3.3.5 删除分类（管理员）
- **路由**: `category.delete`
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
- **副作用**: 清除分类列表缓存

#### 3.3.6 查找或创建分类（管理员）
- **路由**: `category.findOrCreate`
- **类型**: Mutation
- **权限**: Admin Only
- **请求参数**:
  ```typescript
  {
    name: string;           // 分类名称
    type?: "blog" | "doc";  // 类型 (默认 blog)
  }
  ```
- **响应数据**:
  ```typescript
  {
    id: number;
    name: string;
    slug: string;
    type: "blog" | "doc";
  }
  ```
- **说明**: 如果分类已存在则返回现有分类，否则创建新分类（自动生成 slug）

### 3.4 文档模块 (Doc)

#### 3.4.1 获取文档树（公开）
- **路由**: `doc.tree`
- **类型**: Query
- **权限**: Public
- **缓存**: 10 分钟 TTL
- **请求参数**:
  ```typescript
  {
    categorySlug?: string;  // 可选：按分类筛选
  }
  ```
- **响应数据**:
  ```typescript
  Array<{
    category: {
      id: number;
      name: string;
      slug: string;
      icon: string | null;
    };
    articles: Array<{
      id: number;
      title: string;
      slug: string;
      order: number;
    }>;
  }>
  ```
- **说明**: 返回文档类型的分类及其文章，用于文档导航侧边栏

## 4. 数据库设计 (Database Schema)

### 4.1 实体关系图 (ER Diagram Description)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   users     │         │  articles   │         │ categories  │
│─────────────│         │─────────────│         │─────────────│
│ id (PK)     │────┐    │ id (PK)     │    ┌────│ id (PK)     │
│ openId      │    │    │ title       │    │    │ name        │
│ name        │    │    │ slug        │    │    │ slug        │
│ email       │    │    │ summary     │    │    │ description │
│ avatar      │    │    │ content     │    │    │ icon        │
│ role        │    │    │ coverImage  │    │    │ sortOrder   │
│ createdAt   │    │    │ authorId(FK)│────┘    │ type        │
│ updatedAt   │    └────│ categoryId  │─────────│ createdAt   │
└─────────────┘         │ status      │         └─────────────┘
                        │ type        │
                        │ order       │
                        │ publishedAt │
                        │ createdAt   │
                        │ updatedAt   │
                        └─────────────┘

关系说明:
- users 1:N articles (一个用户可以创建多篇文章)
- categories 1:N articles (一个分类可以包含多篇文章)
```

### 4.2 数据字典

#### 4.2.1 用户表 (users)

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|-------|------|------|--------|------|
| id | INT | PK, AI | - | 用户 ID |
| openId | VARCHAR(64) | NOT NULL, UNIQUE | - | 第三方登录唯一标识 (如 github:123456) |
| name | TEXT | NULL | - | 用户名 |
| email | VARCHAR(320) | NULL | - | 邮箱地址 |
| avatar | TEXT | NULL | - | 头像 URL |
| bio | TEXT | NULL | - | 个人简介 |
| loginMethod | VARCHAR(64) | NULL | - | 登录方式 (如 github) |
| role | ENUM | NOT NULL | user | 用户角色: user(普通用户), admin(管理员) |
| createdAt | TIMESTAMP | NOT NULL | NOW() | 创建时间 |
| updatedAt | TIMESTAMP | NOT NULL | NOW() | 更新时间 (自动更新) |
| lastSignedIn | TIMESTAMP | NOT NULL | NOW() | 最后登录时间 |

**索引**:
- PRIMARY KEY: id
- UNIQUE KEY: openId

**业务规则**:
- openId 格式: `{provider}:{userId}` (如 `github:12345678`)
- role 为 admin 的用户可以管理所有内容
- 首次登录时自动创建用户记录

#### 4.2.2 分类表 (categories)

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|-------|------|------|--------|------|
| id | INT | PK, AI | - | 分类 ID |
| name | VARCHAR(100) | NOT NULL, UNIQUE | - | 分类名称 |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | - | URL 别名 |
| description | TEXT | NULL | - | 分类描述 |
| icon | VARCHAR(50) | NULL | - | 图标名称 (用于前端展示) |
| sortOrder | INT | NOT NULL | 0 | 排序顺序 (数字越小越靠前) |
| type | ENUM | NOT NULL | blog | 分类类型: blog(博客), doc(文档) |
| createdAt | TIMESTAMP | NOT NULL | NOW() | 创建时间 |

**索引**:
- PRIMARY KEY: id
- UNIQUE KEY: name
- UNIQUE KEY: slug

**业务规则**:
- 预设分类: 嵌入式、ROS、深度学习、DIY、其他
- type 为 blog 的分类用于博客文章
- type 为 doc 的分类用于技术文档
- sortOrder 用于控制分类在前端的显示顺序

#### 4.2.3 文章表 (articles)

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|-------|------|------|--------|------|
| id | INT | PK, AI | - | 文章 ID |
| title | VARCHAR(255) | NOT NULL | - | 文章标题 |
| slug | VARCHAR(255) | NOT NULL, UNIQUE | - | URL 别名 |
| summary | TEXT | NULL | - | 文章摘要 |
| content | TEXT | NOT NULL | - | 文章内容 (Markdown 格式) |
| coverImage | TEXT | NULL | - | 封面图片 URL |
| authorId | INT | NOT NULL, FK | - | 作者 ID (关联 users.id) |
| categoryId | INT | NULL, FK | - | 分类 ID (关联 categories.id) |
| status | ENUM | NOT NULL | draft | 文章状态: draft(草稿), published(已发布), archived(已归档) |
| type | ENUM | NOT NULL | blog | 内容类型: blog(博客), doc(文档) |
| order | INT | NOT NULL | 0 | 排序权重 (用于文档排序，数字越小越靠前) |
| publishedAt | TIMESTAMP | NULL | - | 发布时间 |
| createdAt | TIMESTAMP | NOT NULL | NOW() | 创建时间 |
| updatedAt | TIMESTAMP | NOT NULL | NOW() | 更新时间 (自动更新) |

**索引**:
- PRIMARY KEY: id
- UNIQUE KEY: slug
- FOREIGN KEY: authorId REFERENCES users(id)
- FOREIGN KEY: categoryId REFERENCES categories(id)
- INDEX: status, type, publishedAt (用于列表查询优化)

**业务规则**:
- slug 必须全局唯一，用于 SEO 友好的 URL
- status 为 published 时，publishedAt 应该有值
- type 为 blog 时，按 publishedAt 倒序排列
- type 为 doc 时，按 order 正序排列
- 删除分类时，该分类下的文章 categoryId 设为 NULL

## 5. 核心业务流程 (Business Logic)

### 5.1 用户认证流程 (GitHub OAuth)

```
1. 用户点击"使用 GitHub 登录"
   ↓
2. 重定向到 GitHub OAuth 授权页面
   URL: https://github.com/login/oauth/authorize?client_id=xxx
   ↓
3. 用户授权后，GitHub 回调到应用
   Callback URL: /api/auth/github/callback?code=xxx
   ↓
4. 后端使用 code 换取 access_token
   POST https://github.com/login/oauth/access_token
   ↓
5. 使用 access_token 获取用户信息
   GET https://api.github.com/user
   ↓
6. 检查用户是否存在于数据库
   - 存在: 更新 lastSignedIn
   - 不存在: 创建新用户记录
   ↓
7. 检查用户是否为管理员
   - 如果 openId 匹配 OWNER_OPEN_ID，设置 role = admin
   ↓
8. 生成 JWT Token 并设置 Cookie
   Cookie Name: session
   HttpOnly: true
   Secure: true (生产环境)
   SameSite: Lax
   ↓
9. 重定向到首页，登录完成
```

### 5.2 文章发布流程

```
1. 管理员在编辑器中撰写文章
   - 填写标题、摘要、内容 (Markdown)
   - 选择分类 (可新建)
   - 上传封面图片 (可选)
   ↓
2. 点击"发布"按钮
   - 设置 status = published
   - 设置 publishedAt = 当前时间
   ↓
3. 调用 article.create 或 article.update API
   - 验证管理员权限
   - 验证数据格式 (Zod Schema)
   ↓
4. 写入数据库
   - 插入或更新 articles 表
   ↓
5. 清除缓存
   - 清除文章列表缓存
   - 清除分类缓存 (如果创建了新分类)
   ↓
6. 返回成功响应
   - 前端跳转到文章详情页
```

### 5.3 缓存策略

本项目使用内存缓存 (LRU Cache) 来优化数据库查询性能。

**缓存配置**:
- 文章列表缓存: TTL 5 分钟
- 分类列表缓存: TTL 10 分钟
- 文档树缓存: TTL 10 分钟

**缓存失效策略**:
- 创建/更新/删除文章时，清除所有文章列表缓存
- 创建/更新/删除分类时，清除所有分类缓存
- 缓存键格式: `article:list:{params}`, `category:list:{type}`, `doc:tree:{slug}`

**缓存优势**:
- 减少数据库查询压力
- 提升页面加载速度
- 适配 2C2G 低配服务器

## 6. 部署与运维 (Deployment)

### 6.1 环境变量配置

项目使用 `.env.production` 文件管理生产环境配置。

**必需环境变量**:

```env
# 数据库配置
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=personal_blog
DATABASE_URL=mysql://root:password@mysql:3306/personal_blog?charset=utf8mb4

# JWT 密钥
JWT_SECRET=your_jwt_secret_key

# GitHub OAuth 配置
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback

# 管理员配置
OWNER_OPEN_ID=github:your_github_user_id
```

**可选环境变量**:

```env
# Node.js 环境
NODE_ENV=production

# 服务器端口
PORT=3000

# AWS S3 配置 (如需使用对象存储)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

### 6.2 Docker 容器化部署

#### 6.2.1 Docker Compose 配置

项目使用 Docker Compose 编排两个服务：

**服务列表**:
- `mysql`: MySQL 8.0 数据库服务
- `app`: Node.js 应用服务

**资源限制** (针对 2C2G 服务器优化):
- MySQL 容器: 768MB 内存, 1 CPU
- App 容器: 512MB 内存, 1 CPU

**网络配置**:
- 自定义桥接网络: `person_web_network`
- 容器间通信: 通过服务名访问 (如 `mysql:3306`)

**数据持久化**:
- MySQL 数据: Docker Volume `person_web_mysql_data`
- 上传文件: 宿主机目录 `./uploads` 挂载到容器 `/app/uploads`

#### 6.2.2 多阶段构建优化

Dockerfile 采用多阶段构建策略，优化镜像大小和构建效率：

**Stage 1: Builder (构建阶段)**
- 基础镜像: `node:22-alpine`
- 安装所有依赖 (包括 devDependencies)
- 构建前端和后端代码
- 内存限制: `--max-old-space-size=1024` (适配 2GB 内存服务器)

**Stage 2: Runner (运行阶段)**
- 基础镜像: `node:22-alpine`
- 仅安装生产依赖 (`--prod`)
- 从 Builder 阶段复制构建产物
- 最终镜像大小: ~300MB

**构建优化**:
- 禁用 source map 生成
- 禁用 gzip 大小计算
- 手动代码分割 (react-vendor, radix-ui)
- 使用 pnpm 减少依赖安装时间

### 6.3 一键部署脚本

项目提供了完整的一键部署脚本，位于 `deploy/scripts/` 目录。

#### 6.3.1 部署脚本列表

| 脚本名称 | 功能说明 | 执行时机 |
|---------|---------|---------|
| `setup-network.sh` | 配置国内镜像源 (APT, Docker, npm) | 首次部署前 |
| `setup-server.sh` | 安装 Docker, Nginx, 配置防火墙 | 首次部署前 |
| `setup-env.sh` | 交互式配置环境变量 | 首次部署前 |
| `setup-domain.sh` | 配置域名 (替换配置文件中的域名) | 可选 |
| `setup-ssl.sh` | 申请 Let's Encrypt SSL 证书 | 可选 |
| `deploy.sh` | 一键部署应用 (构建镜像、启动容器) | 每次部署 |

#### 6.3.2 部署流程

```bash
# 1. 配置网络环境 (国内服务器必须)
sudo bash deploy/scripts/setup-network.sh

# 2. 配置服务器环境
sudo bash deploy/scripts/setup-server.sh

# 3. 配置环境变量
sudo bash deploy/scripts/setup-env.sh

# 4. 一键部署应用
sudo bash deploy/scripts/deploy.sh

# 5. (可选) 配置域名和 HTTPS
sudo bash deploy/scripts/setup-domain.sh yourdomain.com
sudo bash deploy/scripts/setup-ssl.sh yourdomain.com your@email.com
```

### 6.4 Nginx 反向代理配置

#### 6.4.1 基本配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # 反向代理到应用容器
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.5 常用运维命令

#### 6.5.1 容器管理

```bash
# 查看容器状态
docker compose ps

# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 重启应用容器
docker compose restart app

# 重启数据库容器
docker compose restart mysql

# 查看应用日志
docker compose logs -f app

# 查看数据库日志
docker compose logs -f mysql

# 进入应用容器
docker exec -it person_web_app sh

# 进入数据库容器
docker exec -it person_web_mysql mysql -uroot -p
```

#### 6.5.2 数据库备份与恢复

```bash
# 备份数据库
docker exec person_web_mysql mysqldump -uroot -p你的密码 personal_blog > backup-$(date +%Y%m%d).sql

# 压缩备份文件
gzip backup-$(date +%Y%m%d).sql

# 恢复数据库
gunzip backup-20260120.sql.gz
docker exec -i person_web_mysql mysql -uroot -p你的密码 personal_blog < backup-20260120.sql
```

#### 6.5.3 Nginx 管理

```bash
# 测试 Nginx 配置
sudo nginx -t

# 重载 Nginx 配置
sudo systemctl reload nginx

# 重启 Nginx
sudo systemctl restart nginx

# 查看 Nginx 状态
sudo systemctl status nginx

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

## 7. 性能优化 (Performance Optimization)

### 7.1 前端优化

**代码分割**:
- React Vendor 包: 独立打包 React 核心库
- Radix UI 包: 独立打包 UI 组件库
- 按需加载: 使用动态 import 延迟加载非关键组件

**构建优化**:
- 禁用 source map (生产环境)
- 使用 esbuild 压缩 (比 terser 快 10-100 倍)
- 禁用 gzip 大小计算 (减少构建内存占用)

**运行时优化**:
- TanStack Query 缓存服务端数据
- React 19 自动批处理更新
- 虚拟滚动 (长列表场景)

### 7.2 后端优化

**数据库查询优化**:
- 使用索引加速查询 (slug, status, type)
- 避免 N+1 查询 (使用 JOIN)
- 分页查询限制单页数量 (最大 50 条)

**缓存策略**:
- 内存缓存热点数据 (文章列表、分类列表)
- 缓存失效机制 (写操作时清除相关缓存)
- TTL 设置: 5-10 分钟

**资源限制**:
- Node.js 堆内存限制: 1GB
- 容器内存限制: 512MB (应用), 768MB (数据库)
- CPU 限制: 1 核心 (应用), 1 核心 (数据库)

### 7.3 2C2G 服务器优化建议

**内存优化**:
- 启用 Swap 交换空间 (2GB)
- 构建前停止 MySQL 容器释放内存
- 使用 Alpine Linux 基础镜像 (体积小)

**构建优化**:
- 使用国内镜像源加速依赖下载
- 启用 Docker 构建缓存
- 分阶段构建减少最终镜像大小

**运行优化**:
- 限制容器资源使用
- 使用健康检查自动重启异常容器
- 定期清理 Docker 缓存和日志

## 8. 安全性 (Security)

### 8.1 认证与授权

**认证机制**:
- GitHub OAuth 2.0 第三方登录
- JWT Token 存储在 HttpOnly Cookie 中
- Token 过期时间: 7 天

**授权机制**:
- 基于角色的访问控制 (RBAC)
- 角色类型: user (普通用户), admin (管理员)
- 管理员通过 OWNER_OPEN_ID 环境变量配置

**安全措施**:
- Cookie 设置 HttpOnly 防止 XSS 攻击
- Cookie 设置 Secure (HTTPS 环境)
- Cookie 设置 SameSite=Lax 防止 CSRF 攻击
- 密码和密钥使用环境变量管理，不提交到代码仓库

### 8.2 数据安全

**数据库安全**:
- MySQL root 密码使用强密码 (32 位随机字符)
- 数据库仅在 Docker 内部网络访问
- 定期备份数据库 (建议每周一次)

**文件上传安全**:
- 限制上传文件类型 (图片、文档)
- 限制上传文件大小 (最大 10MB)
- 文件存储在独立目录 (uploads/)

**HTTPS 加密**:
- 使用 Let's Encrypt 免费 SSL 证书
- 强制 HTTP 重定向到 HTTPS
- 证书自动续期 (每 90 天)

## 9. 附录 (Appendix)

### 9.1 技术栈版本清单

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 22 | LTS 版本 |
| React | 19.2.1 | 最新稳定版 |
| TypeScript | 5.9.3 | 类型系统 |
| Vite | 7.1.7 | 构建工具 |
| Express | 4.21.2 | Web 框架 |
| tRPC | 11.6.0 | API 框架 |
| Drizzle ORM | 0.44.5 | 数据库 ORM |
| MySQL | 8.0 | 数据库 |
| TailwindCSS | 4.1.14 | CSS 框架 |
| Docker | Latest | 容器化 |
| Nginx | Latest | Web 服务器 |

### 9.2 常见问题 (FAQ)

**Q1: 如何添加新的管理员用户？**

A: 在 `.env.production` 文件中修改 `OWNER_OPEN_ID`，支持多个用户（逗号分隔）：
```env
OWNER_OPEN_ID=github:12345678,github:87654321
```

**Q2: 如何修改数据库密码？**

A:
1. 修改 `.env.production` 中的 `MYSQL_ROOT_PASSWORD`
2. 重新部署: `docker compose down && docker compose up -d`

**Q3: 如何迁移到新服务器？**

A:
1. 备份数据库和 uploads 目录
2. 在新服务器上部署应用
3. 恢复数据库和文件

**Q4: 如何自定义博客样式？**

A: 修改 TailwindCSS 配置文件和组件样式：
- 全局样式: `client/src/index.css`
- 组件样式: `client/src/components/`
- TailwindCSS 配置: `tailwind.config.js`

**Q5: 如何启用 S3 对象存储？**

A: 在 `.env.production` 中配置 AWS S3 参数：
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket
```

### 9.3 参考资源

**官方文档**:
- React 19: https://react.dev/
- tRPC: https://trpc.io/
- Drizzle ORM: https://orm.drizzle.team/
- TailwindCSS: https://tailwindcss.com/
- Docker: https://docs.docker.com/
- Nginx: https://nginx.org/en/docs/

**项目仓库**:
- GitHub: https://github.com/zhanghongchen1213/Person_Web

**技术支持**:
- 提交 Issue: https://github.com/zhanghongchen1213/Person_Web/issues
- 部署文档: README.md

---

## 文档信息

**文档版本**: v1.0.0
**最后更新**: 2026-01-20
**适用项目版本**: Person_Web v1.0.0
**维护者**: Person_Web 开发团队

**更新日志**:
- 2026-01-20: 初始版本发布，包含完整的技术架构、API 文档、数据库设计和部署指南

---

## 总结

本文档详细介绍了 Person_Web 个人博客系统的技术架构、API 接口、数据库设计、部署流程和运维指南。

**核心特性**:
- ✅ 全栈 TypeScript 开发，类型安全
- ✅ tRPC 提供端到端类型安全的 API
- ✅ Docker 容器化部署，一键启动
- ✅ GitHub OAuth 安全认证
- ✅ 内存缓存优化性能
- ✅ 适配 2C2G 低配服务器
- ✅ 完整的部署脚本和文档

**技术亮点**:
- React 19 + Vite 7 最新技术栈
- tRPC 11 类型安全的 RPC 框架
- Drizzle ORM 轻量级数据库操作
- TailwindCSS 4 原子化 CSS
- Docker 多阶段构建优化
- Nginx 反向代理 + HTTPS

**适用场景**:
- 个人技术博客
- 团队知识库
- 开源项目文档站
- 技术文章分享平台

祝你使用愉快！🎉
