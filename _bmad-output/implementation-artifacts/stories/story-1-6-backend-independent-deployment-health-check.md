---
storyId: '1-6'
epicId: 1
title: '后端独立部署与健康检查'
status: 'ready-for-dev'
priority: 'high'
storyPoints: 3
dependencies: ['1-1', '1-2', '1-3', '1-4', '1-5']
blockedBy: ['1-5']
blocks: []
created: '2026-03-21'
---

# Story 1.6: 后端独立部署与健康检查

## Story Description

**As a** 管理员,
**I want** 后端 API 通过进程管理器独立运行在云服务器上并提供健康检查端点,
**So that** 后端服务稳定运行且可被监控。

## Background & Context

### 当前状态（Story 1-5 完成后）

Story 1-1 ~ 1-5 已完成以下关键基础设施：
- PostgreSQL 数据库迁移完成（1-1 ~ 1-3）
- CORS 中间件 + Cookie 跨域配置完成（1-4）
- OAuth 跨域认证流程完成（1-5）
- 前后端分离架构已基本就绪

### 本 Story 需要解决的问题

后端 API 已完成代码层面的跨域分离，但缺少独立部署所需的运维基础设施：

1. **无进程管理**：当前仅通过 `node dist/index.js` 直接启动，无崩溃自动重启、内存限制等保障
2. **无 REST 健康检查端点**：现有 `systemRouter.health` 是 tRPC 端点，不适合外部监控工具（如 Nginx、云平台 health check）使用
3. **无 Nginx 反向代理参考配置**：`api.zhcmqtt.top` 需要路由到 `localhost:3000`
4. **安全中间件已存在但需验证**：Helmet.js 和 rate-limit 已配置，需确认配置符合生产要求

### 关键文件清单

| 文件 | 当前状态 | 需要修改/新建 |
|------|---------|-------------|
| `server/_core/index.ts` | 已有 helmet + rate-limit | 新增 `/health` 和 `/health/db` REST 端点 |
| `ecosystem.config.cjs` | 不存在 | 新建 PM2 配置文件 |
| `nginx/api.zhcmqtt.top.conf` | 不存在 | 新建 Nginx 反向代理参考配置 |
| `package.json` | 已有 `start` 脚本 | 新增 `pm2:start` / `pm2:stop` 等脚本 |
| `.env.production.example` | 已有部分配置 | 补充部署相关变量说明 |

### 架构参考

```
用户浏览器 (zhcmqtt.top)
    │
    ├── 静态资源 → Nginx 直接服务 (zhcmqtt.top)
    │
    └── API 请求 → Nginx 反向代理 (api.zhcmqtt.top)
                      │
                      ├── SSL 终止（宝塔面板管理证书）
                      │
                      └── proxy_pass http://localhost:3000
                            │
                            └── PM2 管理的 Node.js 进程
                                  ├── Express (helmet + rate-limit + CORS)
                                  ├── /health → 基础健康检查
                                  ├── /health/db → 数据库连接检查
                                  └── /api/trpc → tRPC API
```

## Acceptance Criteria

**Given** 后端构建产物为 `dist/index.js`
**When** 通过进程管理器启动后端服务
**Then:**

- [ ] **AC-1**: `ecosystem.config.cjs` 配置 fork 模式、`max_memory_restart: '400M'`
- [ ] **AC-2**: `GET /health` 返回 `{ status: 'ok', uptime: <seconds>, timestamp: <ISO string> }`
- [ ] **AC-3**: 可选 `GET /health/db` 验证数据库连接状态，返回 `{ status: 'ok'|'error', ... }`
- [ ] **AC-4**: Nginx 反向代理配置文件将 `api.zhcmqtt.top` 路由到 `localhost:3000`（参考配置，不实际部署）
- [ ] **AC-5**: SSL 证书由宝塔面板管理（配置文件中标注占位符）
- [ ] **AC-6**: 环境变量通过 `.env` 文件管理（PM2 配置中无硬编码秘密）
- [ ] **AC-7**: 安全中间件正常工作 — Helmet.js 已启用、速率限制 200 次/15 分钟

## Task Breakdown

### Task 1: 新增 REST 健康检查端点 `/health`

**文件**: `server/_core/index.ts`

