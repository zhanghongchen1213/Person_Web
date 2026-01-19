#!/bin/bash

# ============================================
# 一键部署脚本 (One-Click Deployment Script)
# ============================================
# 用途: 自动化部署 Person_Web 项目到生产环境
# 作者: Personal Blog Project
# 日期: 2026-01-19
#
# 使用方法:
#   首次部署: bash deploy.sh
#   更新部署: bash deploy.sh
#
# 功能:
#   1. 检查 Docker 和 Docker Compose 是否安装
#   2. 检查 .env.production 配置文件
#   3. 停止旧容器
#   4. 构建新镜像
#   5. 启动新容器
#   6. 执行数据库迁移
#   7. 健康检查
#   8. 输出部署结果
# ============================================

set -e  # 遇到错误立即退出

# ============================================
# 颜色输出配置
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# 日志函数
# ============================================
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

log_success() {
    echo -e "${CYAN}[SUCCESS]${NC} $1"
}

# ============================================
# 配置变量
# ============================================
PROJECT_NAME="Person_Web"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"
CONTAINER_APP="person_web_app"
CONTAINER_MYSQL="person_web_mysql"
HEALTH_CHECK_TIMEOUT=60  # 健康检查超时时间（秒）
HEALTH_CHECK_INTERVAL=5  # 健康检查间隔（秒）

# ============================================
# 打印欢迎信息
# ============================================
echo ""
echo "============================================"
echo "  ${PROJECT_NAME} 一键部署脚本"
echo "============================================"
echo ""
log_info "开始部署流程..."
log_info "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ============================================
# Step 1: 检查 Docker 是否安装
# ============================================
log_step "1/8 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装"
    log_info "请先安装 Docker: https://docs.docker.com/engine/install/"
    exit 1
fi
log_info "Docker 已安装: $(docker --version)"

# ============================================
# Step 2: 检查 Docker Compose 是否安装
# ============================================
log_step "2/8 检查 Docker Compose..."
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

# ============================================
# Step 3: 检查 .env.production 文件
# ============================================
log_step "3/8 检查环境配置文件..."
if [ ! -f "$ENV_FILE" ]; then
    log_error "未找到 ${ENV_FILE} 文件"
    log_info "请先创建环境配置文件:"
    log_info "  1. 复制模板: cp .env.production.example .env.production"
    log_info "  2. 编辑配置: vim .env.production"
    log_info "  3. 配置必需的环境变量 (DATABASE_URL, JWT_SECRET, OWNER_OPEN_ID)"
    exit 1
fi
log_info "环境配置文件已找到: ${ENV_FILE}"

# 检查必需的环境变量
log_info "验证环境变量..."
source "$ENV_FILE"
MISSING_VARS=()

if [ -z "$JWT_SECRET" ]; then
    MISSING_VARS+=("JWT_SECRET")
fi

if [ -z "$OWNER_OPEN_ID" ]; then
    MISSING_VARS+=("OWNER_OPEN_ID")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    log_error "缺少必需的环境变量: ${MISSING_VARS[*]}"
    log_info "请在 ${ENV_FILE} 中配置这些变量"
    exit 1
fi
log_info "环境变量验证通过"

# ============================================
# Step 4: 停止旧容器
# ============================================
log_step "4/8 停止旧容器..."
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_APP}$"; then
    log_info "发现运行中的容器，正在停止..."
    $COMPOSE_CMD down
    log_info "旧容器已停止"
else
    log_info "未发现运行中的容器，跳过停止步骤"
fi

# ============================================
# Step 5: 构建新镜像
# ============================================
log_step "5/8 构建 Docker 镜像..."
log_info "开始构建镜像（这可能需要几分钟）..."
echo ""

if $COMPOSE_CMD build --no-cache; then
    echo ""
    log_success "镜像构建成功"

    # 显示镜像信息
    IMAGE_SIZE=$(docker images person_web_app --format "{{.Size}}" | head -n 1)
    if [ -n "$IMAGE_SIZE" ]; then
        log_info "镜像大小: ${IMAGE_SIZE}"
    fi
else
    echo ""
    log_error "镜像构建失败"
    log_info "请检查构建日志并修复错误"
    exit 1
fi

