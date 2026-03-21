---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - 'docs/CodeArts.md'
workflowType: 'architecture'
project_name: 'Person_Web'
user_name: 'Administrator'
date: '2026-03-21'
lastStep: 8
status: 'complete'
completedAt: '2026-03-21'
updatedAt: '2026-03-21'
updateReason: 'PRD 新增 CI/CD 流水线为 MVP 需求（FR40-FR49、NFR29-NFR36），补充 CodeArts Pipeline 架构决策'
---

# Architecture Decision Document — Person_Web

_Author: Administrator | Date: 2026-03-21_

## Project Context Analysis

### Requirements Overview

**Functional Requirements（49 项 FR）**，分为 8 大类：

- **内容管理**（FR1-FR8）：文章 CRUD、分类管理、自动分类创建
- **内容消费**（FR9-FR15）：分页列表、slug 详情、归档视图、分类统计、相关推荐、文档树导航、全文搜索（tsvector）
- **认证与授权**（FR16-FR21）：GitHub OAuth 跨域回调、JWT Cookie 根域共享、角色区分、OWNER_OPEN_ID 管理员识别
- **分析与监控**（FR22-FR25）：页面浏览记录、分析概览、时间范围每日统计、文章级浏览统计
- **数据管理**（FR26-FR30）：JSON 导入导出、数据库统计、自动备份配置与执行
- **SEO 与发现**（FR31-FR34）：XML sitemap、robots.txt、Open Graph meta 注入、RSS/Atom
- **部署与运维**（FR35-FR39）：OBS 静态部署、PM2 进程管理、CORS 跨域、Nginx 反代、健康检查
- **CI/CD 自动化**（FR40-FR49）：代码推送触发流水线、自动测试、前端构建上传 OBS、CDN 刷新、SSH 部署后端、数据库迁移、健康检查、部署通知、8 阶段串行编排

**Non-Functional Requirements（36 项 NFR）**，驱动架构决策的关键项：

| 类别 | 关键指标 |
|------|---------|
| 性能 | 首屏 < 2s（CDN）、API P95 < 200ms、搜索 < 300ms、内存 < 400MB |
| 安全 | HttpOnly+Secure Cookie、HTTPS、速率限制 200/15min、Helmet.js、DB SSL、流水线凭据管理（NFR35） |
| 可扩展 | 100 并发、连接池 10 连接、CDN 无限分发、PM2 cluster 预留 |
| 可靠性 | 99% 可用性、自动重启、自动备份、零数据丢失迁移、流水线部署 < 10min（NFR29）、成功率 > 95%（NFR30）、阶段失败中止（NFR31）、迁移幂等（NFR32） |
| 集成 | tRPC httpBatchLink+superjson、GitHub OAuth 2.0、PostgreSQL 协议、S3 兼容 API、CodeArts Webhook 触发（NFR33）、SSH 部署（NFR34） |

### Scale & Complexity

- **主要领域**：全栈 Web App（SPA + API 后端），Brownfield 重构
- **复杂度级别**：Medium — 数据库迁移（MySQL→PostgreSQL）+ 架构拆分（单体→前后端分离）+ 跨域认证
- **预估架构组件**：~9 个（前端 SPA、API 服务、ORM 层、认证模块、缓存层、搜索引擎、CDN 分发、数据库服务、CI/CD 流水线）

### Technical Constraints & Dependencies

| 约束 | 架构影响 |
|------|---------|
| 2C2G 服务器资源限制 | 内存预算严格 < 400MB，服务器不运行数据库，仅 API 服务 |
| MemfireDB 免费额度（最大 10 连接） | 连接池严格控制，需要连接复用和缓存策略减少 DB 请求 |
| 华为云 OBS+CDN 静态部署 | 前端无 SSR 能力，SEO 需后端 API 辅助（爬虫检测+meta 注入） |
| 宝塔面板管理服务器 | Nginx 和 SSL 通过面板 UI 配置，非 IaC 自动化 |
| 保留现有技术栈（React 19 + tRPC + Drizzle ORM） | 仅切换 Drizzle 方言（mysql→pg），不做框架替换 |
| `.zhcmqtt.top` 根域 Cookie 共享 | 前端域名和 API 子域名必须在同一根域下 |
| 单人开发（Administrator） | 架构方案需简洁可维护，避免过度设计 |

### Cross-Cutting Concerns

1. **跨域通信**：前端（`zhcmqtt.top`）↔ API（`api.zhcmqtt.top`）的 CORS + Cookie 共享，贯穿认证、数据获取、SEO 所有模块
2. **数据库方言迁移**：Drizzle ORM MySQL→PostgreSQL 影响所有数据访问层（schema 定义、查询语法、搜索实现、备份恢复）
3. **缓存策略**：LRU 内存缓存需统一失效机制，涉及文章列表（5min TTL）、分类（10min TTL）、分析（1min TTL）
4. **错误处理与监控**：PM2 进程管理 + 慢查询日志（>500ms）+ 健康检查端点，需统一错误边界
5. **多端扩展预留**：API 设计需考虑未来小程序/APP 接入，认证系统需预留 UnionID 扩展点
6. **CI/CD 流水线**：CodeArts Pipeline 编排 8 阶段自动化部署，涉及前端 OBS 上传、CDN 刷新、后端 SSH 部署、数据库迁移、健康检查

