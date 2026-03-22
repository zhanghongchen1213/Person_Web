---
storyId: '1-5'
epicId: 1
title: '跨域 OAuth 认证与 Cookie 共享'
status: 'ready-for-dev'
priority: 'high'
storyPoints: 3
dependencies: ['1-1', '1-2', '1-3', '1-4']
blockedBy: ['1-4']
blocks: []
created: '2026-03-21'
---

# Story 1.5: 跨域 OAuth 认证与 Cookie 共享

## Story Description

**As a** 用户,
**I want** 通过 GitHub OAuth 登录博客，在跨域架构下认证流程正常工作,
**So that** 我可以在前后端分离的架构下无感知地完成登录。

## Background & Context

### 当前状态（Story 1-4 完成后）

Story 1-4 已完成以下关键基础设施：
- CORS 中间件已配置（`origin: ['https://zhcmqtt.top']`, `credentials: true`）
- Cookie `sameSite: "none"` + `secure: true` + `domain: ".zhcmqtt.top"` 已在 `cookies.ts` 中实现
- 前端 `VITE_API_BASE_URL` 环境变量已配置
- 生产模式静态文件托管已移除

### 本 Story 需要解决的问题

虽然 Cookie 跨域共享已在 Story 1-4 中配置，但 OAuth 认证流程仍存在以下跨域问题：

1. **GITHUB_CALLBACK_URL 仍指向本地**：默认值为 `http://localhost:3000/api/auth/github/callback`，生产环境需要设为 `https://api.zhcmqtt.top/api/auth/github/callback`
2. **登录成功后重定向使用相对路径 `/`**：在跨域架构下，后端（api.zhcmqtt.top）执行 `res.redirect(302, "/")` 会重定向到 `https://api.zhcmqtt.top/` 而非前端 `https://zhcmqtt.top/`
3. **退出登录 clearCookie 需要带 domain 参数**：当前 `clearCookie` 已使用 `getSessionCookieOptions()`，但需验证 domain 参数正确传递
4. **通用 OAuth 回调同样存在重定向问题**：`server/_core/oauth.ts` 也使用 `res.redirect(302, "/")`

### 关键文件清单

| 文件 | 当前状态 | 需要修改 |
|------|---------|---------|
| `server/_core/github-oauth.ts` | `res.redirect(302, "/")` | 重定向到前端绝对 URL |
| `server/_core/oauth.ts` | `res.redirect(302, "/")` | 重定向到前端绝对 URL |
| `server/routers.ts` | `clearCookie` 使用 `getSessionCookieOptions()` | 验证 domain 参数正确 |
| `server/_core/env.ts` | 无 `FRONTEND_URL` | 添加前端 URL 环境变量 |
| `server/_core/cookies.ts` | 已在 1-4 中完成跨域配置 | 无需修改（验证即可） |
| `.env.production.example` | 无 `FRONTEND_URL` / `GITHUB_CALLBACK_URL` | 添加模板 |
| `.env` | 开发环境配置 | 添加 `FRONTEND_URL` |

### 架构参考

```
用户浏览器 (zhcmqtt.top)
    │
    ├── 1. 点击"GitHub 登录"按钮
    │      → 跳转到 api.zhcmqtt.top/api/auth/github/login
    │
    ├── 2. 重定向到 GitHub 授权页面
    │      → github.com/login/oauth/authorize
    │      → redirect_uri: https://api.zhcmqtt.top/api/auth/github/callback
    │
    ├── 3. 用户授权后，GitHub 回调
    │      → api.zhcmqtt.top/api/auth/github/callback?code=xxx
    │
    ├── 4. 后端处理回调
    │      → 交换 code → 获取用户信息 → 创建 JWT
    │      → 设置 Cookie (domain: .zhcmqtt.top, sameSite: none, secure: true)
    │      → 重定向到 https://zhcmqtt.top/ (前端首页)
    │
    └── 5. 前端加载
           → Cookie 自动携带（根域共享）
           → tRPC auth.me 请求识别用户身份
```

