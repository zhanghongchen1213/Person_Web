---
name: "docker-check"
description: "本地构建Docker镜像并启动项目，使用Chrome MCP工具自动测试页面功能，测试完成后通知用户。当用户输入「检查docker」时调用。"
---

# Docker 检查技能 (Docker Check Skill)

当用户请求「检查docker」、「docker测试」时，执行以下流程。

## 前置条件

- 本机已安装 Docker 和 docker compose
- 项目根目录包含 `Dockerfile` 和 `docker-compose.yml`
- Chrome MCP 工具可用（chrome-devtools）

## 执行流程

### 1. 环境预检

使用 Bash 工具检查 Docker 是否运行:

```bash
docker info > /dev/null 2>&1 && echo "Docker正在运行" || echo "Docker未运行"
```

如果 Docker 未运行，通知用户启动 Docker 后重试。

### 2. 停止旧容器

清理可能存在的旧容器，避免端口冲突:

```bash
cd /Users/xiaozhangxuezhang/Documents/GitHub/Person_Web && docker compose down 2>&1
```

### 3. 构建并启动容器

使用 Bash 工具在项目根目录执行（设置较长超时，构建可能耗时）:

```bash
cd /Users/xiaozhangxuezhang/Documents/GitHub/Person_Web && docker compose up -d --build 2>&1
```

超时设置为 600000ms（10分钟），因为 docker build 可能较慢。

如果构建失败，向用户报告错误信息并终止流程。

### 4. 等待服务就绪

轮询检查应用健康状态，最多等待 60 秒:

```bash
for i in $(seq 1 12); do
  status=$(docker inspect --format='{{.State.Health.Status}}' person_web_app 2>/dev/null)
  if [ "$status" = "healthy" ]; then
    echo "应用已就绪"
    break
  fi
  echo "等待应用启动... ($i/12)"
  sleep 5
done
docker compose ps
```

如果超时未就绪，使用 `docker compose logs app` 查看日志并报告给用户。

### 5. 使用 Chrome MCP 测试页面

应用就绪后，使用 Chrome DevTools MCP 工具进行自动化测试:

**5.1 打开首页**

使用 `mcp__chrome-devtools__navigate_page` 导航到 `http://localhost:3000`。

**5.2 页面快照检查**

使用 `mcp__chrome-devtools__take_snapshot` 获取页面快照，检查:
- 页面是否正常渲染（非空白页、无错误提示）
- 关键元素是否存在（导航栏、内容区域）

**5.3 控制台错误检查**

使用 `mcp__chrome-devtools__list_console_messages` 检查是否有 JS 错误:
- 筛选 `types: ["error"]`
- 记录所有错误信息

**5.4 网络请求检查**

使用 `mcp__chrome-devtools__list_network_requests` 检查:
- 是否有失败的请求（4xx/5xx）
- API 接口是否正常响应

**5.5 页面截图**

使用 `mcp__chrome-devtools__take_screenshot` 截取页面截图作为测试证据。

**5.6 关键页面导航测试**

对页面中的主要导航链接，使用 `mcp__chrome-devtools__click` 逐一点击测试:
- 每次导航后用 `take_snapshot` 检查页面是否正常加载
- 用 `list_console_messages` 检查是否有新错误

### 6. 清理环境

测试完成后停止并清理容器:

```bash
cd /Users/xiaozhangxuezhang/Documents/GitHub/Person_Web && docker compose down 2>&1
```

### 7. 结果通知

向用户汇报测试结果:

**测试通过时**:
- Docker 构建状态
- 各页面测试结果摘要
- 截图位置
- 是否存在控制台警告（非阻断性）

**测试失败时**:
- 失败发生在哪个步骤
- 具体错误信息（构建错误 / 页面错误 / JS 错误 / 网络请求失败）
- 建议的修复方向

## 注意事项

- Docker 构建命令超时设置为 600000ms（10分钟）
- 健康检查轮询间隔 5 秒，最多等待 60 秒
- 测试完成后务必执行 `docker compose down` 清理环境
- 不要在输出中暴露 `.env.production` 中的敏感信息（数据库密码等）
