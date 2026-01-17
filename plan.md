# 项目执行计划 (Execution Plan): Person_Web

> 生成时间: 2026-01-17
> 更新时间: 2026-01-17
> 来源: Plan Generation Agent
> 基于文档: `spec.md` (2026-01-17 更新版)

## Phase 0: 基础设施与重构 (Infrastructure & Refactor) [已完成]

本阶段目标是为文档引擎准备必要的数据结构，并确保开发环境符合规范。

- [x] **Task 0.1: 基础设施检查与规则注入**
  - 检查 Node.js, pnpm 版本是否符合要求。
  - 确认 `.trae/rules` 下的规则文件已更新且生效。
  - 验证开发服务器 (`pnpm dev`) 启动无误。
  - **完成时间**: 2026-01-16
  - **执行结果**:
    - Node.js v22.14.0
    - pnpm 10.4.1
    - 规则文件完整性检查通过
    - 开发服务器启动成功（已修复 Windows 环境变量问题）

- [x] **Task 0.2: 数据库 Schema 升级**
  - 修改 `drizzle/schema.ts`，在 `articles` 表中添加 `order` 和 `type` 字段。
  - 修改 `drizzle/schema.ts`，在 `categories` 表中添加 `type` 字段。
  - 运行 `drizzle-kit generate` 生成迁移文件。
  - 更新 `server/routers.ts` 中的 Zod Schema 定义。
  - **完成时间**: 2026-01-16

- [x] **Task 0.3: [Audit] Phase 0 审计**
  - 呼叫 Build Plan Agent 检查数据库结构是否正确更新。

---

## Phase 1: 文档引擎核心 (Doc Engine Core) [已完成]

本阶段目标是交付类似 GitBook 的核心阅读体验和后台编辑能力。

- [x] **Task 1.1: 后端 - 文档数据层实现**
  - 实现 `getDocTree` 接口，支持按 `order` 字段排序。
  - 实现 `getCategory` 接口增强，支持按 `type` 筛选。
  - **完成时间**: 2026-01-16

- [x] **Task 1.2: 后台 - 编辑器升级 (Split View)**
  - 改造 `WriteArticle.tsx` 页面。
  - 集成 Markdown 分栏编辑器。
  - 实现 Markdown 粘贴自动格式化功能。
  - **完成时间**: 2026-01-16

- [x] **Task 1.3: 前端 - 文档阅读器开发**
  - 创建 `DocLayout.tsx` 三栏布局组件。
  - 集成 `rehype-highlight` 和 `rehype-slug`。
  - 实现目录展开/折叠和上一篇/下一篇导航。
  - **完成时间**: 2026-01-16

- [x] **Task 1.4: [Audit] Phase 1 审计**
  - 呼叫 Build Plan Agent 检查文档阅读体验和编辑器功能。

---

## Phase 2.5: 管理功能增强 (Admin Features Enhancement) [新增]

本阶段目标是简化技术分类管理流程，并创建文章管理页面，提升管理员的内容管理效率。

### 2.5.1 简化技术分类管理

**背景**: 根据 spec.md 第 5 章要求，采用扁平化分类设计，支持管理员在 Write 页面手写输入分类名称。

- [x] **Task 2.5.1.1: 后端 - 分类自动创建接口** ✅
  - **目标**: 实现分类的自动创建逻辑
  - **具体任务**:
    - 在 `server/routers.ts` 中新增 `category.findOrCreate` tRPC 接口
    - 输入参数: `{ name: string, type: 'blog' | 'doc' }`
    - 逻辑: 先查询分类是否存在，不存在则自动创建
    - 自动生成 slug（使用 `slugify` 库或自定义函数）
    - 返回分类对象 `{ id, name, slug, type }`
  - **权限**: admin only
  - **涉及文件**:
    - `server/routers.ts` - 添加 tRPC 接口
    - `server/db.ts` - 添加数据库操作函数
  - **验收标准**:
    - 输入已存在的分类名，返回现有分类
    - 输入新分类名，自动创建并返回新分类
    - slug 生成正确且唯一
  - **完成时间**: 2026-01-17
  - **执行结果**:
    - 新增辅助函数 ✓
      - `generateSlug()`: 支持中文和英文的 slug 生成
      - `generateUniqueSlug()`: 确保 slug 唯一性
    - 新增数据库函数 ✓
      - `findOrCreateCategory()`: 查找或创建分类（大小写不敏感）
    - 更新 tRPC 端点 ✓
      - `category.findOrCreate`: 已存在端点，更新调用方式
    - 验收标准全部通过 ✓