## Acceptance Criteria

**Given** 用户在 zhcmqtt.top 点击登录按钮
**When** 触发 GitHub OAuth 登录流程
**Then:**

- [ ] **AC-1**: `GITHUB_CALLBACK_URL` 在生产环境设为 `https://api.zhcmqtt.top/api/auth/github/callback`
- [ ] **AC-2**: OAuth 回调完成后，JWT Cookie 设置 `domain: '.zhcmqtt.top'`（根域共享）
- [ ] **AC-3**: Cookie `SameSite` 设为 `'none'`，`Secure` 设为 `true`
- [ ] **AC-4**: Cookie `httpOnly` 保持 `true`
- [ ] **AC-5**: 登录成功后重定向到 `https://zhcmqtt.top/`（而非相对路径 `/`）
- [ ] **AC-6**: 用户退出登录时正确清除根域 Cookie（包含 `domain: '.zhcmqtt.top'`）
- [ ] **AC-7**: 系统可通过 Cookie 识别用户身份和管理员角色（FR18-FR20）

## Task Breakdown

### Task 1: 添加 `FRONTEND_URL` 环境变量

**文件**: `server/_core/env.ts`

**当前代码**:

```typescript
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
```

**修改为**:

```typescript
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // 前端 URL，用于 OAuth 回调后重定向
  // 开发环境: http://localhost:5173 (Vite dev server)
  // 生产环境: https://zhcmqtt.top
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
};
```

**关键点**:
- 开发模式默认指向 Vite dev server（5173 端口）
- 生产环境通过 `FRONTEND_URL` 环境变量配置
- 此变量仅在后端使用，不需要 `VITE_` 前缀

**验证**: `ENV.frontendUrl` 在不同环境下返回正确值

---

### Task 2: 修改 GitHub OAuth 回调重定向

**文件**: `server/_core/github-oauth.ts`

**当前代码** (第 139-140 行):

```typescript
// 重定向到首页
res.redirect(302, "/");
```

**修改为**:

```typescript
// 重定向到前端首页（跨域架构下必须使用绝对 URL）
res.redirect(302, ENV.frontendUrl);
```

**同步修改 import** (文件顶部已有 `import { ENV } from "./env";`，无需添加):

**关键点**:
- 在跨域架构下，`res.redirect(302, "/")` 会重定向到 `api.zhcmqtt.top/`（后端域名），而非前端
- 使用 `ENV.frontendUrl` 确保重定向到正确的前端域名
- `github-oauth.ts` 已经导入了 `ENV`，无需新增 import

**验证**: OAuth 回调完成后，浏览器 Location 头为 `https://zhcmqtt.top/`

---

### Task 3: 修改通用 OAuth 回调重定向

**文件**: `server/_core/oauth.ts`

**当前代码** (第 47 行):

```typescript
res.redirect(302, "/");
```

**修改为**:

```typescript
res.redirect(302, ENV.frontendUrl);
```

**同步添加 import**:

```typescript
import { ENV } from "./env";
```

**关键点**:
- `oauth.ts` 当前未导入 `ENV`，需要新增 import
- 与 Task 2 保持一致的重定向逻辑

**验证**: 通用 OAuth 回调完成后，浏览器 Location 头为 `https://zhcmqtt.top/`

---

### Task 4: 验证退出登录 clearCookie 传递 domain 参数

**文件**: `server/routers.ts`

**当前代码** (第 35-38 行):

```typescript
logout: publicProcedure.mutation(({ ctx }) => {
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
  return { success: true } as const;
}),
```

**分析**: 当前代码已经正确使用 `getSessionCookieOptions(ctx.req)`，该函数在生产环境跨域时返回:

```typescript
{
  httpOnly: true,
  path: "/",
  sameSite: "none",
  secure: true,
  domain: ".zhcmqtt.top"  // 关键：根域 Cookie 清除需要此参数
}
```

