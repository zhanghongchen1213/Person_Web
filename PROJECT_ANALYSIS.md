# Person_Web 项目启动指南

> 最后更新时间: 2026-01-19
> 项目版本: Phase 2.5 已完成

## 📋 项目概述

Person_Web 是一个基于 React 19 + tRPC + Express + MySQL 的全栈个人博客系统，支持博客文章和技术文档两种内容类型。项目采用 TypeScript 全栈开发，使用 Drizzle ORM 进行数据库操作，Shadcn/ui 作为 UI 组件库。

### 核心特性

- ✅ 博客文章管理（草稿、已发布、已归档）
- ✅ 技术文档系统（类似 GitBook 的阅读体验）
- ✅ 分类管理（支持手写输入新分类）
- ✅ Markdown 编辑器（分栏预览）
- ✅ 文章搜索和筛选
- ✅ 分页功能
- ✅ Mock OAuth 认证（本地开发）
- ✅ 管理员权限控制

## 🛠️ 技术栈

### 前端
- **React**: 19.2.1
- **TypeScript**: 5.9.3
- **Vite**: 7.1.7（构建工具）
- **Wouter**: 3.3.5（路由）
- **TanStack Query**: 5.67.1（状态管理）
- **Shadcn/ui**: 基于 Radix UI 的组件库
- **Tailwind CSS**: 4.1.0（样式）

### 后端
- **Node.js**: 22.14.0
- **Express**: 4.21.2
- **tRPC**: 11.6.0（类型安全 API）
- **Drizzle ORM**: 0.44.5
- **MySQL**: 8.0
- **Zod**: 3.24.1（数据验证）

### 开发工具
- **pnpm**: 10.4.1（包管理器）
- **Docker**: 用于 MySQL 容器
- **tsx**: 4.19.2（TypeScript 执行器）

## 📦 环境要求

在开始之前，请确保你的系统已安装以下软件：

1. **Node.js**: >= 22.14.0
   ```bash
   node --version  # 应显示 v22.14.0 或更高
   ```

2. **pnpm**: >= 10.4.1
   ```bash
   pnpm --version  # 应显示 10.4.1 或更高
   ```
   如未安装，运行：
   ```bash
   npm install -g pnpm
   ```

3. **Docker**: 用于运行 MySQL 容器
   ```bash
   docker --version  # 确认已安装
   ```

4. **Git**: 用于克隆项目（如需要）
   ```bash
   git --version
   ```

## 🚀 快速启动

如果你已经熟悉项目，可以使用以下命令快速启动：

```bash
# 1. 安装依赖
pnpm install

# 2. 启动 MySQL 容器
docker run -d --name person-web-mysql -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=personal_blog -p 3306:3306 mysql:8.0

# 3. 运行数据库迁移
pnpm db:push

# 4. 启动开发服务器
pnpm dev
```

访问 http://localhost:3000（或 3001，如果 3000 端口被占用）

## 📝 详细启动步骤

### 步骤 1: 克隆项目（如需要）

```bash
cd /path/to/your/workspace
git clone <repository-url>
cd Person_Web
```

### 步骤 2: 安装项目依赖

```bash
pnpm install
```

**预期输出**:
- 安装所有 npm 包
- 生成 `node_modules` 目录
- 创建 `pnpm-lock.yaml` 文件

**常见问题**: 如果遇到权限错误，尝试使用管理员权限运行终端。

### 步骤 3: 配置环境变量

项目根目录已包含 `.env` 文件，内容如下：

```env
DATABASE_URL=mysql://root:rootpassword@localhost:3306/personal_blog?charset=utf8mb4
VITE_OAUTH_PORTAL_URL=http://localhost:3000
OAUTH_SERVER_URL=http://localhost:3000
VITE_APP_ID=local-dev-app-id
OWNER_OPEN_ID=mock-user-openid-dev
JWT_SECRET=local-dev-secret-key-change-in-production
```

