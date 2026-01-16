# 项目执行计划 (Execution Plan): Person_Web

> 生成时间: 2026-01-16
> 来源: Plan Generation Agent
> 基于文档: `spec.md` (2026-01-16)

## Phase 0: 基础设施与重构 (Infrastructure & Refactor)

本阶段目标是为文档引擎准备必要的数据结构，并确保开发环境符合规范。

- [x] **Task 0.1: 基础设施检查与规则注入** ✅
  - 检查 Node.js, pnpm 版本是否符合要求。
  - 确认 `.trae/rules` 下的规则文件已更新且生效。
  - 验证开发服务器 (`pnpm dev`) 启动无误。
  - **完成时间**: 2026-01-16
  - **执行结果**:
    - Node.js v22.14.0 ✓
    - pnpm 10.4.1 ✓
    - 规则文件完整性检查通过 ✓
    - 开发服务器启动成功（已修复 Windows 环境变量问题）✓
- [x] **Task 0.2: 数据库 Schema 升级** ✅
  - 修改 `drizzle/schema.ts`，在 `articles` 表中添加 `order` (int, default 0) 和 `type` (enum: 'blog', 'doc') 字段。
  - 修改 `drizzle/schema.ts`，在 `categories` 表中添加 `type` (enum: 'blog', 'doc') 字段。
  - 运行 `drizzle-kit generate` 生成迁移文件。
  - 运行 `drizzle-kit migrate` 应用变更到数据库。
  - 更新 `server/routers.ts` 中的 Zod Schema 定义，确保 tRPC 输入输出类型同步更新。
  - **完成时间**: 2026-01-16
  - **执行结果**:
    - Schema 更新完成 ✓
      - `articles` 表新增 `type` (enum: 'blog', 'doc', default 'blog') 和 `order` (int, default 0) 字段
      - `categories` 表新增 `type` (enum: 'blog', 'doc', default 'blog') 字段
    - 迁移文件生成成功: `0005_spicy_jasper_sitwell.sql` ✓
    - tRPC Router 更新完成 ✓
      - 所有相关接口的 Zod Schema 已同步更新
      - 类型安全验证通过（TypeScript 编译无错误）
    - 数据库函数更新完成 ✓
      - `getArticles()`, `createArticle()`, `updateArticle()` 已支持新字段
      - `getCategories()`, `createCategory()`, `updateCategory()` 已支持新字段
    - **注意**: 迁移文件已生成，将在数据库可用时自动应用
- [x] **Task 0.3: [Audit] Phase 0 审计**
  - 呼叫 Build Plan Agent 检查数据库结构是否正确更新，且无数据丢失风险。

## Phase 1: 文档引擎核心 (Doc Engine Core)

本阶段目标是交付类似 GitBook 的核心阅读体验和后台编辑能力。

- [x] **Task 1.1: 后端 - 文档数据层实现** ✅
  - 在 `server/routers.ts` 中实现 `getDocTree` 接口，支持按 `order` 字段对文章进行排序。
  - 实现 `getCategory` 接口的增强，支持根据 `type` 筛选分类（区分博客和文档）。
  - 确保查询逻辑使用 `with: { ... }` 避免 N+1 问题。
  - **完成时间**: 2026-01-16
  - **执行结果**:
    - 新增数据库函数 ✓
      - `getDocTree()`: 获取文档导航树，按 `order` 排序
      - `getCategoryWithArticles()`: 获取分类及关联文章，支持分页
      - `batchFetchArticleRelations()`: 批量获取文章关联数据
    - 新增 tRPC 端点 ✓
      - `doc.tree`: 获取文档树结构
      - `category.withArticles`: 获取分类详情及文章列表
    - N+1 问题优化 ✓
      - 优化 `getArticles()`: 使用批量 IN 查询
      - 优化 `getRelatedArticles()`: 统一批量获取关联数据
      - 优化 `getArticleCountByCategory()`: 使用 GROUP BY 单次查询
    - TypeScript 类型安全验证通过 ✓
