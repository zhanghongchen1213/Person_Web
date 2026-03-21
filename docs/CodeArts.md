## 1. 目标与结论

你的目标可以实现，而且需要两部分共同完成：

- **华为云平台配置**：在 CodeArts（Pipeline/Build/Deploy）里配置流水线任务与部署动作。
- **项目代码配置**：在仓库里补齐部署脚本、数据库迁移脚本（CodeArts 只负责"执行"，不会自动理解业务逻辑）。

一句话：**不是只配平台，也不是只改代码，而是"平台编排 + 代码脚本"联合实现。**

---

## 2. 目标架构（与你当前约束匹配）

- 前端：OBS + CDN（`zhcmqtt.top`）
- 后端：宝塔服务器（`api.zhcmqtt.top`，仅运行 API 进程）
- 数据库：MemFire（PostgreSQL）
- 包管理器：pnpm 10.4.1
- 发布方式：推送代码 -> CodeArts 自动触发 -> 构建/部署/迁移一条龙

---

## 3. 官方能力映射（为什么可行）

- CodeArts Pipeline 是可视化自动化任务编排平台，支持串联构建、部署、测试等任务。
- CodeArts Build 支持"**上传文件到 OBS**"步骤，可把前端构建产物直接推送到指定桶。
- CodeArts Deploy 支持在主机环境执行 Shell 脚本（适合部署后端到 ECS/宝塔）。

---

## 4. 实施前准备（一次性）

## 4.1 云资源与域名

- 已有并可用：
    - OBS 桶（博客前端静态资源）
    - CDN 加速域名（`zhcmqtt.top`）
    - ECS（宝塔）服务器，开放 SSH（建议仅白名单）
    - MemFire 数据库连接串

## 4.2 CodeArts 服务

- 开通并进入同一项目：
    - CodeArts Repo（代码仓）
    - CodeArts Build（构建）
    - CodeArts Pipeline（流水线）
    - CodeArts Deploy（可选，若你要平台托管部署动作）

## 4.3 机密信息（建议统一放 CodeArts 参数/凭据）

- 前端部署：
    - OBS 桶名、AK/SK
    - CDN 刷新鉴权信息（若通过 API 刷新）
- 后端部署：
    - 服务器 IP、SSH 用户、SSH 私钥
- 数据库迁移：
    - `DATABASE_URL`（MemFire）
- 应用密钥：
    - JWT_SECRET 等

---

## 5. 仓库结构（Person_Web 实际结构）

```
Person_Web/                     # 项目根目录（单仓库，共用一个 package.json）
  client/src/                   # React 19 前端源码
  server/                       # Express + tRPC 后端源码
    _core/index.ts              # 后端入口
  shared/                       # 前后端共享类型和常量
  drizzle/                      # Drizzle ORM schema 和迁移文件
  scripts/
    deploy_backend.sh           # 服务器端部署脚本
    migrate_db.sh               # 数据库迁移脚本
  dist/
    public/                     # 前端构建产物（vite build 输出）
    index.js                    # 后端构建产物（esbuild 输出）
  package.json                  # 统一的构建/测试/启动命令
  pnpm-lock.yaml                # pnpm 锁文件
  ecosystem.config.cjs          # PM2 部署配置
```

> **注意**：本项目不是 `frontend/backend/` 分目录结构，而是单仓库 `client/server/shared/` 同级，共用一个 `package.json`，一条 `pnpm run build` 命令同时构建前端和后端。

---

## 6. 代码侧必须补齐的脚本

## 6.1 构建命令（package.json 中已有）

```json
{
  "scripts": {
    "build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "test": "vitest run",
    "db:push": "drizzle-kit generate && drizzle-kit migrate"
  }
}
```

- **前端构建产物**：`dist/public/`（由 vite build 输出）
- **后端构建产物**：`dist/index.js`（由 esbuild 输出）
- **一条命令同时完成前后端构建**，无需分别执行。

## 6.2 后端部署脚本（服务器上执行）

`scripts/deploy_backend.sh`：

```bash
#!/usr/bin/env bash
set -e

APP_DIR=/www/wwwroot/person-web
cd "$APP_DIR"

git pull origin main
pnpm install --frozen-lockfile
pnpm run build
pm2 restart person-web-api || pm2 start dist/index.js --name person-web-api
pm2 save
```

## 6.3 数据库迁移脚本（MemFire / Drizzle ORM）

`scripts/migrate_db.sh`：

```bash
#!/usr/bin/env bash
set -e

cd /www/wwwroot/person-web
export DATABASE_URL="${DATABASE_URL}"
pnpm run db:push
```

> 使用 Drizzle Kit（`drizzle-kit generate && drizzle-kit migrate`），迁移命令可重复执行且幂等。

---

## 7. CodeArts 配置步骤（图形化）

## 7.1 新建代码仓触发流水线

1. 进入 CodeArts Pipeline，创建流水线（空模板）。
2. 流水线源选择你的 Repo，默认分支选择 `main`（或你的发布分支）。
3. 触发方式：代码提交触发（Push）。

## 7.2 阶段一：构建与测试

