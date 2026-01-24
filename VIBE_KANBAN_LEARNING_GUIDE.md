# Vibe-Kanban System Learning Guide

> Comprehensive documentation for the Vibe-Kanban task management system
>
> **Document Version**: v1.0.0
> **Created**: 2026-01-24
> **Target Project**: Person_Web

---

## Table of Contents

1. [Introduction to Vibe-Kanban](#1-introduction-to-vibe-kanban)
2. [Core Concepts](#2-core-concepts)
3. [MCP Tools Reference](#3-mcp-tools-reference)
4. [Repository Script Configuration](#4-repository-script-configuration)
5. [Workspace Sessions](#5-workspace-sessions)
6. [Practical Examples](#6-practical-examples)
7. [Best Practices](#7-best-practices)
8. [Frequently Asked Questions](#8-frequently-asked-questions)

---

## 1. Introduction to Vibe-Kanban

### 1.1 What is Vibe-Kanban?

**Vibe-Kanban** is a comprehensive project task management system integrated into Claude Code through MCP (Model Context Protocol) tools. It provides the following capabilities:

- **Project and Task Management** - Create, update, and delete tasks
- **Task Status Tracking** - todo → in progress → in review → done
- **AI Agent Automation** - Launch AI agents to automatically complete tasks
- **Repository Script Management** - Configure setup, cleanup, and dev server scripts
- **Multi-Executor Support** - Claude Code, Gemini, Cursor, and more

### 1.2 System Architecture

```
Vibe-Kanban System
├── Projects
│   ├── Person_Web (current project)
│   └── Other projects...
│
├── Tasks
│   ├── Task 1: vibe-kanban learning (in progress)
│   ├── Task 2: Implement user login (todo)
│   └── Task 3: Optimize database queries (done)
│
├── Repositories
│   ├── Person_Web Repository
│   │   ├── setup_script (initialization script)
│   │   ├── cleanup_script (cleanup script)
│   │   └── dev_server_script (development server script)
│   └── Other repositories...
│
└── Workspace Sessions
    └── AI agents automatically execute tasks
```

### 1.3 Key Advantages

- **Type Safety** - All APIs have complete TypeScript type definitions
- **AI-Driven** - Supports multiple AI agents for automated task completion
- **Flexible Configuration** - Customizable repository scripts and workflows
- **Status Tracking** - Clear task state transition mechanism
- **Multi-Project Support** - Manage multiple projects and repositories

---

## 2. Core Concepts

### 2.1 Project

**Definition**: A project is a container for tasks and repositories.

**Properties**:
- `id` (UUID) - Unique project identifier
- `name` (string) - Project name
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp

**Example**:
```json
{
  "id": "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  "name": "Person_Web",
  "created_at": "2026-01-24T07:40:33.740+00:00",
  "updated_at": "2026-01-24T07:40:33.740+00:00"
}
```

### 2.2 Task

**Definition**: A task is a unit of work that needs to be completed.

**Properties**:
- `id` (UUID) - Unique task identifier
- `title` (string) - Task title
- `description` (string) - Task description (optional)
- `status` (enum) - Task status
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp

**Task Status Flow**:
```
todo (pending)
  ↓
inprogress (in progress)
  ↓
inreview (in review)
  ↓
done (completed) / cancelled (cancelled)
```

**Example**:
```json
{
  "id": "5c669fc1-836a-4f16-93c2-c94de3e57f8c",
  "title": "vibe-kanban learning",
  "description": "Learn how to use the Vibe-Kanban system",
  "status": "inprogress",
  "created_at": "2026-01-24T07:40:58.796+00:00",
  "updated_at": "2026-01-24T07:42:58+00:00"
}
```

### 2.3 Repository

**Definition**: A repository is a Git code repository associated with a project.

**Properties**:
- `id` (UUID) - Unique repository identifier
- `name` (string) - Repository name
- `display_name` (string) - Display name
- `setup_script` (string) - Initialization script
- `cleanup_script` (string) - Cleanup script
- `dev_server_script` (string) - Development server script

**Example**:
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

### 2.4 Workspace Session

**Definition**: A workspace session is the environment where AI agents execute tasks.

**Components**:
- Task ID
- Executor type (Claude Code, Gemini, etc.)
- Associated repositories and branches
- Execution scripts

---

## 3. MCP Tools Reference

### 3.1 Project Management Tools

#### 3.1.1 list_projects - List All Projects

**Function**: Retrieve all project lists

**Parameters**: None

**Return Value**:
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

**Usage Example**:
```typescript
mcp__vibe_kanban__list_projects()
```

**Return Example**:
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

### 3.2 Task Management Tools

#### 3.2.1 list_tasks - List Project Tasks

**Function**: Retrieve task list for a specified project

**Parameters**:
```typescript
{
  project_id: string;      // Required: Project ID
  status?: string;         // Optional: Filter by status (todo/inprogress/inreview/done/cancelled)
  limit?: number;          // Optional: Limit quantity (default 50)
}
```

**Return Value**:
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

**Usage Examples**:
```typescript
// Get all tasks
mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd"
})

// Get only in-progress tasks
mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  status: "inprogress"
})

// Limit return quantity
mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  limit: 10
})
```

#### 3.2.2 get_task - Get Task Details

**Function**: Retrieve detailed information for a specified task

**Parameters**:
```typescript
{
  task_id: string;  // Required: Task ID
}
```

**Return Value**:
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

**Usage Example**:
```typescript
mcp__vibe_kanban__get_task({
  task_id: "5c669fc1-836a-4f16-93c2-c94de3e57f8c"
})
```

#### 3.2.3 create_task - Create New Task

**Function**: Create a new task in a project

**Parameters**:
```typescript
{
  project_id: string;      // Required: Project ID
  title: string;           // Required: Task title
  description?: string;    // Optional: Task description
}
```

**Return Value**:
```typescript
{
  task_id: string;
}
```

**Usage Example**:
```typescript
mcp__vibe_kanban__create_task({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  title: "实现用户登录功能",
  description: "使用 GitHub OAuth 实现用户认证，包括前端登录按钮和后端回调处理"
})
```

#### 3.2.4 update_task - Update Task

**Function**: Update task title, description, or status

**Parameters**:
```typescript
{
  task_id: string;         // Required: Task ID
  title?: string;          // Optional: New title
  description?: string;    // Optional: New description
  status?: string;         // Optional: New status (todo/inprogress/inreview/done/cancelled)
}
```

**Return Value**:
```typescript
{
  success: boolean;
}
```

**Usage Examples**:
```typescript
// Update task status
mcp__vibe_kanban__update_task({
  task_id: "5c669fc1-836a-4f16-93c2-c94de3e57f8c",
  status: "done"
})

// Update task title and description
mcp__vibe_kanban__update_task({
  task_id: "5c669fc1-836a-4f16-93c2-c94de3e57f8c",
  title: "完成 Vibe-Kanban 学习",
  description: "已掌握所有核心功能和 API 使用方法"
})
```

#### 3.2.5 delete_task - Delete Task

**Function**: Delete a specified task

**Parameters**:
```typescript
{
  task_id: string;  // Required: Task ID
}
```

**Return Value**:
```typescript
{
  success: boolean;
}
```

**Usage Example**:
```typescript
mcp__vibe_kanban__delete_task({
  task_id: "5c669fc1-836a-4f16-93c2-c94de3e57f8c"
})
```

---

### 3.3 Repository Management Tools

#### 3.3.1 list_repos - List Project Repositories

**Function**: Retrieve all repositories associated with a project

**Parameters**:
```typescript
{
  project_id: string;  // Required: Project ID
}
```

**Return Value**:
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

**Usage Example**:
```typescript
mcp__vibe_kanban__list_repos({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd"
})
```

#### 3.3.2 get_repo - Get Repository Details

**Function**: Retrieve detailed repository information, including script configuration

**Parameters**:
```typescript
{
  repo_id: string;  // Required: Repository ID
}
```

**Return Value**:
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

**Usage Example**:
```typescript
mcp__vibe_kanban__get_repo({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f"
})
```

#### 3.3.3 update_setup_script - Update Setup Script

**Function**: Configure repository initialization script (executed when workspace starts)

**Parameters**:
```typescript
{
  repo_id: string;  // Required: Repository ID
  script: string;   // Required: Script content (use empty string to clear)
}
```

**Usage Example**:
```typescript
mcp__vibe_kanban__update_setup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "pnpm install && pnpm db:push"
})
```

#### 3.3.4 update_cleanup_script - Update Cleanup Script

**Function**: Configure repository cleanup script (executed when workspace closes)

**Parameters**:
```typescript
{
  repo_id: string;  // Required: Repository ID
  script: string;   // Required: Script content (use empty string to clear)
}
```

**Usage Example**:
```typescript
mcp__vibe_kanban__update_cleanup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "docker compose down && rm -rf node_modules/.cache"
})
```

#### 3.3.5 update_dev_server_script - Update Dev Server Script

**Function**: Configure repository development server startup script

**Parameters**:
```typescript
{
  repo_id: string;  // Required: Repository ID
  script: string;   // Required: Script content (use empty string to clear)
}
```

**Usage Example**:
```typescript
mcp__vibe_kanban__update_dev_server_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "pnpm dev"
})
```

---

## 4. Repository Script Configuration

### 4.1 Script Types

#### 4.1.1 Setup Script (Initialization Script)

**Execution Timing**: When workspace starts

**Purpose**:
- Install project dependencies
- Configure environment variables
- Initialize database
- Prepare development environment

**Example Scripts**:
```bash
# Basic example
pnpm install

# Complete example
pnpm install && \
cp .env.example .env.production && \
pnpm db:push && \
echo "Environment initialization complete"
```

#### 4.1.2 Cleanup Script

**Execution Timing**: When workspace closes

**Purpose**:
- Stop running services
- Clean temporary files
- Release system resources
- Save work state

**Example Scripts**:
```bash
# Basic example
docker compose down

# Complete example
docker compose down && \
rm -rf node_modules/.cache && \
rm -rf .vite && \
echo "Cleanup complete"
```

#### 4.1.3 Dev Server Script

**Execution Timing**: When development server needs to start

**Purpose**:
- Start frontend development server
- Start backend API service
- Start database service
- Start other necessary services

**Example Scripts**:
```bash
# Frontend project
pnpm dev

# Full-stack project
docker compose up -d mysql && \
pnpm dev

# Multi-service project
pnpm dev:client & pnpm dev:server
```

### 4.2 Configuration Best Practices

#### 4.2.1 Recommended Configuration for Person_Web Project

```typescript
// Setup Script
mcp__vibe_kanban__update_setup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: `
pnpm install && \
echo "Dependencies installed" && \
pnpm db:push && \
echo "Database initialization complete"
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
echo "Services stopped"
  `.trim()
})
```

#### 4.2.2 Script Writing Guidelines

**Recommended Practices**:
- Use `&&` to connect multiple commands, ensuring the next command executes only after the previous one succeeds
- Add `echo` output for key step information to facilitate debugging
- Use absolute or relative paths to explicitly specify file locations
- Handle potential error conditions

**Practices to Avoid**:
- Do not use interactive commands (commands requiring user input)
- Avoid long-running blocking commands
- Do not hard-code sensitive information in scripts (passwords, keys, etc.)
- Avoid using `sudo` or other commands requiring special permissions

---

## 5. Workspace Sessions

### 5.1 What is a Workspace Session?

A workspace session is a core feature of Vibe-Kanban that allows you to launch AI agents to automatically execute tasks.

**Workflow**:
```
1. Create task
   ↓
2. Configure repository scripts (optional)
   ↓
3. Start workspace session
   ↓
4. AI agent executes setup_script
   ↓
5. AI agent automatically completes task
   ↓
6. AI agent executes cleanup_script
   ↓
7. Session ends, task complete
```

### 5.2 start_workspace_session - Start Workspace Session

**Function**: Launch AI agent to execute specified task

**Parameters**:
```typescript
{
  task_id: string;              // Required: Task ID
  executor: string;             // Required: Executor type
  repos: Array<{                // Required: Repository configuration
    repo_id: string;            // Repository ID
    base_branch: string;        // Base branch
  }>;
  variant?: string;             // Optional: Executor variant
}
```

**Supported Executors**:
- `CLAUDE_CODE` - Claude Code agent (recommended)
- `AMP` - AMP agent
- `GEMINI` - Gemini agent
- `CODEX` - Codex agent
- `OPENCODE` - OpenCode agent
- `CURSOR_AGENT` - Cursor agent
- `QWEN_CODE` - Qwen agent
- `COPILOT` - GitHub Copilot agent
- `DROID` - Droid agent

**Usage Examples**:
```typescript
// Use Claude Code to execute task
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

// Use Gemini to execute task
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

### 5.3 Executor Selection Guide

| Executor | Use Case | Advantages | Notes |
|--------|---------|------|---------|
| CLAUDE_CODE | Full-stack development, complex tasks | Strong comprehension, high code quality | Recommended first choice |
| GEMINI | Multi-language projects | Good multi-language support | - |
| CURSOR_AGENT | IDE integrated development | Integrates with Cursor IDE | Requires Cursor |
| COPILOT | GitHub projects | GitHub ecosystem integration | Requires GitHub |

---

## 6. Practical Examples

### 6.1 Complete Workflow Example

The following is a complete Vibe-Kanban usage workflow example.

#### Scenario: Add User Login Feature to Person_Web Project

**Step 1: Create Task**

```typescript
// Create new task
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

console.log("Task created, ID:", result.task_id)
```

**Step 2: Configure Repository Scripts**

```typescript
// Configure setup script
await mcp__vibe_kanban__update_setup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "pnpm install && pnpm db:push"
})

// Configure dev server script
await mcp__vibe_kanban__update_dev_server_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "pnpm dev"
})

// Configure cleanup script
await mcp__vibe_kanban__update_cleanup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: "docker compose down"
})
```

**Step 3: Start Workspace Session**

```typescript
// Launch AI agent to execute task
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

console.log("Workspace session started, AI agent is executing task...")
```

**Step 4: Monitor Task Progress**

```typescript
// Query task status
const task = await mcp__vibe_kanban__get_task({
  task_id: result.task_id
})

console.log("Task status:", task.status)
// Output: inprogress
```

**Step 5: Update Status After Task Completion**

```typescript
// Update task status to done
await mcp__vibe_kanban__update_task({
  task_id: result.task_id,
  status: "done"
})

console.log("Task completed!")
```

### 6.2 Batch Task Management Example

#### Scenario: Create Multiple Related Tasks

```typescript
const projectId = "7d33ce59-3de8-4f9f-9dd5-475b0da575bd"

// Create a series of tasks
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

// Batch create tasks
for (const task of tasks) {
  const result = await mcp__vibe_kanban__create_task({
    project_id: projectId,
    title: task.title,
    description: task.description
  })
  console.log(`Task created: ${task.title}`)
}

// View all todo tasks
const todoTasks = await mcp__vibe_kanban__list_tasks({
  project_id: projectId,
  status: "todo"
})

console.log(`Total ${todoTasks.count} todo tasks`)
```

### 6.3 Task Status Management Example

#### Scenario: Manage Task Lifecycle

```typescript
const taskId = "your-task-id-here"

// 1. Start task
await mcp__vibe_kanban__update_task({
  task_id: taskId,
  status: "inprogress"
})
console.log("Task started")

// 2. Submit for review
await mcp__vibe_kanban__update_task({
  task_id: taskId,
  status: "inreview",
  description: "已完成开发，等待代码审查"
})
console.log("Task submitted for review")

// 3. Review passed, mark as done
await mcp__vibe_kanban__update_task({
  task_id: taskId,
  status: "done"
})
console.log("Task completed")
```

### 6.4 Multi-Repository Project Example

#### Scenario: Manage Frontend-Backend Separated Project

```typescript
// Assume there are frontend and backend repositories
const frontendRepoId = "frontend-repo-id"
const backendRepoId = "backend-repo-id"

// Configure frontend repository scripts
await mcp__vibe_kanban__update_setup_script({
  repo_id: frontendRepoId,
  script: "npm install"
})

await mcp__vibe_kanban__update_dev_server_script({
  repo_id: frontendRepoId,
  script: "npm run dev"
})

// Configure backend repository scripts
await mcp__vibe_kanban__update_setup_script({
  repo_id: backendRepoId,
  script: "pip install -r requirements.txt"
})

await mcp__vibe_kanban__update_dev_server_script({
  repo_id: backendRepoId,
  script: "python manage.py runserver"
})

// Start workspace session, handling both repositories
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

## 7. Best Practices

### 7.1 Task Management Best Practices

#### 7.1.1 Task Naming Conventions

**Recommended Practices**:
- Start with a verb, clearly define task objective
- Keep it concise, within 50 characters
- Use specific technical terminology

**Examples**:
```
Good naming examples:
- "实现 GitHub OAuth 用户登录"
- "优化文章列表查询性能"
- "添加 Markdown 编辑器组件"

Poor naming examples:
- "登录功能" (not specific enough)
- "修复 bug" (doesn't specify what bug)
- "优化" (scope too broad)
```

#### 7.1.2 Task Description Standards

**Recommended Format**:
```markdown
Task Objectives:
1. Specific objective 1
2. Specific objective 2
3. Specific objective 3

Technical Requirements:
- Technology stack or framework
- Performance requirements
- Security requirements

Acceptance Criteria:
- [ ] Feature works properly
- [ ] Passes unit tests
- [ ] Code review passed
```

#### 7.1.3 Task Breakdown Principles

**SMART Principles**:
- **S**pecific - Task objectives are clear
- **M**easurable - Has clear completion criteria
- **A**chievable - Can be completed within reasonable time
- **R**elevant - Related to project goals
- **T**ime-bound - Has clear time expectations

**Examples**:
```typescript
// Poor example: Task too large, difficult to complete
{
  title: "完成整个博客系统",
  description: "实现所有功能"
}

// Good example: Split into multiple small tasks
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

### 7.2 Script Configuration Best Practices

#### 7.2.1 Setup Script Best Practices

```bash
# Recommended: Complete initialization process
pnpm install && \
echo "Dependencies installed" && \
cp .env.example .env.production 2>/dev/null || true && \
echo "Environment variables configured" && \
pnpm db:push && \
echo "Database initialization complete" && \
echo "Environment ready!"

# Avoid: No error handling
pnpm install
pnpm db:push
```

#### 7.2.2 Error Handling Techniques

```bash
# Use || true to ignore non-critical errors
cp .env.example .env.production 2>/dev/null || true

# Use conditional judgment
if [ -f .env.production ]; then
  echo "Environment variables already exist"
else
  cp .env.example .env.production
fi

# Use set -e to stop on error
set -e
pnpm install
pnpm db:push
```

### 7.3 Workspace Session Best Practices

#### 7.3.1 Choosing the Right Executor

**Decision Tree**:
```
Need to handle complex full-stack tasks?
├─ Yes → Use CLAUDE_CODE
└─ No → Continue evaluation
    ├─ Project uses multiple programming languages?
    │   └─ Yes → Use GEMINI
    └─ No → Use CLAUDE_CODE (default recommendation)
```

#### 7.3.2 Task Description Optimization

Provide clear context for AI agents:

```typescript
// Good task description
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

// Poor task description
{
  title: "搜索",
  description: "添加搜索功能"
}
```

### 7.4 Project Organization Best Practices

#### 7.4.1 Task Priority Management

Use task status and naming prefixes to manage priorities:

```typescript
// High priority task
{
  title: "[P0] 修复生产环境登录失败问题",
  status: "inprogress"
}

// Medium priority task
{
  title: "[P1] 实现文章搜索功能",
  status: "todo"
}

// Low priority task
{
  title: "[P2] 优化首页加载速度",
  status: "todo"
}
```

#### 7.4.2 Task Dependency Management

Specify dependencies in task description:

```typescript
{
  title: "实现文章评论功能",
  description: `
## Dependent Tasks
- Completed: User authentication module
- In Progress: Article detail page

## Implementation Content
...
  `
}
```

---

## 8. Frequently Asked Questions

### 8.1 Task Management Related

#### Q1: How to view all tasks for a project?

```typescript
const tasks = await mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd"
})

