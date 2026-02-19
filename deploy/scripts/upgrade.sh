#!/bin/bash

# ============================================
# 一键升级脚本 (One-Click Upgrade Script)
# ============================================
# 用途: 自动化升级 Person_Web 项目到最新版本
# 作者: Personal Blog Project
# 日期: 2026-02-04
#
# 使用方法:
#   bash deploy/scripts/upgrade.sh
#
# 功能:
#   1. 备份当前数据库和配置文件
#   2. 拉取最新代码
#   3. 重新构建并部署应用
#   4. 验证升级结果
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
PROJECT_DIR="/opt/Person_Web/Person_Web-main"
BACKUP_DIR="/opt/backups"
ENV_FILE=".env.production"
DATE_STAMP=$(date +%Y%m%d-%H%M%S)

# ============================================
# 打印欢迎信息
# ============================================
echo ""
echo "============================================"
echo "  Person_Web 一键升级脚本"
echo "============================================"
echo ""
log_info "开始升级流程..."
log_info "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ============================================
# Step 1: 检查当前目录
# ============================================
log_step "1/5 检查项目目录..."

if [ ! -f "$PROJECT_DIR/$ENV_FILE" ]; then
    log_error "未找到 $ENV_FILE 文件"
    log_info "请确保在正确的项目目录中运行此脚本"
    exit 1
fi

cd "$PROJECT_DIR"
log_success "项目目录确认: $PROJECT_DIR"

# ============================================
# Step 2: 备份当前数据
# ============================================
log_step "2/5 备份当前数据..."

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 获取数据库密码
DB_PASSWORD=$(grep MYSQL_ROOT_PASSWORD "$ENV_FILE" | cut -d'=' -f2)

if [ -z "$DB_PASSWORD" ]; then
    log_warn "无法获取数据库密码，跳过数据库备份"
else
    # 备份数据库
    log_info "备份数据库..."
    if docker exec person_web_mysql mysqldump -uroot -p"$DB_PASSWORD" personal_blog 2>/dev/null | gzip > "$BACKUP_DIR/upgrade-backup-$DATE_STAMP.sql.gz"; then
        log_success "数据库备份完成: $BACKUP_DIR/upgrade-backup-$DATE_STAMP.sql.gz"
    else
        log_warn "数据库备份失败，但将继续升级"
    fi
fi

# 备份配置文件
log_info "备份配置文件..."
cp "$ENV_FILE" "$BACKUP_DIR/env-backup-$DATE_STAMP"
log_success "配置文件备份完成: $BACKUP_DIR/env-backup-$DATE_STAMP"

# ============================================
# Step 3: 拉取最新代码
# ============================================
log_step "3/5 拉取最新代码..."

# 检查是否是 Git 仓库
if [ ! -d ".git" ]; then
    log_error "当前目录不是 Git 仓库"
    log_info "请先初始化 Git 仓库或使用 git clone 获取项目"
    exit 1
fi

# 保存本地修改（如果有）
if ! git diff --quiet 2>/dev/null; then
    log_warn "检测到本地修改，正在暂存..."
    git stash
fi

# 拉取最新代码
log_info "从 GitHub 拉取最新代码..."
if git pull origin main; then
    log_success "代码更新完成"
else
    log_error "代码拉取失败"
    log_info "可能的原因："
    log_info "  1. 网络连接问题"
    log_info "  2. Git 仓库配置问题"
    log_info "  3. 存在合并冲突"
    exit 1
fi

# 显示最新提交
log_info "最新提交:"
git log --oneline -3

# ============================================
# Step 4: 重新部署应用
# ============================================
log_step "4/5 重新部署应用..."

log_info "调用部署脚本..."
if bash deploy/scripts/deploy.sh; then
    log_success "应用部署完成"
else
    log_error "部署失败"
    log_info "请检查部署日志并手动修复问题"
    exit 1
fi

# ============================================
# Step 5: 验证升级结果
# ============================================
log_step "5/5 验证升级结果..."

# 等待应用启动
sleep 5

# 检查容器状态
log_info "检查容器状态..."
docker compose --env-file "$ENV_FILE" ps

# 检查应用健康状态
APP_STATUS=$(docker inspect --format='{{.State.Health.Status}}' person_web_app 2>/dev/null || echo "unknown")
MYSQL_STATUS=$(docker inspect --format='{{.State.Health.Status}}' person_web_mysql 2>/dev/null || echo "unknown")

if [ "$APP_STATUS" = "healthy" ] && [ "$MYSQL_STATUS" = "healthy" ]; then
    log_success "所有容器运行正常"
else
    log_warn "容器状态: app=$APP_STATUS, mysql=$MYSQL_STATUS"
    log_info "请等待几秒后再次检查: docker compose --env-file $ENV_FILE ps"
fi

# ============================================
# 升级完成
# ============================================
echo ""
echo "============================================"
echo -e "${GREEN}  升级完成！${NC}"
echo "============================================"
echo ""
log_info "升级时间: $(date '+%Y-%m-%d %H:%M:%S')"
log_info "备份位置: $BACKUP_DIR"
echo ""
log_info "常用命令:"
echo "  查看容器状态:  docker compose --env-file $ENV_FILE ps"
echo "  查看应用日志:  docker compose --env-file $ENV_FILE logs -f app"
echo "  回滚数据库:    gunzip -c $BACKUP_DIR/upgrade-backup-$DATE_STAMP.sql.gz | docker exec -i person_web_mysql mysql -uroot -p\$DB_PASSWORD personal_blog"
echo ""