## Starter Template Evaluation

### Primary Technology Domain

全栈 Web App（SPA + API 后端）— Brownfield 重构项目，已有完整代码库。

### Starter Options Considered

本项目为 **Brownfield 重构**，不适用从零初始化的 starter 模板。现有代码库已经包含完整的技术栈和项目结构，重构的本质是：
1. 数据库方言从 MySQL 切换到 PostgreSQL
2. 部署架构从 Docker 单体拆分为前后端分离
3. 保持所有现有功能和代码结构不变

### Selected Approach: 基于现有代码库重构（非 Starter 模板）

**选择理由：**
- 项目已有成熟的代码库、完整的功能实现和经过验证的技术栈
- 使用 starter 模板意味着放弃所有现有代码，完全不合理
- 重构范围明确：数据库迁移 + 部署架构调整，代码变更最小化

### 现有技术栈确认（已验证版本）

**Language & Runtime:**
- TypeScript 5.9.3 — 严格类型检查，端到端类型安全
- Node.js（ESM 模块，`"type": "module"`）
- pnpm 10.4.1 包管理器

**Frontend:**
- React 19.2.1 — SPA 架构
- Vite 7.1.7 — 构建工具，开发服务器 HMR
- wouter 3.3.5 — 客户端路由（轻量级 React Router 替代）
- TanStack React Query 5.90.2 — 服务端状态管理
- TailwindCSS 4.1.14 — 原子化 CSS
- Radix UI — 无障碍 UI 原语组件库
- Framer Motion 12.23.22 — 动画库
- React Hook Form 7.64.0 + Zod 4.1.12 — 表单验证
- Recharts 2.15.2 — 数据可视化图表
- react-markdown 10.1.0 + rehype-highlight — Markdown 渲染

**Backend:**
- Express 4.21.2 — HTTP 服务器
- tRPC 11.6.0 — 端到端类型安全 API 层
- superjson 1.13.3 — Date/BigInt 等类型序列化
- Drizzle ORM 0.44.5 — 类型安全 ORM（**当前 MySQL 方言，需迁移至 PostgreSQL**）
- mysql2 3.15.0 — **需替换为 postgres 驱动**
- jose 6.1.0 — JWT 令牌处理
- helmet 8.1.0 — HTTP 安全头
- express-rate-limit 8.2.1 — 速率限制
- node-cron 4.2.1 — 定时任务（自动备份）
- compression 1.8.1 — gzip 压缩

**Storage & Integration:**
- @aws-sdk/client-s3 + s3-request-presigner — 华为云 OBS（S3 兼容 API）图片存储

**Build & Dev Tooling:**
- esbuild — 后端构建打包
- Vitest 2.1.4 — 单元测试
- ESLint 10 + Prettier 3.6.2 — 代码质量
- tsx — 开发环境 TypeScript 运行

**Note:** 重构的第一个实施步骤应当是 Drizzle schema 方言迁移（MySQL→PostgreSQL），然后替换数据库驱动（mysql2→postgres）。

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. 数据库驱动替换：mysql2 → postgres (node-postgres)
2. Drizzle ORM schema 方言迁移：drizzle-orm/mysql-core → drizzle-orm/pg-core
3. CORS 跨域配置策略
4. Cookie 认证跨域共享方案
5. 前端 API 基地址切换
6. CI/CD 流水线架构（CodeArts Pipeline 8 阶段编排）

**Important Decisions (Shape Architecture):**
1. 全文搜索迁移方案：MySQL ngram → PostgreSQL tsvector
2. 数据导入导出适配（MySQL 原始 SQL → PostgreSQL 兼容）
3. 部署自动化脚本设计（deploy_backend.sh、migrate_db.sh）

**Deferred Decisions (Post-MVP):**
1. 微信 UnionID 统一鉴权架构
2. PM2 cluster 模式水平扩展

### Data Architecture

**ADR-01: 数据库从 MySQL 8.0 迁移至 MemfireDB（PostgreSQL 兼容）**

- **决策**: 使用 MemfireDB 作为托管 PostgreSQL 服务
- **驱动**: `postgres`（node-postgres 的现代替代，更轻量）
- **连接方式**: Drizzle ORM `drizzle-orm/node-postgres` + `pg` 驱动
- **连接池**: `pg.Pool`，最大连接数 10（MemfireDB 免费额度限制）
- **SSL**: 必须开启（远程数据库连接）
- **理由**: MemfireDB 提供免费 PostgreSQL 托管，消除云服务器数据库运维负担，释放内存给 API 服务
- **影响**: drizzle/schema.ts、server/db.ts、drizzle.config.ts、所有原始 SQL 查询

