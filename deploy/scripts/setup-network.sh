#!/bin/bash

# Person_Web 网络环境配置脚本
# 用途: 配置国内镜像源，解决访问 GitHub、Docker Hub 等资源的网络问题
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
    log_info "使用方法: sudo bash setup-network.sh"
    exit 1
fi

log_info "=========================================="
log_info "Person_Web 网络环境配置脚本"
log_info "=========================================="
log_info ""
log_info "此脚本将配置以下镜像源："
log_info "  1. APT 软件源（阿里云镜像）"
log_info "  2. Docker 镜像源（国内加速）"
log_info "  3. Git 配置优化"
log_info "  4. npm 镜像源（淘宝镜像）"
log_info ""

# 检测系统版本
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
        CODENAME=$VERSION_CODENAME
    else
        log_error "无法检测操作系统版本"
        exit 1
    fi

    log_info "检测到操作系统: $OS $VERSION ($CODENAME)"
}

# 备份原始配置
backup_config() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d-%H%M%S)"
        log_info "已备份: $file"
    fi
}

# 配置 APT 软件源（阿里云镜像）
setup_apt_mirror() {
    log_step "1/4 配置 APT 软件源"

    # 备份原始 sources.list
    backup_config "/etc/apt/sources.list"

    # 根据系统版本配置镜像源
    if [ "$OS" = "ubuntu" ]; then
        log_info "配置 Ubuntu $CODENAME 阿里云镜像源..."
        cat > /etc/apt/sources.list <<EOF
# 阿里云 Ubuntu 镜像源
deb http://mirrors.aliyun.com/ubuntu/ $CODENAME main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ $CODENAME-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ $CODENAME-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ $CODENAME-backports main restricted universe multiverse

# 源码镜像（可选）
# deb-src http://mirrors.aliyun.com/ubuntu/ $CODENAME main restricted universe multiverse
EOF
    elif [ "$OS" = "debian" ]; then
        log_info "配置 Debian $CODENAME 阿里云镜像源..."
        cat > /etc/apt/sources.list <<EOF
# 阿里云 Debian 镜像源
deb http://mirrors.aliyun.com/debian/ $CODENAME main contrib non-free
deb http://mirrors.aliyun.com/debian/ $CODENAME-updates main contrib non-free
deb http://mirrors.aliyun.com/debian-security $CODENAME/updates main contrib non-free
EOF
    else
        log_warn "不支持的操作系统: $OS，跳过 APT 源配置"
        return
    fi

    # 更新软件包列表
    log_info "更新软件包列表..."
    apt update

    log_success "APT 软件源配置完成"
}

# 配置 Docker 镜像源
setup_docker_mirror() {
    log_step "2/4 配置 Docker 镜像源"

    # 创建 Docker 配置目录
    mkdir -p /etc/docker

    # 备份原始配置
    backup_config "/etc/docker/daemon.json"

    # 配置 Docker 镜像加速
    log_info "配置 Docker 镜像加速器..."
    cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://dockerproxy.com",
    "https://docker.m.daocloud.io"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

    log_success "Docker 镜像源配置完成"
    log_info "注意: Docker 服务安装后需要重启才能生效"
}

# 配置 Git 优化
setup_git_config() {
    log_step "3/4 配置 Git 优化"

    log_info "配置 Git 全局设置..."

    # 禁用 HTTP/2（解决克隆失败问题）
    git config --global http.version HTTP/1.1

    # 增加缓冲区大小
    git config --global http.postBuffer 524288000

    # 设置超时时间
    git config --global http.lowSpeedLimit 0
    git config --global http.lowSpeedTime 999999

    log_success "Git 配置优化完成"
}

# 配置 npm 镜像源
setup_npm_mirror() {
    log_step "4/4 配置 npm 镜像源"

    # 检查 npm 是否已安装
    if ! command -v npm &> /dev/null; then
        log_warn "npm 未安装，跳过 npm 镜像源配置"
        log_info "npm 将在后续安装 Node.js 时自动配置"
        return
    fi

    log_info "配置 npm 淘宝镜像源..."
    npm config set registry https://registry.npmmirror.com

    log_success "npm 镜像源配置完成"
}

# 验证配置
verify_config() {
    log_info ""
    log_info "=========================================="
    log_info "验证配置"
    log_info "=========================================="

    # 验证 APT 源
    log_info "APT 源配置:"
    if grep -q "mirrors.aliyun.com" /etc/apt/sources.list 2>/dev/null; then
        log_success "  ✓ APT 阿里云镜像源已配置"
    else
        log_warn "  ✗ APT 镜像源配置可能失败"
    fi

    # 验证 Docker 配置
    log_info "Docker 配置:"
    if [ -f /etc/docker/daemon.json ]; then
        log_success "  ✓ Docker 镜像加速器已配置"
    else
        log_warn "  ✗ Docker 配置文件不存在"
    fi

    # 验证 Git 配置
    log_info "Git 配置:"
    if git config --global --get http.version | grep -q "HTTP/1.1" 2>/dev/null; then
        log_success "  ✓ Git HTTP/1.1 已启用"
    else
        log_warn "  ✗ Git 配置可能失败"
    fi

    # 验证 npm 配置
    log_info "npm 配置:"
    if command -v npm &> /dev/null; then
        if npm config get registry | grep -q "npmmirror.com" 2>/dev/null; then
            log_success "  ✓ npm 淘宝镜像源已配置"
        else
            log_warn "  ✗ npm 镜像源配置可能失败"
        fi
    else
        log_info "  - npm 未安装（将在后续步骤中安装）"
    fi
}

# 主函数
main() {
    # 检测操作系统
    detect_os

    log_info ""
    log_info "开始配置网络环境..."
    log_info ""

    # 执行配置
    setup_apt_mirror
    log_info ""

    setup_docker_mirror
    log_info ""

    setup_git_config
    log_info ""

    setup_npm_mirror
    log_info ""

    # 验证配置
    verify_config

    log_info ""
    log_info "=========================================="
    log_success "网络环境配置完成！"
    log_info "=========================================="
    log_info ""
    log_info "配置总结:"
    log_info "  ✓ APT 软件源已切换到阿里云镜像"
    log_info "  ✓ Docker 镜像加速器已配置（需安装 Docker 后生效）"
    log_info "  ✓ Git 已优化（禁用 HTTP/2，增加缓冲区）"
    log_info "  ✓ npm 镜像源已配置（如已安装）"
    log_info ""
    log_info "下一步操作:"
    log_info "  - 运行服务器环境配置脚本: sudo bash deploy/scripts/setup-server.sh"
    log_info ""
}

# 执行主函数
main