**当前状态**: 无 REST `/health` 端点。现有 `systemRouter.health` 是 tRPC 端点，需要 tRPC 客户端调用，不适合外部监控。

**在 `app.use("/api/", apiLimiter)` 之前插入**:

```typescript
// Health check endpoints (before rate limiter, must be lightweight)
const startTime = Date.now();

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});
```

**关键点**:
- 放在 rate limiter 之前，避免健康检查被限流
- 放在 CORS 和 helmet 之后，确保安全头正确
- `uptime` 为进程启动后的秒数
- `timestamp` 为 ISO 8601 格式的当前时间
- 不依赖数据库或其他外部服务，保证始终可用

**验证**: `curl http://localhost:3000/health` 返回 200 + JSON body

---

### Task 2: 新增可选 REST 健康检查端点 `/health/db`

**文件**: `server/_core/index.ts`

**在 `/health` 端点之后插入**:

```typescript
app.get("/health/db", async (_req, res) => {
  try {
    const { getDb } = await import("../db");
    const db = await getDb();
    // 简单查询验证数据库连接
    await db.execute(sql`SELECT 1`);
    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: process.env.NODE_ENV === "production"
        ? "Database connection failed"
        : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});
```

**需要新增 import**（文件顶部）:

```typescript
import { sql } from "drizzle-orm";
```

**关键点**:
- 动态导入 `getDb` 避免循环依赖
- 使用 `SELECT 1` 最小化数据库负载
- 生产环境不暴露详细错误信息
- 数据库不可用时返回 503 状态码
- 同样放在 rate limiter 之前

**验证**: `curl http://localhost:3000/health/db` 返回 200（数据库正常）或 503（数据库异常）

---

### Task 3: 创建 PM2 配置文件 `ecosystem.config.cjs`

**文件**: `ecosystem.config.cjs`（项目根目录，新建）

```javascript
// PM2 生态系统配置文件
// 使用 .cjs 扩展名因为 package.json 声明了 "type": "module"
// 文档: https://pm2.keymetrics.io/docs/usage/application-declaration/
module.exports = {
  apps: [
    {
      name: "personal-blog-api",
      script: "dist/index.js",

      // 运行模式: fork（单实例，适合小型 VPS）
      exec_mode: "fork",
      instances: 1,

      // 内存限制：超过 400MB 自动重启
      max_memory_restart: "400M",

      // 环境变量从 .env 文件加载，PM2 配置中不硬编码秘密
      // 使用 dotenv/config 在应用启动时加载 .env
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // 日志配置
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // 自动重启策略
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,

      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
```

**关键点**:
- 使用 `.cjs` 扩展名，因为 `package.json` 中 `"type": "module"` 与 PM2 的 CommonJS 配置要求冲突
- `fork` 模式而非 `cluster` 模式，适合单核小型 VPS
- `max_memory_restart: '400M'` 防止内存泄漏导致服务器宕机
- 环境变量通过 `dotenv/config`（代码中已有 `import "dotenv/config"`）加载 `.env` 文件
- PM2 配置中只设置 `NODE_ENV` 和 `PORT`，不包含数据库密码等秘密
- 日志目录 `logs/` 需要预先创建

**验证**: `pm2 start ecosystem.config.cjs` 启动成功，`pm2 status` 显示进程运行中

---

### Task 4: 添加 `logs/` 目录和 `.gitignore`

**文件**: `logs/.gitkeep`（新建空文件）

**修改**: 项目根目录 `.gitignore` 添加：

```gitignore
# PM2 logs
logs/*.log
```

**关键点**:
- `logs/` 目录需要存在供 PM2 写入日志
- `.gitkeep` 确保目录被 Git 跟踪
- 日志文件本身不进入版本控制

---

### Task 5: 更新 `package.json` 添加 PM2 脚本

**文件**: `package.json`

**在 `scripts` 中新增**:

```json
{
  "scripts": {
    "pm2:start": "pm2 start ecosystem.config.cjs",
    "pm2:stop": "pm2 stop personal-blog-api",
    "pm2:restart": "pm2 restart personal-blog-api",
    "pm2:logs": "pm2 logs personal-blog-api",
    "pm2:status": "pm2 status"
  }
}
```