> **关键**：本项目为单仓库结构，在项目根目录统一执行构建和测试。

- 任务 A：安装依赖 + 构建（前后端一起）
    - 执行目录：项目根目录
    - 命令：

        ```bash
        pnpm install --frozen-lockfile
        pnpm run build
        ```

- 任务 B：运行测试
    - 执行目录：项目根目录
    - 命令：

        ```bash
        pnpm run test
        ```

## 7.3 阶段二：上传前端到 OBS

在 Build 中使用"**上传文件到OBS**"步骤：

- 构建产物路径：`dist/public/**`
- 桶名：你的目标桶
- OBS 存储目录：`./`（根目录）或你指定目录
- 是否上传文件夹：按你的目录策略选择

> 推荐：上线后前端走 CDN，OBS 仅作为源站。

## 7.4 阶段三：刷新 CDN

可选两种方式：

- 方式 1：在流水线里调用华为云 CDN 刷新 API（推荐）
- 方式 2：控制台手动刷新（初期可接受）

建议刷新目录：

- `https://zhcmqtt.top/`

## 7.5 阶段四：部署后端到宝塔服务器

你有两种实现路径：

- 路径 A（推荐）：Pipeline 中"执行 Shell + SSH"到服务器执行部署脚本
- 路径 B：使用 CodeArts Deploy 主机环境，编排"下载软件包 -> 执行脚本 -> 健康检查"

最小可行命令（在流水线执行机上）：

```bash
ssh -i "$SSH_KEY_FILE" root@${SERVER_IP} "bash /www/wwwroot/person-web/scripts/deploy_backend.sh"
```

## 7.6 阶段五：数据库迁移（MemFire / Drizzle ORM）

在后端部署之后执行：

```bash
ssh -i "$SSH_KEY_FILE" root@${SERVER_IP} "export DATABASE_URL='${DATABASE_URL}' && bash /www/wwwroot/person-web/scripts/migrate_db.sh"
```

---

## 8. 推荐流水线编排（生产可用）

1. 代码检查（可选，`pnpm run lint`）
2. 安装依赖 + 构建前后端（`pnpm install --frozen-lockfile && pnpm run build`）
3. 运行测试（`pnpm run test`）
4. 上传前端到 OBS（产物路径 `dist/public/**`）
5. 刷新 CDN（`https://zhcmqtt.top/`）
6. 部署后端到 ECS（宝塔）（SSH 执行 `deploy_backend.sh`）
7. 执行 DB 迁移（MemFire）（SSH 执行 `migrate_db.sh`）
8. 健康检查（`curl https://api.zhcmqtt.top/health`）

失败策略：

- 任意阶段失败 -> 停止后续阶段，系统保持上一次成功部署的状态
- 后端健康检查失败 -> 自动回滚到上一个稳定版本（可后续增强）

---

## 9. 你最关心的"到底平台配什么，代码配什么"

- **平台（CodeArts）做的事**：
    - 什么时候触发
    - 执行哪些任务、按什么顺序执行
    - 用哪些云服务（OBS、ECS、CDN）
- **代码仓库做的事**：
    - 如何构建前后端（`pnpm run build`）
    - 如何重启后端（`scripts/deploy_backend.sh`）
    - 如何迁移数据库（`scripts/migrate_db.sh`）
    - 如何健康检查（`GET /health`）

> 结论：CodeArts 负责"编排"，脚本负责"落地动作"。

---

## 10. 最小上线清单（按顺序勾选）

- [ ]  项目根目录可 `pnpm run build` 成功（同时输出 `dist/public/` 和 `dist/index.js`）
- [ ]  后端可启动并通过 `/health`（`node dist/index.js`）
- [ ]  MemFire 连接串可用
- [ ]  迁移脚本可在测试库执行成功（`pnpm run db:push`）
- [ ]  CodeArts Build 可上传 `dist/public/` 到 OBS
- [ ]  CDN 域名 `zhcmqtt.top` 已绑定证书并可访问
- [ ]  SSH 从流水线执行机可连接宝塔服务器
- [ ]  部署脚本可重启服务并稳定运行

---

## 11. 常见故障与处理

- 前端访问 403/AccessDenied：
    - 检查 OBS 桶是否有对象（不是 0 个）
    - 检查桶策略是否公共读
    - 检查 CDN 回源地址是否配置正确
- 流水线上传 OBS 失败：
    - 检查构建产物路径是否为 `dist/public/**`（不是 `frontend/dist/`）
    - 检查执行机到 OBS 终端节点网络连通性
- 后端部署成功但接口 502：
    - 检查 PM2 进程是否存活（`pm2 list`）
    - 检查进程名是否为 `person-web-api`
    - 检查 Nginx 反向代理目标端口（应为 3000）
- 迁移失败：
    - 检查 `DATABASE_URL` 连接串
    - 确保使用 `pnpm run db:push`（Drizzle Kit），不要手工改线上表结构
    - 确保迁移脚本幂等，可重复执行

---

## 12. 下一步建议

先跑通最小链路（前端 OBS + 后端部署，不含自动迁移），确认稳定后再打开自动迁移。
这样可以显著降低第一次切换架构的风险。