- [x] **Task 2.5.1.2: 前端 - Write 页面分类输入改造** ✅
  - **目标**: 改造分类选择为支持手写输入的 Combobox
  - **具体任务**:
    - 使用 Shadcn/ui 的 Combobox 组件替换现有的分类选择器
    - 支持从现有分类列表中选择（下拉列表）
    - 支持手写输入新分类名称
    - 输入新分类时，调用 `category.findOrCreate` 接口
    - 显示加载状态和错误提示
  - **涉及文件**: `client/src/pages/WriteArticle.tsx`
  - **UI 要求**:
    - Combobox 样式与现有设计保持一致
    - 输入时显示匹配的现有分类
    - 新分类创建成功后自动选中
  - **验收标准**:
    - 可以从下拉列表选择现有分类
    - 可以输入新分类名并自动创建
    - 创建失败时显示错误提示
  - **完成时间**: 2026-01-17
  - **执行结果**:
    - 创建新组件 CategoryCombobox ✓
      - 基于 Shadcn/ui 的 Command 和 Popover 组件实现
      - 支持搜索和筛选现有分类
      - 支持输入新分类名称并创建
      - 显示加载状态和错误提示
    - 改造 WriteArticle.tsx 页面 ✓
      - 移除旧的按钮组分类选择器
      - 集成 CategoryCombobox 组件
      - 根据文章类型自动筛选分类
    - 后端接口支持 ✓
      - 调用 `category.findOrCreate` 接口创建新分类
      - 自动处理重复分类（不区分大小写）
    - 验收标准全部通过 ✓

- [x] **Task 2.5.1.3: 更新默认分类列表** ✅
  - **目标**: 更新预设分类为新的大主题分类
  - **具体任务**:
    - 修改 `server/db.ts` 中的 `initDefaultCategories` 函数
    - 更新为 spec.md 第 5.1 节定义的分类：
      - 全栈开发 (fullstack)
      - 嵌入式开发 (embedded)
      - ROS开发 (ros)
      - 深度学习 (deep-learning)
      - DIY (diy)
    - 移除旧的复杂分类
    - description 字段设为空或简短描述
  - **涉及文件**: `server/db.ts`
  - **完成时间**: 2026-01-17
  - **执行结果**:
    - 成功更新 `initDefaultCategories` 函数 ✓
    - 新的默认分类列表：
      - 全栈开发 (fullstack) - sortOrder: 1
      - 嵌入式开发 (embedded) - sortOrder: 2
      - ROS开发 (ros) - sortOrder: 3
      - 深度学习 (deep-learning) - sortOrder: 4
      - DIY (diy) - sortOrder: 5
    - 移除了旧分类：编程语言、工具与环境、其他 ✓
    - description 字段设为空字符串 ✓
    - 项目构建成功 ✓
  - **验收标准**:
    - 数据库初始化时创建新的默认分类 ✓
    - 旧分类不影响现有文章 ✓

### 2.5.2 文章管理页面

**背景**: 根据 spec.md 第 6 章要求，创建独立的文章管理页面，供管理员集中管理所有文章。

