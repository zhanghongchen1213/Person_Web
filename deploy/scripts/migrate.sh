#!/bin/bash

# 数据库迁移脚本
# 用途: 在 Docker 容器内执行 Drizzle ORM 数据库迁移
# 作者: Personal Blog Project
# 日期: 2026-01-19

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 配置变量
CONTAINER_NAME="person_web_app"
COMPOSE_FILE="docker-compose.yml"
MIGRATION_DIR="/app/drizzle"

log_info "=========================================="
log_info "数据库迁移脚本"
log_info "=========================================="
log_info "容器名称: ${CONTAINER_NAME}"
log_info "迁移目录: ${MIGRATION_DIR}"
log_info ""

# 1. 检查 Docker 是否安装
log_step "1/5 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装，请先安装 Docker"
    log_info "安装指南: https://docs.docker.com/engine/install/"
    exit 1
fi
log_info "Docker 已安装: $(docker --version)"

# 2. 检查 docker-compose 是否可用
log_step "2/5 检查 Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    log_info "使用 docker-compose: $(docker-compose --version)"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    log_info "使用 docker compose: $(docker compose version)"
else
    log_error "Docker Compose 未安装"
    log_info "请安装 Docker Compose 或使用 Docker Compose V2"
    exit 1
fi

# 3. 检查容器是否运行
log_step "3/5 检查应用容器状态..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_error "容器 ${CONTAINER_NAME} 未运行"
    log_info "请先启动容器: ${COMPOSE_CMD} up -d"
    log_info "或检查容器名称是否正确: docker ps"
    exit 1
fi
log_info "容器 ${CONTAINER_NAME} 正在运行"

# 4. 检查迁移文件是否存在
log_step "4/5 检查迁移文件..."
MIGRATION_COUNT=$(docker exec "${CONTAINER_NAME}" sh -c "ls -1 ${MIGRATION_DIR}/*.sql 2>/dev/null | wc -l" || echo "0")
if [ "$MIGRATION_COUNT" -eq 0 ]; then
    log_warn "未找到迁移文件 (*.sql)"
    log_info "迁移目录: ${MIGRATION_DIR}"
    log_info "如果这是首次部署，请确保已生成迁移文件"
    log_info "生成迁移: pnpm drizzle-kit generate"
else
    log_info "找到 ${MIGRATION_COUNT} 个迁移文件"
fi

# 5. 执行数据库迁移
log_step "5/5 执行数据库迁移..."
log_info "开始迁移..."
echo ""

# 执行迁移命令
if docker exec "${CONTAINER_NAME}" sh -c "cd /app && node -e \"
const { drizzle } = require('drizzle-orm/mysql2');
const { migrate } = require('drizzle-orm/mysql2/migrator');
const mysql = require('mysql2/promise');

(async () => {
  try {
    console.log('[INFO] 连接数据库...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection);

    console.log('[INFO] 开始执行迁移...');
    await migrate(db, { migrationsFolder: './drizzle/migrations' });

    console.log('[SUCCESS] 数据库迁移完成！');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] 迁移失败:', error.message);
    process.exit(1);
  }
})();
\""; then
    echo ""
    log_info "=========================================="
    log_info "数据库迁移成功完成！"
    log_info "=========================================="
    log_info ""
    log_info "后续操作:"
    log_info "  - 查看应用日志: ${COMPOSE_CMD} logs -f app"
    log_info "  - 重启应用: ${COMPOSE_CMD} restart app"
    log_info "  - 查看容器状态: ${COMPOSE_CMD} ps"
    log_info ""
else
    echo ""
    log_error "=========================================="
    log_error "数据库迁移失败！"
    log_error "=========================================="
    log_info ""
    log_info "故障排查步骤:"
    log_info "  1. 检查数据库连接: ${COMPOSE_CMD} logs mysql"
    log_info "  2. 检查环境变量: docker exec ${CONTAINER_NAME} env | grep DATABASE_URL"
    log_info "  3. 检查应用日志: ${COMPOSE_CMD} logs app"
    log_info "  4. 进入容器调试: docker exec -it ${CONTAINER_NAME} sh"
    log_info ""
    exit 1
fi