**重要说明**:
- `OWNER_OPEN_ID=mock-user-openid-dev` 是管理员的 OpenID，必须与 Mock OAuth 中的一致
- `JWT_SECRET` 用于生成 JWT token，生产环境请修改为强密码
- 本地开发使用 Mock OAuth，无需真实的 OAuth 服务器

### 步骤 4: 启动 MySQL 数据库

使用 Docker 启动 MySQL 8.0 容器：

```bash
docker run -d \
  --name person-web-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=personal_blog \
  -p 3306:3306 \
  mysql:8.0
```

**参数说明**:
- `-d`: 后台运行容器
- `--name person-web-mysql`: 容器名称
- `-e MYSQL_ROOT_PASSWORD=rootpassword`: root 用户密码
- `-e MYSQL_DATABASE=personal_blog`: 自动创建数据库
- `-p 3306:3306`: 端口映射（主机:容器）
- `mysql:8.0`: 使用 MySQL 8.0 镜像

**验证容器运行**:
```bash
docker ps | grep person-web-mysql
```

**预期输出**: 应显示容器正在运行，状态为 "Up"

**常见问题**:
- 如果端口 3306 已被占用，修改端口映射为 `-p 3307:3306`，并相应修改 `.env` 中的 `DATABASE_URL`
- 如果容器已存在，先删除旧容器：`docker rm -f person-web-mysql`

### 步骤 5: 运行数据库迁移

应用 Drizzle ORM 的数据库 schema 到 MySQL：

```bash
pnpm db:push
```

**预期输出**:
```
✓ Applying migrations...
✓ Migrations applied successfully
```

**这个命令会**:
- 读取 `drizzle/schema.ts` 中的表结构定义
- 在 MySQL 中创建以下表：
  - `users` - 用户表
  - `articles` - 文章表
  - `categories` - 分类表
- 创建必要的索引和外键关系

**验证迁移成功**:
```bash
docker exec -it person-web-mysql mysql -uroot -prootpassword -e "USE personal_blog; SHOW TABLES;"
```

应显示 `users`, `articles`, `categories` 三张表。

### 步骤 6: 启动开发服务器

启动前端和后端开发服务器：

```bash
pnpm dev
```

**预期输出**:
```
> person-web@1.0.0 dev
> concurrently "pnpm dev:client" "pnpm dev:server"

[client] VITE v7.1.7  ready in 1234 ms
[client] ➜  Local:   http://localhost:5173/
[server] Server running on http://localhost:3000
```

**这个命令会**:
- 同时启动前端 Vite 开发服务器（端口 5173）
- 启动后端 Express 服务器（端口 3000 或 3001）
- 启用热模块替换（HMR），代码修改后自动刷新

**端口说明**:
- 前端开发服务器：http://localhost:5173
- 后端 API 服务器：http://localhost:3000（或 3001）
- 实际访问地址：http://localhost:3000（Vite 会代理到后端）

**常见问题**:
- 如果端口 3000 被占用，服务器会自动切换到 3001
- 如果遇到 "Cannot find module" 错误，重新运行 `pnpm install`

### 步骤 7: 访问应用并登录

1. **打开浏览器**，访问：http://localhost:3000

2. **点击登录按钮**，会跳转到 Mock OAuth 页面

3. **Mock OAuth 登录**:
   - 用户名：任意输入（例如：admin）
   - 密码：任意输入（例如：password）
   - 点击"登录"按钮

4. **自动获得管理员权限**:
   - Mock OAuth 会自动生成 `openid = mock-user-openid-dev`
   - 该 OpenID 与 `.env` 中的 `OWNER_OPEN_ID` 匹配
   - 因此自动获得管理员权限

5. **验证登录成功**:
   - 右上角显示用户头像和用户名
   - 导航栏出现"写文章"和"文章管理"菜单项

## 🎯 功能模块说明

### 1. 首页 (/)
- 展示已发布的博客文章列表
- 支持按分类筛选
- 显示文章标题、摘要、封面图、发布日期
- 点击文章卡片跳转到文章详情页