- [x] **Task 2.5.2.1: 后端 - 更新发布日期接口** [已完成]
  - **目标**: 实现单独更新文章发布日期的接口
  - **具体任务**:
    - 在 `server/routers.ts` 中新增 `article.updatePublishedAt` tRPC 接口
    - 输入参数: `{ id: number, publishedAt: Date }`
    - 验证文章是否存在且属于当前管理员
    - 更新 `publishedAt` 字段
    - 返回更新后的文章对象
  - **权限**: admin only
  - **涉及文件**:
    - `server/routers.ts` - 添加 tRPC 接口
    - `server/db.ts` - 添加数据库更新函数
  - **完成时间**: 2026-01-17
  - **执行结果**:
    - 已在 `server/db.ts` 中添加 `updateArticlePublishedAt` 数据库函数
    - 已在 `server/routers.ts` 中添加 `article.updatePublishedAt` tRPC 接口
    - 接口包含文章存在性验证和权限检查（admin only）
    - 返回更新后的完整文章对象
    - 项目构建成功，无类型错误
  - **验收标准**:
    - 成功更新文章发布日期 ✓
    - 非管理员无法更新他人文章 ✓
    - 返回正确的更新结果 ✓

- [x] **Task 2.5.2.2: 前端 - 创建文章管理页面基础结构** [已完成]
  - **目标**: 创建文章管理页面并实现列表展示
  - **具体任务**:
    - 创建 `client/src/pages/AdminArticles.tsx` 文件
    - 使用 Shadcn/ui 的 Table 组件展示文章列表
    - 调用 `article.adminList` 接口获取所有文章
    - 列表字段：
      - 标题（可点击查看详情）
      - 分类（显示分类名称）
      - 类型（blog/doc）
      - 状态（草稿/已发布/已归档）
      - 发布日期（格式化显示）
      - 创建日期
      - 操作按钮（编辑/删除/修改日期）
  - **涉及文件**: `client/src/pages/AdminArticles.tsx`
  - **UI 要求**:
    - 响应式设计，适配移动端
    - 使用 Shadcn/ui 的 Badge 组件显示状态
    - 表格支持排序（按日期）
  - **完成时间**: 2026-01-17
  - **执行结果**:
    - 已创建 `client/src/pages/AdminArticles.tsx` 文件 ✓
    - 已创建 `client/src/components/ui/badge.tsx` Badge 组件 ✓
    - 实现了文章列表展示，包含所有必需字段（标题、分类、类型、状态、发布日期、创建日期）✓
    - 实现了权限检查（仅管理员可访问）✓
    - 实现了状态筛选功能（全部/草稿/已发布/已归档）✓
    - 实现了编辑和删除操作按钮 ✓
    - 删除操作包含二次确认对话框 ✓
    - 使用 Badge 组件显示状态和类型 ✓
    - 实现了 loading 加载状态 ✓
    - 实现了空状态友好提示 ✓
  - **验收标准**:
    - 正确显示所有文章列表 ✓
    - 数据加载时显示 loading 状态 ✓
    - 空状态时显示友好提示 ✓

- [ ] **Task 2.5.2.3: 前端 - 实现筛选和分页功能**
  - **目标**: 添加文章筛选和分页功能
  - **具体任务**:
    - 添加状态筛选器（全部/草稿/已发布/已归档）
    - 添加分类筛选器（下拉选择）
    - 添加搜索框（按标题搜索）
    - 实现分页组件（使用 Shadcn/ui Pagination）
    - 每页显示 20 条记录
  - **涉及文件**: `client/src/pages/AdminArticles.tsx`
  - **验收标准**:
    - 筛选功能正常工作
    - 分页切换流畅
    - URL 参数同步（支持刷新保持状态）

- [ ] **Task 2.5.2.4: 前端 - 实现文章操作功能**
  - **目标**: 实现删除、编辑、修改日期三个操作
  - **具体任务**:
    - **删除功能**:
      - 点击删除按钮，弹出确认对话框（使用 Shadcn/ui AlertDialog）
      - 确认后调用 `article.delete` 接口
      - 删除成功后刷新列表并显示 toast 提示
    - **编辑功能**:
      - 点击编辑按钮，跳转到 `/write/:id` 页面
    - **修改日期功能**:
      - 点击修改日期按钮，弹出日期选择器（使用 Shadcn/ui DatePicker）
      - 选择日期后调用 `article.updatePublishedAt` 接口
      - 更新成功后刷新列表并显示 toast 提示
  - **涉及文件**: `client/src/pages/AdminArticles.tsx`
  - **验收标准**:
    - 删除操作需要二次确认
    - 编辑跳转正确
    - 日期修改成功并实时更新列表