**结论**: **无需修改**。`clearCookie` 已通过 `getSessionCookieOptions` 获取了完整的 cookie 选项，包括 `domain: ".zhcmqtt.top"`。浏览器要求 `clearCookie` 时必须提供与设置 Cookie 相同的 `domain` 和 `path`，当前实现已满足此要求。

**验证**: 退出登录后，浏览器 DevTools → Application → Cookies 中确认 `.zhcmqtt.top` 域名下的 session cookie 被清除。

---

### Task 5: 配置生产环境变量

#### 5a. 生产环境 `.env.production`

**新增行**:

```env
# OAuth 回调后重定向的前端 URL
FRONTEND_URL=https://zhcmqtt.top

# GitHub OAuth 回调地址（必须与 GitHub App 配置一致）
GITHUB_CALLBACK_URL=https://api.zhcmqtt.top/api/auth/github/callback
```

#### 5b. 生产环境模板 `.env.production.example`

**新增区块**:

```env
# --------------------------------------------
# 前端 URL (Frontend URL for OAuth Redirects)
# --------------------------------------------
# OAuth 登录成功后重定向的前端地址
# 用途: 跨域架构下，后端 OAuth 回调需要知道前端的完整 URL 以正确重定向
#
# 开发环境: http://localhost:5173 (Vite dev server，可不设置使用默认值)
# 生产环境: https://your-domain.com
#
# 注意:
#   - 必须使用 HTTPS（生产环境）
#   - 不要以 / 结尾
#   - 此变量仅在后端使用，不需要 VITE_ 前缀
FRONTEND_URL=https://your-domain.com

# --------------------------------------------
# GitHub OAuth 配置 (GitHub OAuth Configuration)
# --------------------------------------------
# GitHub OAuth App 的客户端凭据和回调地址
# 在 https://github.com/settings/applications/new 创建 OAuth App
#
# Authorization callback URL 必须与 GITHUB_CALLBACK_URL 一致
# 生产环境示例: https://api.your-domain.com/api/auth/github/callback
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://api.your-domain.com/api/auth/github/callback
```

#### 5c. 开发环境 `.env`

**新增行**（可选，`env.ts` 已有默认值）:

```env
# OAuth 回调后重定向的前端 URL（开发环境）
# FRONTEND_URL=http://localhost:5173
```

---

### Task 6: 更新 GitHub OAuth App 配置

**操作位置**: GitHub → Settings → Developer settings → OAuth Apps

**需要更新的字段**:

| 字段 | 当前值 | 新值 |
|------|--------|------|
| Authorization callback URL | `http://localhost:3000/api/auth/github/callback` | `https://api.zhcmqtt.top/api/auth/github/callback` |
| Homepage URL | (可能是 localhost) | `https://zhcmqtt.top` |

**关键点**:
- GitHub OAuth App 的 callback URL **必须**与 `GITHUB_CALLBACK_URL` 环境变量一致
- 如果需要同时支持开发和生产环境，可以创建两个 OAuth App（推荐）
- 或者在开发环境使用默认的 `http://localhost:3000/api/auth/github/callback`（`github-oauth.ts` 中已设置为默认值）

**验证**: GitHub OAuth 授权页面正确显示，回调 URL 指向 `api.zhcmqtt.top`

---

## Testing Requirements

### Unit Tests

#### Test 1: OAuth 重定向 URL 测试

**文件**: `server/__tests__/oauth-redirect.test.ts` (新建)

```typescript
// 测试用例:
// 1. GitHub OAuth 回调成功后重定向到 FRONTEND_URL
// 2. 通用 OAuth 回调成功后重定向到 FRONTEND_URL
// 3. FRONTEND_URL 未设置时使用默认值 http://localhost:5173
// 4. FRONTEND_URL 设为 https://zhcmqtt.top 时正确重定向
```

#### Test 2: Cookie 设置验证测试

**文件**: `server/__tests__/oauth-cookie.test.ts` (新建)