### 2. 文章详情页 (/article/:slug)
- 显示完整的文章内容（Markdown 渲染）
- 显示文章元信息（作者、发布日期、分类）
- 代码高亮显示
- 相关文章推荐

### 3. 写文章页面 (/write)
**管理员专用功能**

- Markdown 分栏编辑器（左侧编辑，右侧实时预览）
- 文章基本信息设置：
  - 标题
  - Slug（URL 路径）
  - 摘要
  - 封面图
- 分类选择（Combobox 组件）：
  - 支持从现有分类中选择
  - 支持手写输入新分类名称（自动创建）
- 文章类型选择：博客 (blog) 或文档 (doc)
- 状态选择：草稿、已发布、已归档
- 保存和发布功能

### 4. 文章管理页面 (/admin/articles)
**管理员专用功能 - Phase 2.5 新增**

- 文章列表展示（表格形式）：
  - 标题（可点击查看详情）
  - 分类
  - 类型（博客/文档）
  - 状态（草稿/已发布/已归档）
  - 发布日期
  - 创建日期
- 筛选功能：
  - 按状态筛选（全部/草稿/已发布/已归档）
  - 按分类筛选（下拉选择）
  - 按标题搜索（支持回车快捷键）
- 分页功能：
  - 每页显示 20 条记录
  - 智能页码显示（超过 7 页显示省略号）
  - URL 参数同步（刷新保持筛选状态）
- 操作功能：
  - 编辑：跳转到写文章页面
  - 修改发布日期：弹出日历选择器
  - 删除：二次确认对话框

### 5. 文档阅读页面 (/docs)
- 三栏布局（侧边栏、内容区、目录）
- 文档树导航（支持展开/折叠）
- 上一篇/下一篇导航
- 代码高亮和语法着色

## 🔧 开发指南

### 常用命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器（前端 + 后端）
pnpm dev

# 仅启动前端开发服务器
pnpm dev:client

# 仅启动后端开发服务器
pnpm dev:server

# 构建生产版本
pnpm build

# 运行数据库迁移
pnpm db:push

# 生成数据库迁移文件
pnpm db:generate

# 打开 Drizzle Studio（数据库可视化工具）
pnpm db:studio

# 类型检查
pnpm type-check

# 代码格式化
pnpm format
```

### 项目结构

```
Person_Web/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 可复用组件
│   │   ├── lib/           # 工具函数
│   │   └── _core/         # 核心功能（hooks, utils）
│   └── index.html
├── server/                # 后端代码
│   ├── _core/            # 核心功能（trpc, cookies, auth）
│   ├── routers.ts        # tRPC 路由定义
│   ├── db.ts             # 数据库操作函数
│   └── index.ts          # Express 服务器入口
├── drizzle/              # 数据库相关
│   ├── schema.ts         # 数据库表结构定义
│   └── migrations/       # 迁移文件
├── shared/               # 前后端共享代码
│   └── const.ts          # 常量定义
├── .env                  # 环境变量配置
├── package.json          # 项目依赖
└── tsconfig.json         # TypeScript 配置
```

## ❓ 常见问题

### Q1: 端口 3000 被占用怎么办？

**问题**: 启动服务器时提示 "Port 3000 is busy"

**解决方案**:
- 服务器会自动切换到 3001 端口
- 访问 http://localhost:3001 即可
- 或者手动停止占用 3000 端口的进程

### Q2: 数据库连接失败怎么办？

**问题**: 启动服务器时提示 "Cannot connect to database"

**解决方案**:
1. 检查 MySQL 容器是否运行：
   ```bash
   docker ps | grep person-web-mysql
   ```
2. 如果容器未运行，重新启动：
   ```bash
   docker start person-web-mysql
   ```
3. 检查 `.env` 中的 `DATABASE_URL` 是否正确

### Q3: 如何重置数据库？

**解决方案**:
```bash
# 1. 停止并删除 MySQL 容器
docker rm -f person-web-mysql