**关键点**:
- PM2 需要全局安装在服务器上：`npm install -g pm2`
- 保留原有 `"start": "cross-env NODE_ENV=production node dist/index.js"` 脚本，用于不依赖 PM2 的场景
- `pm2:start` 使用配置文件启动，包含所有运维参数

**验证**: `pnpm pm2:start` 成功启动服务

---

### Task 6: 创建 Nginx 反向代理参考配置

**文件**: `nginx/api.zhcmqtt.top.conf`（新建，仅作参考）

```nginx
# Nginx 反向代理配置 - api.zhcmqtt.top
# 此文件为参考配置，实际部署通过宝塔面板管理
# SSL 证书由宝塔面板自动申请和续期

server {
    listen 80;
    server_name api.zhcmqtt.top;

    # HTTP -> HTTPS 重定向
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.zhcmqtt.top;

    # SSL 证书路径（由宝塔面板管理，以下为占位符）
    # ssl_certificate     /www/server/panel/vhost/cert/api.zhcmqtt.top/fullchain.pem;
    # ssl_certificate_key /www/server/panel/vhost/cert/api.zhcmqtt.top/privkey.pem;
    # ssl_protocols       TLSv1.2 TLSv1.3;
    # ssl_ciphers         HIGH:!aNULL:!MD5;

    # 安全头（Helmet.js 在应用层已处理，Nginx 层可选）
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 请求体大小限制（与 Express 的 50mb 对齐）
    client_max_body_size 50m;

    # 健康检查端点（可选：Nginx 层面缓存或直通）
    location /health {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 健康检查不需要缓存
        proxy_no_cache 1;
        proxy_cache_bypass 1;
    }

    # API 路由 - 全部转发到 Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    access_log /www/wwwlogs/api.zhcmqtt.top.log;
    error_log /www/wwwlogs/api.zhcmqtt.top.error.log;
}
```

**关键点**:
- 此文件**仅作参考**，实际 Nginx 配置由宝塔面板管理
- SSL 证书路径为宝塔面板默认路径占位符
- `proxy_pass` 指向 `localhost:3000`（与 PM2 配置的 PORT 一致）
- `client_max_body_size 50m` 与 Express 的 `express.json({ limit: "50mb" })` 对齐
- WebSocket 支持（`Upgrade` + `Connection` 头）预留

**验证**: 配置语法正确（`nginx -t`），可被宝塔面板参考使用

---

### Task 7: 验证现有安全中间件配置

**文件**: `server/_core/index.ts`（验证，无需修改）

**Helmet.js 配置（第 45-47 行）**:

```typescript
app.use(helmet({
  contentSecurityPolicy: false, // CSP handled by Nginx in production
}));
```

**验证项**:
- [x] Helmet.js 已启用，`contentSecurityPolicy: false` 是合理的（CSP 由 Nginx 管理）
- [x] Helmet 默认启用 `X-DNS-Prefetch-Control`、`X-Frame-Options`、`X-Content-Type-Options` 等安全头

**Rate Limit 配置（第 108-114 行）**:

```typescript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 200,                  // 每 IP 最多 200 次请求
  standardHeaders: true,     // RateLimit-* 标准头
  legacyHeaders: false,      // 不发送 X-RateLimit-* 旧头
});
app.use("/api/", apiLimiter);
```

**验证项**:
- [x] 窗口期 15 分钟 ✓
- [x] 最大请求数 200 ✓
- [x] 使用标准 RateLimit 头 ✓
- [x] 仅限 `/api/` 路径（不影响 `/health` 端点） ✓

**结论**: 安全中间件已满足 AC-7 要求，无需修改。

---

### Task 8: 更新环境变量文档

**文件**: `.env.production.example`

**补充部署相关说明**:

```env
# --------------------------------------------
# 部署配置 (Deployment Configuration)
# --------------------------------------------
# Node.js 运行环境
NODE_ENV=production

# 后端服务端口（PM2 和 Nginx proxy_pass 需要一致）
PORT=3000

# --------------------------------------------
# 说明: PM2 + 环境变量
# --------------------------------------------
# PM2 通过 ecosystem.config.cjs 启动服务
# 敏感环境变量（DATABASE_URL, JWT_SECRET 等）通过 .env 文件管理
# 应用启动时 dotenv/config 自动加载 .env
# PM2 配置文件中不包含任何秘密信息
```

---

## Testing Requirements

