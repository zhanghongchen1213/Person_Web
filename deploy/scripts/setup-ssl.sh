#!/bin/bash

# SSL 证书申请脚本
# 用途: 自动化申请和配置 Let's Encrypt SSL 证书
# 作者: Personal Blog Project
# 日期: 2024

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 配置变量
DOMAIN="zhcmqtt.top"
WWW_DOMAIN="www.zhcmqtt.top"
EMAIL="admin@${DOMAIN}"  # 用于接收证书过期通知
WEBROOT="/var/www/html"  # Nginx webroot 路径

log_info "开始 SSL 证书申请流程..."
log_info "域名: ${DOMAIN}, ${WWW_DOMAIN}"

# 1. 检查是否以 root 权限运行
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 权限运行此脚本"
    log_info "使用方法: sudo bash setup-ssl.sh"
    exit 1
fi

# 2. 检查 Certbot 是否已安装
log_info "检查 Certbot 安装状态..."
if ! command -v certbot &> /dev/null; then
    log_warn "Certbot 未安装，开始安装..."

    # 检测操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        log_error "无法检测操作系统类型"
        exit 1
    fi

    # 根据不同操作系统安装 Certbot
    case $OS in
        ubuntu|debian)
            log_info "检测到 Ubuntu/Debian 系统，使用 apt 安装..."
            apt-get update
            apt-get install -y certbot python3-certbot-nginx
            ;;
        centos|rhel|fedora)
            log_info "检测到 CentOS/RHEL/Fedora 系统，使用 yum/dnf 安装..."
            if command -v dnf &> /dev/null; then
                dnf install -y certbot python3-certbot-nginx
            else
                yum install -y certbot python3-certbot-nginx
            fi
            ;;
        *)
            log_error "不支持的操作系统: $OS"
            log_info "请手动安装 Certbot: https://certbot.eff.org/"
            exit 1
            ;;
    esac

    log_info "Certbot 安装完成"
else
    log_info "Certbot 已安装: $(certbot --version)"
fi

# 3. 检查 Nginx 是否运行
log_info "检查 Nginx 运行状态..."
if ! systemctl is-active --quiet nginx && ! docker ps | grep -q nginx; then
    log_warn "Nginx 未运行，请确保 Nginx 已启动"
    log_info "如果使用 Docker，请先启动 Nginx 容器"
    log_info "如果使用系统服务，请运行: sudo systemctl start nginx"
fi

# 4. 创建 webroot 目录（如果不存在）
if [ ! -d "$WEBROOT" ]; then
    log_info "创建 webroot 目录: $WEBROOT"
    mkdir -p "$WEBROOT"
fi

# 5. 申请 SSL 证书
log_info "开始申请 SSL 证书..."
log_info "使用 HTTP-01 验证方式 (webroot)"

# 检查证书是否已存在
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    log_warn "证书已存在，是否要续期？(y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "执行证书续期..."
        certbot renew --force-renewal
    else
        log_info "跳过证书申请"
    fi
else
    # 申请新证书
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "$WWW_DOMAIN"

    if [ $? -eq 0 ]; then
        log_info "证书申请成功！"
    else
        log_error "证书申请失败"
        exit 1
    fi
fi

# 6. 配置自动续期
log_info "配置证书自动续期..."
# Certbot 会自动创建 systemd timer 或 cron job
# 检查自动续期配置
if systemctl list-timers | grep -q certbot; then
    log_info "Certbot systemd timer 已配置"
    systemctl list-timers | grep certbot
elif crontab -l 2>/dev/null | grep -q certbot; then
    log_info "Certbot cron job 已配置"
    crontab -l | grep certbot
else
    log_warn "未检测到自动续期配置，手动添加 cron job..."
    # 每天凌晨 2 点检查并续期证书
    (crontab -l 2>/dev/null; echo "0 2 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    log_info "已添加 cron job: 每天凌晨 2 点自动检查证书续期"
fi

# 7. 测试证书续期
log_info "测试证书续期功能..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
    log_info "证书续期测试成功！"
else
    log_warn "证书续期测试失败，请检查配置"
fi

# 8. 输出证书路径
log_info "=========================================="
log_info "SSL 证书配置完成！"
log_info "=========================================="
log_info "证书文件路径:"
log_info "  - 证书: /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
log_info "  - 私钥: /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
log_info ""
log_info "Nginx 配置示例:"
echo "  ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;"
echo "  ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;"
log_info ""
log_info "证书有效期: 90 天"
log_info "自动续期: 已配置"
log_info "续期测试: certbot renew --dry-run"
log_info "手动续期: certbot renew"
log_info "=========================================="

# 9. 重载 Nginx 配置
log_info "是否要重载 Nginx 配置？(y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        log_info "Nginx 配置已重载"
    elif docker ps | grep -q nginx; then
        docker exec nginx nginx -s reload
        log_info "Nginx 容器配置已重载"
    else
        log_warn "无法重载 Nginx，请手动重载"
    fi
fi

log_info "SSL 证书申请脚本执行完成！"
