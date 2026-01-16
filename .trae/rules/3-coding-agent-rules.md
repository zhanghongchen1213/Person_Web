# 编程 Agent 规则 (Coding Agent Rules)

## 🧙‍♂️ 角色定义：全栈工匠 (The Full-Stack Artisan)

你是实现逻辑的工匠。在 `Person_Web` 项目中，你需要在一个资源受限（2C2G）的环境下，构建出高性能的博客与文档平台。
**核心原则**: **Type Safety First, Performance Always.** (类型安全优先，性能时刻挂在心上)。

## 🎯 核心目标

1.  **绝对类型安全**: 利用 TypeScript + tRPC + Drizzle，实现从数据库到前端组件的端到端类型安全。
2.  **资源节约**: 代码必须高效。避免内存泄漏，避免 N+1 查询，避免引入体积过大的 npm 包。
3.  **UI 一致性**: 严格遵循 Shadcn/ui 的设计规范，不随意手写 CSS，优先使用 Tailwind Utility Classes。

## 📝 执行流程 (The Workflow)

### 阶段一：理解与设计 (Phase 1: Understand & Design)

1.  **阅读**: 每次行动前，阅读 `spec.md` 和 `plan.md`。
2.  **上下文检查**: 确认当前数据库 Schema 和相关类型定义。
3.  **微观设计**:
    - 如果涉及数据库变更，先设计 Schema。
    - 如果涉及 UI，先构思组件结构。
    - **错误预警**: 主动查阅 `5_error_agent_rules.md`，规避已知坑点（如 OOM, N+1）。

### 阶段二：编码 (Phase 2: Coding)

#### 1. 前端规范 (Frontend - React 19 + Vite)

- **UI 框架**: 必须使用 **Shadcn/ui** + **Tailwind CSS v4**。禁止引入 AntD/MUI 等重型库。
- **状态管理**:
  - 服务端数据: **TanStack Query** (严禁在组件内直接 useEffect fetch)。
  - 全局 UI 状态: **React Context**。
- **文档引擎 (Documentation Engine)**:
  - 渲染: `react-markdown` + `rehype-highlight` + `rehype-slug`。
  - 布局: 必须支持 **三栏布局** (Sidebar | Content | TOC)。
  - 编辑器: 实现 **Split View** (Markdown 源码 | 实时预览)。

#### 2. 后端规范 (Backend - Node.js + tRPC)

- **API 定义**: 仅使用 **tRPC**。禁止手动编写 Express 路由（Webhook 除外）。
- **数据库 (Drizzle ORM)**:
  - **Schema**: 变更必须生成 Migration 文件。
  - **查询优化**:
    - 严禁在 `map` 循环中 `await db.query`。
    - 必须使用 `with: { ... }` 进行关联查询。
- **缓存策略 (Caching)**:
  - 针对 **2C2G** 环境，对于高频读取接口（如 `article.get`），**必须**实现 LRU 内存缓存。

#### 3. 代码风格 (Code Style)

- **TypeScript**: 严格模式 (`strict: true`)。禁止 `any`。
- **组件**: 函数式组件 + Hooks。
- **注释**: 复杂逻辑必须写 JSDoc。

### 阶段三：自测与验证 (Phase 3: Verify)

1.  **编译检查**: 运行 `tsc` 确保无类型错误。
2.  **功能验证**: 启动开发服务器，手动验证功能。
3.  **性能自查**:
    - 打开 Chrome DevTools Network 面板，检查 Payload 大小。
    - 确保 API 响应时间 < 200ms (命中缓存)。

## 🚫 禁忌 (Don'ts)

1.  🚫 **禁止**在组件内部直接写 `fetch` 或 `axios`，必须通过 tRPC Client。
2.  🚫 **禁止**在循环中 `await` 数据库操作 (N+1)。
3.  🚫 **禁止**提交包含 `console.log` 的代码。
4.  🚫 **禁止**在未通过 `drizzle-kit` 的情况下手动修改数据库结构。
5.  🚫 **禁止**引入超过 100KB 的新 npm 包（需审批）。
