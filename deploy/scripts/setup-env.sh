#!/bin/bash

# Person_Web 环境变量配置脚本
# 用途: 交互式配置 .env.production 文件
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

# 项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.production"
ENV_EXAMPLE="$PROJECT_ROOT/.env.production.example"

log_info "=========================================="
log_info "Person_Web 环境变量配置脚本"
log_info "=========================================="
log_info "项目目录: $PROJECT_ROOT"
log_info ""

# 检查是否存在示例文件
if [ ! -f "$ENV_EXAMPLE" ]; then
    log_error "未找到环境变量示例文件: $ENV_EXAMPLE"
    exit 1
fi

# 检查是否已存在配置文件
if [ -f "$ENV_FILE" ]; then
    log_warn "检测到已存在的 .env.production 文件"
    log_info "是否要重新配置？(y/n)"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "操作已取消"
        exit 0
    fi
    # 备份现有文件
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
    log_info "已备份现有配置文件"
fi

log_info ""
log_info "开始配置环境变量..."
log_info ""

# ============================================
# 生成强密码函数
# ============================================
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# ============================================
# 收集用户输入
# ============================================

# 数据库密码
log_step "1/6 配置数据库密码"
log_info "请输入 MySQL root 密码（留空自动生成）:"
read -r MYSQL_PASSWORD
if [ -z "$MYSQL_PASSWORD" ]; then
    MYSQL_PASSWORD=$(generate_password)
    log_info "已自动生成密码: $MYSQL_PASSWORD"
fi
log_info ""

# JWT 密钥
log_step "2/6 配置 JWT 密钥"
log_info "请输入 JWT 密钥（留空自动生成）:"
read -r JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(generate_password)
    log_info "已自动生成密钥: $JWT_SECRET"
fi
log_info ""

# GitHub OAuth 配置
log_step "3/6 配置 GitHub OAuth"
log_warn "⚠️  GitHub OAuth 是管理员登录的唯一方式，必须配置！"
log_info ""
log_info "GitHub OAuth 配置步骤:"
log_info "1. 访问 https://github.com/settings/developers"
log_info "2. 点击 'New OAuth App' 创建新应用"
log_info "3. 填写应用信息并获取 Client ID 和 Client Secret"
log_info ""

log_info "请输入 GitHub Client ID:"
read -r GITHUB_CLIENT_ID

log_info "请输入 GitHub Client Secret:"
read -r GITHUB_CLIENT_SECRET

log_info "请输入 GitHub Callback URL (例如: http://your-domain.com/api/auth/github/callback):"
read -r GITHUB_CALLBACK_URL