**ADR-02: Drizzle Schema 方言迁移映射**

| MySQL (当前) | PostgreSQL (目标) |
|-------------|------------------|
| `mysqlTable` | `pgTable` |
| `int().autoincrement().primaryKey()` | `serial().primaryKey()` |
| `mysqlEnum("role", [...])` | `pgEnum("role", [...])` |
| `varchar("col", { length: N })` | `varchar("col", { length: N })` （保持不变） |
| `text("col")` | `text("col")` （保持不变） |
| `timestamp("col").defaultNow()` | `timestamp("col").defaultNow()` （保持不变） |
| `timestamp().onUpdateNow()` | 移除（PostgreSQL 无原生支持，需应用层处理 updatedAt） |
| `int("enabled").default(0)` | `boolean("enabled").default(false)` |
| `drizzle-orm/mysql2` | `drizzle-orm/node-postgres` |

**关键迁移点：**
- `onUpdateNow()` 无 PostgreSQL 原生等价物 → 在应用层（db.ts 的 update 函数中）手动设置 `updatedAt: new Date()`
- `onDuplicateKeyUpdate` → `onConflictDoUpdate`（PostgreSQL upsert 语法）
- `insertId` → 使用 `.returning({ id: table.id })` 获取插入 ID
- `int("enabled")` 布尔模拟 → 改用 `boolean` 类型
- pgEnum 需要单独在 schema 文件顶部定义

**ADR-03: 缓存策略（保留现有 LRU 缓存）**

- **决策**: 保留现有 `LRUCache` 实现，不引入外部缓存（Redis 等）
- **容量**: 100 条目（当前设定，适合低流量博客）
- **TTL 策略**: 文章列表 5min、分类 10min、分析 1min、sitemap 10min
- **失效机制**: 写操作后调用 `invalidateArticleCache()` / `invalidateCategoryCache()` 清除相关缓存
- **理由**: 2C2G 服务器内存有限，LRU 缓存内存占用极低且无外部依赖

**ADR-04: 全文搜索迁移（MySQL ngram → PostgreSQL tsvector）**

- **决策**: 使用 PostgreSQL 原生 tsvector + to_tsvector/to_tsquery 实现中文全文搜索
- **分词配置**: 使用 `simple` 配置（因 MemfireDB 可能不支持 zhparser 扩展），配合 LIKE 模糊搜索兜底
- **降级策略**: 如果 tsvector 搜索返回 0 结果，自动降级为 `ILIKE '%keyword%'` 模糊搜索（与当前 MySQL LIKE 降级逻辑一致）
- **索引**: 在 articles 表创建 GIN 索引 `CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('simple', title || ' ' || content))`
- **影响**: server/db.ts 中的 `getArticles()` 搜索逻辑、`ensureFulltextIndex()` 函数

**ADR-05: 数据迁移方案**

- **决策**: 通过 JSON 导出/导入进行数据迁移
- **步骤**:
  1. 旧系统通过 /admin/database 导出全部数据为 JSON
  2. 新系统使用适配后的 `importAllData()` 函数导入
  3. 导入后校验行数一致性
- **日期处理**: `toMySQLDatetime()` 函数改为 `toPostgresTimestamp()`，直接使用 ISO 字符串（PostgreSQL 原生支持）
- **事务**: 使用 Drizzle ORM 事务替代原始 SQL 事务（`db.transaction()`）

### Authentication & Security

**ADR-06: 跨域 OAuth 认证方案**

- **决策**: GitHub OAuth 回调指向 `api.zhcmqtt.top`，认证完成后重定向到 `zhcmqtt.top`
- **Cookie 配置变更**:
  - `domain`: 设置为 `.zhcmqtt.top`（根域，前端和 API 共享）
  - `sameSite`: 从 `lax` 改为 `none`（跨子域名需要）
  - `secure`: 必须为 `true`（SameSite=None 要求 HTTPS）
  - `httpOnly`: 保持 `true`
- **回调 URL**: `GITHUB_CALLBACK_URL` 从 `http://localhost:3000/api/auth/github/callback` 改为 `https://api.zhcmqtt.top/api/auth/github/callback`
- **登录后重定向**: 从 `res.redirect(302, "/")` 改为 `res.redirect(302, "https://zhcmqtt.top/")`
- **影响**: server/_core/cookies.ts、server/_core/github-oauth.ts

**ADR-07: 安全中间件配置**

- **Helmet.js**: 保持现有配置，`contentSecurityPolicy: false`（Nginx 层配置 CSP）
- **速率限制**: 保持 200 请求/15 分钟（express-rate-limit）
- **CORS 配置**: 新增 Express CORS 中间件
  ```
  origin: ['https://zhcmqtt.top']
  credentials: true
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  allowedHeaders: ['Content-Type', 'Authorization']
  ```
