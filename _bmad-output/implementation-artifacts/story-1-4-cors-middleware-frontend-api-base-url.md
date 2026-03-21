---
storyId: '1-4'
epicId: 1
title: 'CORS 跨域中间件与前端 API 基地址配置'
status: 'ready-for-dev'
priority: 'high'
storyPoints: 3
dependencies: ['1-1', '1-2', '1-3']
blockedBy: ['1-3']
blocks: []
created: '2026-03-21'
---

# Story 1.4: CORS 跨域中间件与前端 API 基地址配置

## Story Description

**As a** 用户,
**I want** 前端可从不同域名（zhcmqtt.top）安全访问后端 API（api.zhcmqtt.top）,
**So that** 前后端分离架构下的跨域通信正常工作。

## Background & Context

### 当前架构（单体部署）

当前项目采用单体部署模式：前端和后端由同一个 Express 服务器托管（端口 3000），Nginx 反向代理 `zhcmqtt.top` 到 `localhost:3000`。

- 前端 tRPC client 使用**相对路径** `url: "/api/trpc"`（无跨域问题）
- Express 服务器在生产模式下通过 `serveStatic()` 托管前端静态文件
- 没有 CORS 中间件（同源不需要）
- Cookie `sameSite: "lax"` 在同源下正常工作

### 目标架构（前后端分离）

前后端分离部署：
- **前端**: `zhcmqtt.top` — 由 Nginx 直接服务静态文件（或 CDN）
- **后端**: `api.zhcmqtt.top` — Express API 服务器
- 跨域请求需要 CORS 中间件
- Cookie 跨域传输需要 `sameSite: "none"` + `secure: true`

### 关键文件清单

| 文件 | 当前状态 | 需要修改 |
|------|---------|---------|
| `server/_core/index.ts` | 无 CORS 配置 | 添加 CORS 中间件 |
| `client/src/main.tsx` | `url: "/api/trpc"` (相对路径) | 使用 `VITE_API_BASE_URL` 环境变量 |
| `client/src/lib/trpc.ts` | 仅导出 tRPC hooks | 无需修改 |
| `server/_core/vite.ts` | `serveStatic()` 用于生产模式 | 生产模式移除静态文件托管 |
| `server/_core/cookies.ts` | `sameSite: "lax"` | 跨域时改为 `sameSite: "none"` + `secure: true` |
| `.env` | 无 `VITE_API_BASE_URL` | 添加开发环境变量 |
| `.env.production` | 无 `VITE_API_BASE_URL` | 添加生产环境变量 |
| `.env.production.example` | 无 `VITE_API_BASE_URL` | 添加模板 |
| `deploy/nginx/zhcmqtt.top-https.conf` | 仅 zhcmqtt.top | 添加 api.zhcmqtt.top server block |
| `package.json` | 无 cors 依赖 | 添加 `cors` 包 |

## Acceptance Criteria

**Given** 前端部署在 zhcmqtt.top，后端部署在 api.zhcmqtt.top
**When** 前端发起 API 请求
**Then:**

- [ ] **AC-1**: Express CORS 中间件允许 `origin: ['https://zhcmqtt.top']`，`credentials: true`
- [ ] **AC-2**: 前端 tRPC client `httpBatchLink` URL 使用 `VITE_API_BASE_URL` 环境变量
- [ ] **AC-3**: 生产环境 `VITE_API_BASE_URL` 设为 `https://api.zhcmqtt.top/api/trpc`
- [ ] **AC-4**: 开发环境 `VITE_API_BASE_URL` 保持 `http://localhost:3000/api/trpc`
- [ ] **AC-5**: 浏览器预检请求（OPTIONS）正确响应 CORS 头
- [ ] **AC-6**: 移除 Express 静态文件托管（生产模式），开发模式保留 Vite 集成

## Task Breakdown

### Task 1: 安装 cors 依赖

**文件**: `package.json`

```bash
pnpm add cors
pnpm add -D @types/cors
```

**验证**: `package.json` 中出现 `cors` 依赖项

---

### Task 2: 添加 CORS 中间件到 Express

**文件**: `server/_core/index.ts`

**修改位置**: `startServer()` 函数内，`app.use(helmet(...))` 之后，其他中间件之前

**新增代码逻辑**:

```typescript
import cors from "cors";

// 在 startServer() 中，helmet 之后添加:
const allowedOrigins = process.env.NODE_ENV === "production"
  ? ["https://zhcmqtt.top", "https://www.zhcmqtt.top"]
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
```

