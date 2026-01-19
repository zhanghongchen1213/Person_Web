#!/bin/bash

# 域名配置脚本
# 用途: 自动替换项目中所有硬编码的域名
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

# 默认域名（用于替换）
DEFAULT_DOMAIN="zhcmqtt.top"

# 项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

log_info "=========================================="
log_info "Person_Web 域名配置脚本"
log_info "=========================================="
log_info "项目目录: $PROJECT_ROOT"
log_info ""

# 1. 获取用户输入的域名
if [ -z "$1" ]; then
    log_info "请输入你的域名（不带 www，例如: myblog.com）:"
    read -r NEW_DOMAIN
else
    NEW_DOMAIN="$1"
fi

# 验证域名格式
if [[ ! "$NEW_DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
    log_error "域名格式不正确: $NEW_DOMAIN"
    log_info "示例: myblog.com 或 blog.example.com"
    exit 1
fi

log_info "你输入的域名: $NEW_DOMAIN"
log_info ""

# 2. 确认操作
log_warn "此操作将替换以下文件中的域名 '$DEFAULT_DOMAIN' 为 '$NEW_DOMAIN':"
log_warn "  - deploy/scripts/setup-ssl.sh"
log_warn "  - deploy/nginx/zhcmqtt.top.conf (将重命名为 ${NEW_DOMAIN}.conf)"
log_info ""
log_info "是否继续？(y/n)"
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    log_info "操作已取消"
    exit 0
fi

log_info ""
log_info "开始配置域名..."
log_info ""

# 3. 备份原始文件
log_step "1/4 备份原始文件..."
BACKUP_DIR="$PROJECT_ROOT/deploy/backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

cp "$PROJECT_ROOT/deploy/scripts/setup-ssl.sh" "$BACKUP_DIR/" 2>/dev/null || true
cp "$PROJECT_ROOT/deploy/nginx/zhcmqtt.top.conf" "$BACKUP_DIR/" 2>/dev/null || true

log_info "备份完成: $BACKUP_DIR"

# 4. 替换 setup-ssl.sh 中的域名
log_step "2/4 配置 SSL 证书申请脚本..."
SSL_SCRIPT="$PROJECT_ROOT/deploy/scripts/setup-ssl.sh"

if [ -f "$SSL_SCRIPT" ]; then
    # 替换默认域名
    sed -i.bak "s/DOMAIN=\"${DEFAULT_DOMAIN}\"/DOMAIN=\"\${1:-${NEW_DOMAIN}}\"/" "$SSL_SCRIPT"
    rm -f "${SSL_SCRIPT}.bak"
    log_info "已更新: setup-ssl.sh"
else
    log_warn "文件不存在: $SSL_SCRIPT"
fi

# 5. 替换 Nginx 配置文件中的域名
log_step "3/4 配置 Nginx 配置文件..."
OLD_NGINX_CONF="$PROJECT_ROOT/deploy/nginx/zhcmqtt.top.conf"
NEW_NGINX_CONF="$PROJECT_ROOT/deploy/nginx/${NEW_DOMAIN}.conf"

if [ -f "$OLD_NGINX_CONF" ]; then
    # 复制并替换域名
    cp "$OLD_NGINX_CONF" "$NEW_NGINX_CONF"

    # 替换所有出现的域名
    sed -i.bak "s/${DEFAULT_DOMAIN}/${NEW_DOMAIN}/g" "$NEW_NGINX_CONF"
    rm -f "${NEW_NGINX_CONF}.bak"

    log_info "已创建新配置: ${NEW_DOMAIN}.conf"
    log_info "原配置文件保留: zhcmqtt.top.conf"
else
    log_warn "文件不存在: $OLD_NGINX_CONF"
fi

# 6. 输出后续步骤
log_step "4/4 配置完成！"
log_info ""
log_info "=========================================="
log_info "域名配置成功！"
log_info "=========================================="
log_info "你的域名: $NEW_DOMAIN"
log_info "www 域名: www.$NEW_DOMAIN"
log_info ""
log_info "后续步骤:"
log_info ""
log_info "1. 配置 Nginx（在服务器上执行）:"
log_info "   sudo cp $PROJECT_ROOT/deploy/nginx/${NEW_DOMAIN}.conf /etc/nginx/sites-available/"
log_info "   sudo ln -s /etc/nginx/sites-available/${NEW_DOMAIN}.conf /etc/nginx/sites-enabled/"
log_info "   sudo nginx -t"
log_info "   sudo systemctl reload nginx"
log_info ""
log_info "2. 申请 SSL 证书（在服务器上执行）:"
log_info "   sudo bash $PROJECT_ROOT/deploy/scripts/setup-ssl.sh $NEW_DOMAIN"
log_info ""
log_info "3. 或者使用 Certbot 自动配置:"
log_info "   sudo certbot --nginx -d $NEW_DOMAIN -d www.$NEW_DOMAIN"
log_info ""
log_info "=========================================="
log_info ""
log_info "备份文件位置: $BACKUP_DIR"
log_info ""