console.log(`Total ${tasks.count} tasks`)
tasks.tasks.forEach(task => {
  console.log(`- [${task.status}] ${task.title}`)
})
```

#### Q2: How to filter tasks by specific status?

```typescript
// View only in-progress tasks
const inProgressTasks = await mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  status: "inprogress"
})

// View only completed tasks
const doneTasks = await mcp__vibe_kanban__list_tasks({
  project_id: "7d33ce59-3de8-4f9f-9dd5-475b0da575bd",
  status: "done"
})
```

#### Q3: How to modify a task after creation?

```typescript
// Update any task property
await mcp__vibe_kanban__update_task({
  task_id: "your-task-id",
  title: "新标题",
  description: "新描述",
  status: "inprogress"
})
```

#### Q4: How to delete unnecessary tasks?

```typescript
await mcp__vibe_kanban__delete_task({
  task_id: "your-task-id"
})
```

### 8.2 Repository Script Related

#### Q5: How to view current repository script configuration?

```typescript
const repo = await mcp__vibe_kanban__get_repo({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f"
})

console.log("Setup Script:", repo.setup_script)
console.log("Dev Server Script:", repo.dev_server_script)
console.log("Cleanup Script:", repo.cleanup_script)
```

#### Q6: How to clear configured scripts?

```typescript
// Use empty string to clear script
await mcp__vibe_kanban__update_setup_script({
  repo_id: "545d39de-35a1-4fcb-9281-007bda363b6f",
  script: ""
})
```

#### Q7: What to do if script execution fails?

**Troubleshooting Steps**:
1. Check if script syntax is correct
2. Confirm commands execute properly locally
3. Check for permission issues
4. Review workspace session log output

**Debugging Tips**:
```bash
# Add debug output to script
echo "Starting execution..." && \
pnpm install && \
echo "Dependencies installed" && \
pnpm db:push && \
echo "Database initialization complete"
```

### 8.3 Workspace Session Related

#### Q8: How to choose the right executor?

**Recommended Choices**:
- Full-stack projects → `CLAUDE_CODE` (recommended)
- Multi-language projects → `GEMINI`
- Simple tasks → `CLAUDE_CODE` (default)

#### Q9: Can workspace session be cancelled after starting?

Once a workspace session is started, it will be automatically executed by the AI agent. If you need to interrupt:
1. Wait for task completion
2. Manually update task status to `cancelled`

#### Q10: How to monitor workspace session execution progress?

```typescript
// Periodically query task status
const task = await mcp__vibe_kanban__get_task({
  task_id: "your-task-id"
})

console.log("Task status:", task.status)
console.log("Has in-progress attempt:", task.has_in_progress_attempt)
console.log("Last attempt failed:", task.last_attempt_failed)
```

### 8.4 Project Management Related

#### Q11: How to view all projects?

```typescript
const projects = await mcp__vibe_kanban__list_projects()

console.log(`Total ${projects.count} projects`)
projects.projects.forEach(project => {
  console.log(`- ${project.name} (ID: ${project.id})`)
})
```

#### Q12: How to get all repositories for a project?

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