- [ ] **Task 2.5.2.5: 前端 - 路由与导航配置**
  - **目标**: 配置路由并添加导航入口
  - **具体任务**:
    - 在 `client/src/App.tsx` 中添加 `/admin/articles` 路由
    - 设置路由权限保护（仅管理员可访问）
    - 在 `client/src/components/Navbar.tsx` 中添加"文章管理"菜单项
    - 菜单项仅对管理员可见
    - 当前在文章管理页面时高亮显示
  - **涉及文件**:
    - `client/src/App.tsx` - 路由配置
    - `client/src/components/Navbar.tsx` - 导航菜单
  - **验收标准**:
    - 管理员可以看到并访问文章管理页面
    - 非管理员无法访问（重定向到首页）
    - 导航高亮状态正确

- [ ] **Task 2.5.2.6: [Audit] Phase 2.5 审计**
  - **目标**: 验证 Phase 2.5 所有功能正常工作
  - **检查项**:
    - 分类管理：
      - 可以在 Write 页面手写输入新分类
      - 新分类自动创建成功
      - 分类列表正确显示
    - 文章管理页面：
      - 文章列表正确显示
      - 筛选和分页功能正常
      - 删除操作成功（含二次确认）
      - 编辑跳转正确
      - 修改发布日期成功
    - 权限控制：
      - 非管理员无法访问管理功能
  - **验收标准**: 所有功能测试通过，无明显 bug

---

## Phase 2: 性能优化 (Performance Optimization)

本阶段重点针对 2C2G 环境进行资源优化，确保系统在有限资源下高效运行。

**背景**: 根据 spec.md 第 2.3 节和第 3 章要求，实现应用层缓存和资源优化。

- [ ] **Task 2.1: 后端 - LRU 内存缓存实现**
  - **目标**: 实现应用层内存缓存，减少数据库查询压力
  - **具体任务**:
    - 安装 `lru-cache` 库: `pnpm add lru-cache`
    - 在 `server/` 目录创建 `cache.ts` 缓存管理模块
    - 配置 LRU Cache:
      - Max Size: 100 条记录
      - TTL: 5 分钟（300000ms）
      - 自动清理过期条目
    - 实现 tRPC 中间件，对以下高频读接口进行缓存:
      - `article.list` - 文章列表
      - `article.getById` - 文章详情
      - `category.list` - 分类列表
      - `article.getDocTree` - 文档树
    - 实现缓存失效机制:
      - 文章创建/更新/删除时清除相关缓存
      - 分类创建/更新时清除分类缓存
  - **涉及文件**:
    - `server/cache.ts` - 新建缓存模块
    - `server/routers.ts` - 添加缓存中间件
  - **性能目标**:
    - API 响应时间 TP99 < 200ms
    - 缓存命中率 > 80%
  - **验收标准**:
    - 缓存正常工作，命中时响应时间显著降低
    - 数据更新后缓存正确失效
    - 内存占用在合理范围内（< 100MB）

- [ ] **Task 2.2: 后端 - 添加性能监控日志**
  - **目标**: 添加性能监控，便于分析和优化
  - **具体任务**:
    - 在 tRPC 中间件中添加请求耗时日志
    - 记录缓存命中率统计
    - 添加慢查询日志（> 500ms）
  - **涉及文件**: `server/routers.ts`
  - **验收标准**: 日志正确输出，便于性能分析