# 2. 重新启动 MySQL 容器
docker run -d --name person-web-mysql -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=personal_blog -p 3306:3306 mysql:8.0

# 3. 重新运行数据库迁移
pnpm db:push
```

### Q4: 如何添加新的分类？

**解决方案**:
- 方式 1（推荐）：在写文章页面的分类输入框中直接输入新分类名称，系统会自动创建
- 方式 2：使用 Drizzle Studio 手动添加：
  ```bash
  pnpm db:studio
  ```
  然后在浏览器中打开 https://local.drizzle.studio，编辑 `categories` 表

### Q5: 如何获得管理员权限？

**解决方案**:
- 本地开发环境使用 Mock OAuth，登录后自动获得管理员权限
- Mock OAuth 会生成固定的 `openid = mock-user-openid-dev`
- 该 OpenID 与 `.env` 中的 `OWNER_OPEN_ID` 匹配，因此自动成为管理员
- 如需修改管理员 OpenID，同时修改 `.env` 和 `server/_core/mock-oauth.ts`

### Q6: 如何查看数据库内容？

**解决方案**:
- 方式 1：使用 Drizzle Studio（推荐）
  ```bash
  pnpm db:studio
  ```
  访问 https://local.drizzle.studio

- 方式 2：使用 MySQL 命令行
  ```bash
  docker exec -it person-web-mysql mysql -uroot -prootpassword personal_blog
  ```

## 📚 技术细节

### tRPC API 端点

项目使用 tRPC 提供类型安全的 API，主要端点包括：

**文章相关** (`article.*`):
- `list` - 获取文章列表（公开）
- `bySlug` - 根据 slug 获取文章（公开）
- `byId` - 根据 ID 获取文章（管理员）
- `adminList` - 获取所有文章包括草稿（管理员）
- `create` - 创建文章（管理员）
- `update` - 更新文章（管理员）
- `delete` - 删除文章（管理员）
- `updatePublishedAt` - 更新发布日期（管理员）
- `stats` - 获取统计信息（公开）
- `archive` - 获取归档列表（公开）
- `related` - 获取相关文章（公开）

**分类相关** (`category.*`):
- `list` - 获取分类列表（公开）
- `bySlug` - 根据 slug 获取分类（公开）
- `withArticles` - 获取分类及其文章（公开）
- `create` - 创建分类（管理员）
- `update` - 更新分类（管理员）
- `delete` - 删除分类（管理员）
- `findOrCreate` - 查找或创建分类（管理员）

**文档相关** (`doc.*`):
- `tree` - 获取文档树结构（公开）

**认证相关** (`auth.*`):
- `me` - 获取当前用户信息（公开）
- `logout` - 退出登录（公开）

### 数据库表结构

**users 表** - 用户信息
- `id` - 主键
- `openid` - OAuth OpenID（唯一）
- `nickname` - 昵称
- `avatar` - 头像 URL
- `role` - 角色（admin/user）
- `createdAt` - 创建时间

**articles 表** - 文章信息
- `id` - 主键
- `title` - 标题
- `slug` - URL 路径（唯一）
- `summary` - 摘要
- `content` - 内容（Markdown）
- `coverImage` - 封面图 URL
- `categoryId` - 分类 ID（外键）
- `authorId` - 作者 ID（外键）
- `status` - 状态（draft/published/archived）
- `type` - 类型（blog/doc）
- `order` - 排序（用于文档）
- `publishedAt` - 发布时间
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**categories 表** - 分类信息
- `id` - 主键
- `name` - 分类名称
- `slug` - URL 路径（唯一）
- `description` - 描述
- `icon` - 图标
- `sortOrder` - 排序
- `type` - 类型（blog/doc）
- `createdAt` - 创建时间

### 环境变量说明

`.env` 文件中的环境变量详细说明：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | MySQL 数据库连接字符串 | `mysql://root:rootpassword@localhost:3306/personal_blog?charset=utf8mb4` |
| `VITE_OAUTH_PORTAL_URL` | OAuth 登录页面地址（前端使用） | `http://localhost:3000` |
| `OAUTH_SERVER_URL` | OAuth 服务器地址（后端使用） | `http://localhost:3000` |
| `VITE_APP_ID` | OAuth 应用 ID | `local-dev-app-id` |
| `OWNER_OPEN_ID` | 管理员的 OpenID | `mock-user-openid-dev` |
| `JWT_SECRET` | JWT 签名密钥 | `local-dev-secret-key-change-in-production` |

