## 1. 目标与结论

你的目标可以实现，而且需要两部分共同完成：

- **华为云平台配置**：在 CodeArts（Pipeline/Build/Deploy）里配置流水线任务与部署动作。
- **项目代码配置**：在仓库里补齐构建脚本、部署脚本、数据库迁移脚本（CodeArts 只负责“执行”，不会自动理解业务逻辑）。

一句话：**不是只配平台，也不是只改代码，而是“平台编排 + 代码脚本”联合实现。**

---

## 2. 目标架构（与你当前约束匹配）

- 前端：OBS + CDN（`zhcmqtt.top` / `saas1.zhcmqtt.top` 等）
- 后端：宝塔服务器（`api.zhcmqtt.top`，仅运行 API 进程）
- 数据库：MemFire（PostgreSQL）
- 发布方式：推送代码 -> CodeArts 自动触发 -> 构建/部署/迁移一条龙

---

## 3. 官方能力映射（为什么可行）

- CodeArts Pipeline 是可视化自动化任务编排平台，支持串联构建、部署、测试等任务。
- CodeArts Build 支持“**上传文件到 OBS**”步骤，可把前端构建产物直接推送到指定桶。
- CodeArts Deploy 支持在主机环境执行 Shell 脚本（适合部署后端到 ECS/宝塔）。

---

## 4. 实施前准备（一次性）

## 4.1 云资源与域名

- 已有并可用：
    - OBS 桶（例如：`blog-zhcmqtt-top` 或 `saas1-zhcmqtt-top`）
    - CDN 加速域名（例如：`saas1.zhcmqtt.top`）
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
    - OBS 桶名
    - CDN 刷新鉴权信息（若通过 API 刷新）
- 后端部署：
    - 服务器 IP、SSH 用户、SSH 私钥
- 数据库迁移：
    - `DATABASE_URL`（MemFire）
- 应用密钥：
    - JWT_SECRET 等

---

## 5. 仓库结构建议（最少改动版）

```
repo-root/
  frontend/                 # 前端项目（Vue/React）
  backend/                  # API 项目（Node/Nest/Express/FastAPI）
  scripts/
    deploy_backend.sh       # 服务器端部署脚本
    ci_deploy_backend.sh    # 流水线中通过SSH触发的脚本
    migrate_db.sh           # 数据库迁移脚本
```

---

## 6. 代码侧必须补齐的脚本

## 6.1 前端构建脚本（package.json 示例）

```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

构建输出目录假设为 `frontend/dist`。

## 6.2 后端部署脚本（服务器上执行）

`scripts/deploy_backend.sh` 示例：

```bash
#!/usr/bin/env bash
set -e

APP_DIR=/www/wwwroot/blog-api
cd "$APP_DIR"

git pull origin main
npm ci
npm run build
pm2 restart blog-api || pm2 start dist/main.js --name blog-api
pm2 save
```

## 6.3 数据库迁移脚本（MemFire）

`scripts/migrate_db.sh` 示例（以 Prisma 为例）：

```bash
#!/usr/bin/env bash
set -e