# ============================================
# Step 6: 启动新容器
# ============================================
log_step "6/8 启动容器..."
log_info "启动 MySQL 和应用容器..."
echo ""

if $COMPOSE_CMD up -d; then
    echo ""
    log_success "容器启动成功"
else
    echo ""
    log_error "容器启动失败"
    log_info "查看日志: ${COMPOSE_CMD} logs"
    exit 1
fi

# 等待 MySQL 容器健康
log_info "等待 MySQL 容器就绪..."
MYSQL_WAIT=0
while [ $MYSQL_WAIT -lt 30 ]; do
    if docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_MYSQL" 2>/dev/null | grep -q "healthy"; then
        log_success "MySQL 容器已就绪"
        break
    fi
    sleep 2
    MYSQL_WAIT=$((MYSQL_WAIT + 2))
    echo -n "."
done
echo ""

if [ $MYSQL_WAIT -ge 30 ]; then
    log_warn "MySQL 容器启动超时，但将继续部署流程"
fi

# ============================================
# Step 7: 执行数据库迁移
# ============================================
log_step "7/8 执行数据库迁移..."
log_info "调用迁移脚本..."
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATE_SCRIPT="${SCRIPT_DIR}/migrate.sh"

if [ -f "$MIGRATE_SCRIPT" ]; then
    if bash "$MIGRATE_SCRIPT"; then
        echo ""
        log_success "数据库迁移完成"
    else
        echo ""
        log_error "数据库迁移失败"
        log_info "请检查迁移日志并手动修复"
        log_info "容器仍在运行，您可以手动执行迁移"
        exit 1
    fi
else
    log_warn "未找到迁移脚本: ${MIGRATE_SCRIPT}"
    log_info "跳过数据库迁移步骤"
fi

# ============================================
# Step 8: 健康检查
# ============================================
log_step "8/8 执行健康检查..."
log_info "等待应用启动（最多 ${HEALTH_CHECK_TIMEOUT} 秒）..."

ELAPSED=0
HEALTH_OK=false

while [ $ELAPSED -lt $HEALTH_CHECK_TIMEOUT ]; do
    # 检查容器是否运行
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_APP}$"; then
        log_error "应用容器已停止"
        log_info "查看日志: ${COMPOSE_CMD} logs app"
        exit 1
    fi

    # 检查健康状态
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_APP" 2>/dev/null || echo "unknown")

    if [ "$HEALTH_STATUS" = "healthy" ]; then
        HEALTH_OK=true
        break
    elif [ "$HEALTH_STATUS" = "unhealthy" ]; then
        log_error "应用健康检查失败"
        log_info "查看日志: ${COMPOSE_CMD} logs app"
        exit 1
    fi

    # 显示进度
    echo -n "."
    sleep $HEALTH_CHECK_INTERVAL
    ELAPSED=$((ELAPSED + HEALTH_CHECK_INTERVAL))
done

echo ""

if [ "$HEALTH_OK" = true ]; then
    log_success "应用健康检查通过"
else
    log_warn "健康检查超时，但容器仍在运行"
    log_info "请手动验证应用状态"
fi

# ============================================
# 部署完成 - 输出结果
# ============================================
echo ""
echo "============================================"
log_success "部署完成！"
echo "============================================"
echo ""

# 显示容器状态
log_info "容器状态:"
$COMPOSE_CMD ps
echo ""

# 显示有用的命令
log_info "常用命令:"
echo "  查看应用日志:   ${COMPOSE_CMD} logs -f app"
echo "  查看数据库日志: ${COMPOSE_CMD} logs -f mysql"
echo "  查看所有日志:   ${COMPOSE_CMD} logs -f"
echo "  重启应用:       ${COMPOSE_CMD} restart app"
echo "  停止服务:       ${COMPOSE_CMD} down"
echo "  查看容器状态:   ${COMPOSE_CMD} ps"
echo "  进入应用容器:   docker exec -it ${CONTAINER_APP} sh"
echo ""

# 显示访问信息
log_info "访问信息:"
echo "  本地访问: http://localhost:3000"
echo "  生产访问: https://zhcmqtt.top (需配置 Nginx)"
echo ""

log_info "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "============================================"