**关键点**:
- `credentials: true` 允许跨域发送 Cookie
- `origin` 使用白名单而非通配符 `*`（`credentials: true` 时不允许 `*`）
- Express cors 包自动处理 OPTIONS 预检请求（AC-5）
- 开发模式允许 localhost:5173（Vite dev server 默认端口）和 localhost:3000

**验证**: 使用 `curl -H "Origin: https://zhcmqtt.top" -I http://localhost:3000/api/trpc` 确认响应包含:
- `Access-Control-Allow-Origin: https://zhcmqtt.top`
- `Access-Control-Allow-Credentials: true`

---

### Task 3: 前端 tRPC client 使用环境变量

**文件**: `client/src/main.tsx`

**当前代码** (第 43-44 行):

```typescript
httpBatchLink({
  url: "/api/trpc",
```

**修改为**:

```typescript
httpBatchLink({
  url: import.meta.env.VITE_API_BASE_URL || "/api/trpc",
```

**关键点**:
- Vite 通过 `import.meta.env` 暴露 `VITE_` 前缀的环境变量
- 回退到 `"/api/trpc"` 保证向后兼容
- `vite.config.ts` 中 `envDir` 已正确指向项目根目录

**验证**: 开发模式启动后，浏览器控制台中确认请求 URL 正确

---

### Task 4: 配置环境变量

#### 4a. 开发环境 `.env`

**新增行**:

```env
VITE_API_BASE_URL=http://localhost:3000/api/trpc
```

#### 4b. 生产环境 `.env.production`

**新增行**:

```env
VITE_API_BASE_URL=https://api.zhcmqtt.top/api/trpc
```

#### 4c. 生产环境模板 `.env.production.example`

**新增区块** (在 PORT 配置之后):

```env
# --------------------------------------------
# 前端 API 基地址 (Frontend API Base URL)
# --------------------------------------------
# 前端 tRPC client 连接后端 API 的完整 URL
# 用途: 前后端分离部署时，前端需要知道后端 API 的完整地址
#
# 开发环境: http://localhost:3000/api/trpc
# 生产环境: https://api.your-domain.com/api/trpc
#
# 注意:
#   - 必须包含 /api/trpc 路径
#   - 生产环境必须使用 HTTPS
#   - 域名必须在后端 CORS 白名单中
VITE_API_BASE_URL=https://api.your-domain.com/api/trpc
```

#### 4d. CORS 白名单环境变量（可选但推荐）

在 `.env.production.example` 中新增:

```env
# --------------------------------------------
# CORS 允许的域名 (CORS Allowed Origins)
# --------------------------------------------
# 多个域名用逗号分隔
# 用途: 指定哪些前端域名可以跨域访问后端 API
#
# 示例: https://zhcmqtt.top,https://www.zhcmqtt.top
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

对应修改 `server/_core/index.ts` 中的 CORS 配置:

```typescript
const allowedOrigins = process.env.NODE_ENV === "production"
  ? (process.env.CORS_ALLOWED_ORIGINS?.split(",") || ["https://zhcmqtt.top"])
  : ["http://localhost:5173", "http://localhost:3000"];
```

---

### Task 5: 修改 Cookie sameSite 策略

**文件**: `server/_core/cookies.ts`

**当前代码** (第 26-31 行):

```typescript
return {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: isLocalhost ? false : isSecureRequest(req),
};
```

**修改为**:

```typescript
const isCrossOrigin = !isLocalhost && process.env.NODE_ENV === "production";

