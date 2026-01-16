# 项目执行计划 (Execution Plan): Person_Web

> 生成时间: 2026-01-16
> 来源: Plan Generation Agent
> 基于文档: `spec.md` (2026-01-16)

## Phase 0: 基础设施与重构 (Infrastructure & Refactor) [已完成]

本阶段目标是为文档引擎准备必要的数据结构，并确保开发环境符合规范。

- [x] **Task 0.1: 基础设施检查与规则注入**
  - 检查 Node.js, pnpm 版本是否符合要求。
  - 确认 `.trae/rules` 下的规则文件已更新且生效。
  - 验证开发服务器 (`pnpm dev`) 启动无误。
  - **完成时间**: 2026-01-16
  - **执行结果**:
    - Node.js v22.14.0
    - pnpm 10.4.1
    - 规则文件完整性检查通过
    - 开发服务器启动成功（已修复 Windows 环境变量问题）

- [x] **Task 0.2: 数据库 Schema 升级**
  - 修改 `drizzle/schema.ts`，在 `articles` 表中添加 `order` 和 `type` 字段。
  - 修改 `drizzle/schema.ts`，在 `categories` 表中添加 `type` 字段。
  - 运行 `drizzle-kit generate` 生成迁移文件。
  - 更新 `server/routers.ts` 中的 Zod Schema 定义。
  - **完成时间**: 2026-01-16

- [x] **Task 0.3: [Audit] Phase 0 审计**
  - 呼叫 Build Plan Agent 检查数据库结构是否正确更新。

---

## Phase 1: 文档引擎核心 (Doc Engine Core) [已完成]

本阶段目标是交付类似 GitBook 的核心阅读体验和后台编辑能力。

- [x] **Task 1.1: 后端 - 文档数据层实现**
  - 实现 `getDocTree` 接口，支持按 `order` 字段排序。
  - 实现 `getCategory` 接口增强，支持按 `type` 筛选。
  - **完成时间**: 2026-01-16

- [x] **Task 1.2: 后台 - 编辑器升级 (Split View)**
  - 改造 `WriteArticle.tsx` 页面。
  - 集成 Markdown 分栏编辑器。
  - 实现 Markdown 粘贴自动格式化功能。
  - **完成时间**: 2026-01-16

- [x] **Task 1.3: 前端 - 文档阅读器开发**
  - 创建 `DocLayout.tsx` 三栏布局组件。
  - 集成 `rehype-highlight` 和 `rehype-slug`。
  - 实现目录展开/折叠和上一篇/下一篇导航。
  - **完成时间**: 2026-01-16

- [x] **Task 1.4: [Audit] Phase 1 审计**
  - 呼叫 Build Plan Agent 检查文档阅读体验和编辑器功能。

---

## Phase 2: 性能优化 (Performance Optimization)

本阶段重点针对 2C2G 环境进行资源优化。

- [ ] **Task 2.1: 后端 - LRU 内存缓存实现**
  - 引入 `lru-cache` 库。
  - 实现 tRPC 中间件，对高频读接口进行缓存。
  - 设置合理的 TTL (5分钟) 和 Max Size。
  - 验证缓存命中率和响应时间 (目标 TP99 < 200ms)。

- [ ] **Task 2.2: [Refactor] 技术债处理 - 本地图片清理**
  - 编写 Node.js 脚本，定期清理未引用的孤儿图片。
  - 设置 Cron Job 或定时任务触发该脚本。

---

## Phase 3: Docker 容器化部署 (Docker Containerization & Deployment)

本阶段目标是将项目打包为 Docker 容器，实现在华为云服务器 (zhcmqtt.top) 上的快速部署。

### 3.1 Dockerfile 编写

- [ ] **Task 3.1.1: 创建多阶段构建 Dockerfile**
  - 创建 `Dockerfile` 文件，采用多阶段构建策略。
  - **Stage 1 (deps)**: 安装生产依赖
    - 基础镜像: `node:22-alpine`
    - 复制 `package.json`, `pnpm-lock.yaml`
    - 运行 `pnpm install --frozen-lockfile --prod`
  - **Stage 2 (builder)**: 构建项目
    - 安装全部依赖 (包括 devDependencies)
    - 运行 `pnpm build` 构建前端和后端
  - **Stage 3 (runner)**: 运行时镜像
    - 仅复制 `dist/`, `node_modules/`, `drizzle/` 等必需文件
    - 设置 `NODE_ENV=production`
    - 暴露端口 `3000`
    - 启动命令: `node dist/index.js`
  - **预期产出**: `Dockerfile` 文件

- [ ] **Task 3.1.2: 创建 .dockerignore 文件**
  - 排除不需要复制到镜像的文件:
    - `node_modules/`, `.git/`, `*.md`, `.env`, `dist/`
  - **预期产出**: `.dockerignore` 文件

### 3.2 Docker Compose 配置

- [ ] **Task 3.2.1: 创建 docker-compose.yml**
  - 定义服务:
    - `app`: Node.js 应用容器 (端口 3000)
    - `mysql`: MySQL 8.0 数据库容器 (端口 3306)
  - 配置网络: 创建 `person_web_network` bridge 网络
  - 配置数据卷:
    - `mysql_data`: MySQL 数据持久化
    - `./uploads:/app/uploads`: 上传文件持久化
  - 配置资源限制 (适配 2C2G):
    - app: memory 512MB
    - mysql: memory 768MB
  - **预期产出**: `docker-compose.yml` 文件