- [x] **Task 1.2: 后台 - 编辑器升级 (Split View)** ✅
  - 改造 `WriteArticle.tsx` 页面。
  - 集成或实现 Markdown 分栏编辑器 (左侧源码，右侧实时预览)。
  - 实现 Markdown 粘贴自动格式化功能 (处理图片、代码块等)。
  - 在发布/编辑表单中增加 `type` (博客/文档) 和 `order` (排序权重) 的输入控件。
  - **完成时间**: 2026-01-16
  - **执行结果**:
    - 新建 Markdown 编辑器组件 ✓
      - 创建 `MarkdownEditor.tsx` 组件，支持三种视图模式（编辑/分栏/预览）
      - 实现可调整大小的分栏布局
      - 集成工具栏（加粗、斜体、标题、列表、链接、图片等）
    - 粘贴自动格式化功能 ✓
      - 自动检测粘贴的图片并生成 Markdown 占位符
      - HTML 转 Markdown（支持标题、加粗、斜体、链接、列表、代码块）
      - 自动检测代码片段并添加代码块标记
    - WriteArticle.tsx 页面改造 ✓
      - 集成新的 MarkdownEditor 组件替换原有 textarea
      - 新增文章类型选择器（博客/文档）
      - 新增排序权重输入框（仅文档类型显示）
      - 更新数据流，支持 type 和 order 字段的读取和提交
- [x] **Task 1.3: 前端 - 文档阅读器开发** ✅
  - 创建新的文档布局组件 `DocLayout.tsx`，实现三栏布局 (Sidebar 目录树 | Main 正文 | Aside 页内 TOC)。
  - 配置 `react-markdown` 渲染管线：
    - 集成 `rehype-highlight` 实现代码高亮。
    - 集成 `rehype-slug` 生成标题锚点。
  - 实现 Sidebar 的目录展开/折叠逻辑，并高亮当前阅读章节。
  - 实现上一篇/下一篇的底部导航逻辑。
  - **完成时间**: 2026-01-16
  - **执行结果**:
    - 创建了完整的文档阅读器组件体系 ✓
      - `DocLayout.tsx` - 三栏响应式布局
      - `DocSidebar.tsx` - 目录树导航（支持展开/折叠）
      - `DocTOC.tsx` - 页内目录
      - `DocNavigation.tsx` - 上一篇/下一篇导航
      - `MarkdownRenderer.tsx` - Markdown 渲染器
    - 集成 rehype-highlight 和 rehype-slug ✓
    - 实现滚动监听和当前章节高亮 ✓
    - 添加 `/docs/:category/:slug` 路由 ✓
    - 新增 `doc.tree` tRPC 端点 ✓
    - TypeScript 类型检查通过 ✓
- [x] **Task 1.4: [Audit] Phase 1 审计**
  - 呼叫 Build Plan Agent 检查文档阅读体验和编辑器功能是否符合 `spec.md` 要求。

## Phase 2: 性能与部署 (Performance & Deploy)

本阶段重点针对 2C2G 环境进行资源优化，并完成华为云部署。

- [ ] **Task 2.1: 后端 - LRU 内存缓存实现**
  - 引入 `lru-cache` 库。
  - 实现 tRPC 中间件或装饰器，对 `article.get`, `category.list` 等高频读接口进行缓存。
  - 设置合理的 TTL (如 5分钟) 和 Max Size，防止内存溢出。
  - 验证缓存命中率和响应时间 (目标 TP99 < 200ms)。
- [ ] **Task 2.2: 部署配置优化**
  - 配置 `ecosystem.config.js`，设置 PM2 运行模式 (推荐 `fork` 或限制实例数的 `cluster` 模式以节省内存)。
  - 编写/更新 Nginx 配置文件：
    - 开启 Gzip/Brotli 压缩。
    - 配置静态资源 (JS/CSS/Images) 的强缓存策略。
    - 配置 SSL 证书和安全 Headers。
- [ ] **Task 2.3: [Refactor] 技术债处理 - 本地图片清理**
  - 编写 Node.js 脚本，定期扫描 `/uploads` 目录，清理数据库中未引用的孤儿图片。
  - 设置 Cron Job 或定时任务触发该脚本。
- [ ] **Task 2.4: [Perf-Check] 性能与资源检查**
  - 运行 Lighthouse 进行性能评分 (目标 > 90)。
  - 模拟 50+ 并发用户，监控服务器内存占用，确保无 OOM 风险。
- [ ] **Task 2.5: [Audit] 最终交付审计**
  - 呼叫 Build Plan Agent 进行上线前的最终全量审计。
