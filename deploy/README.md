# Person_Web 生产环境部署指南

> 最后更新时间: 2026-01-19
> 目标服务器: 华为云 Ubuntu 22.04, 2C2G
> 域名: zhcmqtt.top

## 📋 目录

- [1. 服务器环境要求](#1-服务器环境要求)
- [2. Docker 和 Docker Compose 安装](#2-docker-和-docker-compose-安装)
- [3. Nginx 安装和配置](#3-nginx-安装和配置)
- [4. SSL 证书申请](#4-ssl-证书申请)
- [5. 首次部署流程](#5-首次部署流程)
- [6. 更新部署流程](#6-更新部署流程)
- [7. 常见问题排查 (FAQ)](#7-常见问题排查-faq)
- [8. 日志查看命令](#8-日志查看命令)
- [9. 备份和恢复指南](#9-备份和恢复指南)

---

## 1. 服务器环境要求

### 1.1 硬件配置

| 项目 | 最低要求 | 推荐配置 |
|------|---------|---------|
| CPU | 2 核心 | 2 核心 |
| 内存 | 2GB | 2GB 或更高 |
| 磁盘 | 20GB | 40GB 或更高 |
| 网络 | 1Mbps | 5Mbps 或更高 |

### 1.2 操作系统

- **推荐**: Ubuntu 22.04 LTS (Jammy Jellyfish)
- **支持**: Ubuntu 20.04 LTS, Debian 11+, CentOS 8+

### 1.3 软件依赖

| 软件 | 版本要求 | 说明 |
|------|---------|------|
| Docker | >= 20.10 | 容器运行时 |
| Docker Compose | >= 2.0 | 容器编排工具 |
| Nginx | >= 1.18 | 反向代理服务器 |
| Git | >= 2.25 | 版本控制（可选） |

### 1.4 网络要求

- **开放端口**:
  - `80` (HTTP) - 用于 SSL 证书验证和 HTTP 重定向
  - `443` (HTTPS) - 用于 HTTPS 访问
  - `22` (SSH) - 用于远程管理（建议修改默认端口）

- **域名解析**:
  - 确保域名 `zhcmqtt.top` 和 `www.zhcmqtt.top` 已正确解析到服务器 IP

### 1.5 安全建议

- ✅ 配置防火墙（UFW 或 iptables）
- ✅ 禁用 root 用户 SSH 登录
- ✅ 使用 SSH 密钥认证
- ✅ 定期更新系统补丁
- ✅ 配置自动备份

---

## 2. Docker 和 Docker Compose 安装

### 2.1 更新系统包

```bash
# 更新包索引
sudo apt update

# 升级已安装的包
sudo apt upgrade -y
```

### 2.2 安装 Docker

#### 方法 1: 使用官方安装脚本（推荐）

```bash
# 下载并执行 Docker 官方安装脚本
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 将当前用户添加到 docker 组（避免每次使用 sudo）
sudo usermod -aG docker $USER

# 重新登录以使组权限生效
# 或者执行: newgrp docker
```

#### 方法 2: 手动安装

```bash
# 安装依赖
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker APT 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 更新包索引
sudo apt update

# 安装 Docker Engine
sudo apt install -y docker-ce docker-ce-cli containerd.io

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
```

#### 验证 Docker 安装

```bash
# 检查 Docker 版本
docker --version
# 预期输出: Docker version 24.0.x, build xxxxx

# 测试 Docker 运行
docker run hello-world
# 预期输出: Hello from Docker! ...
```

### 2.3 安装 Docker Compose

Docker Compose V2 已集成到 Docker CLI 中，作为插件使用。

#### 验证 Docker Compose 安装

```bash
# 检查 Docker Compose 版本（V2）
docker compose version
# 预期输出: Docker Compose version v2.x.x

# 如果使用旧版本（V1）
docker-compose --version
# 预期输出: docker-compose version 1.x.x
```

#### 如果未安装 Docker Compose V2

```bash
# 下载 Docker Compose V2 插件
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose

# 添加执行权限
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# 验证安装
docker compose version
```

### 2.4 配置 Docker 服务

```bash
# 启动 Docker 服务
sudo systemctl start docker

# 设置 Docker 开机自启
sudo systemctl enable docker

# 检查 Docker 服务状态
sudo systemctl status docker
# 预期输出: Active: active (running)
```

---

## 3. Nginx 安装和配置

### 3.1 安装 Nginx

```bash
# 安装 Nginx
sudo apt install -y nginx

# 启动 Nginx 服务
sudo systemctl start nginx

# 设置 Nginx 开机自启
sudo systemctl enable nginx

# 检查 Nginx 服务状态
sudo systemctl status nginx
# 预期输出: Active: active (running)
```

### 3.2 验证 Nginx 安装

```bash
# 检查 Nginx 版本
nginx -v
# 预期输出: nginx version: nginx/1.18.x

# 测试 Nginx 配置语法
sudo nginx -t
# 预期输出: syntax is ok, test is successful

# 访问服务器 IP，应显示 Nginx 默认欢迎页面
curl http://localhost
```

### 3.3 配置防火墙

```bash
# 安装 UFW（如果未安装）
sudo apt install -y ufw

# 允许 SSH（重要！避免被锁定）
sudo ufw allow 22/tcp

# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 检查防火墙状态
sudo ufw status
# 预期输出:
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

### 3.4 部署 Nginx 配置文件

项目提供了完整的 Nginx 配置文件，位于 `deploy/nginx/zhcmqtt.top.conf`。

```bash
# 假设项目已克隆到 /opt/Person_Web
cd /opt/Person_Web

# 复制 Nginx 配置文件到 sites-available
sudo cp deploy/nginx/zhcmqtt.top.conf /etc/nginx/sites-available/zhcmqtt.top.conf

# 创建软链接到 sites-enabled
sudo ln -s /etc/nginx/sites-available/zhcmqtt.top.conf /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
sudo nginx -t

# 重载 Nginx 配置
sudo systemctl reload nginx
```

**注意**: 在申请 SSL 证书之前，Nginx 配置中的 SSL 相关部分会导致错误。建议先注释掉 HTTPS 服务器块，申请证书后再启用。

---

## 4. SSL 证书申请

### 4.1 安装 Certbot

```bash
# 安装 Certbot 和 Nginx 插件
sudo apt install -y certbot python3-certbot-nginx
```

### 4.2 申请 SSL 证书

#### 方法 1: 使用项目提供的脚本（推荐）

```bash
# 进入项目目录
cd /opt/Person_Web

# 执行 SSL 证书申请脚本
sudo bash deploy/scripts/setup-ssl.sh
```

#### 方法 2: 手动申请

```bash
# 使用 Certbot 申请证书（Nginx 插件会自动配置）
sudo certbot --nginx -d zhcmqtt.top -d www.zhcmqtt.top

# 或者使用 webroot 方式（需要手动配置 Nginx）
sudo certbot certonly --webroot -w /var/www/html -d zhcmqtt.top -d www.zhcmqtt.top
```

#### 申请过程中的提示

1. **输入邮箱地址**: 用于接收证书过期提醒
2. **同意服务条款**: 输入 `Y` 同意
3. **是否共享邮箱**: 输入 `N` 拒绝（可选）
4. **选择重定向**: 输入 `2` 自动重定向 HTTP 到 HTTPS（推荐）

### 4.3 验证 SSL 证书

```bash
# 检查证书文件是否存在
sudo ls -la /etc/letsencrypt/live/zhcmqtt.top/

# 预期输出:
# cert.pem -> ../../archive/zhcmqtt.top/cert1.pem
# chain.pem -> ../../archive/zhcmqtt.top/chain1.pem
# fullchain.pem -> ../../archive/zhcmqtt.top/fullchain1.pem
# privkey.pem -> ../../archive/zhcmqtt.top/privkey1.pem

# 测试 HTTPS 访问
curl -I https://zhcmqtt.top
# 预期输出: HTTP/2 200
```

### 4.4 配置证书自动续期

Certbot 会自动配置 cron job 或 systemd timer 来自动续期证书。

```bash
# 测试证书续期（dry-run 模式）
sudo certbot renew --dry-run

# 预期输出: Congratulations, all simulated renewals succeeded

# 检查自动续期配置
sudo systemctl list-timers | grep certbot
# 或
sudo crontab -l | grep certbot
```

### 4.5 更新 Nginx 配置

证书申请成功后，更新 Nginx 配置以启用 HTTPS。

```bash
# 编辑 Nginx 配置文件
sudo nano /etc/nginx/sites-available/zhcmqtt.top.conf

# 确保 SSL 证书路径正确:
# ssl_certificate /etc/letsencrypt/live/zhcmqtt.top/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/zhcmqtt.top/privkey.pem;

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## 5. 首次部署流程

### 5.1 准备工作

#### 5.1.1 创建项目目录

```bash
# 创建项目目录
sudo mkdir -p /opt/Person_Web

# 设置目录所有者（替换 your_user 为实际用户名）
sudo chown -R $USER:$USER /opt/Person_Web

# 进入项目目录
cd /opt/Person_Web
```

#### 5.1.2 获取项目代码

**方法 1: 使用 Git 克隆（推荐）**

```bash
# 克隆项目仓库
git clone <repository-url> /opt/Person_Web

# 进入项目目录
cd /opt/Person_Web
```

**方法 2: 上传代码包**

```bash
# 在本地打包项目（排除 node_modules 和 .git）
tar -czf person-web.tar.gz --exclude=node_modules --exclude=.git --exclude=dist .

# 上传到服务器
scp person-web.tar.gz user@server:/opt/

# 在服务器上解压
cd /opt
tar -xzf person-web.tar.gz -C Person_Web
cd Person_Web
```

### 5.2 配置环境变量

```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑环境变量文件
nano .env.production
```

**必需配置的环境变量**:

```env
# 数据库连接（Docker Compose 会自动配置）
DATABASE_URL=mysql://root:your_mysql_password@mysql:3306/personal_blog?charset=utf8mb4

# 运行环境
NODE_ENV=production

# JWT 密钥（必须修改为强密码！）
JWT_SECRET=your-very-strong-secret-key-here-change-me

# 管理员 OpenID（替换为实际的 OpenID）
OWNER_OPEN_ID=your-actual-openid-here

# 应用端口
PORT=3000

# MySQL 配置（用于 Docker Compose）
MYSQL_ROOT_PASSWORD=your_mysql_password
MYSQL_DATABASE=personal_blog
```

**生成强密码的方法**:

```bash
# 方法 1: 使用 openssl
openssl rand -base64 32

# 方法 2: 使用 /dev/urandom
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1

# 方法 3: 使用 pwgen（需要安装）
sudo apt install -y pwgen
pwgen -s 32 1
```

**安全提示**:
- ⚠️ **绝对不要**将 `.env.production` 文件提交到 Git 仓库
- ⚠️ **必须修改** `JWT_SECRET` 为强密码
- ⚠️ **必须修改** `MYSQL_ROOT_PASSWORD` 为强密码
- ⚠️ **必须配置** 正确的 `OWNER_OPEN_ID`

### 5.3 执行一键部署

项目提供了一键部署脚本，自动完成所有部署步骤。

```bash
# 进入项目目录
cd /opt/Person_Web

# 赋予脚本执行权限
chmod +x deploy/scripts/*.sh

# 执行一键部署脚本
bash deploy/scripts/deploy.sh
```

**部署脚本会自动执行以下步骤**:

1. ✅ 检查 Docker 和 Docker Compose 是否安装
2. ✅ 检查 `.env.production` 配置文件
3. ✅ 停止旧容器（如果存在）
4. ✅ 构建新的 Docker 镜像
5. ✅ 启动 MySQL 和 App 容器
6. ✅ 执行数据库迁移
7. ✅ 健康检查（等待应用启动）
8. ✅ 输出部署结果和常用命令

**预期输出**:

```
[INFO] ==========================================
[INFO] Person_Web 一键部署脚本
[INFO] ==========================================
[STEP] 1/8 检查 Docker 环境...
[INFO] Docker 已安装: Docker version 24.0.7
[STEP] 2/8 检查 Docker Compose...
[INFO] 使用 docker compose: Docker Compose version v2.24.0
[STEP] 3/8 检查 .env.production 配置文件...
[INFO] 配置文件存在: .env.production
[INFO] 环境变量验证通过
[STEP] 4/8 停止旧容器...
[INFO] 停止并删除旧容器...
[STEP] 5/8 构建新镜像...
[INFO] 开始构建 Docker 镜像（使用 --no-cache）...
[STEP] 6/8 启动新容器...
[INFO] 启动容器...
[STEP] 7/8 执行数据库迁移...
[INFO] 调用数据库迁移脚本...
[SUCCESS] 数据库迁移完成！
[STEP] 8/8 执行健康检查...
[INFO] 等待应用启动（最多 60 秒）...
[SUCCESS] 应用健康检查通过
[INFO] ==========================================
[SUCCESS] 部署成功完成！
[INFO] ==========================================
[INFO] 部署耗时: 120 秒
[INFO]
[INFO] 常用命令:
[INFO]   - 查看容器状态: docker compose ps
[INFO]   - 查看应用日志: docker compose logs -f app
[INFO]   - 查看数据库日志: docker compose logs -f mysql
[INFO]   - 重启应用: docker compose restart app
[INFO]   - 停止所有服务: docker compose down
[INFO]
[INFO] 访问地址:
[INFO]   - HTTP: http://zhcmqtt.top
[INFO]   - HTTPS: https://zhcmqtt.top
```

### 5.4 验证部署

#### 5.4.1 检查容器状态

```bash
# 查看所有容器状态
docker compose ps

# 预期输出:
# NAME                IMAGE               STATUS              PORTS
# person_web_app      person-web:latest   Up 2 minutes        0.0.0.0:3000->3000/tcp
# person_web_mysql    mysql:8.0           Up 2 minutes        0.0.0.0:3306->3306/tcp
```

#### 5.4.2 检查应用日志

```bash
# 查看应用日志（实时）
docker compose logs -f app

# 预期输出:
# [INFO] Server running on http://localhost:3000
# [INFO] Database connected successfully
```

#### 5.4.3 测试应用访问

```bash
# 测试本地访问
curl http://localhost:3000

# 测试域名访问（HTTP）
curl http://zhcmqtt.top

# 测试域名访问（HTTPS）
curl https://zhcmqtt.top
```

#### 5.4.4 浏览器访问

打开浏览器，访问 `https://zhcmqtt.top`，应该能看到应用首页。

### 5.5 初始化数据

首次部署后，需要初始化一些基础数据。

```bash
# 进入应用容器
docker exec -it person_web_app sh

# 在容器内执行初始化脚本（如果有）
# node dist/scripts/init-data.js

# 退出容器
exit
```

---

## 6. 更新部署流程

当需要更新应用代码时，使用以下流程。

### 6.1 拉取最新代码

```bash
# 进入项目目录
cd /opt/Person_Web

# 拉取最新代码
git pull origin main

# 或者上传新的代码包并解压
```

### 6.2 执行更新部署

```bash
# 执行一键部署脚本（会自动重新构建镜像）
bash deploy/scripts/deploy.sh
```

**更新部署流程**:

1. ✅ 停止旧容器
2. ✅ 构建新镜像（包含最新代码）
3. ✅ 启动新容器
4. ✅ 执行数据库迁移（如果有新的迁移）
5. ✅ 健康检查

### 6.3 零停机更新（可选）

如果需要零停机更新，可以使用滚动更新策略。

```bash
# 构建新镜像（不停止旧容器）
docker compose build app

# 滚动更新（逐个替换容器）
docker compose up -d --no-deps --build app

# 验证新容器运行正常
docker compose ps
docker compose logs -f app
```

### 6.4 回滚到上一个版本

如果更新后出现问题，可以快速回滚。

```bash
# 方法 1: 使用 Git 回滚代码
cd /opt/Person_Web
git log --oneline -5  # 查看最近 5 次提交
git checkout <previous-commit-hash>
bash deploy/scripts/deploy.sh

# 方法 2: 使用 Docker 镜像标签
docker tag person-web:latest person-web:backup
# 部署前先备份当前镜像，出问题时恢复
docker tag person-web:backup person-web:latest
docker compose up -d
```

---

## 7. 常见问题排查 (FAQ)

### 7.1 容器无法启动

**问题**: 执行 `docker compose up -d` 后容器无法启动

**排查步骤**:

```bash
# 1. 查看容器状态
docker compose ps

# 2. 查看容器日志
docker compose logs app
docker compose logs mysql

# 3. 检查端口占用
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3306

# 4. 检查磁盘空间
df -h

# 5. 检查内存使用
free -h
```

**常见原因**:

1. **端口被占用**: 修改 `docker-compose.yml` 中的端口映射
2. **内存不足**: 调整 `mem_limit` 配置或增加服务器内存
3. **磁盘空间不足**: 清理 Docker 镜像和容器 `docker system prune -a`
4. **环境变量错误**: 检查 `.env.production` 文件配置

### 7.2 数据库连接失败

**问题**: 应用日志显示 "Cannot connect to database"

**排查步骤**:

```bash
# 1. 检查 MySQL 容器状态
docker compose ps mysql

# 2. 查看 MySQL 日志
docker compose logs mysql

# 3. 测试数据库连接
docker exec -it person_web_mysql mysql -uroot -p
# 输入密码后应能进入 MySQL 命令行

# 4. 检查数据库是否存在
docker exec -it person_web_mysql mysql -uroot -p -e "SHOW DATABASES;"

# 5. 检查网络连接
docker exec -it person_web_app ping mysql
```

**解决方案**:

1. **MySQL 未就绪**: 等待 MySQL 健康检查通过（约 30 秒）
2. **密码错误**: 检查 `.env.production` 中的 `MYSQL_ROOT_PASSWORD`
3. **数据库不存在**: 检查 `MYSQL_DATABASE` 配置
4. **网络问题**: 重启容器 `docker compose restart`

### 7.3 Nginx 502 Bad Gateway

**问题**: 访问域名时显示 "502 Bad Gateway"

**排查步骤**:

```bash
# 1. 检查应用容器是否运行
docker compose ps app

# 2. 检查应用是否监听 3000 端口
docker exec -it person_web_app netstat -tulpn | grep :3000

# 3. 测试本地访问
curl http://localhost:3000

# 4. 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 5. 检查 Nginx 配置
sudo nginx -t
```

**解决方案**:

1. **应用未启动**: 启动应用容器 `docker compose up -d app`
2. **端口配置错误**: 检查 Nginx 配置中的 `proxy_pass` 地址
3. **防火墙阻止**: 检查防火墙规则 `sudo ufw status`
4. **SELinux 阻止**: 临时禁用 `sudo setenforce 0`（CentOS）

### 7.4 SSL 证书错误

**问题**: 浏览器显示 "Your connection is not private"

**排查步骤**:

```bash
# 1. 检查证书文件是否存在
sudo ls -la /etc/letsencrypt/live/zhcmqtt.top/

# 2. 检查证书有效期
sudo certbot certificates

# 3. 测试 SSL 配置
curl -vI https://zhcmqtt.top

# 4. 检查 Nginx SSL 配置
sudo nginx -t
```

**解决方案**:

1. **证书未申请**: 执行 `sudo certbot --nginx -d zhcmqtt.top`
2. **证书过期**: 手动续期 `sudo certbot renew`
3. **证书路径错误**: 检查 Nginx 配置中的证书路径
4. **域名不匹配**: 重新申请证书，包含所有子域名

### 7.5 应用性能问题

**问题**: 应用响应缓慢或超时

**排查步骤**:

```bash
# 1. 检查容器资源使用
docker stats

# 2. 查看应用日志（慢查询）
docker compose logs app | grep "SLOW QUERY"

# 3. 检查数据库性能
docker exec -it person_web_mysql mysql -uroot -p -e "SHOW PROCESSLIST;"

# 4. 检查磁盘 I/O
iostat -x 1 5

# 5. 检查网络延迟
ping zhcmqtt.top
```

**解决方案**:

1. **内存不足**: 增加容器内存限制或服务器内存
2. **数据库慢查询**: 优化 SQL 查询，添加索引
3. **缓存未命中**: 检查缓存配置，增加缓存 TTL
4. **磁盘 I/O 瓶颈**: 使用 SSD 或优化数据库配置

### 7.6 图片上传失败

**问题**: 上传图片时报错或图片无法显示

**排查步骤**:

```bash
# 1. 检查 uploads 目录权限
ls -la uploads/

# 2. 检查磁盘空间
df -h

# 3. 查看应用日志
docker compose logs app | grep "upload"

# 4. 测试上传功能
curl -X POST -F "file=@test.jpg" http://localhost:3000/api/upload
```

**解决方案**:

1. **权限不足**: 修改目录权限 `chmod 755 uploads/`
2. **磁盘空间不足**: 清理旧文件或扩容磁盘
3. **文件大小限制**: 修改 Nginx 配置 `client_max_body_size`
4. **路径配置错误**: 检查 `docker-compose.yml` 中的 volume 挂载

---

## 8. 日志查看命令

### 8.1 Docker 容器日志

```bash
# 查看所有容器日志
docker compose logs

# 查看应用日志（实时）
docker compose logs -f app

# 查看 MySQL 日志（实时）
docker compose logs -f mysql

# 查看最近 100 行日志
docker compose logs --tail=100 app

# 查看特定时间段的日志
docker compose logs --since="2026-01-19T10:00:00" app

# 查看日志并显示时间戳
docker compose logs -t app
```

### 8.2 Nginx 日志

```bash
# 查看 Nginx 访问日志（实时）
sudo tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志（实时）
sudo tail -f /var/log/nginx/error.log

# 查看特定域名的日志
sudo tail -f /var/log/nginx/zhcmqtt.top.access.log
sudo tail -f /var/log/nginx/zhcmqtt.top.error.log

# 统计访问量
sudo cat /var/log/nginx/access.log | wc -l

# 统计 IP 访问次数（Top 10）
sudo awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 统计访问最多的 URL（Top 10）
sudo awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10
```

### 8.3 系统日志

```bash
# 查看系统日志
sudo journalctl -xe

# 查看 Docker 服务日志
sudo journalctl -u docker -f

# 查看 Nginx 服务日志
sudo journalctl -u nginx -f

# 查看最近 1 小时的日志
sudo journalctl --since "1 hour ago"
```

### 8.4 应用性能日志

```bash
# 查看性能监控日志（每 5 分钟输出）
docker compose logs app | grep "Performance Stats"

# 查看缓存命中率
docker compose logs app | grep "Cache Hit Rate"

# 查看慢查询日志
docker compose logs app | grep "SLOW QUERY"

# 查看 API 请求耗时
docker compose logs app | grep "tRPC"
```

---

## 9. 备份和恢复指南

### 9.1 数据库备份

#### 9.1.1 手动备份

```bash
# 创建备份目录
mkdir -p /opt/backups/mysql

# 备份所有数据库
docker exec person_web_mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} --all-databases > /opt/backups/mysql/all-databases-$(date +%Y%m%d-%H%M%S).sql

# 备份单个数据库
docker exec person_web_mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} personal_blog > /opt/backups/mysql/personal_blog-$(date +%Y%m%d-%H%M%S).sql

# 压缩备份文件
gzip /opt/backups/mysql/personal_blog-$(date +%Y%m%d-%H%M%S).sql
```

#### 9.1.2 自动备份脚本

创建自动备份脚本 `/opt/scripts/backup-mysql.sh`:

```bash
#!/bin/bash

# 配置
BACKUP_DIR="/opt/backups/mysql"
MYSQL_ROOT_PASSWORD="your_mysql_password"
DATABASE_NAME="personal_blog"
RETENTION_DAYS=7

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份文件名
BACKUP_FILE="$BACKUP_DIR/${DATABASE_NAME}-$(date +%Y%m%d-%H%M%S).sql"

# 执行备份
docker exec person_web_mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} ${DATABASE_NAME} > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除超过保留期的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

#### 9.1.3 配置定时备份

```bash
# 赋予脚本执行权限
chmod +x /opt/scripts/backup-mysql.sh

# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨 2 点执行备份）
0 2 * * * /opt/scripts/backup-mysql.sh >> /var/log/mysql-backup.log 2>&1
```

### 9.2 数据库恢复

#### 9.2.1 从备份文件恢复

```bash
# 解压备份文件
gunzip /opt/backups/mysql/personal_blog-20260119-020000.sql.gz

# 恢复数据库
docker exec -i person_web_mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} personal_blog < /opt/backups/mysql/personal_blog-20260119-020000.sql

# 验证恢复结果
docker exec -it person_web_mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "USE personal_blog; SHOW TABLES;"
```

#### 9.2.2 恢复到新数据库

```bash
# 创建新数据库
docker exec -it person_web_mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "CREATE DATABASE personal_blog_restore;"

# 恢复到新数据库
docker exec -i person_web_mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} personal_blog_restore < /opt/backups/mysql/personal_blog-20260119-020000.sql

# 切换应用使用新数据库（修改 .env.production）
# DATABASE_URL=mysql://root:password@mysql:3306/personal_blog_restore?charset=utf8mb4

# 重启应用
docker compose restart app
```

### 9.3 上传文件备份

#### 9.3.1 手动备份

```bash
# 创建备份目录
mkdir -p /opt/backups/uploads

# 备份 uploads 目录
tar -czf /opt/backups/uploads/uploads-$(date +%Y%m%d-%H%M%S).tar.gz -C /opt/Person_Web uploads/

# 查看备份文件大小
ls -lh /opt/backups/uploads/
```

#### 9.3.2 自动备份脚本

创建自动备份脚本 `/opt/scripts/backup-uploads.sh`:

```bash
#!/bin/bash

# 配置
BACKUP_DIR="/opt/backups/uploads"
SOURCE_DIR="/opt/Person_Web/uploads"
RETENTION_DAYS=30

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份文件名
BACKUP_FILE="$BACKUP_DIR/uploads-$(date +%Y%m%d-%H%M%S).tar.gz"

# 执行备份
tar -czf $BACKUP_FILE -C $(dirname $SOURCE_DIR) $(basename $SOURCE_DIR)

# 删除超过保留期的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_FILE"
```

#### 9.3.3 配置定时备份

```bash
# 赋予脚本执行权限
chmod +x /opt/scripts/backup-uploads.sh

# 编辑 crontab
crontab -e

# 添加定时任务（每周日凌晨 3 点执行备份）
0 3 * * 0 /opt/scripts/backup-uploads.sh >> /var/log/uploads-backup.log 2>&1
```

### 9.4 上传文件恢复

```bash
# 解压备份文件到临时目录
mkdir -p /tmp/restore
tar -xzf /opt/backups/uploads/uploads-20260119-030000.tar.gz -C /tmp/restore

# 停止应用容器（避免文件冲突）
docker compose stop app

# 恢复文件
rm -rf /opt/Person_Web/uploads/*
cp -r /tmp/restore/uploads/* /opt/Person_Web/uploads/

# 设置正确的权限
chmod -R 755 /opt/Person_Web/uploads/

# 启动应用容器
docker compose start app

# 清理临时文件
rm -rf /tmp/restore
```

### 9.5 完整系统备份

#### 9.5.1 创建完整备份脚本

创建 `/opt/scripts/backup-full.sh`:

```bash
#!/bin/bash

# 配置
BACKUP_ROOT="/opt/backups"
PROJECT_DIR="/opt/Person_Web"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/full-$TIMESTAMP"

# 创建备份目录
mkdir -p $BACKUP_DIR

echo "Starting full backup at $(date)"

# 1. 备份数据库
echo "Backing up database..."
docker exec person_web_mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} personal_blog | gzip > $BACKUP_DIR/database.sql.gz

# 2. 备份上传文件
echo "Backing up uploads..."
tar -czf $BACKUP_DIR/uploads.tar.gz -C $PROJECT_DIR uploads/

# 3. 备份配置文件
echo "Backing up configuration..."
cp $PROJECT_DIR/.env.production $BACKUP_DIR/
cp $PROJECT_DIR/docker-compose.yml $BACKUP_DIR/

# 4. 创建备份清单
echo "Creating backup manifest..."
cat > $BACKUP_DIR/manifest.txt <<EOF
Backup Date: $(date)
Database: personal_blog
Uploads Size: $(du -sh $PROJECT_DIR/uploads | cut -f1)
Configuration: .env.production, docker-compose.yml
EOF

# 5. 压缩整个备份目录
echo "Compressing backup..."
tar -czf $BACKUP_ROOT/full-backup-$TIMESTAMP.tar.gz -C $BACKUP_ROOT full-$TIMESTAMP

# 6. 清理临时目录
rm -rf $BACKUP_DIR

# 7. 删除超过 30 天的备份
find $BACKUP_ROOT -name "full-backup-*.tar.gz" -mtime +30 -delete

echo "Full backup completed: $BACKUP_ROOT/full-backup-$TIMESTAMP.tar.gz"
```

#### 9.5.2 从完整备份恢复

```bash
# 解压完整备份
BACKUP_FILE="/opt/backups/full-backup-20260119-040000.tar.gz"
RESTORE_DIR="/tmp/restore-full"

mkdir -p $RESTORE_DIR
tar -xzf $BACKUP_FILE -C $RESTORE_DIR

# 进入恢复目录
cd $RESTORE_DIR/full-20260119-040000

# 1. 恢复数据库
echo "Restoring database..."
gunzip -c database.sql.gz | docker exec -i person_web_mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} personal_blog

# 2. 恢复上传文件
echo "Restoring uploads..."
docker compose stop app
tar -xzf uploads.tar.gz -C /opt/Person_Web/
docker compose start app

# 3. 恢复配置文件（可选，谨慎操作）
echo "Configuration files available in: $RESTORE_DIR/full-20260119-040000"
echo "Please review before restoring: .env.production, docker-compose.yml"

# 清理
cd /
rm -rf $RESTORE_DIR

echo "Restore completed!"
```

### 9.6 远程备份（推荐）

#### 9.6.1 使用 rsync 同步到远程服务器

```bash
# 安装 rsync
sudo apt install -y rsync

# 同步备份到远程服务器
rsync -avz --delete /opt/backups/ user@backup-server:/backups/person-web/

# 添加到 crontab（每天凌晨 4 点同步）
0 4 * * * rsync -avz --delete /opt/backups/ user@backup-server:/backups/person-web/ >> /var/log/rsync-backup.log 2>&1
```

#### 9.6.2 使用对象存储（阿里云 OSS / 腾讯云 COS）

```bash
# 安装 ossutil（阿里云 OSS 工具）
wget http://gosspublic.alicdn.com/ossutil/1.7.15/ossutil64
chmod +x ossutil64
sudo mv ossutil64 /usr/local/bin/ossutil

# 配置 OSS
ossutil config

# 上传备份到 OSS
ossutil cp -r /opt/backups/ oss://your-bucket/person-web-backups/

# 添加到 crontab（每天凌晨 5 点上传）
0 5 * * * ossutil cp -r /opt/backups/ oss://your-bucket/person-web-backups/ >> /var/log/oss-backup.log 2>&1
```

---

## 10. 附录

### 10.1 项目文件结构

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
│   │   └── zhcmqtt.top.conf
│   ├── scripts/         # 部署脚本
│   │   ├── deploy.sh    # 一键部署
│   │   ├── migrate.sh   # 数据库迁移
│   │   └── setup-ssl.sh # SSL 证书申请
│   └── README.md        # 本文档
├── uploads/              # 上传文件目录
├── .env.production       # 生产环境变量
├── docker-compose.yml    # Docker Compose 配置
├── Dockerfile            # Docker 镜像构建
└── package.json          # 项目依赖

```

### 10.2 常用命令速查表

| 操作 | 命令 |
|------|------|
| 启动所有服务 | `docker compose up -d` |
| 停止所有服务 | `docker compose down` |
| 重启应用 | `docker compose restart app` |
| 查看容器状态 | `docker compose ps` |
| 查看应用日志 | `docker compose logs -f app` |
| 进入应用容器 | `docker exec -it person_web_app sh` |
| 进入数据库容器 | `docker exec -it person_web_mysql mysql -uroot -p` |
| 执行数据库迁移 | `bash deploy/scripts/migrate.sh` |
| 一键部署 | `bash deploy/scripts/deploy.sh` |
| 重载 Nginx | `sudo systemctl reload nginx` |
| 测试 Nginx 配置 | `sudo nginx -t` |
| 查看 Nginx 日志 | `sudo tail -f /var/log/nginx/error.log` |
| 续期 SSL 证书 | `sudo certbot renew` |
| 清理 Docker 资源 | `docker system prune -a` |
| 查看容器资源使用 | `docker stats` |

### 10.3 性能优化建议

#### 10.3.1 数据库优化

```sql
-- 添加索引（在 MySQL 容器内执行）
ALTER TABLE articles ADD INDEX idx_status (status);
ALTER TABLE articles ADD INDEX idx_type (type);
ALTER TABLE articles ADD INDEX idx_category_id (categoryId);
ALTER TABLE articles ADD INDEX idx_published_at (publishedAt);

-- 查看慢查询日志
SHOW VARIABLES LIKE 'slow_query%';
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

#### 10.3.2 Nginx 优化

在 `deploy/nginx/zhcmqtt.top.conf` 中添加:

```nginx
# 增加 worker 进程数
worker_processes auto;

# 增加连接数
events {
    worker_connections 2048;
}

# 启用 HTTP/2
listen 443 ssl http2;

# 增加缓冲区大小
client_body_buffer_size 128k;
client_max_body_size 10m;
```

#### 10.3.3 Docker 优化

在 `docker-compose.yml` 中调整资源限制:

```yaml
# 根据实际使用情况调整
app:
  mem_limit: 768m  # 增加到 768MB
  cpus: 1.5        # 增加到 1.5 核心

mysql:
  mem_limit: 1024m # 增加到 1GB
  cpus: 1.5        # 增加到 1.5 核心
```

### 10.4 安全加固建议

1. **修改 SSH 默认端口**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Port 22 改为 Port 2222
   sudo systemctl restart sshd
   ```

2. **配置 fail2ban 防止暴力破解**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

3. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **配置自动安全更新**
   ```bash
   sudo apt install -y unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

5. **限制 Docker 容器权限**
   ```yaml
   # 在 docker-compose.yml 中添加
   security_opt:
     - no-new-privileges:true
   read_only: true
   ```

### 10.5 监控和告警

#### 10.5.1 使用 Uptime Kuma 监控

```bash
# 安装 Uptime Kuma
docker run -d --restart=always -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:1

# 访问 http://your-server:3001 配置监控
```

#### 10.5.2 配置邮件告警

```bash
# 安装 mailutils
sudo apt install -y mailutils

# 测试邮件发送
echo "Test email" | mail -s "Test Subject" your-email@example.com
```

---

## 11. 联系与支持

### 11.1 技术支持

- **项目文档**: 查看 [plan.md](../plan.md) 了解详细的开发计划
- **技术规范**: 查看 [spec.md](../spec.md) 了解项目需求和技术规范
- **项目启动指南**: 查看 [PROJECT_ANALYSIS.md](../PROJECT_ANALYSIS.md)

### 11.2 常见资源

- **Docker 官方文档**: https://docs.docker.com/
- **Docker Compose 文档**: https://docs.docker.com/compose/
- **Nginx 官方文档**: https://nginx.org/en/docs/
- **Let's Encrypt 文档**: https://letsencrypt.org/docs/
- **MySQL 官方文档**: https://dev.mysql.com/doc/

### 11.3 故障排查流程

1. **查看容器状态**: `docker compose ps`
2. **查看应用日志**: `docker compose logs -f app`
3. **查看数据库日志**: `docker compose logs -f mysql`
4. **查看 Nginx 日志**: `sudo tail -f /var/log/nginx/error.log`
5. **检查系统资源**: `docker stats`, `free -h`, `df -h`
6. **参考本文档的 FAQ 章节**

---

**文档版本**: v1.0.0
**最后更新**: 2026-01-19
**维护者**: Person_Web Project Team

---