return {
  httpOnly: true,
  path: "/",
  sameSite: isCrossOrigin ? "none" as const : "lax" as const,
  secure: isCrossOrigin ? true : (isLocalhost ? false : isSecureRequest(req)),
  ...(isCrossOrigin && { domain: ".zhcmqtt.top" }),
};
```

**关键点**:
- 跨域发送 Cookie 必须 `sameSite: "none"` + `secure: true`
- `domain: ".zhcmqtt.top"` 允许 Cookie 在 `zhcmqtt.top` 和 `api.zhcmqtt.top` 之间共享
- 开发模式保持 `sameSite: "lax"` 不变
- `secure: true` 在生产环境跨域时强制要求 HTTPS

---

### Task 6: 移除生产模式静态文件托管

**文件**: `server/_core/index.ts`

**当前代码** (第 94-99 行):

```typescript
// development mode uses Vite, production mode uses static files
if (process.env.NODE_ENV === "development") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}
```

**修改为**:

```typescript
// Development mode: use Vite dev server for HMR
// Production mode: static files served by Nginx, Express only handles API
if (process.env.NODE_ENV === "development") {
  await setupVite(app, server);
}
// Production mode: no static file serving - handled by Nginx/CDN
```

**同步修改 import**:

```typescript
// 移除 serveStatic 的导入
import { setupVite } from "./vite";
// (保留 serveStatic 在 vite.ts 中的导出，但不在 index.ts 中使用)
```

**注意**: `serveStatic` 函数保留在 `server/_core/vite.ts` 中不删除，以便未来可能的回退需要。

**验证**: 生产模式启动后，直接访问 `localhost:3000` 应返回 404 或空响应（非 HTML 页面）

---

### Task 7: 添加 Nginx api.zhcmqtt.top 配置

**文件**: `deploy/nginx/zhcmqtt.top-https.conf`

**新增 server block** (在现有 server block 之后追加):

```nginx
# ============================================
# API 子域名配置 - api.zhcmqtt.top
# 用途: 后端 API 服务（前后端分离）
# ============================================

# HTTP 重定向到 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.zhcmqtt.top;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
        default_type "text/plain";
        try_files $uri =404;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS API 服务
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.zhcmqtt.top;

    # SSL 证书（需要为 api.zhcmqtt.top 单独申请或使用通配符证书）
    ssl_certificate /etc/letsencrypt/live/api.zhcmqtt.top/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.zhcmqtt.top/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/api.zhcmqtt.top/chain.pem;

    # SSL 安全配置（与主域名一致）
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    ssl_stapling on;
    ssl_stapling_verify on;

    # 安全 Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 日志
    access_log /var/log/nginx/api.zhcmqtt.top_access.log;
    error_log /var/log/nginx/api.zhcmqtt.top_error.log;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types application/json;

    # 仅代理 API 请求
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 拒绝非 API 请求
    location / {
        return 404;
    }
}
```

**同步修改主域名 server block**: 修改 `zhcmqtt.top` 的 Nginx 配置，让前端静态文件由 Nginx 直接服务:

```nginx
# 在 zhcmqtt.top HTTPS server block 中修改:
# 前端静态文件（从 Docker 构建产出物复制到服务器）
root /var/www/zhcmqtt.top;
index index.html;

location / {
    try_files $uri $uri/ /index.html;
}

# 静态资源缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

### Task 8: 更新 Dockerfile 和 Docker Compose

**文件**: `Dockerfile`

生产镜像不再需要前端构建产出物，但为了兼容部署流程，保留构建步骤，添加一个单独的 stage 用于导出前端文件:

```dockerfile
# Stage 3: Frontend export (可选，用于导出前端文件到 Nginx)
FROM builder AS frontend
WORKDIR /app
# 前端文件在 dist/public 目录
CMD ["echo", "Frontend files ready at /app/dist/public"]
```

**文件**: `docker-compose.yml`

Dockerfile HEALTHCHECK 需要修改（生产模式不再服务 HTML）:

```dockerfile
# 修改为检查 API 端点
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/trpc || exit 1
```

---

## Testing Requirements

### Unit Tests

#### Test 1: CORS 中间件配置测试

**文件**: `server/__tests__/cors.test.ts` (新建)

```typescript
// 测试用例:
// 1. 允许的 origin 返回正确的 CORS 头
// 2. 不允许的 origin 不返回 CORS 头
// 3. OPTIONS 预检请求返回 200 和正确的 CORS 头
// 4. credentials 头正确设置
// 5. 开发模式允许 localhost origins
```

#### Test 2: Cookie sameSite 策略测试

**文件**: `server/_core/cookies.test.ts` (新建或追加)

```typescript
// 测试用例:
// 1. 开发模式: sameSite = "lax", secure = false
// 2. 生产模式跨域: sameSite = "none", secure = true, domain = ".zhcmqtt.top"
// 3. 生产模式同源: sameSite = "lax"（回退场景）
```

#### Test 3: 环境变量回退测试

```typescript
// 测试用例:
// 1. VITE_API_BASE_URL 设置时使用该值
// 2. VITE_API_BASE_URL 未设置时回退到 "/api/trpc"
```

### Integration Tests