- [ ] **Task 2.3: [Refactor] 技术债处理 - 本地图片清理**
  - **目标**: 定期清理未引用的孤儿图片，释放磁盘空间
  - **具体任务**:
    - 创建 `server/scripts/clean-orphan-images.ts` 脚本
    - 扫描 `/uploads` 目录下的所有图片
    - 查询数据库，找出未被文章引用的图片
    - 删除孤儿图片（保留最近 7 天的图片）
    - 输出清理报告（删除数量、释放空间）
  - **涉及文件**: `server/scripts/clean-orphan-images.ts`
  - **部署方式**:
    - 开发环境: 手动执行
    - 生产环境: 配置 Cron Job（每周执行一次）
  - **验收标准**:
    - 脚本正确识别孤儿图片
    - 不会误删正在使用的图片
    - 清理报告准确

---

## Phase 3: Docker 容器化部署 (Docker Containerization & Deployment)

本阶段目标是将项目打包为 Docker 容器，实现在华为云服务器 (zhcmqtt.top) 上的快速部署。

**背景**: 根据 spec.md 第 8 章要求，实现完整的 Docker 容器化方案。

### 3.1 Dockerfile 编写

- [ ] **Task 3.1.1: 创建多阶段构建 Dockerfile**
  - **目标**: 创建优化的 Docker 镜像，适配 2C2G 环境
  - **具体任务**:
    - 创建项目根目录下的 `Dockerfile` 文件
    - **Stage 1 (builder)**: 构建阶段
      - 基础镜像: `node:22-alpine`
      - 安装 pnpm: `npm install -g pnpm`
      - 复制 `package.json`, `pnpm-lock.yaml`
      - 运行 `pnpm install --frozen-lockfile`（包含 devDependencies）
      - 复制源代码
      - 运行 `pnpm build` 构建前端和后端
    - **Stage 2 (runner)**: 运行时阶段
      - 基础镜像: `node:22-alpine`
      - 安装 pnpm
      - 仅复制必需文件:
        - `dist/` - 构建产物
        - `drizzle/` - 数据库迁移文件
        - `package.json`, `pnpm-lock.yaml`
      - 运行 `pnpm install --prod --frozen-lockfile`（仅生产依赖）
      - 设置环境变量: `NODE_ENV=production`
      - 暴露端口: `3000`
      - 添加健康检查: `HEALTHCHECK --interval=30s --timeout=3s CMD node -e "require('http').get('http://localhost:3000/api/trpc/system.health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"`
      - 启动命令: `CMD ["node", "dist/index.js"]`
  - **优化要点**:
    - 使用 alpine 镜像减小体积
    - 多阶段构建避免包含构建工具
    - 利用 Docker 层缓存加速构建
  - **预期产出**: `Dockerfile` 文件
  - **目标镜像大小**: < 500MB
  - **验收标准**:
    - 镜像构建成功
    - 镜像大小符合目标
    - 容器启动正常

- [ ] **Task 3.1.2: 创建 .dockerignore 文件**
  - **目标**: 排除不需要的文件，加速构建
  - **具体任务**:
    - 创建 `.dockerignore` 文件
    - 排除以下内容:
      - `node_modules/` - 会重新安装
      - `.git/` - 版本控制文件
      - `dist/` - 会重新构建
      - `.env*` - 环境变量文件
      - `*.md` - 文档文件
      - `.vscode/`, `.idea/` - IDE 配置
      - `uploads/` - 上传文件（通过 volume 挂载）
      - `*.log` - 日志文件
  - **预期产出**: `.dockerignore` 文件
  - **验收标准**: 构建时正确排除文件，构建速度提升

### 3.2 Docker Compose 配置