# 验证必填项
if [ -z "$GITHUB_CLIENT_ID" ] || [ -z "$GITHUB_CLIENT_SECRET" ] || [ -z "$GITHUB_CALLBACK_URL" ]; then
    log_error "GitHub OAuth 配置不完整！"
    log_error "Client ID、Client Secret 和 Callback URL 都是必填项"
    log_info ""
    log_info "如果暂时无法配置，可以使用占位符继续，但管理员将无法登录"
    log_info "是否使用占位符继续？[y/N]"
    read -r USE_PLACEHOLDER

    if [[ ! "$USE_PLACEHOLDER" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "操作已取消，请先配置 GitHub OAuth 后再运行此脚本"
        exit 1
    fi

    log_warn "使用占位符继续，管理员将无法登录！"
    GITHUB_CLIENT_ID="your_github_client_id_here"
    GITHUB_CLIENT_SECRET="your_github_client_secret_here"
    GITHUB_CALLBACK_URL="http://localhost:3000/api/auth/github/callback"
fi
log_info ""

# 管理员 OpenID
log_step "4/6 配置管理员 GitHub 用户 ID"
if [ "$GITHUB_CLIENT_ID" != "your_github_client_id_here" ]; then
    log_info "请输入管理员的 GitHub 用户 ID (格式: github:12345678):"
    log_info "获取方法: 访问 https://api.github.com/users/你的GitHub用户名"
    read -r OWNER_OPEN_ID

    if [ -z "$OWNER_OPEN_ID" ]; then
        log_error "管理员 GitHub 用户 ID 不能为空！"
        log_info "是否使用占位符继续？[y/N]"
        read -r USE_PLACEHOLDER_OWNER

        if [[ ! "$USE_PLACEHOLDER_OWNER" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            log_info "操作已取消"
            exit 1
        fi

        log_warn "使用占位符，管理员将无法登录！"
        OWNER_OPEN_ID="github:your_github_user_id_here"
    fi
else
    log_warn "GitHub OAuth 未正确配置，使用占位符"
    OWNER_OPEN_ID="github:your_github_user_id_here"
fi
log_info ""

# 域名配置
log_step "5/6 配置访问域名"
log_info "请输入博客访问域名（留空使用 localhost:3000）:"
log_info "示例: https://myblog.com 或 http://123.45.67.89:3000"
read -r DOMAIN_URL

if [ -z "$DOMAIN_URL" ]; then
    DOMAIN_URL="http://localhost:3000"
    log_info "使用默认域名: $DOMAIN_URL"
fi
log_info ""

# 确认配置
log_step "6/6 确认配置信息"
log_info "请确认以下配置:"
log_info "  - 数据库密码: $MYSQL_PASSWORD"
log_info "  - JWT 密钥: $JWT_SECRET"
log_info "  - GitHub Client ID: $GITHUB_CLIENT_ID"
log_info "  - GitHub Callback URL: $GITHUB_CALLBACK_URL"
log_info "  - 管理员 OpenID: $OWNER_OPEN_ID"
log_info "  - 访问域名: $DOMAIN_URL"
log_info ""
log_info "是否继续生成配置文件？[Y/n]"
read -r CONFIRM

if [[ "$CONFIRM" =~ ^([nN][oO]|[nN])$ ]]; then
    log_info "操作已取消"
    exit 0
fi
log_info ""

# ============================================
# 生成配置文件
# ============================================
log_info "生成配置文件..."

cat > "$ENV_FILE" <<EOF
# ============================================
# Person_Web 生产环境配置
# 生成时间: $(date)
# ============================================

# --------------------------------------------
# 数据库配置 (Database Configuration)
# --------------------------------------------
DATABASE_URL=mysql://root:${MYSQL_PASSWORD}@mysql:3306/personal_blog?charset=utf8mb4

# --------------------------------------------
# 运行环境 (Environment)
# --------------------------------------------
NODE_ENV=production

# --------------------------------------------
# 应用标识 (Application ID)
# --------------------------------------------
# 用于会话管理的应用唯一标识符
VITE_APP_ID=person_web_blog

# --------------------------------------------
# JWT 认证配置 (JWT Authentication)
# --------------------------------------------
JWT_SECRET=${JWT_SECRET}

# --------------------------------------------
# GitHub OAuth 认证配置 (GitHub OAuth Configuration)
# --------------------------------------------
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
GITHUB_CALLBACK_URL=${GITHUB_CALLBACK_URL}

# --------------------------------------------
# 管理员配置 (Admin Configuration)
# --------------------------------------------
# 管理员 GitHub 用户 ID（格式: github:你的GitHub用户ID）
OWNER_OPEN_ID=${OWNER_OPEN_ID}

# --------------------------------------------
# 应用端口配置 (Application Port)
# --------------------------------------------
PORT=3000

# --------------------------------------------
# MySQL 配置 (用于 docker-compose.yml)
# --------------------------------------------
MYSQL_ROOT_PASSWORD=${MYSQL_PASSWORD}
MYSQL_DATABASE=personal_blog
EOF

log_success "配置文件生成完成: $ENV_FILE"
log_info ""

# ============================================
# 输出总结
# ============================================
log_info "=========================================="
log_success "环境变量配置完成！"
log_info "=========================================="
log_info ""
log_info "配置信息:"
log_info "  - 数据库密码: $MYSQL_PASSWORD"
log_info "  - JWT 密钥: $JWT_SECRET"
log_info "  - 管理员 OpenID: $OWNER_OPEN_ID"
log_info "  - 访问域名: $DOMAIN_URL"
log_info ""

if [ "$GITHUB_CLIENT_ID" != "your_github_client_id_here" ]; then
    log_info "GitHub OAuth 配置:"
    log_info "  - Client ID: $GITHUB_CLIENT_ID"
    log_info "  - Callback URL: $GITHUB_CALLBACK_URL"
    log_info "  - 登录方式: GitHub OAuth"
    log_info ""
else
    log_error "GitHub OAuth 未正确配置:"
    log_info "  - 管理员将无法登录后台"
    log_info "  - 必须配置 GitHub OAuth 才能使用管理功能"
    log_info "  - 配置方法: 重新运行此脚本并输入真实的 GitHub OAuth 信息"
    log_info ""
fi

log_warn "安全提示:"
log_info "  - 请妥善保管数据库密码、JWT 密钥和 GitHub Client Secret"
log_info "  - 不要将 .env.production 文件提交到 Git 仓库"
log_info "  - 建议定期更换密码和密钥"
log_info ""
log_info "下一步操作:"
log_info "  - 运行一键部署脚本: bash deploy/scripts/deploy.sh"
log_info ""
log_info "=========================================="