#### Test 4: 跨域 API 请求集成测试

```typescript
// 测试用例:
// 1. 从允许的 origin 发起 GET 请求 → 200 + CORS 头
// 2. 从允许的 origin 发起 POST 请求 → 200 + CORS 头
// 3. 从不允许的 origin 发起请求 → 无 CORS 头
// 4. OPTIONS 预检 → 200 + 完整 CORS 头
// 5. 带 credentials 的跨域请求 → Cookie 正确设置和传递
```

### E2E Tests (Manual)

#### Test 5: 完整跨域流程

```
1. 部署后端到 api.zhcmqtt.top
2. 部署前端到 zhcmqtt.top
3. 打开浏览器 DevTools → Network 标签
4. 访问 zhcmqtt.top
5. 验证:
   - API 请求发送到 api.zhcmqtt.top
   - 预检 OPTIONS 请求成功
   - Cookie 正确设置（sameSite=none, secure, domain=.zhcmqtt.top）
   - 登录流程正常工作
   - 文章列表正常加载
```

### Coverage Target

- CORS 相关代码: 100%
- Cookie 策略修改: 100%
- 环境变量回退逻辑: 100%
- 整体新增代码覆盖率: ≥ 80%

## Implementation Notes

### 开发模式兼容性

开发模式下保持完全向后兼容：
- Vite dev server 继续正常工作（`setupVite()` 不变）
- tRPC URL 回退到 `"/api/trpc"`（相对路径，同源）
- Cookie 保持 `sameSite: "lax"`
- CORS 允许 localhost

### 部署顺序

1. 先部署后端（含 CORS 中间件）到现有架构（单体模式仍可工作）
2. 为 `api.zhcmqtt.top` 申请 SSL 证书
3. 配置 Nginx `api.zhcmqtt.top` server block
4. 构建前端（`VITE_API_BASE_URL=https://api.zhcmqtt.top/api/trpc pnpm build`）
5. 将前端文件部署到 Nginx 静态服务目录
6. 切换 DNS / Nginx 配置

### 回退方案

如果跨域部署出现问题，可快速回退：
1. 恢复 `server/_core/index.ts` 中的 `serveStatic(app)` 调用
2. 前端 `VITE_API_BASE_URL` 不设置（回退到相对路径）
3. Nginx 恢复单 server block 配置

### 安全考虑

- CORS `origin` 白名单不使用 `*` 通配符
- `credentials: true` 仅与白名单 origin 配合使用
- Cookie `sameSite: "none"` 必须搭配 `secure: true`（仅 HTTPS）
- API 子域名 Nginx 配置中 `X-Frame-Options: DENY`（比主站更严格）
- 所有 headers 配置遵循最小权限原则

## Dependencies & Risks

### Dependencies

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| Story 1-1 (Schema 迁移) | 前置完成 | 本 story 不直接依赖 schema |
| Story 1-2 (驱动替换) | 前置完成 | 本 story 不直接依赖驱动 |
| Story 1-3 (查询适配) | 前置完成 | 本 story 不直接依赖查询语法 |
| `cors` npm 包 | 需安装 | 成熟稳定的包，低风险 |
| SSL 证书 for api.zhcmqtt.top | 部署时需要 | 可用 Let's Encrypt 免费申请 |

### Risks

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Cookie 跨域传输失败 | 登录状态丢失 | 充分测试 sameSite/secure/domain 组合 |
| CORS 预检缓存问题 | 部分浏览器请求失败 | 设置 `Access-Control-Max-Age` |
| 通配符证书申请失败 | API 子域名无法 HTTPS | 备选: 单独为 api 子域名申请证书 |
| 第三方浏览器限制 third-party cookies | Safari ITP 阻止 Cookie | 未来可考虑 token-based auth 替代 |

## Definition of Done

- [ ] `cors` 包已安装
- [ ] Express CORS 中间件配置正确
- [ ] 前端 tRPC URL 使用 `VITE_API_BASE_URL` 环境变量
- [ ] 所有 `.env` 文件已更新
- [ ] Cookie sameSite 策略针对跨域场景适配
- [ ] 生产模式不再托管静态文件
- [ ] 开发模式完全向后兼容
- [ ] Nginx 配置包含 api.zhcmqtt.top
- [ ] Dockerfile HEALTHCHECK 已更新
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] OPTIONS 预检请求手动验证通过
- [ ] Code review 通过