**注意事项**:
- 生产环境必须修改 `JWT_SECRET` 为强密码
- `OWNER_OPEN_ID` 必须与实际管理员的 OpenID 匹配
- 本地开发使用 Mock OAuth，生产环境需要配置真实的 OAuth 服务器

## 📝 更新日志

### Phase 2.5 (2026-01-19) - 已完成

**新增功能**:
1. ✅ 分类自动创建功能
   - 在写文章页面支持手写输入新分类名称
   - 自动生成 slug（支持中文和英文）
   - 自动处理重复分类（不区分大小写）

2. ✅ 文章管理页面 (`/admin/articles`)
   - 文章列表展示（表格形式）
   - 搜索功能（按标题搜索，支持回车快捷键）
   - 分类筛选器（Select 下拉选择）
   - 状态筛选器（全部/草稿/已发布/已归档）
   - 分页功能（每页 20 条，智能页码显示）
   - URL 参数同步（刷新保持筛选状态）
   - 编辑、删除、修改发布日期操作

3. ✅ 后端接口增强
   - `category.findOrCreate` - 查找或创建分类
   - `article.updatePublishedAt` - 更新文章发布日期
   - `article.adminList` - 管理员获取所有文章

**技术改进**:
- 使用 Shadcn/ui 的 Combobox、Select、Pagination 组件
- 实现 URL 参数同步（useSearch + useEffect）
- 优化分页算法（智能页码显示）
- 添加 Badge 组件显示状态和类型

### Phase 1 (2026-01-16) - 已完成

**核心功能**:
1. ✅ 文档引擎核心
   - 文档树结构（按 order 排序）
   - Markdown 分栏编辑器
   - 文档阅读器（三栏布局）
   - 代码高亮和语法着色

2. ✅ 数据库 Schema 升级
   - articles 表添加 `order` 和 `type` 字段
   - categories 表添加 `type` 字段

### Phase 0 (2026-01-16) - 已完成

**基础设施**:
1. ✅ 开发环境配置
   - Node.js 22.14.0
   - pnpm 10.4.1
   - MySQL 8.0 (Docker)

2. ✅ Mock OAuth 认证
   - 本地开发登录功能
   - 管理员权限控制

## 🚧 下一步计划

根据 [plan.md](plan.md) 文档，接下来的开发计划：

### Phase 2: 性能优化
- [ ] LRU 内存缓存实现
- [ ] 性能监控日志
- [ ] 孤儿图片清理脚本

### Phase 3: Docker 容器化部署
- [ ] 创建 Dockerfile
- [ ] 创建 docker-compose.yml
- [ ] Nginx 配置
- [ ] 部署脚本

### Phase 4: 华为云部署与上线
- [ ] 服务器环境准备
- [ ] SSL 证书配置
- [ ] 应用部署
- [ ] 性能检查

## 📞 联系与支持

如有问题或建议，请通过以下方式联系：

- 项目文档：查看 [plan.md](plan.md) 了解详细的开发计划
- 技术规范：查看 [spec.md](spec.md) 了解项目需求和技术规范

## 📄 许可证

本项目仅供学习和个人使用。

---

**文档生成时间**: 2026-01-19
**项目状态**: Phase 2.5 已完成，Phase 2 进行中
**最后更新**: 完成文章管理页面和分类自动创建功能

