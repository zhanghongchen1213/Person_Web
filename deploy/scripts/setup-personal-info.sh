#!/bin/bash

# Person_Web 个人信息配置脚本
# 用途: 交互式替换项目中的个人信息（GitHub 用户名、头像、邮箱、微信等）
# 作者: Personal Blog Project
# 日期: 2026-01-20

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

log_success() {
    echo -e "${CYAN}[SUCCESS]${NC} $1"
}

# 项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 默认值（当前项目中的值）
DEFAULT_GITHUB_USERNAME="zhanghongchen1213"
DEFAULT_DOMAIN="zhcmqtt.top"
DEFAULT_EMAIL="admin@zhcmqtt.top"
DEFAULT_WECHAT="zhang_hongchen"

log_info "=========================================="
log_info "Person_Web 个人信息配置脚本"
log_info "=========================================="
log_info "项目目录: $PROJECT_ROOT"
log_info ""
log_warn "此脚本将替换项目中的个人信息，包括："
log_info "  - GitHub 用户名和头像链接"
log_info "  - 域名"
log_info "  - 邮箱地址"
log_info "  - 微信号"
log_info "  - 其他联系方式"
log_info ""
log_warn "建议在运行此脚本前先备份项目！"
log_info ""
log_info "是否继续？[Y/n]"
read -r CONFIRM

if [[ "$CONFIRM" =~ ^([nN][oO]|[nN])$ ]]; then
    log_info "操作已取消"
    exit 0
fi

log_info ""
log_info "开始收集个人信息..."
log_info ""

# ============================================
# 收集用户输入
# ============================================

# GitHub 用户名
log_step "1/4 配置 GitHub 用户名"
log_info "当前值: $DEFAULT_GITHUB_USERNAME"
log_info "请输入您的 GitHub 用户名（留空保持不变）:"
read -r GITHUB_USERNAME
if [ -z "$GITHUB_USERNAME" ]; then
    GITHUB_USERNAME="$DEFAULT_GITHUB_USERNAME"
    log_info "保持默认值: $GITHUB_USERNAME"
fi
log_info ""

# 域名
log_step "2/4 配置域名"
log_info "当前值: $DEFAULT_DOMAIN"
log_info "请输入您的域名（留空保持不变）:"
read -r DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="$DEFAULT_DOMAIN"
    log_info "保持默认值: $DOMAIN"
fi
log_info ""

# 邮箱
log_step "3/4 配置邮箱地址"
log_info "当前值: $DEFAULT_EMAIL"
log_info "请输入您的邮箱地址（留空保持不变）:"
read -r EMAIL
if [ -z "$EMAIL" ]; then
    EMAIL="$DEFAULT_EMAIL"
    log_info "保持默认值: $EMAIL"
fi
log_info ""

# 微信号
log_step "4/4 配置微信号"
log_info "当前值: $DEFAULT_WECHAT"
log_info "请输入您的微信号（留空保持不变）:"
read -r WECHAT
if [ -z "$WECHAT" ]; then
    WECHAT="$DEFAULT_WECHAT"
    log_info "保持默认值: $WECHAT"
fi
log_info ""

# ============================================
# 确认配置
# ============================================
log_info "=========================================="
log_info "请确认以下配置信息："
log_info "=========================================="
log_info "  GitHub 用户名: $GITHUB_USERNAME"
log_info "  域名: $DOMAIN"
log_info "  邮箱: $EMAIL"
log_info "  微信号: $WECHAT"
log_info ""
log_info "是否继续替换？[Y/n]"
read -r CONFIRM_REPLACE

if [[ "$CONFIRM_REPLACE" =~ ^([nN][oO]|[nN])$ ]]; then
    log_info "操作已取消"
    exit 0
fi

log_info ""
log_info "开始替换个人信息..."
log_info ""

# ============================================
# 执行替换
# ============================================

# 需要替换的文件列表
FILES_TO_UPDATE=(
    "client/src/pages/About.tsx"
    "client/src/pages/ComponentShowcase.tsx"
    "client/src/components/Footer.tsx"
    "README.md"
    "TECHNICAL_DOCUMENTATION.md"
    "LEARNING_GUIDE.md"
)

# 替换计数器
REPLACED_COUNT=0

# 遍历文件进行替换
for file in "${FILES_TO_UPDATE[@]}"; do
    FILE_PATH="$PROJECT_ROOT/$file"

    if [ ! -f "$FILE_PATH" ]; then
        log_warn "文件不存在，跳过: $file"
        continue
    fi

    log_info "处理文件: $file"

    # 创建备份
    cp "$FILE_PATH" "${FILE_PATH}.backup"

    # 执行替换
    # 1. 替换 GitHub 用户名
    sed -i "s|$DEFAULT_GITHUB_USERNAME|$GITHUB_USERNAME|g" "$FILE_PATH"

    # 2. 替换域名
    sed -i "s|$DEFAULT_DOMAIN|$DOMAIN|g" "$FILE_PATH"

    # 3. 替换邮箱
    sed -i "s|$DEFAULT_EMAIL|$EMAIL|g" "$FILE_PATH"

    # 4. 替换微信号
    sed -i "s|$DEFAULT_WECHAT|$WECHAT|g" "$FILE_PATH"

    REPLACED_COUNT=$((REPLACED_COUNT + 1))
done

log_info ""
log_success "替换完成！共处理 $REPLACED_COUNT 个文件"
log_info ""

# ============================================
# 输出总结
# ============================================
log_info "=========================================="
log_success "个人信息配置完成！"
log_info "=========================================="
log_info ""
log_info "已替换的信息："
log_info "  GitHub 用户名: $DEFAULT_GITHUB_USERNAME → $GITHUB_USERNAME"
log_info "  域名: $DEFAULT_DOMAIN → $DOMAIN"
log_info "  邮箱: $DEFAULT_EMAIL → $EMAIL"
log_info "  微信号: $DEFAULT_WECHAT → $WECHAT"
log_info ""
log_info "已处理的文件："
for file in "${FILES_TO_UPDATE[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        log_info "  ✓ $file"
    fi
done
log_info ""
log_warn "备份文件已创建（*.backup），如需恢复请手动还原"
log_info ""
log_info "是否删除备份文件？[y/N]"
read -r DELETE_BACKUP

if [[ "$DELETE_BACKUP" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    for file in "${FILES_TO_UPDATE[@]}"; do
        BACKUP_FILE="$PROJECT_ROOT/${file}.backup"
        if [ -f "$BACKUP_FILE" ]; then
            rm "$BACKUP_FILE"
        fi
    done
    log_info "备份文件已删除"
else
    log_info "备份文件已保留"
fi

log_info ""
log_info "=========================================="
log_info "脚本执行完成！"
log_info "=========================================="