```typescript
// 测试用例:
// 1. GitHub OAuth 回调后 Cookie 包含 domain: ".zhcmqtt.top"（生产环境）
// 2. GitHub OAuth 回调后 Cookie 包含 sameSite: "none"（生产环境）
// 3. GitHub OAuth 回调后 Cookie 包含 secure: true（生产环境）
// 4. GitHub OAuth 回调后 Cookie 包含 httpOnly: true
// 5. 开发环境下 Cookie 不包含 domain 属性
// 6. 开发环境下 Cookie sameSite: "lax"
```

#### Test 3: 退出登录 Cookie 清除测试

**文件**: `server/__tests__/logout-cookie.test.ts` (新建)

```typescript
// 测试用例:
// 1. 退出登录时 clearCookie 传入正确的 domain 参数（生产环境）
// 2. 退出登录时 clearCookie 传入正确的 path 参数
// 3. 退出登录时 clearCookie 传入 maxAge: -1
// 4. 开发环境退出登录不传 domain 参数
```

#### Test 4: ENV.frontendUrl 配置测试

**文件**: `server/__tests__/env.test.ts` (新建或追加)

```typescript
// 测试用例:
// 1. FRONTEND_URL 环境变量设置时使用该值
// 2. FRONTEND_URL 未设置时回退到 "http://localhost:5173"
```

### Integration Tests

#### Test 5: 完整 GitHub OAuth 流程集成测试

**文件**: `server/__tests__/github-oauth-integration.test.ts` (新建)

```typescript
// 测试用例:
// 1. GET /api/auth/github/login → 302 重定向到 GitHub 授权页面
//    - redirect_uri 参数等于 GITHUB_CALLBACK_URL
// 2. GET /api/auth/github/callback?code=xxx → 302 重定向到 FRONTEND_URL
//    - Set-Cookie 头包含正确的 domain/sameSite/secure/httpOnly
// 3. 模拟跨域请求：带 Origin: https://zhcmqtt.top 的请求正确处理
// 4. auth.logout mutation → clearCookie 包含正确的 domain 参数
```

### E2E Tests (Manual)

#### Test 6: 完整跨域 OAuth 流程

```
1. 部署后端到 api.zhcmqtt.top
2. 部署前端到 zhcmqtt.top
3. 打开浏览器 DevTools → Network + Application 标签
4. 访问 zhcmqtt.top，点击 GitHub 登录按钮
5. 验证:
   a. 重定向到 GitHub 授权页面（redirect_uri 指向 api.zhcmqtt.top）
   b. GitHub 授权后回调到 api.zhcmqtt.top/api/auth/github/callback
   c. 回调后重定向到 https://zhcmqtt.top/（非 api.zhcmqtt.top/）
   d. Cookie 设置在 .zhcmqtt.top 域名下
   e. Cookie 属性: httpOnly=true, secure=true, sameSite=none
   f. 页面加载后用户已登录状态（Navbar 显示用户名）
   g. 管理员用户可访问 /admin 页面
6. 点击退出登录
7. 验证:
   a. .zhcmqtt.top 域名下的 session cookie 被清除
   b. 页面状态恢复为未登录
   c. /admin 页面不可访问
```

### Coverage Target

- OAuth 重定向逻辑: 100%
- Cookie 设置/清除逻辑: 100%（已在 Story 1-4 测试中覆盖大部分，本 Story 验证）
- ENV.frontendUrl 回退逻辑: 100%
- 整体新增代码覆盖率: >= 80%

## Implementation Notes

### 代码变更范围（极小）

本 Story 的实际代码变更非常小，主要是：
1. `env.ts` 新增 1 行（`frontendUrl`）
2. `github-oauth.ts` 修改 1 行（重定向 URL）
3. `oauth.ts` 修改 1 行（重定向 URL）+ 新增 1 行 import
4. 环境变量文件新增若干行

大部分跨域 Cookie 基础设施已在 Story 1-4 中完成。

### 开发环境兼容性

