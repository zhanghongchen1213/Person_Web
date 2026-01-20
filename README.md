# Person_Web 个人博客部署指南

## 前言

> **📅 最后更新**：2026-01-19
> **🎯 目标读者**：有编程基础的开发者（不需要全栈经验）
> **🚀 部署目标**：将个人博客部署到云服务器（如华为云、阿里云、腾讯云等）

本文将手把手教你如何将 Person_Web 个人博客项目部署到云服务器上。即使你不是全栈工程师，只要有基本的编程知识和 Linux 命令行使用经验，就能按照本指南完成部署。

### 你将学到什么

- ✅ 如何在云服务器上安装 Docker 环境
- ✅ 如何配置 Nginx 反向代理
- ✅ 如何申请免费的 HTTPS 证书
- ✅ 如何使用一键脚本部署应用
- ✅ 如何以访客身份访问博客
- ✅ 如何以管理员身份登录后台

---

### 部署架构简介

```mermaid
graph TD
    A[用户浏览器] --> B[域名 zhcmqtt.top]
    B --> C[Nginx 反向代理 + HTTPS]
    C --> D[Docker 容器]
    D --> E[应用容器<br/>React + Express + tRPC]
    D --> F[数据库容器<br/>MySQL 8.0]
```

---

## 📋 目录

