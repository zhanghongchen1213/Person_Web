# 部署脚本使用说明

本目录包含用于部署和维护 Person_Web 项目的脚本。

## 脚本列表

### 1. migrate.sh - 数据库迁移脚本

**用途**: 在 Docker 容器内执行 Drizzle ORM 数据库迁移

**使用场景**:
- 首次部署后初始化数据库结构
- 更新应用后同步数据库 Schema 变更
- 手动执行数据库迁移

**前置条件**:
- Docker 已安装并运行
- Docker Compose 已安装
- 应用容器 `person_web_app` 正在运行
- 数据库容器 `person_web_mysql` 正在运行且健康

**使用方法**:

```bash
# 在项目根目录执行
bash deploy/scripts/migrate.sh

# 或者直接执行（需要可执行权限）
./deploy/scripts/migrate.sh
```

**执行流程**:
1. 检查 Docker 环境
2. 检查 Docker Compose 可用性
3. 验证应用容器运行状态
4. 检查迁移文件是否存在
5. 在容器内执行数据库迁移

**输出示例**:

```
[INFO] ==========================================
[INFO] 数据库迁移脚本
[INFO] ==========================================
[INFO] 容器名称: person_web_app
[INFO] 迁移目录: /app/drizzle

[STEP] 1/5 检查 Docker 环境...
[INFO] Docker 已安装: Docker version 24.0.7

[STEP] 2/5 检查 Docker Compose...
[INFO] 使用 docker compose: Docker Compose version v2.23.0

[STEP] 3/5 检查应用容器状态...
[INFO] 容器 person_web_app 正在运行

[STEP] 4/5 检查迁移文件...
[INFO] 找到 5 个迁移文件

[STEP] 5/5 执行数据库迁移...
[INFO] 开始迁移...

[INFO] 连接数据库...
[INFO] 开始执行迁移...
[SUCCESS] 数据库迁移完成！

[INFO] ==========================================
[INFO] 数据库迁移成功完成！
[INFO] ==========================================
```

**故障排查**:

如果迁移失败，脚本会提供详细的排查步骤：

```bash
# 1. 检查数据库连接
docker-compose logs mysql

# 2. 检查环境变量
docker exec person_web_app env | grep DATABASE_URL

# 3. 检查应用日志
docker-compose logs app

# 4. 进入容器调试
docker exec -it person_web_app sh
```

**常见问题**:

1. **容器未运行**
   - 错误: `容器 person_web_app 未运行`
   - 解决: 先启动容器 `docker-compose up -d`

2. **数据库连接失败**
   - 错误: `连接数据库失败`
   - 解决: 检查 `.env.production` 中的 `DATABASE_URL` 配置

3. **迁移文件不存在**
   - 警告: `未找到迁移文件`
   - 解决: 运行 `pnpm drizzle-kit generate` 生成迁移文件

---

### 2. setup-ssl.sh - SSL 证书申请脚本

**用途**: 自动化申请和配置 Let's Encrypt SSL 证书

**使用场景**:
- 首次部署时申请 SSL 证书
- 证书过期前手动续期
- 更换域名后重新申请证书

**前置条件**:
- 服务器已安装 Nginx
- 域名已正确解析到服务器 IP
- 80 端口可访问（用于 HTTP-01 验证）

**使用方法**:

```bash
# 需要 root 权限执行
sudo bash deploy/scripts/setup-ssl.sh
```

**详细说明**: 请参考脚本内的注释

---

## 部署流程

### 首次部署

1. **启动容器**
   ```bash
   docker-compose up -d
   ```

2. **执行数据库迁移**
   ```bash
   bash deploy/scripts/migrate.sh
   ```

3. **配置 SSL 证书**（生产环境）
   ```bash
   sudo bash deploy/scripts/setup-ssl.sh
   ```

### 更新部署

1. **拉取最新代码**
   ```bash
   git pull origin main
   ```

2. **重新构建镜像**
   ```bash
   docker-compose build
   ```

3. **重启容器**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

4. **执行数据库迁移**（如有 Schema 变更）
   ```bash
   bash deploy/scripts/migrate.sh
   ```

---

## 注意事项

1. 所有脚本都包含详细的错误处理和日志输出
2. 脚本使用 `set -e` 确保遇到错误时立即退出
3. 建议在执行前先阅读脚本内容，了解执行流程
4. 生产环境操作前建议先备份数据库

---

## 技术支持

如有问题，请查看：
- 项目文档: `spec.md` 和 `plan.md`
- 部署文档: `deploy/README.md`（待创建）
- 错误日志: `docker-compose logs`