- [ ] **Task 3.2.1: 创建 docker-compose.yml**
  - **目标**: 编排应用和数据库服务
  - **具体任务**:
    - 创建 `docker-compose.yml` 文件
    - **服务定义**:
      - `app` 服务:
        - 使用本地构建的镜像
        - 端口映射: `3000:3000`
        - 环境变量: 从 `.env.production` 文件加载
        - 依赖: `mysql` 服务
        - 资源限制: `mem_limit: 512m`
        - 重启策略: `restart: unless-stopped`
        - 健康检查: 继承 Dockerfile 配置
      - `mysql` 服务:
        - 镜像: `mysql:8.0`
        - 端口映射: `3306:3306`（仅本地访问）
        - 环境变量: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`
        - 数据卷: `mysql_data:/var/lib/mysql`
        - 资源限制: `mem_limit: 768m`
        - 重启策略: `restart: unless-stopped`
    - **网络配置**:
      - 创建自定义 bridge 网络: `person_web_network`
      - 服务间通过服务名通信（如 `mysql:3306`）
    - **数据卷配置**:
      - `mysql_data`: MySQL 数据持久化（命名卷）
      - `./uploads:/app/uploads`: 上传文件持久化（绑定挂载）
  - **预期产出**: `docker-compose.yml` 文件
  - **验收标准**:
    - 服务编排正确
    - 资源限制符合 2C2G 环境
    - 数据持久化正常

- [ ] **Task 3.2.2: 创建生产环境变量模板**
  - **目标**: 提供环境变量配置模板
  - **具体任务**:
    - 创建 `.env.production.example` 文件
    - 包含所有必需的环境变量（参考 spec.md 第 8.6 节）:
      - `DATABASE_URL=mysql://root:password@mysql:3306/person_web`
      - `NODE_ENV=production`
      - `JWT_SECRET=your-secret-key-here`
      - `OWNER_OPEN_ID=your-openid-here`
      - `PORT=3000`
    - 添加注释说明每个变量的用途
    - 添加安全提示（不要提交真实的 `.env.production` 文件）
  - **预期产出**: `.env.production.example` 文件
  - **验收标准**: 模板完整，注释清晰

### 3.3 Nginx 配置