- [第一步：准备云服务器](#第一步准备云服务器)
- [第二步：一键配置服务器环境](#第二步一键配置服务器环境)
- [第三步：配置云服务商安全组](#第三步配置云服务商安全组)
- [第四步：上传项目代码](#第四步上传项目代码)
- [第五步：配置环境变量](#第五步配置环境变量)
- [第六步：一键部署应用](#第六步一键部署应用)
- [第七步：访问你的博客](#第七步访问你的博客)
- [第八步：配置域名和 HTTPS（可选）](#第八步配置域名和-https可选)
- [常见问题解答](#常见问题解答)
- [日常维护指南](#日常维护指南)

---

## 一、准备云服务器

### 1.1 购买云服务器

你可以选择以下任一云服务商：

- **华为云**：https://www.huaweicloud.com/
- **阿里云**：https://www.aliyun.com/
- **腾讯云**：https://cloud.tencent.com/

**推荐配置**：

| 配置项   | 最低要求         | 说明                   |
| -------- | ---------------- | ---------------------- |
| CPU      | 2 核心           | 保证应用流畅运行       |
| 内存     | 2GB              | 足够运行 Docker 容器   |
| 磁盘     | 20GB             | 存储系统、应用和数据库 |
| 操作系统 | Ubuntu 22.04 LTS | 推荐使用 Ubuntu        |
| 带宽     | 1Mbps            | 个人博客足够使用       |

💡 **小贴士**：新用户通常有优惠活动，2核2G配置一年大约 100-300 元。

---

### 1.2 购买域名（可选但推荐）

如果你想使用自己的域名（如 `myblog.com`），需要：

1. 在域名注册商购买域名（如阿里云、腾讯云、GoDaddy）
2. 将域名解析到你的服务器 IP 地址

**域名解析步骤**：

```
1. 登录域名管理控制台
2. 找到 DNS 解析设置
3. 添加 A 记录：
   - 主机记录：@ (代表根域名)
   - 记录类型：A
   - 记录值：你的服务器公网 IP
4. 添加 A 记录：
   - 主机记录：www
   - 记录类型：A
   - 记录值：你的服务器公网 IP
```

💡 **小贴士**：如果暂时没有域名，可以先使用服务器 IP 地址访问，后续再配置域名。

---

### 1.3 连接到服务器

使用 SSH 连接到你的服务器：

**Windows 用户**：

```bash
# 使用 PowerShell 或 Windows Terminal
ssh root@你的服务器IP
# 例如：ssh root@123.45.67.89
```

**Mac/Linux 用户**：

```bash
# 使用终端
ssh root@你的服务器IP
```

首次连接会提示是否信任服务器，输入 `yes` 并回车，然后输入服务器密码。

✅ **成功标志**：看到类似 `root@hostname:~#` 的命令提示符。

---

## 二、一键配置服务器环境

项目提供了一键配置脚本，可以自动完成 Docker、Nginx 和防火墙的安装配置。

### 2.1 创建项目目录

```bash
# 创建项目目录
sudo mkdir -p /opt/Person_Web

# 设置目录所有者为当前用户
sudo chown -R $USER:$USER /opt/Person_Web

# 进入项目目录
cd /opt/Person_Web
```

### 2.2 上传项目到服务器

#### 方法一：使用 GitHub 镜像加速（推荐，适用于国内服务器）

如果你的云服务器无法直接访问 GitHub，可以使用以下镜像加速服务：

```bash
# 安装 Git（如果未安装）
sudo apt install -y git

# 方案 1：使用 ghproxy.com 镜像（推荐）
git clone https://ghproxy.com/https://github.com/zhanghongchen1213/Person_Web /opt/Person_Web

# 方案 2：使用 gitclone.com 镜像
git clone https://gitclone.com/github.com/zhanghongchen1213/Person_Web /opt/Person_Web

# 方案 3：使用 fastgit 镜像
git clone https://hub.fastgit.xyz/zhanghongchen1213/Person_Web /opt/Person_Web

# 进入项目目录
cd /opt/Person_Web
```

💡 **小贴士**：

- 镜像服务可能会有延迟，建议优先尝试 ghproxy.com
- 如果一个镜像失败，可以尝试其他镜像
- 镜像服务仅用于克隆，后续 git 操作会自动使用原始仓库地址

#### 方法二：手动上传代码（备选方案）

如果 Git 克隆始终失败，可以手动上传代码：

1. **在本地下载项目**：
   - 访问 https://github.com/zhanghongchen1213/Person_Web
   - 点击 "Code" → "Download ZIP"
   - 解压到本地

2. **上传到服务器**并解压

   ```bash
   unzip Person_Web-main.zip
   rm -rf Person_Web-main.zip
   cd Person_Web-main
   ```

### 2.3 配置网络环境（重要，适用于国内服务器）

⚠️ **重要提示**：如果你的云服务器在国内，或者无法正常访问 GitHub、Docker Hub 等国外资源，**必须先执行此步骤**配置镜像源，否则后续安装可能会失败或非常缓慢。

项目提供了网络环境配置脚本，可以自动配置国内镜像源，解决网络访问问题。

```bash
# 进入项目目录
cd /opt/Person_Web

# 赋予脚本执行权限
chmod +x deploy/scripts/*

# 执行网络环境配置脚本
sudo bash deploy/scripts/setup-network.sh
```

脚本会自动完成以下配置：

1. ✅ **APT 软件源** - 切换到阿里云镜像，加速软件包下载
2. ✅ **Docker 镜像源** - 配置国内镜像加速器（腾讯云、DaoCloud、DockerProxy）
3. ✅ **Git 配置优化** - 禁用 HTTP/2，增加缓冲区，解决克隆失败问题
4. ✅ **npm 镜像源** - 配置淘宝镜像（如已安装 npm）

✅ **预期输出**：

[![yV63jQ.md.png](https://i.imgs.ovh/2026/01/19/yV63jQ.md.png)](https://imgloc.com/image/yV63jQ)

💡 **配置效果**：

- ✅ APT 软件包下载速度提升 10-50 倍
- ✅ Docker 镜像拉取速度提升 10-100 倍
- ✅ Git 克隆成功率接近 100%
- ✅ npm 包安装速度提升 5-20 倍

### 2.4 执行服务器环境配置脚本

```bash
# 执行服务器环境配置脚本
sudo bash deploy/scripts/setup-server.sh
```

脚本会自动完成以下操作：

1. ✅ **更新系统软件包** - 更新 apt 软件包列表
2. ✅ **安装 Docker** - 使用官方脚本安装 Docker 和 Docker Compose
3. ✅ **配置 Docker 权限** - 将当前用户添加到 docker 组
4. ✅ **安装 Nginx** - 安装并启动 Nginx 服务
5. ✅ **配置防火墙** - 开放必要端口（22, 80, 443）
6. ✅ **验证安装** - 测试所有服务是否正常运行

### 2.5 预期输出

[![yV8yHp.md.png](https://i.imgs.ovh/2026/01/19/yV8yHp.md.png)](https://imgloc.com/image/yV8yHp)

---

## 三、配置云服务商安全组

除了服务器防火墙，还需要在云服务商控制台配置安全组：

1. 登录云服务商控制台
2. 找到你的服务器实例
3. 进入"安全组"或"防火墙"设置
4. 添加入站规则：
   - 端口 22（SSH）
   - 端口 80（HTTP）
   - 端口 443（HTTPS）

💡 **小贴士**：不同云服务商的界面略有不同，但操作逻辑相同。

---

## 四、配置环境变量

环境变量包含了应用运行所需的配置信息，如数据库密码、JWT 密钥等。

### 4.1 使用一键配置脚本（推荐）

项目提供了交互式环境变量配置脚本，可以自动生成强密码并创建配置文件。

⚠️ **重要提示**：为了确保博客安全，**强烈推荐使用 GitHub OAuth 认证**，这样只有你的 GitHub 账号能够登录管理员后台。

#### 步骤 1：创建 GitHub OAuth 应用（推荐）

在运行配置脚本之前，建议先创建 GitHub OAuth 应用以获取必要的认证参数。

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 **"New OAuth App"** 创建新应用
3. 填写应用信息：
   - **Application name**: 你的博客名称（如 "My Personal Blog"）
   - **Homepage URL**: `http://你的服务器IP:3000` 或 `https://你的域名`
   - **Authorization callback URL**: `http://你的服务器IP:3000/api/auth/github/callback`
4. 点击 **"Register application"**
5. 记录下 **Client ID** 和 **Client Secret**（稍后配置时需要）
6. 获取你的 GitHub 用户 ID：
   - 访问 `https://api.github.com/users/你的GitHub用户名`
   - 记录返回的 JSON 中的 `id` 字段值

💡 **示例**：如果你的 GitHub 用户名是 `zhangsan`，访问 `https://api.github.com/users/zhangsan`，会看到类似：

```json
{
  "id": 12345678,
  "login": "zhangsan",
  ...
}
```

记录下 `id: 12345678`，稍后配置时需要填写 `github:12345678`。

#### 步骤 2：运行配置脚本

```bash
# 执行环境变量配置脚本
sudo bash deploy/scripts/setup-env.sh
```

脚本会交互式地询问你以下配置：

1. **MySQL root 密码**（留空自动生成32位强密码）
2. **JWT 密钥**（留空自动生成32位强密码）
3. **GitHub OAuth 配置**（必须配置，输入上一步获取的参数）：
   - GitHub Client ID
   - GitHub Client Secret
   - GitHub Callback URL
4. **管理员 GitHub 用户 ID**（格式为 `github:你的GitHub用户ID`）

配置完成后，脚本会自动生成 `.env.production` 文件。

✅ **预期输出**（配置 GitHub OAuth）：

[![yV8aLO.md.png](https://i.imgs.ovh/2026/01/19/yV8aLO.md.png)](https://imgloc.com/image/yV8aLO)

🔒 **安全优势**：

- ✅ 只有你的 GitHub 账号能够登录管理员后台
- ✅ 使用 GitHub 官方 OAuth 认证，安全可靠
- ✅ 无需记忆复杂的登录链接
- ✅ 支持后续添加其他 GitHub 用户为管理员

---

## 五、一键部署应用

项目提供了一键部署脚本，会自动完成所有部署步骤。

### 5.1 执行一键部署

```bash
# 执行一键部署脚本
sudo bash deploy/scripts/deploy.sh
```

⏱️ **预计耗时**：10-20 分钟（首次部署需要下载 Docker 镜像，会比较慢，请耐心等待）

[![ybCXcY.md.png](https://i.imgs.ovh/2026/01/19/ybCXcY.md.png)](https://imgloc.com/image/ybCXcY)

---

### 5.2 部署过程说明

部署脚本会自动执行以下 8 个步骤：

1. ✅ **检查 Docker 环境** - 确保 Docker 和 Docker Compose 已安装
2. ✅ **检查配置文件** - 验证 `.env.production` 文件存在且配置正确
3. ✅ **停止旧容器** - 如果有旧版本运行，先停止并删除
4. ✅ **构建新镜像** - 构建包含最新代码的 Docker 镜像
5. ✅ **启动新容器** - 启动应用容器和数据库容器
6. ✅ **执行数据库迁移** - 创建数据库表结构
7. ✅ **健康检查** - 等待应用启动并验证运行状态
8. ✅ **输出部署结果** - 显示部署成功信息和常用命令

### 5.3 预期输出

### 5.4 验证部署

#### 检查容器状态

```bash
# 查看所有容器状态
docker compose ps
```

✅ **预期输出**：

```
NAME                IMAGE               STATUS              PORTS
person_web_app      person-web:latest   Up 2 minutes (healthy)   0.0.0.0:3000->3000/tcp
person_web_mysql    mysql:8.0           Up 2 minutes (healthy)   0.0.0.0:3306->3306/tcp
```

两个容器的状态都应该是 `Up` 且显示 `(healthy)`。

#### 查看应用日志

```bash
# 查看应用日志（实时）
docker compose logs -f app
```

✅ **预期输出**：应该能看到类似以下的日志：

```
[INFO] Server running on http://localhost:3000
[INFO] Database connected successfully
```

按 `Ctrl + C` 退出日志查看。

#### 测试应用访问

```bash
# 测试本地访问
curl http://localhost:3000
```

✅ **预期输出**：返回 HTML 内容（博客首页）

---

## 六、访问你的博客

恭喜！你的博客已经部署成功了。现在让我们了解如何访问博客。

💡 **提示**：如果你还没有域名，可以直接使用服务器 IP 地址访问。域名配置是可选的，可以在第七步中完成。

### 6.1 使用 IP 地址访问（无域名）

#### 访客访问

访客可以通过以下方式访问你的博客：

```
http://你的服务器IP:3000
```

例如：`http://123.45.67.89:3000`

💡 **访客可以做什么**：

- ✅ 浏览所有已发布的博客文章
- ✅ 查看文章分类
- ✅ 搜索文章
- ✅ 查看文档（如果有）
- ❌ 无法创建、编辑或删除文章

#### 管理员访问

作为博客的管理员，你需要使用 **GitHub OAuth 登录**进行身份验证。

⚠️ **重要提示**：在第四步"配置环境变量"时，如果你已经按照推荐方式配置了 GitHub OAuth，可以直接登录。如果还没有配置，请先返回第四步完成 GitHub OAuth 配置。

**步骤 1：配置 GitHub OAuth 应用**（如果第四步已配置，可跳过）

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App" 创建新应用
3. 填写应用信息：
   - **Application name**: 你的博客名称（如 "My Personal Blog"）
   - **Homepage URL**: `http://你的服务器IP:3000` 或 `https://你的域名`
   - **Authorization callback URL**: `http://你的服务器IP:3000/api/auth/github/callback`
4. 点击 "Register application"
5. 记录 **Client ID** 和 **Client Secret**

**步骤 2：更新环境变量**

编辑 `.env.production` 文件，添加 GitHub OAuth 配置：

```bash
# 编辑环境变量文件
nano /opt/Person_Web/.env.production
```

添加或修改以下配置：

```env
# GitHub OAuth 配置
GITHUB_CLIENT_ID=你的GitHub_Client_ID
GITHUB_CLIENT_SECRET=你的GitHub_Client_Secret
GITHUB_CALLBACK_URL=http://你的服务器IP:3000/api/auth/github/callback

# 管理员 GitHub ID（格式: github:你的GitHub用户ID）
# 获取你的 GitHub 用户 ID: 访问 https://api.github.com/users/你的GitHub用户名
OWNER_OPEN_ID=github:你的GitHub用户ID
```

**步骤 3：重启应用**

```bash
cd /opt/Person_Web
docker-compose restart app
```

**步骤 4：登录博客**

访问登录页面：`http://你的服务器IP:3000/login`

点击 "使用 GitHub 登录" 按钮，将跳转到 GitHub 授权页面，授权后自动登录。

✅ **优势**：

- 安全可靠，使用 GitHub 官方 OAuth
- 无需记忆复杂的登录链接
- 支持多用户管理（通过配置多个 GitHub ID）

💡 **管理员可以做什么**：

- ✅ 创建新文章（博客或文档）
- ✅ 编辑已有文章
- ✅ 删除文章
- ✅ 管理分类
- ✅ 修改文章发布状态（草稿/已发布/归档）
- ✅ 上传图片

✅ **成功标志**：

- 访客模式：可以浏览文章，但无法编辑
- 管理员模式：右上角有"写文章"按钮，可以创建和编辑文章

💡 **下一步**：如果你有域名，可以继续阅读[七、配置域名和 HTTPS（可选）](#七配置域名和-https可选)来配置自定义域名和 HTTPS 证书。

---

## 七、配置域名和 HTTPS（可选）

⚠️ **本步骤为可选项**：如果你没有域名或暂时不需要 HTTPS，可以跳过此步骤。使用 IP 地址访问博客已经完全可以正常使用。

如果你有自己的域名，强烈建议配置 HTTPS 证书，让你的博客更安全、更专业。

### 7.1 前置准备

在开始配置之前，请确保：

1. ✅ 你已经购买了域名（如 `myblog.com`）
2. ✅ 域名已经解析到你的服务器 IP 地址
3. ✅ 博客已经可以通过 IP 地址正常访问

### 7.2 配置域名（一键脚本）

项目提供了域名配置脚本，可以自动替换所有配置文件中的域名。

```bash
# 执行域名配置脚本
sudo bash deploy/scripts/setup-domain.sh 你的域名
# 例如：bash deploy/scripts/setup-domain.sh zhcmqtt.top
```

⏱️ **预计耗时**：10 秒

脚本会自动完成以下操作：

1. ✅ 备份原始配置文件
2. ✅ 替换 SSL 证书申请脚本中的域名
3. ✅ 创建新的 Nginx 配置文件（使用你的域名）
4. ✅ 输出后续操作步骤

### 7.3 部署 Nginx 配置

```bash
# 复制 Nginx 配置文件到系统目录
sudo cp /opt/Person_Web/deploy/nginx/你的域名.conf /etc/nginx/sites-available/
# 例如：sudo cp /opt/Person_Web/deploy/nginx/zhcmqtt.top.conf /etc/nginx/sites-available/

# 创建软链接启用配置
sudo ln -s /etc/nginx/sites-available/你的域名.conf /etc/nginx/sites-enabled/
# 例如：sudo ln -s /etc/nginx/sites-available/zhcmqtt.top.conf /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

✅ **预期输出**：`syntax is ok` 和 `test is successful`

### 7.4 申请 SSL 证书（一键脚本）

项目提供了 SSL 证书申请脚本，可以自动完成所有步骤。

```bash
# 执行 SSL 证书申请脚本
sudo bash /opt/Person_Web/deploy/scripts/setup-ssl.sh 你的域名 你的邮箱

# 例如：sudo bash /opt/Person_Web/deploy/scripts/setup-ssl.sh zhcmqtt.top admin@zhcmqtt.top
```

⏱️ **预计耗时**：2-3 分钟

脚本会自动完成以下操作：

1. ✅ 检查并安装 Certbot
2. ✅ 申请 Let's Encrypt SSL 证书
3. ✅ 配置证书自动续期
4. ✅ 测试证书续期功能
5. ✅ 重载 Nginx 配置

### 7.5 验证 HTTPS 访问

```bash
# 测试 HTTPS 访问
curl -I https://你的域名
```

✅ **预期输出**：`HTTP/2 200`

或者在浏览器中访问 `https://你的域名`，应该能看到绿色的锁图标。

### 7.6 证书自动续期说明

SSL 证书申请脚本已经自动配置了证书续期任务。Let's Encrypt 证书有效期为 90 天，系统会在到期前自动续期。

你可以手动测试续期功能：

```bash
# 测试证书续期（不会真正续期）
sudo certbot renew --dry-run
```

✅ **预期输出**：`Congratulations, all simulated renewals succeeded`

💡 **小贴士**：

- 证书会在到期前 30 天自动续期
- 续期失败会发送邮件通知到你配置的邮箱
- 可以使用 `sudo certbot certificates` 查看证书状态

---

## 常见问题解答

### Q1: 如何备份数据？

**备份数据库**：

```bash
# 创建备份目录
mkdir -p /opt/backups

# 备份数据库
docker exec person_web_mysql mysqldump -uroot -p你的数据库密码 personal_blog > /opt/backups/blog-$(date +%Y%m%d).sql

# 压缩备份文件
gzip /opt/backups/blog-$(date +%Y%m%d).sql
```

**备份上传的文件**：

```bash
# 备份 uploads 目录
tar -czf /opt/backups/uploads-$(date +%Y%m%d).tar.gz -C /opt/Person_Web uploads/
```

### Q2: 如何恢复数据？

**恢复数据库**：

```bash
# 解压备份文件
gunzip /opt/backups/blog-20260119.sql.gz

# 恢复数据库
docker exec -i person_web_mysql mysql -uroot -p你的数据库密码 personal_blog < /opt/backups/blog-20260119.sql
```

### Q3: 2G 内存服务器构建失败怎么办？

**问题现象**：

- 构建过程中显示 `Killed` 或 `exit code: 137`
- 构建卡在 `computing gzip size...` 阶段后失败
- 错误信息：`JavaScript heap out of memory` 或 `Reached heap limit`

**原因分析**：

2G 内存服务器在构建大型前端项目时容易出现内存不足（OOM）问题：
- 系统本身占用：200-300MB
- Docker 守护进程：100-200MB
- MySQL 容器（如运行）：400-500MB
- 构建进程需要：1GB+
- **总需求超过 2GB 可用内存**

**解决方案**：

项目已经针对 2G 内存服务器进行了优化，包括：

1. ✅ **降低 Node.js 堆内存**：限制为 1GB（`--max-old-space-size=1024`）
2. ✅ **禁用内存密集型操作**：
   - 禁用 source map 生成
   - 禁用 gzip 大小计算
   - 优化代码分割策略
3. ✅ **构建前释放内存**：自动停止 MySQL 容器释放约 400-500MB 内存

**如果仍然失败，可以尝试**：

**方案 1：启用 Swap 交换空间（推荐）**

```bash
# 创建 2GB Swap 文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 验证 Swap 已启用
free -h

# 永久启用（重启后生效）
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**方案 2：手动停止所有容器后构建**

```bash
cd /opt/Person_Web

# 停止所有容器释放内存
docker compose down

# 清理 Docker 缓存
docker system prune -af

# 重新部署
bash deploy/scripts/deploy.sh
```

**方案 3：升级服务器配置**

如果预算允许，建议升级到 4GB 内存配置，可以获得更稳定的构建体验。

---

## 日常维护指南

### 常用命令速查表

| 操作            | 命令                                               |
| --------------- | -------------------------------------------------- |
| 查看容器状态    | `docker compose ps`                                |
| 启动所有服务    | `docker compose up -d`                             |
| 停止所有服务    | `docker compose down`                              |
| 重启应用        | `docker compose restart app`                       |
| 重启数据库      | `docker compose restart mysql`                     |
| 查看应用日志    | `docker compose logs -f app`                       |
| 查看数据库日志  | `docker compose logs -f mysql`                     |
| 进入应用容器    | `docker exec -it person_web_app sh`                |
| 进入数据库容器  | `docker exec -it person_web_mysql mysql -uroot -p` |
| 重新部署        | `bash deploy/scripts/deploy.sh`                    |
| 重载 Nginx      | `sudo systemctl reload nginx`                      |
| 测试 Nginx 配置 | `sudo nginx -t`                                    |

### 定期维护任务

#### 每周任务

1. **检查容器状态**

   ```bash
   docker compose ps
   docker stats --no-stream
   ```

2. **查看磁盘使用情况**

   ```bash
   df -h
   du -sh /opt/Person_Web/uploads
   ```

3. **备份数据库**

   ```bash
   mkdir -p /opt/backups
   docker exec person_web_mysql mysqldump -uroot -p你的数据库密码 personal_blog | gzip > /opt/backups/blog-$(date +%Y%m%d).sql.gz
   ```

#### 每月任务

1. **更新系统软件包**

   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. **清理 Docker 资源**

   ```bash
   # 清理未使用的镜像、容器、网络
   docker system prune -a
   ```

3. **检查 SSL 证书有效期**

   ```bash
   sudo certbot certificates
   ```

#### 每季度任务

1. **完整备份**

   ```bash
   # 备份数据库
   docker exec person_web_mysql mysqldump -uroot -p你的数据库密码 personal_blog | gzip > /opt/backups/full-backup-$(date +%Y%m%d)-db.sql.gz

   # 备份上传文件
   tar -czf /opt/backups/full-backup-$(date +%Y%m%d)-uploads.tar.gz -C /opt/Person_Web uploads/

   # 备份配置文件
   cp /opt/Person_Web/.env.production /opt/backups/env-backup-$(date +%Y%m%d)
   ```

2. **性能优化检查**

   ```bash
   # 查看容器资源使用
   docker stats

   # 查看数据库大小
   docker exec person_web_mysql mysql -uroot -p你的数据库密码 -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables GROUP BY table_schema;"
   ```

### 故障排查流程

当博客出现问题时，按照以下流程排查：

1. **检查容器状态**

   ```bash
   docker compose ps
   ```

2. **查看应用日志**

   ```bash
   docker compose logs --tail=50 app
   ```

3. **查看数据库日志**

   ```bash
   docker compose logs --tail=50 mysql
   ```

4. **检查系统资源**

   ```bash
   free -h  # 内存使用
   df -h    # 磁盘使用
   ```

5. **重启服务**

   ```bash
   docker compose restart
   ```

6. **如果问题依然存在，查看详细日志**

   ```bash
   docker compose logs app > /tmp/app-logs.txt
   docker compose logs mysql > /tmp/mysql-logs.txt
   ```

---

## 附录

### 项目文件结构

```
Person_Web/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # UI 组件
│   │   └── lib/           # 工具函数
│   └── index.html
├── server/                # 后端代码
│   ├── _core/            # 核心功能
│   ├── routers.ts        # tRPC 路由
│   ├── db.ts             # 数据库操作
│   └── index.ts          # 服务器入口
├── drizzle/              # 数据库相关
│   ├── schema.ts         # 表结构定义
│   └── migrations/       # 迁移文件
├── deploy/               # 部署相关
│   ├── nginx/           # Nginx 配置
│   └── scripts/         # 部署脚本
├── uploads/              # 上传文件目录
├── .env.production       # 生产环境变量
├── docker-compose.yml    # Docker Compose 配置
├── Dockerfile            # Docker 镜像构建
└── package.json          # 项目依赖
```

### 技术栈说明

- **前端**: React 19 + TypeScript + Vite
- **后端**: Express + tRPC + TypeScript
- **数据库**: MySQL 8.0
- **ORM**: Drizzle ORM
- **容器化**: Docker + Docker Compose
- **Web 服务器**: Nginx
- **SSL 证书**: Let's Encrypt (Certbot)

### 获取帮助

如果遇到本文档未涵盖的问题：

1. **查看日志**
   - 应用日志：`docker compose logs app`
   - 数据库日志：`docker compose logs mysql`
   - Nginx 日志：`/var/log/nginx/error.log`

2. **在线资源**
   - Docker 官方文档：https://docs.docker.com/
   - Nginx 官方文档：https://nginx.org/en/docs/
   - MySQL 官方文档：https://dev.mysql.com/doc/

---

## 总结

恭喜你完成了 Person_Web 个人博客的部署！现在你已经拥有了一个功能完整的个人博客系统。

**你已经学会了**：

- ✅ 在云服务器上安装 Docker 环境
- ✅ 配置 Nginx 反向代理
- ✅ 申请免费的 HTTPS 证书
- ✅ 使用一键脚本部署应用
- ✅ 区分访客访问和管理员访问
- ✅ 日常维护和故障排查

**下一步建议**：

1. 创建你的第一篇博客文章
2. 配置博客的基本信息（关于页面等）
3. 设置定期备份任务
4. 优化 SEO 设置
5. 分享你的博客给朋友

**重要提醒**：

- 📌 定期备份数据库和上传文件
- 📌 关注 SSL 证书有效期
- 📌 定期更新系统和应用

祝你使用愉快！🎉

---

**文档版本**: v2.0.0
**最后更新**: 2026-01-19
**适用对象**: 有编程基础的开发者（不需要全栈经验）