### Unit Tests

#### Test 1: `/health` 端点测试

**文件**: `server/__tests__/health.test.ts`（新建）

```typescript
// 测试用例:
// 1. GET /health 返回 200 状态码
// 2. GET /health 返回 JSON 包含 status: "ok"
// 3. GET /health 返回 JSON 包含 uptime（number >= 0）
// 4. GET /health 返回 JSON 包含 timestamp（ISO 8601 格式）
// 5. GET /health 不受 rate limiter 影响（连续请求 201 次仍返回 200）
```

#### Test 2: `/health/db` 端点测试

**文件**: `server/__tests__/health-db.test.ts`（新建）

```typescript
// 测试用例:
// 1. GET /health/db 数据库正常时返回 200 + { status: "ok", database: "connected" }
// 2. GET /health/db 数据库异常时返回 503 + { status: "error", database: "disconnected" }
// 3. GET /health/db 生产环境不暴露详细错误信息
// 4. GET /health/db 开发环境返回详细错误信息
```

#### Test 3: PM2 配置文件验证测试

**文件**: `server/__tests__/ecosystem-config.test.ts`（新建）

```typescript
// 测试用例:
// 1. ecosystem.config.cjs 可被正确加载（require）
// 2. apps[0].exec_mode === "fork"
// 3. apps[0].max_memory_restart === "400M"
// 4. apps[0].script === "dist/index.js"
// 5. apps[0].env.NODE_ENV === "production"
// 6. 配置中不包含 DATABASE_URL、JWT_SECRET 等敏感信息
```

### Integration Tests

#### Test 4: 完整健康检查集成测试

**文件**: `server/__tests__/health-integration.test.ts`（新建）

```typescript
// 测试用例:
// 1. 启动 Express 应用 → GET /health 返回 200
// 2. 启动 Express 应用 → GET /health/db 返回 200（带真实数据库连接）
// 3. 断开数据库连接 → GET /health/db 返回 503
// 4. GET /health 响应时间 < 50ms（健康检查必须快速）
// 5. Helmet 安全头存在于 /health 响应中
```

### E2E Tests (Manual)

#### Test 5: PM2 部署验证

```
1. 构建项目: pnpm build
2. 启动 PM2: pnpm pm2:start
3. 验证:
   a. pm2 status 显示 personal-blog-api 状态为 online
   b. curl http://localhost:3000/health → { status: "ok", ... }
   c. curl http://localhost:3000/health/db → { status: "ok", database: "connected" }
   d. 查看内存: pm2 monit → 内存使用 < 400MB
   e. 模拟崩溃: pm2 stop/kill → 自动重启
   f. 查看日志: pnpm pm2:logs → 日志正常输出
4. 清理: pnpm pm2:stop
```

#### Test 6: Nginx 反向代理验证（部署后）

```
1. 将 nginx/api.zhcmqtt.top.conf 作为参考配置在宝塔面板中设置
2. 验证:
   a. curl https://api.zhcmqtt.top/health → 200 + JSON
   b. curl https://api.zhcmqtt.top/health/db → 200 + JSON
   c. curl http://api.zhcmqtt.top/health → 301 重定向到 HTTPS
   d. 安全头检查: curl -I https://api.zhcmqtt.top/health
      → X-Frame-Options, X-Content-Type-Options 等存在
   e. Rate limit 测试: 15 分钟内发送 201 次 /api/trpc 请求
      → 第 201 次返回 429 Too Many Requests
```

### Coverage Target

- `/health` 端点逻辑: 100%
- `/health/db` 端点逻辑（含错误分支）: 100%
- PM2 配置验证: 100%
- 整体新增代码覆盖率: >= 80%

## Implementation Notes

### 代码变更范围

| 变更类型 | 文件 | 改动量 |
|---------|------|--------|
| 修改 | `server/_core/index.ts` | +25 行（健康检查端点） |
| 新建 | `ecosystem.config.cjs` | ~45 行 |
| 新建 | `nginx/api.zhcmqtt.top.conf` | ~60 行（参考配置） |
| 修改 | `package.json` | +5 行（PM2 脚本） |
| 新建 | `logs/.gitkeep` | 0 行 |
| 修改 | `.gitignore` | +2 行 |
| 修改 | `.env.production.example` | +10 行 |