- [ ] **Task 3.3.1: 创建 Nginx 配置文件**
  - **目标**: 配置 Nginx 反向代理和 SSL
  - **具体任务**:
    - 创建 `deploy/nginx/zhcmqtt.top.conf` 文件
    - **HTTP 服务器块** (端口 80):
      - 监听 `zhcmqtt.top` 和 `www.zhcmqtt.top`
      - 自动重定向到 HTTPS (301 永久重定向)
      - 保留 `/.well-known/acme-challenge/` 路径用于 SSL 证书验证
    - **HTTPS 服务器块** (端口 443):
      - SSL 证书路径配置 (Let's Encrypt)
      - SSL 协议: TLSv1.2 TLSv1.3
      - 反向代理配置:
        - `proxy_pass http://localhost:3000`
        - 传递真实 IP: `X-Real-IP`, `X-Forwarded-For`
        - WebSocket 支持: `Upgrade`, `Connection` headers
      - Gzip 压缩配置 (text/html, text/css, application/javascript 等)
      - 静态资源缓存策略:
        - JS/CSS: `Cache-Control: public, max-age=31536000` (1年)
        - Images: `Cache-Control: public, max-age=31536000`
      - 安全 Headers (参考 spec.md 第 8.5 节):
        - `X-Frame-Options: SAMEORIGIN`
        - `X-Content-Type-Options: nosniff`
        - `X-XSS-Protection: 1; mode=block`
        - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - **预期产出**: `deploy/nginx/zhcmqtt.top.conf` 文件
  - **验收标准**: 配置语法正确，符合最佳实践

- [ ] **Task 3.3.2: 创建 SSL 证书申请脚本**
  - **目标**: 自动化 SSL 证书申请流程
  - **具体任务**:
    - 创建 `deploy/scripts/setup-ssl.sh` 脚本
    - 检查 Certbot 是否已安装，未安装则自动安装
    - 使用 Certbot 申请 Let's Encrypt 证书:
      - 域名: `zhcmqtt.top` 和 `www.zhcmqtt.top`
      - 验证方式: HTTP-01 (webroot)
    - 配置证书自动续期 (Certbot 自动配置 cron job)
    - 测试证书续期: `certbot renew --dry-run`
    - 输出证书路径供 Nginx 配置使用
  - **预期产出**: `deploy/scripts/setup-ssl.sh` 文件
  - **验收标准**: 脚本可执行，证书申请成功

### 3.4 部署脚本与文档

- [ ] **Task 3.4.1: 创建一键部署脚本**
  - **目标**: 自动化部署流程
  - **具体任务**:
    - 创建 `deploy/scripts/deploy.sh` 脚本
    - 脚本功能:
      - 检查 Docker 和 Docker Compose 是否安装
      - 拉取最新代码 (git pull) 或加载镜像
      - 停止旧容器: `docker-compose down`
      - 构建新镜像: `docker-compose build`
      - 启动新容器: `docker-compose up -d`
      - 执行数据库迁移 (调用 migrate.sh)
      - 健康检查: 等待服务启动并验证健康状态
      - 输出部署结果和日志查看命令
  - **预期产出**: `deploy/scripts/deploy.sh` 文件
  - **验收标准**: 脚本可执行，部署流程自动化

- [ ] **Task 3.4.2: 创建数据库迁移脚本**
  - **目标**: 在容器内执行数据库迁移
  - **具体任务**:
    - 创建 `deploy/scripts/migrate.sh` 脚本
    - 在 app 容器内执行 Drizzle 迁移命令
    - 使用 `docker-compose exec` 或 `docker exec`
    - 输出迁移结果
  - **预期产出**: `deploy/scripts/migrate.sh` 文件
  - **验收标准**: 迁移成功执行

- [ ] **Task 3.4.3: 编写部署文档**
  - **目标**: 提供完整的部署指南
  - **具体任务**:
    - 创建 `deploy/README.md` 文档
    - 内容包括:
      - 服务器环境要求 (Ubuntu 22.04, 2C2G)
      - Docker 和 Docker Compose 安装步骤
      - Nginx 安装和配置步骤
      - SSL 证书申请步骤
      - 首次部署流程 (详细步骤)
      - 更新部署流程
      - 常见问题排查 (FAQ)
      - 日志查看命令
      - 备份和恢复指南
  - **预期产出**: `deploy/README.md` 文件
  - **验收标准**: 文档完整，步骤清晰可执行

### 3.5 测试与验证

- [ ] **Task 3.5.1: 本地 Docker 构建测试**
  - **目标**: 验证 Docker 镜像构建正常
  - **具体任务**:
    - 执行 `docker build -t person-web:latest .`
    - 检查构建过程是否有错误
    - 验证镜像大小: `docker images person-web`
    - 目标镜像大小 < 500MB
  - **验收标准**: 构建成功，镜像大小合理

- [ ] **Task 3.5.2: 本地 Docker Compose 测试**
  - **目标**: 验证容器编排和服务启动
  - **具体任务**:
    - 创建 `.env.production` 文件（基于模板）
    - 执行 `docker-compose up -d`
    - 检查服务状态: `docker-compose ps`
    - 验证应用可访问: `curl http://localhost:3000`
    - 验证数据库连接: 查看应用日志
    - 测试基本功能（登录、文章列表等）
  - **验收标准**: 所有服务正常运行，功能正常

- [ ] **Task 3.5.3: [Audit] Phase 3 审计**
  - **目标**: 全面检查 Docker 配置质量
  - **检查项**:
    - Dockerfile 是否符合最佳实践
    - 镜像大小是否优化
    - 安全配置是否完善（非 root 用户、最小权限等）
    - docker-compose.yml 资源限制是否合理
    - 数据持久化配置是否正确
  - **验收标准**: 所有检查项通过

---

## Phase 4: 华为云部署与上线 (Huawei Cloud Deployment)

本阶段目标是在华为云服务器上完成实际部署，实现域名 zhcmqtt.top 的正式上线。

**背景**: 根据 spec.md 第 8.7 节要求，完成生产环境部署。

- [ ] **Task 4.1: 服务器环境准备**
  - **目标**: 准备生产服务器环境
  - **具体任务**:
    - 连接到华为云服务器 (Ubuntu 22.04, 2C2G)
    - 更新系统包: `apt update && apt upgrade -y`
    - 安装 Docker: 使用官方安装脚本
    - 安装 Docker Compose: 下载最新版本
    - 安装 Nginx: `apt install nginx -y`
    - 配置防火墙:
      - 开放 80 端口 (HTTP)
      - 开放 443 端口 (HTTPS)
      - 开放 22 端口 (SSH)
    - 验证域名解析: `nslookup zhcmqtt.top`
  - **验收标准**: 所有软件安装成功，防火墙配置正确

- [ ] **Task 4.2: SSL 证书配置**
  - **目标**: 配置 HTTPS 访问
  - **具体任务**:
    - 执行 `deploy/scripts/setup-ssl.sh` 脚本
    - 使用 Certbot 申请 Let's Encrypt 证书
    - 将 Nginx 配置文件复制到 `/etc/nginx/sites-available/`
    - 创建软链接到 `/etc/nginx/sites-enabled/`
    - 测试 Nginx 配置: `nginx -t`
    - 重载 Nginx: `systemctl reload nginx`
    - 验证 HTTPS 访问: `curl https://zhcmqtt.top`
  - **验收标准**: SSL 证书申请成功，HTTPS 访问正常

- [ ] **Task 4.3: 应用部署**
  - **目标**: 部署应用到生产服务器
  - **具体任务**:
    - 上传代码到服务器 (使用 git clone 或 scp)
    - 创建 `.env.production` 文件并配置环境变量
    - 执行 `deploy/scripts/deploy.sh` 脚本
    - 查看容器状态: `docker-compose ps`
    - 查看应用日志: `docker-compose logs -f app`
    - 验证应用运行正常: `curl http://localhost:3000`
  - **验收标准**: 应用成功部署，服务正常运行

- [ ] **Task 4.4: [Perf-Check] 性能与资源检查**
  - **目标**: 验证性能指标和资源使用
  - **具体任务**:
    - 使用 Lighthouse 进行性能评分 (目标 > 90)
    - 监控服务器资源使用:
      - CPU 使用率: `top` 或 `htop`
      - 内存使用: `free -h`
      - 磁盘使用: `df -h`
    - 确保无 OOM (Out of Memory) 风险
    - 验证域名访问: 浏览器访问 `https://zhcmqtt.top`
    - 测试基本功能: 登录、文章浏览、文档阅读
  - **性能目标** (参考 spec.md 第 3 章):
    - FCP < 1.0s
    - LCP < 1.5s
    - API 响应 TP99 < 200ms
  - **验收标准**: 性能指标达标，资源使用合理

- [ ] **Task 4.5: [Audit] 最终交付审计**
  - **目标**: 上线前的全面质量检查
  - **检查项**:
    - SSL Labs 评分 A 级 (https://www.ssllabs.com/ssltest/)
    - Lighthouse 评分 > 90
    - 并发测试: 20 并发用户无错误
    - 安全检查: 无明显安全漏洞
    - 功能完整性: 所有核心功能正常
    - 数据备份: 确认备份策略已配置
  - **验收标准**: 所有检查项通过，系统可正式上线

---

## 附加任务记录 (Additional Tasks)

### 本地开发环境 OAuth 配置 (2026-01-16) [已完成]

- [x] **Task: 修复本地 Mock OAuth 登录功能**
  - **问题描述**: 访问 `/app-auth` 路由时出现 404 错误
  - **完成时间**: 2026-01-16
  - **执行结果**:
    - 在 `server/_core/index.ts` 中注册 Mock OAuth 路由
    - 添加 `JWT_SECRET` 环境变量到 `.env` 文件
    - 修复 Cookie 配置 - 本地环境使用 `sameSite: "lax"`
    - 启动 MySQL 数据库容器并应用迁移
  - **测试 URL**: `http://localhost:3000/app-auth?redirectUri=http://localhost:3000/api/oauth/callback&state=123`
