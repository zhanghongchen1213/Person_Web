#!/bin/bash

# Person_Web 服务器环境一键配置脚本
# 用途: 自动安装和配置服务器环境（Docker、Nginx、防火墙等）
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

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 检查是否以 root 权限运行
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 权限运行此脚本"
    log_info "使用方法: sudo bash setup-server.sh"
    exit 1
fi

log_info "=========================================="
log_info "Person_Web 服务器环境一键配置脚本"
log_info "=========================================="
log_info ""
log_info "此脚本将自动完成以下操作："
log_info "  1. 更新系统软件包"
log_info "  2. 安装 Docker 和 Docker Compose"
log_info "  3. 安装 Nginx"
log_info "  4. 配置防火墙（UFW）"
log_info "  5. 配置 Docker 和 Nginx 开机自启"
log_info ""
log_warn "预计耗时: 5-10 分钟"
log_info ""
log_info "是否继续？(y/n)"
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    log_info "操作已取消"
    exit 0
fi

log_info ""
log_info "开始配置服务器环境..."
log_info ""

# ============================================
# 步骤 1: 更新系统软件包
# ============================================
log_step "1/5 更新系统软件包..."
apt update
apt upgrade -y
log_success "系统软件包更新完成"
log_info ""

# ============================================
# 步骤 2: 安装 Docker
# ============================================
log_step "2/5 安装 Docker..."

# 检查 Docker 是否已安装
if command -v docker &> /dev/null; then
    log_info "Docker 已安装: $(docker --version)"
else
    log_info "开始安装 Docker..."

    # 使用官方安装脚本
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm -f get-docker.sh

    log_success "Docker 安装完成: $(docker --version)"
fi

# 配置 Docker 权限
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker "$SUDO_USER"
    log_info "已将用户 $SUDO_USER 添加到 docker 组"
fi

# 启动 Docker 服务
systemctl start docker
systemctl enable docker
log_success "Docker 服务已启动并设置为开机自启"
log_info ""

# 验证 Docker Compose
if docker compose version &> /dev/null; then
    log_info "Docker Compose 已安装: $(docker compose version)"
else
    log_warn "Docker Compose 未安装，请手动安装"
fi
log_info ""

# ============================================
# 步骤 3: 安装 Nginx
# ============================================
log_step "3/5 安装 Nginx..."

# 检查 Nginx 是否已安装
if command -v nginx &> /dev/null; then
    log_info "Nginx 已安装: $(nginx -v 2>&1)"
else
    log_info "开始安装 Nginx..."
    apt install -y nginx
    log_success "Nginx 安装完成: $(nginx -v 2>&1)"
fi

# 启动 Nginx 服务
systemctl start nginx
systemctl enable nginx
log_success "Nginx 服务已启动并设置为开机自启"
log_info ""

# ============================================
# 步骤 4: 配置防火墙
# ============================================
log_step "4/5 配置防火墙（UFW）..."

# 检查 UFW 是否已安装
if ! command -v ufw &> /dev/null; then
    log_info "安装 UFW..."
    apt install -y ufw
fi

# 配置防火墙规则
log_info "配置防火墙规则..."
ufw --force enable
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

log_success "防火墙配置完成"
log_info ""
log_info "防火墙状态:"
ufw status numbered
log_info ""

# ============================================
# 步骤 5: 验证安装
# ============================================
log_step "5/5 验证安装..."

# 验证 Docker
if docker run hello-world &> /dev/null; then
    log_success "Docker 运行正常"
else
    log_warn "Docker 测试失败，请检查安装"
fi

# 验证 Nginx
if systemctl is-active --quiet nginx; then
    log_success "Nginx 运行正常"
else
    log_warn "Nginx 未运行，请检查安装"
fi

# 验证防火墙
if ufw status | grep -q "Status: active"; then
    log_success "防火墙运行正常"
else
    log_warn "防火墙未启用"
fi

log_info ""

# ============================================
# 输出总结
# ============================================
log_info "=========================================="
log_success "服务器环境配置完成！"
log_info "=========================================="
log_info ""
log_info "已安装的软件:"
log_info "  - Docker: $(docker --version)"
log_info "  - Docker Compose: $(docker compose version 2>&1 | head -n 1)"
log_info "  - Nginx: $(nginx -v 2>&1)"
log_info ""
log_info "已开放的端口:"
log_info "  - 22 (SSH)"
log_info "  - 80 (HTTP)"
log_info "  - 443 (HTTPS)"
log_info ""
log_info "下一步操作:"
log_info "  1. 上传项目代码到服务器"
log_info "  2. 配置环境变量（运行 setup-env.sh）"
log_info "  3. 一键部署应用（运行 deploy.sh）"
log_info ""
log_warn "重要提示:"
log_info "  - 如果你添加了用户到 docker 组，需要重新登录才能生效"
log_info "  - 建议重启服务器以确保所有配置生效: sudo reboot"
log_info ""
log_info "=========================================="