- **数据库 SSL**: MemfireDB 连接必须开启 SSL（`ssl: { rejectUnauthorized: false }`）

### API & Communication Patterns

**ADR-08: 前端 API 基地址切换**

- **决策**: 前端 tRPC client 的 httpBatchLink URL 从相对路径改为绝对路径
- **变更**: `url: '/api/trpc'` → `url: 'https://api.zhcmqtt.top/api/trpc'`
- **环境变量**: 通过 `VITE_API_BASE_URL` 配置，开发环境使用 `http://localhost:3000`，生产环境使用 `https://api.zhcmqtt.top`
- **影响**: 前端 tRPC client 配置文件

**ADR-09: tRPC API 架构（保持不变）**

- **协议**: tRPC over HTTP（httpBatchLink），JSON + superjson 序列化
- **权限模型**: publicProcedure / protectedProcedure / adminProcedure（三级权限，保持现有）
- **路由结构**: 保持现有 routers.ts 中的路由定义
- **错误处理**: tRPC 内置错误类型（TRPCError），保持现有模式

**ADR-10: 后端不再托管前端静态文件**

- **决策**: 移除 Express 静态文件托管和 Vite 开发服务器集成
- **变更**:
  - 生产模式移除 `serveStatic(app)` 调用
  - 开发模式保留 `setupVite()` 用于本地开发（前后端同一进程运行）
  - 新增 CORS 中间件替代同源策略
- **影响**: server/_core/index.ts、server/_core/vite.ts

### Frontend Architecture

**ADR-11: 前端构建与部署（OBS + CDN）**

- **构建**: `vite build` 输出到 `dist/client/`（或 `dist/public/`）
- **部署**: 使用华为云 obsutil CLI 上传构建产物到 OBS bucket
- **CDN**: 华为云 CDN 加速，源站指向 OBS bucket
- **域名**: `zhcmqtt.top` 绑定 CDN，HTTPS 证书由 CDN 管理
- **SPA 路由**: OBS 配置 404 规则指向 `index.html`（SPA 客户端路由降级）
- **缓存策略**: HTML 文件 no-cache，JS/CSS/图片 长期缓存（文件名含 hash）

**ADR-12: 前端状态管理（保持不变）**

- **服务端状态**: TanStack React Query（tRPC 集成）
- **客户端状态**: React useState/useReducer（无全局状态管理库）
- **路由**: wouter 客户端路由

### Infrastructure & Deployment

**ADR-13: 服务器部署架构**

```
                    ┌─────────────────────┐
                    │   华为云 CDN         │
   zhcmqtt.top ───→│   (静态资源加速)      │
                    │   源站: OBS Bucket   │
                    └─────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │   2C2G 云服务器（宝塔面板管理）            │
                    │                                         │
api.zhcmqtt.top ──→│   Nginx (反向代理 + SSL)                 │
                    │     ↓                                   │
                    │   Node.js (PM2 管理)                     │
                    │     ├── Express + tRPC API               │
                    │     ├── LRU 缓存                         │
                    │     ├── 定时备份（node-cron）              │
                    │     └── SEO 中间件（爬虫检测）             │
                    └─────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │   MemfireDB          │
                    │   (PostgreSQL 兼容)   │
                    │   SSL 加密连接        │
                    └─────────────────────┘
```

