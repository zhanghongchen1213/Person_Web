# 📚 Vibe-Kanban 系统学习指南

> 完整的 Vibe-Kanban 任务管理系统学习文档
>
> **文档版本**: v1.0.0
> **创建日期**: 2026-01-24
> **适用项目**: Person_Web

---

## 目录

1. [Vibe-Kanban 简介](#1-vibe-kanban-简介)
2. [核心概念](#2-核心概念)
3. [MCP 工具详解](#3-mcp-工具详解)
4. [仓库脚本配置](#4-仓库脚本配置)
5. [工作空间会话](#5-工作空间会话)
6. [实战示例](#6-实战示例)
7. [最佳实践](#7-最佳实践)
8. [常见问题](#8-常见问题)

---

## 1. Vibe-Kanban 简介

### 1.1 什么是 Vibe-Kanban？

**Vibe-Kanban** 是一个强大的**项目任务管理系统**，通过 MCP (Model Context Protocol) 工具集成到 Claude Code 中。它让你可以：

- 📋 **管理项目和任务** - 创建、更新、删除任务
- 🔄 **跟踪任务状态** - todo → in progress → in review → done
- 🤖 **启动 AI 代理** - 让 AI 自动完成任务
- 📦 **管理仓库脚本** - 配置初始化、清理、开发服务器脚本
- 🎯 **多执行器支持** - Claude Code, Gemini, Cursor 等

### 1.2 系统架构

```
Vibe-Kanban 系统
├── 项目 (Projects)
│   ├── Person_Web (当前项目)
│   └── 其他项目...
│
├── 任务 (Tasks)
│   ├── 任务 1: vibe-kanban学习 (in progress)
│   ├── 任务 2: 实现用户登录 (todo)
│   └── 任务 3: 优化数据库查询 (done)
│
├── 仓库 (Repositories)
│   ├── Person_Web 仓库
│   │   ├── setup_script (初始化脚本)
│   │   ├── cleanup_script (清理脚本)
│   │   └── dev_server_script (开发服务器脚本)
│   └── 其他仓库...
│
└── 工作空间会话 (Workspace Sessions)
    └── AI 代理自动执行任务
```

### 1.3 核心优势

✅ **类型安全** - 所有 API 都有完整的 TypeScript 类型定义
✅ **AI 驱动** - 支持多种 AI 代理自动完成任务
✅ **灵活配置** - 可自定义仓库脚本和工作流
✅ **状态追踪** - 清晰的任务状态流转机制
✅ **多项目支持** - 可管理多个项目和仓库

---

## 2. 核心概念

### 2.1 项目 (Project)

**定义**: 项目是任务和仓库的容器。

**属性**:
- `id` (UUID) - 项目唯一标识
- `name` (string) - 项目名称
- `created_at` (timestamp) - 创建时间
- `updated_at` (timestamp) - 更新时间

**示例**:
```json
{
  "id": "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  "name": "Person_Web",
  "created_at": "2026-01-24T07:40:33.740+00:00",
  "updated_at": "2026-01-24T07:40:33.740+00:00"
}
```

### 2.2 任务 (Task)

**定义**: 任务是需要完成的工作单元。

**属性**:
- `id` (UUID) - 任务唯一标识
- `title` (string) - 任务标题
- `description` (string) - 任务描述（可选）
- `status` (enum) - 任务状态
- `created_at` (timestamp) - 创建时间
- `updated_at` (timestamp) - 更新时间

**任务状态流转**:
```
todo (待办)
  ↓
inprogress (进行中)
  ↓
inreview (审查中)
  ↓
done (完成) / cancelled (取消)
```

**示例**:
```json
{
  "id": "5c669fc1-836a-4f16-93c2-c94de3e57f8c",
  "title": "vibe-kanban学习",
  "description": "学习 Vibe-Kanban 系统的使用方法",
  "status": "inprogress",
  "created_at": "2026-01-24T07:40:58.796+00:00",
  "updated_at": "2026-01-24T07:42:58+00:00"
}
```

### 2.3 仓库 (Repository)

**定义**: 仓库是项目关联的 Git 代码仓库。

**属性**:
- `id` (UUID) - 仓库唯一标识
- `name` (string) - 仓库名称
- `display_name` (string) - 显示名称
- `setup_script` (string) - 初始化脚本
- `cleanup_script` (string) - 清理脚本
- `dev_server_script` (string) - 开发服务器脚本

**示例**:
```json
{
  "id": "545d39de-35a1-4fcb-9281-007bda363b6f",
  "name": "Person_Web",
  "display_name": "Person_Web",
  "setup_script": "pnpm install && pnpm db:push",
  "cleanup_script": "docker compose down",
  "dev_server_script": "pnpm dev"
}
```

### 2.4 工作空间会话 (Workspace Session)

**定义**: 工作空间会话是 AI 代理执行任务的环境。

**组成部分**:
- 任务 ID
- 执行器类型（Claude Code, Gemini 等）
- 关联的仓库和分支
- 执行脚本

---

## 3. MCP 工具详解

### 3.1 项目管理工具

#### 3.1.1 list_projects - 列出所有项目

**功能**: 获取所有项目列表

**参数**: 无

**返回值**:
```typescript
{
  projects: Array<{
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
  }>;
  count: number;
}
```

**使用示例**:
```typescript
mcp__vibe_kanban__list_projects()
```

**返回示例**:
```json
{
  "projects": [
    {
      "id": "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
      "name": "Person_Web",
      "created_at": "2026-01-24T07:40:33.740+00:00",
      "updated_at": "2026-01-24T07:40:33.740+00:00"
    }
  ],
  "count": 1
}
```

---

### 3.2 任务管理工具

#### 3.2.1 list_tasks - 列出项目任务

**功能**: 获取指定项目的任务列表

**参数**:
```typescript
{
  project_id: string;      // 必需：项目 ID
  status?: string;         // 可选：筛选状态 (todo/inprogress/inreview/done/cancelled)
  limit?: number;          // 可选：限制数量 (默认 50)
}
```

**返回值**:
```typescript
{
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  count: number;
  project_id: string;
}
```

**使用示例**:
```typescript
// 获取所有任务
mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd"
})

// 只获取进行中的任务
mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  status: "inprogress"
})

// 限制返回数量
mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  limit: 10
})
```

#### 3.2.2 get_task - 获取任务详情

**功能**: 获取指定任务的详细信息

**参数**:
```typescript
{
  task_id: string;  // 必需：任务 ID
}
```

**返回值**:
```typescript
{
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    has_in_progress_attempt: boolean | null;
    last_attempt_failed: boolean | null;
  }
}
```

**使用示例**:
```typescript
mcp__vibe_kanban__get_task({
  task_id: "5c669fc1-836a-4f16-93c2-c94de3e57f8c"
})
```

#### 3.2.3 create_task - 创建新任务

**功能**: 在项目中创建新任务

**参数**:
```typescript
{
  project_id: string;      // 必需：项目 ID
  title: string;           // 必需：任务标题
  description?: string;    // 可选：任务描述
}
```

**返回值**:
```typescript
{
  task_id: string;
}
```

**使用示例**:
```typescript
mcp__vibe_kanban__create_task({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  title: "实现用户登录功能",
  description: "使用 GitHub OAuth 实现用户认证，包括前端登录按钮和后端回调处理"
})
```

#### 3.2.4 update_task - 更新任务

**功能**: 更新任务的标题、描述或状态

**参数**:
```typescript
{
  task_id: string;         // 必需：任务 ID
  title?: string;          // 可选：新标题
  description?: string;    // 可选：新描述
  status?: string;         // 可选：新状态 (todo/inprogress/inreview/done/cancelled)
}
```

**返回值**:
```typescript
{
  success: boolean;
}
```

**使用示例**:
```typescript
// 更新任务状态
mcp__vibe_kanban__update_task({
  task_id: "5c669fc1-836a-4f16-93c2-c94de3e57f8c",
  status: "done"
})

// 更新任务标题和描述
mcp__vibe_kanban__update_task({
  task_id: "5c669fc1-836a-4f16-93c2-c94de3e57f8c",
  title: "完成 Vibe-Kanban 学习",
  description: "已掌握所有核心功能和 API 使用方法"
})
```

#### 3.2.5 delete_task - 删除任务

**功能**: 删除指定任务

**参数**:
```typescript
{
  task_id: string;  // 必需：任务 ID
}
```

**返回值**:
```typescript
{
  success: boolean;
}
```

**使用示例**:
```typescript
mcp__vibe_kanban__delete_task({
  task_id: "5c669fc1-836a-4f16-93c2-c94de3e57f8c"
})
```

---

### 3.3 仓库管理工具

#### 3.3.1 list_repos - 列出项目仓库

**功能**: 获取项目关联的所有仓库

**参数**:
```typescript
{
  project_id: string;  // 必需：项目 ID
}
```

**返回值**:
```typescript
{
  repos: Array<{
    id: string;
    name: string;
  }>;
  count: number;
  project_id: string;
}
```

**使用示例**:
```typescript
mcp__vibe_kanban__list_repos({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd"
})
```

#### 3.3.2 get_repo - 获取仓库详情

**功能**: 获取仓库的详细信息，包括脚本配置

**参数**:
```typescript
{
  repo_id: string;  // 必需：仓库 ID
}
```

**返回值**:
```typescript
{
  id: string;
  name: string;
  display_name: string;
  setup_script: string | null;
  cleanup_script: string | null;
  dev_server_script: string | null;
}
```

**使用示例**:
```typescript
mcp__vibe_kanban__get_repo({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f"
})
```

#### 3.3.3 update_setup_script - 更新初始化脚本

**功能**: 配置仓库的初始化脚本（在工作空间启动时执行）

**参数**:
```typescript
{
  repo_id: string;  // 必需：仓库 ID
  script: string;   // 必需：脚本内容（使用空字符串清除）
}
```

**使用示例**:
```typescript
mcp__vibe_kanban__update_setup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "pnpm install && pnpm db:push"
})
```

#### 3.3.4 update_cleanup_script - 更新清理脚本

**功能**: 配置仓库的清理脚本（在工作空间关闭时执行）

**参数**:
```typescript
{
  repo_id: string;  // 必需：仓库 ID
  script: string;   // 必需：脚本内容（使用空字符串清除）
}
```

**使用示例**:
```typescript
mcp__vibe_kanban__update_cleanup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "docker compose down && rm -rf node_modules/.cache"
})
```

#### 3.3.5 update_dev_server_script - 更新开发服务器脚本

**功能**: 配置仓库的开发服务器启动脚本

**参数**:
```typescript
{
  repo_id: string;  // 必需：仓库 ID
  script: string;   // 必需：脚本内容（使用空字符串清除）
}
```

**使用示例**:
```typescript
mcp__vibe_kanban__update_dev_server_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "pnpm dev"
})
```

---

## 4. 仓库脚本配置

### 4.1 脚本类型说明

#### 4.1.1 Setup Script（初始化脚本）

**执行时机**: 工作空间启动时

**用途**:
- 安装项目依赖
- 配置环境变量
- 初始化数据库
- 准备开发环境

**示例脚本**:
```bash
# 基础示例
pnpm install

# 完整示例
pnpm install && \
cp .env.example .env.production && \
pnpm db:push && \
echo "环境初始化完成"
```

#### 4.1.2 Cleanup Script（清理脚本）

**执行时机**: 工作空间关闭时

**用途**:
- 停止运行的服务
- 清理临时文件
- 释放系统资源
- 保存工作状态

**示例脚本**:
```bash
# 基础示例
docker compose down

# 完整示例
docker compose down && \
rm -rf node_modules/.cache && \
rm -rf .vite && \
echo "清理完成"
```

#### 4.1.3 Dev Server Script（开发服务器脚本）

**执行时机**: 需要启动开发服务器时

**用途**:
- 启动前端开发服务器
- 启动后端 API 服务
- 启动数据库服务
- 启动其他必要服务

**示例脚本**:
```bash
# 前端项目
pnpm dev

# 全栈项目
docker compose up -d mysql && \
pnpm dev

# 多服务项目
pnpm dev:client & pnpm dev:server
```

### 4.2 配置最佳实践

#### 4.2.1 Person_Web 项目推荐配置

```typescript
// Setup Script
mcp__vibe_kanban__update_setup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: `
pnpm install && \
echo "依赖安装完成" && \
pnpm db:push && \
echo "数据库初始化完成"
  `.trim()
})

// Dev Server Script
mcp__vibe_kanban__update_dev_server_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "pnpm dev"
})

// Cleanup Script
mcp__vibe_kanban__update_cleanup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: `
docker compose down && \
echo "服务已停止"
  `.trim()
})
```

#### 4.2.2 脚本编写注意事项

✅ **推荐做法**:
- 使用 `&&` 连接多个命令，确保前一个命令成功后才执行下一个
- 添加 `echo` 输出关键步骤信息，便于调试
- 使用绝对路径或相对路径明确指定文件位置
- 处理可能的错误情况

❌ **避免做法**:
- 不要使用交互式命令（如需要用户输入的命令）
- 避免长时间运行的阻塞命令
- 不要在脚本中硬编码敏感信息（密码、密钥等）
- 避免使用 `sudo` 等需要特殊权限的命令

---

## 5. 工作空间会话

### 5.1 什么是工作空间会话？

工作空间会话是 Vibe-Kanban 的核心功能，它允许你启动 AI 代理自动执行任务。

**工作流程**:
```
1. 创建任务
   ↓
2. 配置仓库脚本（可选）
   ↓
3. 启动工作空间会话
   ↓
4. AI 代理执行 setup_script
   ↓
5. AI 代理自动完成任务
   ↓
6. AI 代理执行 cleanup_script
   ↓
7. 会话结束，任务完成
```

### 5.2 start_workspace_session - 启动工作空间会话

**功能**: 启动 AI 代理执行指定任务

**参数**:
```typescript
{
  task_id: string;              // 必需：任务 ID
  executor: string;             // 必需：执行器类型
  repos: Array<{                // 必需：仓库配置
    repo_id: string;            // 仓库 ID
    base_branch: string;        // 基础分支
  }>;
  variant?: string;             // 可选：执行器变体
}
```

**支持的执行器**:
- `CLAUDE_CODE` - Claude Code 代理（推荐）
- `AMP` - AMP 代理
- `GEMINI` - Gemini 代理
- `CODEX` - Codex 代理
- `OPENCODE` - OpenCode 代理
- `CURSOR_AGENT` - Cursor 代理
- `QWEN_CODE` - Qwen 代理
- `COPILOT` - GitHub Copilot 代理
- `DROID` - Droid 代理

**使用示例**:
```typescript
// 使用 Claude Code 执行任务
mcp__vibe_kanban__start_workspace_session({
  task_id: "5c669fc1-836a-4f16-93c2-c94de3e57f8c",
  executor: "CLAUDE_CODE",
  repos: [
    {
      repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
      base_branch: "main"
    }
  ]
})

// 使用 Gemini 执行任务
mcp__vibe_kanban__start_workspace_session({
  task_id: "task-id-here",
  executor: "GEMINI",
  repos: [
    {
      repo_id: "repo-id-here",
      base_branch: "develop"
    }
  ]
})
```

### 5.3 执行器选择指南

| 执行器 | 适用场景 | 优势 | 注意事项 |
|--------|---------|------|---------|
| CLAUDE_CODE | 全栈开发、复杂任务 | 理解能力强、代码质量高 | 推荐首选 |
| GEMINI | 多语言项目 | 多语言支持好 | - |
| CURSOR_AGENT | IDE 集成开发 | 与 Cursor IDE 集成 | 需要 Cursor |
| COPILOT | GitHub 项目 | GitHub 生态集成 | 需要 GitHub |

---

## 6. 实战示例

### 6.1 完整工作流示例

以下是一个完整的 Vibe-Kanban 使用流程示例。

#### 场景：为 Person_Web 项目添加用户登录功能

**步骤 1: 创建任务**

```typescript
// 创建新任务
const result = await mcp__vibe_kanban__create_task({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  title: "实现 GitHub OAuth 用户登录",
  description: `
任务目标：
1. 在前端添加"使用 GitHub 登录"按钮
2. 实现后端 OAuth 回调处理
3. 添加用户会话管理
4. 编写单元测试

技术要求：
- 使用 GitHub OAuth 2.0
- JWT Token 存储在 HttpOnly Cookie
- 前端使用 React + TanStack Query
- 后端使用 tRPC + Express
  `
})

console.log("任务已创建，ID:", result.task_id)
```

**步骤 2: 配置仓库脚本**

```typescript
// 配置初始化脚本
await mcp__vibe_kanban__update_setup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "pnpm install && pnpm db:push"
})

// 配置开发服务器脚本
await mcp__vibe_kanban__update_dev_server_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "pnpm dev"
})

// 配置清理脚本
await mcp__vibe_kanban__update_cleanup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "docker compose down"
})
```

**步骤 3: 启动工作空间会话**

```typescript
// 启动 AI 代理执行任务
await mcp__vibe_kanban__start_workspace_session({
  task_id: result.task_id,
  executor: "CLAUDE_CODE",
  repos: [
    {
      repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
      base_branch: "main"
    }
  ]
})

console.log("工作空间会话已启动，AI 代理正在执行任务...")
```

**步骤 4: 监控任务进度**

```typescript
// 查询任务状态
const task = await mcp__vibe_kanban__get_task({
  task_id: result.task_id
})

console.log("任务状态:", task.status)
// 输出: inprogress
```

**步骤 5: 任务完成后更新状态**

```typescript
// 更新任务状态为已完成
await mcp__vibe_kanban__update_task({
  task_id: result.task_id,
  status: "done"
})

console.log("任务已完成！")
```

### 6.2 批量任务管理示例

#### 场景：创建多个相关任务

```typescript
const projectId = "7d33ce59-3de8-4f9f-9dd5-475b0da575bd"

// 创建一系列任务
const tasks = [
  {
    title: "优化数据库查询性能",
    description: "为文章列表查询添加索引，优化 JOIN 查询"
  },
  {
    title: "添加文章搜索功能",
    description: "实现全文搜索，支持标题和内容搜索"
  },
  {
    title: "实现文章评论功能",
    description: "添加评论表、API 接口和前端组件"
  }
]

// 批量创建任务
for (const task of tasks) {
  const result = await mcp__vibe_kanban__create_task({
    project_id: projectId,
    title: task.title,
    description: task.description
  })
  console.log(`✅ 已创建任务: ${task.title}`)
}

// 查看所有待办任务
const todoTasks = await mcp__vibe_kanban__list_tasks({
  project_id: projectId,
  status: "todo"
})

console.log(`共有 ${todoTasks.count} 个待办任务`)
```

### 6.3 任务状态管理示例

#### 场景：管理任务生命周期

```typescript
const taskId = "your-task-id-here"

// 1. 开始任务
await mcp__vibe_kanban__update_task({
  task_id: taskId,
  status: "inprogress"
})
console.log("✅ 任务已开始")

// 2. 提交审查
await mcp__vibe_kanban__update_task({
  task_id: taskId,
  status: "inreview",
  description: "已完成开发，等待代码审查"
})
console.log("✅ 任务已提交审查")

// 3. 审查通过，标记完成
await mcp__vibe_kanban__update_task({
  task_id: taskId,
  status: "done"
})
console.log("✅ 任务已完成")
```

### 6.4 多仓库项目示例

#### 场景：管理前后端分离的项目

```typescript
// 假设有前端和后端两个仓库
const frontendRepoId = "frontend-repo-id"
const backendRepoId = "backend-repo-id"

// 配置前端仓库脚本
await mcp__vibe_kanban__update_setup_script({
  repo_id: frontendRepoId,
  script: "npm install"
})

await mcp__vibe_kanban__update_dev_server_script({
  repo_id: frontendRepoId,
  script: "npm run dev"
})

// 配置后端仓库脚本
await mcp__vibe_kanban__update_setup_script({
  repo_id: backendRepoId,
  script: "pip install -r requirements.txt"
})

await mcp__vibe_kanban__update_dev_server_script({
  repo_id: backendRepoId,
  script: "python manage.py runserver"
})

// 启动工作空间会话，同时处理两个仓库
await mcp__vibe_kanban__start_workspace_session({
  task_id: "your-task-id",
  executor: "CLAUDE_CODE",
  repos: [
    {
      repo_id: frontendRepoId,
      base_branch: "main"
    },
    {
      repo_id: backendRepoId,
      base_branch: "main"
    }
  ]
})
```

---

## 7. 最佳实践

### 7.1 任务管理最佳实践

#### 7.1.1 任务命名规范

✅ **推荐做法**:
- 使用动词开头，明确任务目标
- 保持简洁，控制在 50 字符以内
- 使用具体的技术术语

**示例**:
```
✅ 好的命名：
- "实现 GitHub OAuth 用户登录"
- "优化文章列表查询性能"
- "添加 Markdown 编辑器组件"

❌ 不好的命名：
- "登录功能"（不够具体）
- "修复 bug"（没有说明是什么 bug）
- "优化"（范围太广）
```

#### 7.1.2 任务描述规范

**推荐格式**:
```markdown
任务目标：
1. 具体目标 1
2. 具体目标 2
3. 具体目标 3

技术要求：
- 技术栈或框架
- 性能要求
- 安全要求

验收标准：
- [ ] 功能正常运行
- [ ] 通过单元测试
- [ ] 代码审查通过
```

#### 7.1.3 任务拆分原则

**SMART 原则**:
- **S**pecific（具体的）- 任务目标明确
- **M**easurable（可衡量的）- 有明确的完成标准
- **A**chievable（可实现的）- 在合理时间内可完成
- **R**elevant（相关的）- 与项目目标相关
- **T**ime-bound（有时限的）- 有明确的时间预期

**示例**:
```typescript
// ❌ 任务太大，难以完成
{
  title: "完成整个博客系统",
  description: "实现所有功能"
}

// ✅ 拆分为多个小任务
[
  {
    title: "实现用户认证模块",
    description: "GitHub OAuth 登录和会话管理"
  },
  {
    title: "实现文章 CRUD 功能",
    description: "创建、读取、更新、删除文章"
  },
  {
    title: "实现分类管理功能",
    description: "分类的增删改查"
  }
]
```

### 7.2 脚本配置最佳实践

#### 7.2.1 Setup Script 最佳实践

```bash
# ✅ 推荐：完整的初始化流程
pnpm install && \
echo "✅ 依赖安装完成" && \
cp .env.example .env.production 2>/dev/null || true && \
echo "✅ 环境变量配置完成" && \
pnpm db:push && \
echo "✅ 数据库初始化完成" && \
echo "🎉 环境准备就绪！"

# ❌ 避免：没有错误处理
pnpm install
pnpm db:push
```

#### 7.2.2 错误处理技巧

```bash
# 使用 || true 忽略非关键错误
cp .env.example .env.production 2>/dev/null || true

# 使用条件判断
if [ -f .env.production ]; then
  echo "环境变量已存在"
else
  cp .env.example .env.production
fi

# 使用 set -e 在错误时停止
set -e
pnpm install
pnpm db:push
```

### 7.3 工作空间会话最佳实践

#### 7.3.1 选择合适的执行器

**决策树**:
```
需要处理复杂的全栈任务？
├─ 是 → 使用 CLAUDE_CODE
└─ 否 → 继续判断
    ├─ 项目使用多种编程语言？
    │   └─ 是 → 使用 GEMINI
    └─ 否 → 使用 CLAUDE_CODE（默认推荐）
```

#### 7.3.2 任务描述优化

为 AI 代理提供清晰的上下文：

```typescript
// ✅ 好的任务描述
{
  title: "实现文章搜索功能",
  description: `
## 任务背景
当前博客系统缺少搜索功能，用户无法快速找到感兴趣的文章。

## 实现要求
1. 后端 API：
   - 在 server/routers.ts 中添加 article.search 路由
   - 支持按标题和内容搜索
   - 使用 MySQL LIKE 查询或全文索引
   - 返回分页结果

2. 前端组件：
   - 在 Header 组件中添加搜索框
   - 使用 TanStack Query 调用搜索 API
   - 实现搜索结果页面
   - 支持搜索关键词高亮

3. 性能优化：
   - 添加防抖处理（300ms）
   - 缓存搜索结果（5分钟）

## 技术栈
- 后端：tRPC + Drizzle ORM
- 前端：React 19 + TanStack Query
- 数据库：MySQL 8.0

## 验收标准
- [ ] 搜索功能正常工作
- [ ] 搜索结果准确
- [ ] 性能良好（响应时间 < 500ms）
- [ ] 通过单元测试
  `
}

// ❌ 不好的任务描述
{
  title: "搜索",
  description: "添加搜索功能"
}
```

### 7.4 项目组织最佳实践

#### 7.4.1 任务优先级管理

使用任务状态和命名前缀管理优先级：

```typescript
// 高优先级任务
{
  title: "[P0] 修复生产环境登录失败问题",
  status: "inprogress"
}

// 中优先级任务
{
  title: "[P1] 实现文章搜索功能",
  status: "todo"
}

// 低优先级任务
{
  title: "[P2] 优化首页加载速度",
  status: "todo"
}
```

#### 7.4.2 任务依赖管理

在任务描述中说明依赖关系：

```typescript
{
  title: "实现文章评论功能",
  description: `
## 依赖任务
- ✅ 用户认证模块（已完成）
- ⏳ 文章详情页（进行中）

## 实现内容
...
  `
}
```

---

## 8. 常见问题

### 8.1 任务管理相关

#### Q1: 如何查看某个项目的所有任务？

```typescript
const tasks = await mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd"
})

console.log(`共有 ${tasks.count} 个任务`)
tasks.tasks.forEach(task => {
  console.log(`- [${task.status}] ${task.title}`)
})
```

#### Q2: 如何筛选特定状态的任务？

```typescript
// 只查看进行中的任务
const inProgressTasks = await mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  status: "inprogress"
})

// 只查看已完成的任务
const doneTasks = await mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  status: "done"
})
```

#### Q3: 任务创建后如何修改？

```typescript
// 更新任务的任何属性
await mcp__vibe_kanban__update_task({
  task_id: "your-task-id",
  title: "新标题",
  description: "新描述",
  status: "inprogress"
})
```

#### Q4: 如何删除不需要的任务？

```typescript
await mcp__vibe_kanban__delete_task({
  task_id: "your-task-id"
})
```

### 8.2 仓库脚本相关

#### Q5: 如何查看仓库当前的脚本配置？

```typescript
const repo = await mcp__vibe_kanban__get_repo({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f"
})

console.log("Setup Script:", repo.setup_script)
console.log("Dev Server Script:", repo.dev_server_script)
console.log("Cleanup Script:", repo.cleanup_script)
```

#### Q6: 如何清除已配置的脚本？

```typescript
// 使用空字符串清除脚本
await mcp__vibe_kanban__update_setup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: ""
})
```

#### Q7: 脚本执行失败怎么办？

**排查步骤**:
1. 检查脚本语法是否正确
2. 确认命令在本地可以正常执行
3. 检查是否有权限问题
4. 查看工作空间会话的日志输出

**调试技巧**:
```bash
# 在脚本中添加调试输出
echo "开始执行..." && \
pnpm install && \
echo "依赖安装完成" && \
pnpm db:push && \
echo "数据库初始化完成"
```

### 8.3 工作空间会话相关

#### Q8: 如何选择合适的执行器？

**推荐选择**:
- 全栈项目 → `CLAUDE_CODE`（推荐）
- 多语言项目 → `GEMINI`
- 简单任务 → `CLAUDE_CODE`（默认）

#### Q9: 工作空间会话启动后可以取消吗？

工作空间会话一旦启动，会由 AI 代理自动执行。如果需要中断，可以：
1. 等待任务完成
2. 手动更新任务状态为 `cancelled`

#### Q10: 如何监控工作空间会话的执行进度？

```typescript
// 定期查询任务状态
const task = await mcp__vibe_kanban__get_task({
  task_id: "your-task-id"
})

console.log("任务状态:", task.status)
console.log("是否有进行中的尝试:", task.has_in_progress_attempt)
console.log("上次尝试是否失败:", task.last_attempt_failed)
```

### 8.4 项目管理相关

#### Q11: 如何查看所有项目？

```typescript
const projects = await mcp__vibe_kanban__list_projects()

console.log(`共有 ${projects.count} 个项目`)
projects.projects.forEach(project => {
  console.log(`- ${project.name} (ID: ${project.id})`)
})
```

#### Q12: 如何获取项目的所有仓库？

```typescript
const repos = await mcp__vibe_kanban__list_repos({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd"
})

console.log(`共有 ${repos.count} 个仓库`)
repos.repos.forEach(repo => {
  console.log(`- ${repo.name} (ID: ${repo.id})`)
})
```

### 8.5 错误处理相关

#### Q13: 任务状态更新失败怎么办？

**常见原因**:
1. 任务 ID 不存在
2. 状态值不合法（必须是 todo/inprogress/inreview/done/cancelled）
3. 网络连接问题

**解决方法**:
```typescript
try {
  await mcp__vibe_kanban__update_task({
    task_id: "your-task-id",
    status: "done"
  })
  console.log("✅ 任务状态更新成功")
} catch (error) {
  console.error("❌ 更新失败:", error.message)
  // 检查任务是否存在
  const task = await mcp__vibe_kanban__get_task({
    task_id: "your-task-id"
  })
  console.log("当前任务状态:", task.status)
}
```

#### Q14: 脚本配置后不生效怎么办？

**检查清单**:
1. ✅ 确认脚本已成功保存
2. ✅ 检查脚本语法是否正确
3. ✅ 确认工作空间会话使用了正确的仓库 ID
4. ✅ 查看执行日志确认脚本是否被调用

---

## 9. 快速参考

### 9.1 常用命令速查表

| 操作 | 命令 |
|------|------|
| 列出所有项目 | `mcp__vibe_kanban__list_projects()` |
| 列出项目任务 | `mcp__vibe_kanban__list_tasks({ project_id })` |
| 创建任务 | `mcp__vibe_kanban__create_task({ project_id, title })` |
| 获取任务详情 | `mcp__vibe_kanban__get_task({ task_id })` |
| 更新任务 | `mcp__vibe_kanban__update_task({ task_id, ... })` |
| 删除任务 | `mcp__vibe_kanban__delete_task({ task_id })` |
| 列出仓库 | `mcp__vibe_kanban__list_repos({ project_id })` |
| 获取仓库详情 | `mcp__vibe_kanban__get_repo({ repo_id })` |
| 配置初始化脚本 | `mcp__vibe_kanban__update_setup_script({ repo_id, script })` |
| 配置开发服务器 | `mcp__vibe_kanban__update_dev_server_script({ repo_id, script })` |
| 配置清理脚本 | `mcp__vibe_kanban__update_cleanup_script({ repo_id, script })` |
| 启动工作空间 | `mcp__vibe_kanban__start_workspace_session({ task_id, executor, repos })` |

### 9.2 任务状态速查表

| 状态 | 英文 | 说明 | 下一步 |
|------|------|------|--------|
| 待办 | `todo` | 任务已创建，等待开始 | → `inprogress` |
| 进行中 | `inprogress` | 任务正在执行 | → `inreview` |
| 审查中 | `inreview` | 任务已完成，等待审查 | → `done` |
| 已完成 | `done` | 任务已完成并通过审查 | - |
| 已取消 | `cancelled` | 任务已取消 | - |

### 9.3 Person_Web 项目信息

```typescript
// 项目 ID
const PROJECT_ID = "7d33ce59-3de8-4f9f-9dd5-475b0da575bd"

// 仓库 ID
const REPO_ID = "545d39de-35a1-4fcb-9281-007bda363b6f"

// 推荐的脚本配置
const SETUP_SCRIPT = "pnpm install && pnpm db:push"
const DEV_SERVER_SCRIPT = "pnpm dev"
const CLEANUP_SCRIPT = "docker compose down"
```

---

## 10. 总结

### 10.1 核心要点回顾

✅ **Vibe-Kanban 是什么**
- 项目任务管理系统
- 通过 MCP 工具集成到 Claude Code
- 支持 AI 代理自动执行任务

✅ **核心功能**
- 项目和任务管理
- 仓库脚本配置
- 工作空间会话
- 多执行器支持

✅ **最佳实践**
- 使用 SMART 原则拆分任务
- 为任务提供详细描述
- 配置完整的仓库脚本
- 选择合适的执行器

### 10.2 学习路径建议

**初学者**:
1. 了解核心概念（项目、任务、仓库）
2. 学习基本的任务管理操作
3. 尝试创建和更新任务
4. 查看任务状态和详情

**进阶用户**:
1. 配置仓库脚本
2. 理解脚本执行时机
3. 学习错误处理技巧
4. 掌握批量任务管理

**高级用户**:
1. 启动工作空间会话
2. 选择合适的执行器
3. 优化任务描述
4. 管理复杂的多仓库项目

### 10.3 下一步行动

现在你已经完成了 Vibe-Kanban 的学习，可以：

1. **实践操作** - 为 Person_Web 项目创建实际任务
2. **配置脚本** - 为仓库配置初始化和开发脚本
3. **启动会话** - 尝试使用 AI 代理自动完成任务
4. **分享经验** - 将学到的知识应用到其他项目

---

## 附录

### A. 相关资源

- **MCP 协议文档**: [Model Context Protocol](https://modelcontextprotocol.io/)
- **Claude Code 文档**: [Claude Code Documentation](https://docs.anthropic.com/)
- **Person_Web 项目**: 当前工作目录

### B. 文档更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.0.0 | 2026-01-24 | 初始版本发布 |

### C. 反馈与支持

如果你在使用 Vibe-Kanban 过程中遇到问题或有改进建议，欢迎：
- 查阅本文档的常见问题章节
- 查看 MCP 工具的官方文档
- 在项目中创建任务记录问题

---

**文档结束**

感谢你完成 Vibe-Kanban 系统的学习！祝你使用愉快！🎉