cd /www/wwwroot/blog-api
export DATABASE_URL="${DATABASE_URL}"
npx prisma migrate deploy
```

> 如果你不是 Prisma，请替换为 Knex/TypeORM/Flyway 等迁移命令，但必须保证“可重复执行且幂等”。
> 

---

## 7. CodeArts 配置步骤（图形化）

## 7.1 新建代码仓触发流水线

1. 进入 CodeArts Pipeline，创建流水线（空模板）。
2. 流水线源选择你的 Repo，默认分支选择 `main`（或你的发布分支）。
3. 触发方式：代码提交触发（Push）。

## 7.2 阶段一：构建与测试

建议任务：

- 任务 A：前端构建
    - 执行目录：`frontend`
    - 命令：
        
        ```bash
        npm ci
        npm run build
        ```
        
- 任务 B：后端构建
    - 执行目录：`backend`
    - 命令：
        
        ```bash
        npm ci
        npm run build
        npm test --if-present
        ```
        

## 7.3 阶段二：上传前端到 OBS

在 Build 中使用“**上传文件到OBS**”步骤：

- 构建产物路径：`frontend/dist/**`
- 桶名：你的目标桶
- OBS 存储目录：`./`（根目录）或你指定目录
- 是否上传文件夹：按你的目录策略选择

> 推荐：上线后前端走 CDN，OBS 仅作为源站。
> 

## 7.4 阶段三：刷新 CDN

可选两种方式：

- 方式 1：在流水线里调用华为云 CDN 刷新 API（推荐）
- 方式 2：控制台手动刷新（初期可接受）

建议刷新目录：

- `https://saas1.zhcmqtt.top/`

## 7.5 阶段四：部署后端到宝塔服务器

你有两种实现路径：

- 路径 A（推荐）：Pipeline 中“执行 Shell + SSH”到服务器执行部署脚本
- 路径 B：使用 CodeArts Deploy 主机环境，编排“下载软件包 -> 执行脚本 -> 健康检查”

最小可行命令（在流水线执行机上）：

```bash
ssh -i "$SSH_KEY_FILE" root@${SERVER_IP} "bash /www/wwwroot/blog-api/scripts/deploy_backend.sh"
```

## 7.6 阶段五：数据库迁移（MemFire）

在后端部署之后执行：

```bash
ssh -i "$SSH_KEY_FILE" root@${SERVER_IP} "export DATABASE_URL='${DATABASE_URL}' && bash /www/wwwroot/blog-api/scripts/migrate_db.sh"
```

---

## 8. 推荐流水线编排（生产可用）

1. 代码检查（可选）
2. 前端构建
3. 后端构建+测试
4. 上传前端到 OBS
5. 刷新 CDN
6. 部署后端到 ECS（宝塔）
7. 执行 DB 迁移（MemFire）
8. 健康检查（`/health`）

失败策略：

- 迁移失败 -> 停止发布，不刷新“成功”状态
- 后端健康检查失败 -> 自动回滚到上一个稳定版本（可后续增强）

---

## 9. 你最关心的“到底平台配什么，代码配什么”

- **平台（CodeArts）做的事**：
    - 什么时候触发
    - 执行哪些任务、按什么顺序执行
    - 用哪些云服务（OBS、ECS、CDN）
- **代码仓库做的事**：
    - 如何构建前端
    - 如何重启后端
    - 如何迁移数据库
    - 如何健康检查

> 结论：CodeArts 负责“编排”，脚本负责“落地动作”。
> 

---

## 10. 最小上线清单（按顺序勾选）

- [ ]  前端项目本地可 `npm run build` 成功
- [ ]  后端项目本地可启动并通过 `/health`
- [ ]  MemFire 连接串可用
- [ ]  迁移脚本可在测试库执行成功
- [ ]  CodeArts Build 可上传 `dist` 到 OBS
- [ ]  CDN 域名已绑定证书并可访问
- [ ]  SSH 从流水线执行机可连接宝塔服务器
- [ ]  部署脚本可重启服务并稳定运行

---

## 11. 常见故障与处理

- 前端访问 403/AccessDenied：
    - 检查 OBS 桶是否有对象（不是 0 个）
    - 检查桶策略是否公共读
    - 检查 CDN 回源地址是否配置正确
- 流水线上传 OBS 失败：
    - 检查构建产物路径是否正确
    - 检查执行机到 OBS 终端节点网络连通性
- 后端部署成功但接口 502：
    - 检查 PM2 进程是否存活
    - 检查 Nginx 反向代理目标端口
- 迁移失败：
    - 检查 `DATABASE_URL`
    - 确保迁移脚本幂等，不要手工改线上表结构

---

## 12. 下一步建议

先跑通最小链路（前端 OBS + 后端部署，不含自动迁移），确认稳定后再打开自动迁移。
这样可以显著降低第一次切换架构的风险。