**ADR-14: PM2 配置**

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'person-web-api',
    script: 'dist/index.js',
    node_args: '--experimental-specifier-resolution=node',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '400M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true,
    time: true,
  }]
};
```

**ADR-15: Nginx 反向代理配置（宝塔面板）**

```nginx
server {
    listen 443 ssl;
    server_name api.zhcmqtt.top;

    # SSL 证书由宝塔面板管理
    ssl_certificate    /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**ADR-16: 环境变量分离**

| 变量 | 用途 | 部署位置 |
|------|------|---------|
| `DATABASE_URL` | MemfireDB 连接串（含 SSL） | 服务器 .env |
| `JWT_SECRET` | JWT 签名密钥 | 服务器 .env |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | 服务器 .env |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | 服务器 .env |
| `GITHUB_CALLBACK_URL` | `https://api.zhcmqtt.top/api/auth/github/callback` | 服务器 .env |
| `OWNER_OPEN_ID` | 管理员 GitHub OpenID | 服务器 .env |
| `VITE_API_BASE_URL` | API 基地址（前端使用） | 前端构建时注入 |
| `VITE_APP_ID` | 应用标识 | 前端构建时注入 |

**ADR-17: 健康检查端点**

- **路由**: `GET /health`
- **响应**: `{ status: 'ok', uptime: process.uptime(), timestamp: Date.now() }`
- **用途**: 宝塔面板监控 + PM2 健康检查 + CI/CD 流水线部署验证
- **数据库检查**: 可选的 `GET /health/db` 端点执行简单查询验证数据库连接

### CI/CD Pipeline Architecture

**ADR-18: CodeArts Pipeline 自动化部署流水线（MVP）**

- **决策**: 使用华为云 CodeArts Pipeline 实现「平台编排 + 代码脚本」联合自动化部署
- **参考文档**: `docs/CodeArts.md`
- **触发方式**: 代码推送到 CodeArts Repo 主分支后自动触发（Webhook）
- **目标**: 从推送到部署完成 < 10 分钟（NFR29）
- **理由**: PRD 将 CI/CD 纳入 MVP 范围，消除手动部署的 30 分钟耗时
- **覆盖需求**: FR40-FR49、NFR29-NFR36

**流水线 8 阶段编排（串行执行，任一阶段失败则中止后续）：**

```
┌─────────────┐   ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐
│ 1. 代码检查  │──→│ 2. 前端构建  │──→│ 3. 后端构建+测试  │──→│ 4. 上传前端到OBS │
│ (lint/format)│   │ pnpm build  │   │ build + vitest   │   │ dist/** → 桶根目录│
└─────────────┘   └─────────────┘   └──────────────────┘   └─────────────────┘
                                                                    │
┌─────────────┐   ┌──────────────┐   ┌───────────────────┐   ┌─────┴───────────┐
│ 8. 健康检查  │←──│ 7. DB 迁移   │←──│ 6. SSH 部署后端    │←──│ 5. 刷新 CDN 缓存 │
│ curl /health│   │ drizzle migrate│  │ deploy_backend.sh │   │ zhcmqtt.top/    │
└─────────────┘   └──────────────┘   └───────────────────┘   └─────────────────┘
```

**各阶段职责划分：**

| 阶段 | 平台侧（CodeArts） | 代码仓库侧 |
|------|-------------------|-----------|
| 1. 代码检查 | 触发构建任务 | `pnpm run lint && pnpm run check` |
| 2. 前端构建 | 执行构建命令 | `pnpm install && pnpm run build`（Vite 输出 dist/） |
| 3. 后端构建+测试 | 执行构建命令 | `pnpm install && pnpm run build && pnpm run test` |
| 4. 上传 OBS | Build「上传文件到 OBS」步骤 | 构建产物路径 `dist/**` |
| 5. 刷新 CDN | 调用华为云 CDN 刷新 API | 刷新 URL `https://zhcmqtt.top/` |
| 6. 部署后端 | SSH 连接宝塔服务器 | `scripts/deploy_backend.sh`（git pull → pnpm ci → build → PM2 restart） |
| 7. DB 迁移 | SSH 执行迁移脚本 | `scripts/migrate_db.sh`（`drizzle-kit migrate`，幂等执行） |
| 8. 健康检查 | `curl https://api.zhcmqtt.top/health` | `/health` 端点返回 200 |

**ADR-19: 部署脚本设计**

**`scripts/deploy_backend.sh`（服务器上执行）：**
```bash
#!/usr/bin/env bash
set -e
APP_DIR=/www/wwwroot/person-web-api
cd "$APP_DIR"
git pull origin main
pnpm install --frozen-lockfile
pnpm run build
pm2 restart person-web-api || pm2 start dist/index.js --name person-web-api
pm2 save
```

**`scripts/migrate_db.sh`（服务器上执行）：**
```bash
#!/usr/bin/env bash
set -e
APP_DIR=/www/wwwroot/person-web-api
cd "$APP_DIR"
export DATABASE_URL="${DATABASE_URL}"
npx drizzle-kit migrate
```

- **幂等性要求**: Drizzle Kit migrate 基于迁移文件状态表，重复执行不产生副作用（NFR32）
- **渐进上线**: 先跑通最小链路（前端 OBS + 后端部署），确认稳定后再启用自动数据库迁移阶段（NFR36）

**ADR-20: CI/CD 凭据管理**

| 凭据 | 用途 | 存储位置 |
|------|------|---------|
| SSH 私钥 | 连接宝塔服务器 | CodeArts 凭据管理 |
| OBS AK/SK | 上传前端构建产物 | CodeArts 参数管理 |
| CDN 鉴权信息 | 刷新 CDN 缓存 | CodeArts 参数管理 |
| DATABASE_URL | 数据库迁移连接串 | CodeArts 凭据管理 |
| 服务器 IP | SSH 连接目标 | CodeArts 参数管理 |

- **安全要求**: 所有机密信息通过 CodeArts 参数/凭据管理，不写入代码仓库（NFR35）
- **SSH 白名单**: 服务器 SSH 需预先配置 CodeArts 执行机 IP 段

**ADR-21: 流水线失败处理策略**

- **阶段失败中止**: 任一阶段失败，后续阶段不执行，线上保持上一次成功部署状态（NFR31）
- **通知**: 流水线完成后发送部署结果通知（成功/失败）（FR46）
- **回滚**: 初期不实现自动回滚，失败后手动排查；后续可增强为自动回滚到上一稳定版本
- **常见故障排查**:
  - 前端 403/AccessDenied → 检查 OBS 桶策略（公共读）+ CDN 回源配置
  - 后端 502 → 检查 PM2 进程存活 + Nginx 反代端口
  - SSH 连接失败 → 检查服务器 SSH 白名单是否包含 CodeArts 执行机 IP
  - DB 迁移失败 → 检查 DATABASE_URL + 确保迁移脚本幂等

### Decision Impact Analysis

**Implementation Sequence:**

1. **Drizzle Schema 迁移** — 修改 drizzle/schema.ts（MySQL→PostgreSQL 类型映射）
2. **数据库驱动替换** — 修改 server/db.ts（mysql2→pg，连接池配置）
3. **Drizzle Config 更新** — 修改 drizzle.config.ts（dialect: "postgresql"）
4. **查询语法适配** — 修改 server/db.ts 中的原始 SQL 查询（DATE_FORMAT→to_char 等）
5. **全文搜索迁移** — 替换 ngram FULLTEXT 为 tsvector GIN 索引
6. **认证跨域适配** — 修改 cookies.ts、github-oauth.ts（Cookie 域、重定向 URL）
7. **CORS 中间件添加** — 修改 server/_core/index.ts
8. **前端 API 基地址** — 修改 tRPC client 配置
9. **构建脚本分离** — 添加 OBS 上传脚本
10. **PM2 + Nginx 配置** — 添加 ecosystem.config.cjs、宝塔面板配置
11. **数据迁移** — 旧系统 JSON 导出 → 新系统导入
12. **功能验收** — 逐项验证所有 FR1-FR39
13. **CI/CD 流水线配置** — CodeArts Pipeline 8 阶段编排 [新增]
14. **部署脚本编写** — scripts/deploy_backend.sh + scripts/migrate_db.sh [新增]
15. **流水线验证** — 端到端测试流水线触发→部署→健康检查 [新增]

**Cross-Component Dependencies:**

- Schema 迁移（1）必须在驱动替换（2）之前完成
- 驱动替换（2）必须在查询适配（4）之前完成
- 认证适配（6）和 CORS（7）可以并行进行
- 数据迁移（11）必须在所有代码变更完成后进行
- CI/CD 配置（13-15）在手动部署验证（12）完成后进行，确保最小链路已跑通

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming Conventions:**
- 表名：snake_case 复数（`users`, `articles`, `categories`, `page_views`, `backup_settings`）— 保持现有命名
- 列名：camelCase（`openId`, `authorId`, `categoryId`, `createdAt`）— 保持现有命名（Drizzle ORM 映射）
- pgEnum 定义：camelCase 函数名（`roleEnum`, `statusEnum`, `contentTypeEnum`）
- 索引：`idx_{table}_{column}` 格式

**API Naming Conventions:**
- tRPC 路由：camelCase 动词+名词（`article.list`, `article.bySlug`, `category.create`）— 保持现有
- REST 端点（OAuth 等）：kebab-case（`/api/auth/github/login`, `/api/auth/github/callback`）

**Code Naming Conventions:**
- 文件名：camelCase（`github-oauth.ts`, `backup-scheduler.ts`）— 保持现有 kebab-case
- React 组件文件：PascalCase（`ArticleList.tsx`）
- 函数名：camelCase（`getArticles`, `upsertUser`）
- 常量：UPPER_SNAKE_CASE（`COOKIE_NAME`, `ONE_YEAR_MS`）

### Structure Patterns

**项目组织（保持现有结构，最小化变更）：**
- `client/src/` — React SPA 前端代码
- `server/` — Express + tRPC 后端代码
- `server/_core/` — 核心基础设施模块
- `shared/` — 前后端共享类型和常量
- `drizzle/` — ORM schema 和迁移文件

**测试组织：**
- 测试文件与源文件同目录（co-located）：`*.test.ts`
- 测试运行器：Vitest

### Format Patterns

**API Response Format:**
- tRPC 自动处理响应封装，不需要手动 wrapper
- 错误通过 `TRPCError` 抛出，包含 `code` 和 `message`
- 日期通过 superjson 序列化（自动处理 Date 对象）

**数据库查询模式：**
- 批量获取避免 N+1（现有 `batchFetchArticleRelations` 模式保持）
- 计数查询使用 `sql<number>\`count(*)\``
- 分页使用 `limit` + `offset`

### Process Patterns

**错误处理：**
- 数据库不可用时返回空结果（不抛异常）— 保持现有 `if (!db) return []` 模式
- 写操作数据库不可用时抛出 `Error("Database not available")`
- OAuth 错误返回 HTTP 错误响应并记录日志

**缓存失效：**
- 文章写操作后调用 `invalidateArticleCache()`
- 分类写操作后调用 `invalidateCategoryCache()`
- 缓存 key 生成使用 `generate*Key()` 工具函数

### Enforcement Guidelines

**All AI Agents MUST:**
- 使用 Drizzle ORM 进行所有数据库操作，禁止原始 SQL（除全文搜索和数据迁移外）
- 在写操作后主动调用缓存失效函数
- 新增 API 端点遵循现有 tRPC 权限三级模型
- 数据库查询使用批量获取模式避免 N+1
- 新增环境变量必须在 server/_core/env.ts 中注册

## Project Structure & Boundaries

### Complete Project Directory Structure（重构后）

```
Person_Web/
├── package.json                    # pnpm 项目配置
├── tsconfig.json                   # TypeScript 配置
├── vite.config.ts                  # Vite 前端构建配置
├── drizzle.config.ts               # Drizzle Kit 配置（dialect: "postgresql"）
├── ecosystem.config.cjs            # PM2 部署配置 [新增]
├── .env                            # 本地开发环境变量
├── .env.production                 # 生产环境变量模板 [新增]
├── scripts/
│   ├── deploy-obs.sh               # 前端 OBS 上传脚本 [新增]
│   ├── deploy_backend.sh           # 后端部署脚本（CI/CD 流水线调用）[新增]
│   ├── migrate_db.sh               # 数据库迁移脚本（CI/CD 流水线调用）[新增]
│   └── migrate-data.ts             # 一次性数据迁移脚本（MySQL→PostgreSQL）[新增]
│
├── client/src/                     # React SPA 前端
│   ├── components/                 # UI 组件
│   ├── hooks/                      # 自定义 React Hooks
│   ├── lib/                        # 工具库（tRPC client 配置在此）
│   ├── pages/                      # 页面组件
│   └── main.tsx                    # 应用入口
│
├── server/                         # Express + tRPC 后端
│   ├── _core/
│   │   ├── index.ts                # 服务器入口 [修改：新增 CORS、健康检查]
│   │   ├── cache.ts                # LRU 缓存 [保持不变]
│   │   ├── context.ts              # tRPC 上下文
│   │   ├── cookies.ts              # Cookie 配置 [修改：跨域 Cookie]
│   │   ├── env.ts                  # 环境变量 [修改：新增 VITE_API_BASE_URL]
│   │   ├── github-oauth.ts         # GitHub OAuth [修改：跨域回调+重定向]
│   │   ├── oauth.ts                # OAuth 工具
│   │   ├── seo.ts                  # SEO 爬虫中间件
│   │   ├── sitemap.ts              # Sitemap 生成
│   │   ├── trpc.ts                 # tRPC 初始化
│   │   ├── backup-scheduler.ts     # 自动备份调度
│   │   └── vite.ts                 # Vite 开发服务器集成（仅开发模式）
│   ├── db.ts                       # 数据库层 [重大修改：MySQL→PostgreSQL]
│   ├── routers.ts                  # tRPC 路由定义
│   ├── performance.ts              # 性能监控
│   └── storage.ts                  # S3/OBS 存储
│
├── shared/                         # 前后端共享
│   └── const.ts                    # 共享常量
│
├── drizzle/
│   ├── schema.ts                   # ORM Schema [重大修改：MySQL→PostgreSQL 类型]
│   └── migrations/                 # 数据库迁移文件
│
└── dist/                           # 构建产物
    └── index.js                    # 后端构建产物（esbuild）
```

### Architectural Boundaries

**API Boundaries:**
- 外部：`api.zhcmqtt.top` — 所有 HTTP 请求入口（Nginx 反代）
- tRPC 层：`/api/trpc` — 类型安全 RPC 调用（公开/认证/管理员三级）
- REST 层：`/api/auth/*` — OAuth 认证端点
- 工具层：`/sitemap.xml`, `/robots.txt`, `/health` — 辅助端点

**Component Boundaries:**
- 前端完全通过 tRPC httpBatchLink 与后端通信，无直接数据库访问
- 后端所有数据库操作封装在 server/db.ts，路由层不直接访问数据库
- 缓存操作通过 server/_core/cache.ts 的工具函数，路由层使用 key 生成器

**Data Boundaries:**
- 数据库连接池：server/db.ts 的 `getDb()` 单例
- 缓存层：server/_core/cache.ts 的 `appCache` 全局实例
- 外部存储：server/storage.ts 的 S3 客户端

### Data Flow

```
浏览器 → CDN (zhcmqtt.top)
  ↓ tRPC 请求
API 服务器 (api.zhcmqtt.top)
  ↓ Nginx 反代
Express + tRPC
  ↓ 检查缓存
LRU Cache (命中则直接返回)
  ↓ 缓存未命中
Drizzle ORM
  ↓ SQL over SSL
MemfireDB (PostgreSQL)
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Drizzle ORM 0.44.5 原生支持 PostgreSQL 方言，与 MemfireDB 兼容
- tRPC 11.6.0 + Express 4.21.2 + CORS 中间件组合成熟
- PM2 fork 模式与 Node.js ESM 模块兼容
- 华为云 OBS S3 兼容 API 与 @aws-sdk/client-s3 兼容

**Pattern Consistency:**
- 所有数据库操作集中在 db.ts，迁移影响范围可控
- 缓存失效模式与现有代码一致
- 认证 Cookie 方案从 `lax` 升级为 `none` + `secure`，语义清晰

**Structure Alignment:**
- 项目结构保持不变，仅修改文件内容和新增部署脚本
- 前后端分离通过 CORS + 独立部署实现，代码层面变更最小

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
- FR1-FR8（内容管理）：db.ts 数据库操作适配 PostgreSQL ✅
- FR9-FR15（内容消费）：tsvector 全文搜索替代 ngram ✅
- FR16-FR21（认证授权）：跨域 Cookie + OAuth 回调适配 ✅
- FR22-FR25（分析监控）：SQL 日期函数适配（DATE_FORMAT→to_char） ✅
- FR26-FR30（数据管理）：导入导出适配 PostgreSQL 事务 ✅
- FR31-FR34（SEO）：sitemap/robots.txt/meta 注入保持不变 ✅
- FR35-FR39（部署运维）：PM2 + Nginx + OBS + 健康检查 ✅
- FR40-FR49（CI/CD 自动化）：CodeArts Pipeline 8 阶段编排 + 部署脚本 + 凭据管理 ✅

**Non-Functional Requirements Coverage:**
- NFR1-5（性能）：CDN 加速 + LRU 缓存 + 内存限制 ✅
- NFR6-11（安全）：Cookie 安全属性 + HTTPS + 速率限制 + DB SSL ✅
- NFR12-15（可扩展）：CDN 分发 + 连接池 + PM2 cluster 预留 ✅
- NFR16-19（可靠性）：自动重启 + 备份 + 零数据丢失 ✅
- NFR20-24（集成）：tRPC + OAuth + PostgreSQL + S3 ✅
- NFR25-28（无障碍）：WCAG 2.1 AA 标准 ✅
- NFR29-36（CI/CD）：部署 < 10min + 成功率 > 95% + 阶段失败中止 + 迁移幂等 + 凭据管理 ✅

### Implementation Readiness Validation ✅

**Decision Completeness:**
- 所有关键技术决策已文档化，包含版本号
- Drizzle schema 迁移映射表明确到字段级别
- 跨域认证方案详细到 Cookie 属性配置

**Structure Completeness:**
- 项目目录结构明确标注了每个文件的修改类型（保持/修改/新增）
- 新增文件（ecosystem.config.cjs、deploy-obs.sh、migrate-data.ts）已规划

**Pattern Completeness:**
- 命名、结构、格式、流程模式均已定义
- AI Agent 强制规则清晰明确

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] 项目上下文深度分析
- [x] 规模与复杂度评估
- [x] 技术约束识别
- [x] 跨切面关注点映射

**✅ Architectural Decisions**
- [x] 21 项 ADR 决策文档化（含版本号，ADR-18~21 为 CI/CD）
- [x] 技术栈完整指定
- [x] 集成模式定义
- [x] 性能考量已覆盖

**✅ Implementation Patterns**
- [x] 命名约定建立
- [x] 结构模式定义
- [x] 通信模式指定
- [x] 流程模式文档化

**✅ Project Structure**
- [x] 完整目录结构定义
- [x] 组件边界建立
- [x] 集成点映射
- [x] 需求到结构的映射完成

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — 基于现有代码库深度分析，所有决策均有明确的代码对应关系

**Key Strengths:**
- 最小化变更策略：保持现有代码结构，仅修改数据库层和部署配置
- 详细的 Schema 迁移映射：MySQL→PostgreSQL 字段级对照表
- 完整的跨域认证方案：Cookie 属性、OAuth 回调、重定向全链路覆盖
- 降级策略：全文搜索有 LIKE 兜底，数据库不可用有空结果返回

**Areas for Future Enhancement:**
- 微信 UnionID 统一鉴权（Post-MVP Phase 2）
- PM2 cluster 模式水平扩展（流量增长后）
- 独立 PostgreSQL 数据库（脱离 MemfireDB 免费额度限制）
- CI/CD 自动回滚能力（当前仅中止，后续增强为自动回滚到上一稳定版本）

### Implementation Handoff

**AI Agent Guidelines:**

- 严格按照 ADR 决策执行，不做额外架构变更
- 数据库操作使用 Drizzle ORM，参照 ADR-02 迁移映射表
- Cookie 配置参照 ADR-06，确保 `domain: '.zhcmqtt.top'`
- 新增文件遵循现有命名和组织模式
- 部署脚本遵循 ADR-19 规范，确保幂等性
- CI/CD 凭据通过 CodeArts 平台管理，不写入代码仓库
- 按照 Implementation Sequence 顺序执行，尊重依赖关系（CI/CD 在手动部署验证之后）

**First Implementation Priority:**
1. `drizzle/schema.ts` — Drizzle Schema MySQL→PostgreSQL 方言迁移
2. `server/db.ts` — 数据库驱动替换和查询语法适配
3. `drizzle.config.ts` — Drizzle Kit 配置更新