开发模式下保持完全向后兼容：
- `FRONTEND_URL` 默认值为 `http://localhost:5173`（Vite dev server）
- `GITHUB_CALLBACK_URL` 默认值为 `http://localhost:3000/api/auth/github/callback`
- Cookie 保持 `sameSite: "lax"`，无 `domain` 属性（同源不需要）
- Mock OAuth 路由（`mock-oauth.ts`）不受影响

### 与 Story 1-4 的关系

| 功能 | Story 1-4 负责 | Story 1-5 负责 |
|------|---------------|---------------|
| CORS 中间件 | 已完成 | - |
| Cookie sameSite/secure/domain | 已完成 | 验证在 OAuth 流程中正确工作 |
| 前端 API 基地址 | 已完成 | - |
| OAuth 回调 URL | - | 配置生产环境 GITHUB_CALLBACK_URL |
| OAuth 后重定向 | - | 从 `/` 改为 `FRONTEND_URL` 绝对路径 |
| 退出登录 clearCookie | - | 验证 domain 参数正确传递 |

### 安全考虑

- `FRONTEND_URL` 不应接受用户输入，仅从环境变量读取（防止开放重定向攻击）
- OAuth 回调 URL 必须与 GitHub App 配置严格一致（GitHub 会验证）
- Cookie `httpOnly: true` 防止 XSS 攻击读取 token
- Cookie `secure: true` 防止中间人攻击截获 token
- Cookie `sameSite: "none"` 虽然降低了 CSRF 防护，但 `httpOnly` + 业务逻辑中的 token 验证弥补了这一点

### GITHUB_CALLBACK_URL 配置说明

`server/_core/github-oauth.ts` 第 13 行：

```typescript
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback";
```

此环境变量需要在两个地方保持一致：
1. `.env.production`（或服务器环境变量）: `GITHUB_CALLBACK_URL=https://api.zhcmqtt.top/api/auth/github/callback`
2. GitHub OAuth App 设置页面: Authorization callback URL = `https://api.zhcmqtt.top/api/auth/github/callback`

如果两者不一致，GitHub 会返回 `redirect_uri_mismatch` 错误。

## Dependencies & Risks

### Dependencies

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| Story 1-4 (CORS + Cookie 跨域) | 前置完成 | Cookie domain/sameSite/secure 已配置 |
| GitHub OAuth App 配置 | 需手动更新 | 需在 GitHub 更新 callback URL |
| SSL 证书 for api.zhcmqtt.top | 部署时需要 | 已在 Story 1-4 中规划 |

### Risks

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| GitHub OAuth App callback URL 不一致 | OAuth 流程完全失败 | 部署前核对 GitHub App 配置 |
| `FRONTEND_URL` 配置错误 | 登录后重定向到错误地址 | 默认值保证开发模式安全 |
| 开放重定向漏洞 | 安全风险 | `FRONTEND_URL` 仅从环境变量读取，不接受用户输入 |
| Safari ITP 限制第三方 Cookie | 部分用户无法登录 | 未来可考虑 token-based auth 或 Proxy 方案 |
| 双 OAuth App 管理复杂性 | 开发/生产不一致 | 文档化配置步骤，环境变量默认值保证开发模式 |

## Definition of Done

- [ ] `ENV.frontendUrl` 从 `FRONTEND_URL` 环境变量读取
- [ ] GitHub OAuth 回调后重定向到 `FRONTEND_URL`（而非 `/`）
- [ ] 通用 OAuth 回调后重定向到 `FRONTEND_URL`（而非 `/`）
- [ ] `.env.production.example` 包含 `FRONTEND_URL` 和 `GITHUB_CALLBACK_URL` 模板
- [ ] 退出登录 `clearCookie` 验证包含正确的 `domain` 参数
- [ ] 开发模式完全向后兼容
- [ ] 单元测试覆盖率 >= 80%
- [ ] 手动验证完整 OAuth 流程（登录 → 识别身份 → 退出登录）
- [ ] Code review 通过
