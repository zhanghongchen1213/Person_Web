---
name: "cloud-deploy"
description: "通过SSH连接云服务器，执行upgrade.sh一键升级脚本，实时监控部署状态直到升级成功或失败并通知用户。当用户输入「云服务部署」或「部署到云端」时调用。"
---

# 云服务部署技能 (Cloud Deploy Skill)

当用户请求「云服务部署」、「部署到云端」、「升级服务器」时，执行以下流程。

## 前置条件

- 本机 `~/.ssh/config` 中已配置 `person-web-server` 主机别名
- 云端项目路径: `/opt/Person_Web/Person_Web-main`
- 升级脚本: `deploy/scripts/upgrade.sh`

## 执行流程

### 1. 验证 SSH 连通性

使用 Bash 工具执行:

```bash
ssh -o ConnectTimeout=10 person-web-server "echo 'SSH连接成功'"
```

如果连接失败，立即通知用户并终止流程。

### 2. 执行升级脚本

使用 Bash 工具执行（设置较长超时，升级过程可能耗时）:

```bash
ssh person-web-server "cd /opt/Person_Web/Person_Web-main && bash deploy/scripts/upgrade.sh 2>&1"
```

实时关注输出中的关键信息:
- `[ERROR]` 开头的行表示出错
- `[SUCCESS]` 开头的行表示步骤成功
- `升级完成` 表示整体升级成功
- 脚本非零退出码表示升级失败

### 3. 验证部署状态

升级脚本执行完毕后，额外验证服务状态:

```bash
ssh person-web-server "cd /opt/Person_Web/Person_Web-main && docker compose ps --format 'table {{.Name}}\t{{.Status}}'"
```

### 4. 结果通知

根据执行结果向用户报告:

**升级成功时**，汇报:
- 升级耗时
- 各容器运行状态
- 最新部署的 Git 提交信息

**升级失败时**，汇报:
- 失败发生在哪个步骤（备份/拉取代码/部署/验证）
- 具体错误信息
- 建议的排查方向

## 注意事项

- SSH 命令超时设置为 600000ms（10分钟），因为 docker build 可能较慢
- 如果升级脚本执行超时，提示用户手动 SSH 检查服务器状态
- 不要在输出中暴露数据库密码等敏感信息