- [ ] **Task 3.2.2: 创建生产环境变量模板**
  - 创建 `.env.production.example` 文件
  - 包含所有必需的环境变量:
    - `DATABASE_URL`, `NODE_ENV`, `JWT_SECRET`, `OWNER_OPEN_ID`
  - **预期产出**: `.env.production.example` 文件

### 3.3 Nginx 配置

- [ ] **Task 3.3.1: 创建 Nginx 配置文件**
  - 创建 `deploy/nginx/zhcmqtt.top.conf` 文件
  - 配置功能:
    - 域名绑定: `zhcmqtt.top` 和 `www.zhcmqtt.top`
    - HTTP 自动跳转 HTTPS (80 -> 443)
    - SSL 证书配置 (Let's Encrypt)
    - 反向代理到 `localhost:3000`
    - Gzip 压缩
    - 静态资源缓存策略 (JS/CSS/Images 1年)
    - 安全 Headers (X-Frame-Options, HSTS 等)
  - **预期产出**: `deploy/nginx/zhcmqtt.top.conf` 文件

- [ ] **Task 3.3.2: 创建 SSL 证书申请脚本**
  - 创建 `deploy/scripts/setup-ssl.sh` 脚本
  - 使用 Certbot 申请 Let's Encrypt 证书
  - 配置证书自动续期
  - **预期产出**: `deploy/scripts/setup-ssl.sh` 文件

### 3.4 部署脚本与文档

- [ ] **Task 3.4.1: 创建一键部署脚本**
  - 创建 `deploy/scripts/deploy.sh` 脚本
  - 功能:
    - 检查 Docker 和 Docker Compose 是否安装
    - 拉取最新代码或镜像
    - 停止旧容器
    - 启动新容器
    - 执行数据库迁移
    - 健康检查
  - **预期产出**: `deploy/scripts/deploy.sh` 文件

- [ ] **Task 3.4.2: 创建数据库迁移脚本**
  - 创建 `deploy/scripts/migrate.sh` 脚本
  - 在容器内执行 Drizzle 迁移
  - **预期产出**: `deploy/scripts/migrate.sh` 文件

- [ ] **Task 3.4.3: 编写部署文档**
  - 创建 `deploy/README.md` 文档
  - 内容:
    - 服务器环境要求
    - Docker 和 Docker Compose 安装步骤
    - Nginx 安装和配置步骤
    - SSL 证书申请步骤
    - 首次部署流程
    - 更新部署流程
    - 常见问题排查
  - **预期产出**: `deploy/README.md` 文件

### 3.5 测试与验证

- [ ] **Task 3.5.1: 本地 Docker 构建测试**
  - 执行 `docker build -t person-web:latest .`
  - 验证镜像构建成功
  - 验证镜像大小合理 (目标 < 500MB)

- [ ] **Task 3.5.2: 本地 Docker Compose 测试**
  - 执行 `docker-compose up -d`
  - 验证所有服务启动成功
  - 验证应用可正常访问
  - 验证数据库连接正常

- [ ] **Task 3.5.3: [Audit] Phase 3 审计**
  - 呼叫 Build Plan Agent 检查 Docker 配置是否符合最佳实践。
  - 检查安全配置是否完善。

---

## Phase 4: 华为云部署与上线 (Huawei Cloud Deployment)

本阶段目标是在华为云服务器上完成实际部署。

- [ ] **Task 4.1: 服务器环境准备**
  - 安装 Docker 和 Docker Compose
  - 安装 Nginx
  - 配置防火墙 (开放 80, 443 端口)
  - 配置域名解析 (zhcmqtt.top -> 服务器 IP)

- [ ] **Task 4.2: SSL 证书配置**
  - 使用 Certbot 申请 Let's Encrypt 证书
  - 配置 Nginx SSL
  - 验证 HTTPS 访问正常

- [ ] **Task 4.3: 应用部署**
  - 上传代码或镜像到服务器
  - 执行部署脚本
  - 验证应用运行正常

- [ ] **Task 4.4: [Perf-Check] 性能与资源检查**
  - 运行 Lighthouse 进行性能评分 (目标 > 90)
  - 监控服务器内存占用，确保无 OOM 风险
  - 验证域名访问正常 (zhcmqtt.top)

- [ ] **Task 4.5: [Audit] 最终交付审计**
  - 呼叫 Build Plan Agent 进行上线前的最终全量审计。
  - 检查项:
    - SSL Labs 评分 A 级
    - Lighthouse 评分 > 90
    - 20 并发下无错误

---

## 附加任务记录 (Additional Tasks)

### 本地开发环境 OAuth 配置 (2026-01-16) [已完成]

- [x] **Task: 修复本地 Mock OAuth 登录功能**
  - **问题描述**: 访问 `/app-auth` 路由时出现 404 错误
  - **完成时间**: 2026-01-16
  - **执行结果**:
    - 在 `server/_core/index.ts` 中注册 Mock OAuth 路由
    - 添加 `JWT_SECRET` 环境变量到 `.env` 文件
    - 修复 Cookie 配置 - 本地环境使用 `sameSite: "lax"`
    - 启动 MySQL 数据库容器并应用迁移
  - **测试 URL**: `http://localhost:3000/app-auth?redirectUri=http://localhost:3000/api/oauth/callback&state=123`