### 现有安全中间件分析

当前 `server/_core/index.ts` 中已配置：

| 中间件 | 配置 | 状态 |
|--------|------|------|
| `helmet()` | `contentSecurityPolicy: false` | ✅ 已满足要求 |
| `rateLimit()` | `200/15min`, `/api/` 路径 | ✅ 已满足要求 |
| `cors()` | 生产环境白名单 | ✅ Story 1-4 已完成 |
| `compression()` | 默认配置 | ✅ 已启用 |

### PM2 vs 直接运行

| 特性 | `node dist/index.js` | PM2 |
|------|----------------------|-----|
| 崩溃重启 | ❌ | ✅ 自动重启 |
| 内存监控 | ❌ | ✅ `max_memory_restart` |
| 日志管理 | stdout 丢失 | ✅ 持久化日志文件 |
| 进程守护 | ❌ SSH 断开即停止 | ✅ 后台运行 |
| 零停机重载 | ❌ | ✅ `pm2 reload` |

### 健康检查端点设计

| 端点 | 用途 | 依赖 | 建议检查频率 |
|------|------|------|------------|
| `GET /health` | 基础存活检测 | 无 | 每 10-30 秒 |
| `GET /health/db` | 数据库连接检测 | PostgreSQL | 每 60 秒 |

### 与宝塔面板的协作

- **SSL 证书**: 完全由宝塔面板管理（Let's Encrypt 自动续期）
- **Nginx 配置**: 宝塔面板生成基础配置，参考 `nginx/api.zhcmqtt.top.conf` 补充 `proxy_pass` 相关配置
- **PM2**: 独立于宝塔面板运行，通过 SSH 管理

### `.env` 文件管理策略

```
.env                      # 开发环境（Git 忽略）
.env.production           # 生产环境（部署到服务器，Git 忽略）
.env.production.example   # 生产环境模板（Git 跟踪）
```

PM2 配置中仅设置 `NODE_ENV` 和 `PORT`，所有敏感变量通过 `.env` 文件管理，由代码中的 `import "dotenv/config"` 自动加载。

## Dependencies & Risks

### Dependencies

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| Story 1-1 ~ 1-5 | 前置完成 | 数据库 + CORS + OAuth 已就绪 |
| PM2 | 需全局安装 | 服务器上 `npm install -g pm2` |
| 宝塔面板 | 已安装 | 管理 Nginx + SSL 证书 |
| 构建产物 `dist/index.js` | `pnpm build` 生成 | esbuild 打包 |

### Risks

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| PM2 与 ESM 兼容性问题 | 进程无法启动 | `ecosystem.config.cjs` 使用 CJS 格式；`dist/index.js` 由 esbuild 打包为 ESM |
| 内存 400M 限制过低 | 频繁重启 | 监控实际内存使用，必要时调整阈值 |
| `/health/db` 数据库查询开销 | 高频检查影响性能 | 使用 `SELECT 1` 最小查询；外部监控降低检查频率 |
| Nginx 配置与宝塔面板冲突 | 配置覆盖 | 参考配置仅作文档，不直接复制到宝塔 |
| `.env` 文件遗漏 | 服务启动失败 | `env.ts` 中对生产必需变量做启动检查 |

## Definition of Done

- [ ] `GET /health` 返回 `{ status: 'ok', uptime, timestamp }`（200）
- [ ] `GET /health/db` 正常时返回 200，异常时返回 503
- [ ] `/health` 端点不受 API rate limiter 限制
- [ ] `ecosystem.config.cjs` 配置 fork 模式、`max_memory_restart: '400M'`
- [ ] `package.json` 包含 `pm2:start` / `pm2:stop` 等脚本
- [ ] `nginx/api.zhcmqtt.top.conf` 参考配置文件已创建
- [ ] Nginx 配置中 SSL 证书路径标注为宝塔面板占位符
- [ ] PM2 配置中无硬编码秘密，环境变量通过 `.env` 管理
- [ ] Helmet.js 安全头已启用 ✅（已有）
- [ ] Rate limit 200 次/15 分钟已配置 ✅（已有）
- [ ] `logs/` 目录已创建并加入 `.gitignore`
- [ ] 单元测试覆盖率 >= 80%
- [ ] PM2 启动测试通过
- [ ] Code review 通过
