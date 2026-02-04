---
title: '管理员数据库导入导出页面'
slug: 'admin-database-migration'
created: '2026-02-04'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - React 19.2.1 + TypeScript
  - tRPC 11.6.0 + superjson
  - Drizzle ORM 0.44.5
  - MySQL 8.0+ (mysql2)
  - Wouter 3.3.5 (路由)
  - Radix UI (AlertDialog, Button, etc.)
  - Sonner (toast 通知)
files_to_modify:
  - client/src/App.tsx (添加路由)
  - client/src/pages/AdminDatabase.tsx (新建)
  - server/routers.ts (添加 database router)
  - server/db.ts (添加导入导出函数)
  - drizzle/schema.ts (添加 backupSettings 表)
  - server/_core/backup-scheduler.ts (新建)
code_patterns:
  - adminProcedure 用于管理员权限校验
  - tRPC mutation 用于数据操作
  - AlertDialog 用于确认弹窗
  - toast 用于操作反馈
test_patterns:
  - 无现有测试文件参考
---

# Tech-Spec: 管理员数据库导入导出页面

**Created:** 2026-02-04

## Overview

### Problem Statement

需要一个便捷的方式在不同环境间迁移博客数据，目前只能通过命令行操作数据库，不够直观且容易出错。

### Solution

新增管理员专属页面 `/admin/database`，提供一键导出/导入功能，操作时弹窗展示数据概览（文章数、用户数、分类数等），让管理员清楚了解操作内容。

### Scope

**In Scope:**
- 新增 `/admin/database` 页面（仅管理员可访问）
- 导出功能：导出 users、articles、categories 为单个 JSON 文件，弹窗显示数据概览后确认下载
- 导入功能：上传 JSON 文件，弹窗预览数据概览，自动备份现有数据后覆盖
- 操作状态反馈（进度、成功/失败提示）
- 二次确认弹窗
- **自动备份功能**：支持按周/月/季度间隔自动执行备份任务

**Out of Scope:**
- 增量导入/合并数据
- 云存储集成
- 数据库结构迁移（仅数据迁移）

## Context for Development

### Codebase Patterns

**权限控制模式：**
- 使用 `adminProcedure` 中间件（定义于 `server/routers.ts:18-23`）
- 检查 `ctx.user.role === 'admin'`，否则抛出 `FORBIDDEN` 错误
- 前端页面需检查 `user?.role !== "admin"` 显示无权限提示

**tRPC API 模式：**
- Router 定义在 `server/routers.ts`，使用 `router()` 嵌套组织
- Mutation 使用 `z.object()` 定义输入 schema
- 返回 `{ success: true }` 或具体数据

**前端页面模式（参考 AdminArticles.tsx）：**
- 使用 `useAuth()` 获取用户状态
- 权限检查：`authLoading` → `!isAuthenticated || user?.role !== "admin"`
- 使用 `trpc.xxx.useMutation()` 调用 API
- 使用 `toast.success/error()` 显示操作结果
- 使用 `AlertDialog` 组件做确认弹窗

**数据库操作模式（参考 db.ts）：**
- 使用 `getDb()` 获取数据库连接
- 使用 Drizzle ORM 的 `db.select()/insert()/update()/delete()`
- 批量操作使用 `Promise.all()`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `server/_core/trpc.ts` | adminProcedure 定义（第 66-81 行） |
| `server/routers.ts` | tRPC 路由定义，参考 article/category router |
| `server/db.ts` | 数据库操作函数，参考 getArticles/createArticle |
| `drizzle/schema.ts` | 数据库表结构：users, articles, categories |
| `client/src/pages/AdminArticles.tsx` | 管理员页面模板，权限检查、弹窗、toast |
| `client/src/App.tsx` | 前端路由配置 |

### Technical Decisions

- **导出格式**: JSON（与 Drizzle ORM 数据结构契合，跨环境兼容性好）
- **导出范围**: 全部数据（users、articles、categories）
- **导入策略**: 完全覆盖（导入前自动备份）
- **JSON 结构**: 包含 `version`、`exportedAt`、`data` 字段，便于版本兼容
- **版本兼容**: 导入时检查 version 字段，若版本不匹配则提示用户并拒绝导入
- **备份机制**: 导入前先调用导出 API 生成备份文件，自动下载到本地
- **数据预览**: 弹窗显示各表记录数，导入时解析上传文件后展示
- **自动备份**: 使用 node-cron 定时任务，备份文件存储在服务器 `backups/` 目录
- **备份间隔**: 周（每周日 00:00）、月（每月1日 00:00）、季度（每季度首日 00:00），**使用服务器本地时区**
- **备份保留策略**: 自动备份保留最近 10 个文件，超出后删除最旧的

## Implementation Plan

### Tasks

- [ ] **Task 1: 添加数据库导出函数**
  - File: `server/db.ts`
  - Action: 新增 `exportAllData()` 函数
  - Details:
    - 查询 users、articles、categories 三张表全部数据
    - 返回 `{ version: "1.0", exportedAt: Date, data: { users, articles, categories } }`
    - 同时返回统计信息 `{ userCount, articleCount, categoryCount }`

- [ ] **Task 2: 添加数据库导入函数**
  - File: `server/db.ts`
  - Action: 新增 `importAllData(data)` 函数
  - Details:
    - 接收 JSON 数据对象
    - 使用事务：先删除所有现有数据，再批量插入新数据
    - **删除顺序：articles → categories → users（先删子表，遵循外键依赖）**
    - 插入顺序：users → categories → articles（遵循外键依赖）
    - 返回导入统计 `{ userCount, articleCount, categoryCount }`
    - **导入完成后调用 `invalidateArticleCache()` 和 `invalidateCategoryCache()` 清除缓存**

- [ ] **Task 3: 添加数据统计函数**
  - File: `server/db.ts`
  - Action: 新增 `getDatabaseStats()` 函数
  - Details:
    - 返回 `{ userCount, articleCount, categoryCount }`
    - 用于导出前预览当前数据库状态

- [ ] **Task 4: 添加 tRPC database router**
  - File: `server/routers.ts`
  - Action: 在 `appRouter` 中新增 `database` router
  - Details:
    - `database.stats`: adminProcedure query，调用 `getDatabaseStats()`
    - `database.export`: adminProcedure query，调用 `exportAllData()`
    - `database.import`: adminProcedure mutation，接收 JSON 数据，调用 `importAllData()`

- [ ] **Task 5: 创建 AdminDatabase 页面**
  - File: `client/src/pages/AdminDatabase.tsx`（新建）
  - Action: 创建管理员数据库管理页面
  - Details:
    - 页面布局参考 `AdminArticles.tsx`
    - 权限检查：非管理员显示无权限提示
    - 两个主要操作区：导出卡片、导入卡片

- [ ] **Task 6: 实现导出功能 UI**
  - File: `client/src/pages/AdminDatabase.tsx`
  - Action: 实现导出按钮和确认弹窗
  - Details:
    - 点击"导出数据"按钮 → 调用 `database.stats` 获取统计
    - 弹窗显示：用户 X 个、文章 X 篇、分类 X 个
    - 确认后调用 `database.export`，生成 JSON 文件并触发下载
    - 文件名格式：`manual-backup-{YYYY-MM-DD-HHmmss}.json`

- [ ] **Task 7: 实现导入功能 UI**
  - File: `client/src/pages/AdminDatabase.tsx`
  - Action: 实现文件上传和确认弹窗
  - Details:
    - 文件选择器（accept=".json"）
    - 选择文件后解析 JSON，弹窗显示即将导入的数据统计
    - 警告文字："此操作将覆盖所有现有数据，系统会先自动备份当前数据"
    - 确认后：先调用 `database.export` 下载备份 → 再调用 `database.import`

- [ ] **Task 8: 添加前端路由**
  - File: `client/src/App.tsx`
  - Action: 添加 `/admin/database` 路由
  - Details:
    - 导入 `AdminDatabase` 组件
    - 在 `/admin/articles` 路由后添加新路由

- [ ] **Task 9: 添加自动备份配置表**
  - File: `drizzle/schema.ts`
  - Action: 新增 `backupSettings` 表
  - Details:
    - 字段：`id`, `enabled` (boolean), `interval` ('weekly'|'monthly'|'quarterly'), `lastBackupAt`, `nextBackupAt`, `updatedAt`
    - 单行配置表，只存储一条记录
    - **运行 `npx drizzle-kit push` 或 `npx drizzle-kit generate` + `migrate` 生成迁移**

- [ ] **Task 10: 添加自动备份数据库函数**
  - File: `server/db.ts`
  - Action: 新增备份配置相关函数
  - Details:
    - `getBackupSettings()`: 获取当前备份配置
    - `updateBackupSettings(enabled, interval)`: 更新备份配置
    - `saveBackupFile(data)`: 将备份数据写入服务器文件
    - **`ensureBackupDir()`: 检查并创建 backups/ 目录，无权限时抛出错误**

- [ ] **Task 11: 添加定时任务服务**
  - File: `server/_core/backup-scheduler.ts`（新建）
  - Action: 创建备份定时任务调度器
  - Details:
    - 使用 node-cron 实现定时任务
    - 根据 interval 设置 cron 表达式
    - 执行备份时调用 `exportAllData()` + `saveBackupFile()`
    - **服务器启动时从数据库读取配置，若 enabled=true 则初始化 cron 任务**
    - **提供 `restartScheduler()` 函数，配置更新时重新调度**

- [ ] **Task 12: 添加备份配置 tRPC 端点**
  - File: `server/routers.ts`
  - Action: 在 database router 中添加备份配置端点
  - Details:
    - `database.backupSettings`: adminProcedure query，获取配置
    - `database.updateBackupSettings`: adminProcedure mutation，更新配置

- [ ] **Task 13: 实现自动备份 UI**
  - File: `client/src/pages/AdminDatabase.tsx`
  - Action: 添加自动备份配置卡片
  - Details:
    - 开关按钮：启用/禁用自动备份
    - 下拉选择：周/月/季度
    - 显示上次备份时间、下次备份时间

### Acceptance Criteria

**导出功能：**
- [ ] AC1: Given 管理员已登录，when 访问 `/admin/database`，then 显示数据库管理页面
- [ ] AC2: Given 非管理员用户，when 访问 `/admin/database`，then 显示"无权限"提示
- [ ] AC3: Given 管理员点击"导出数据"，when 弹窗显示，then 展示当前数据库统计（用户数、文章数、分类数）
- [ ] AC4: Given 管理员确认导出，when 导出完成，then 自动下载 JSON 文件，文件名包含时间戳
- [ ] AC16: Given 管理员在导出弹窗中，when 点击取消，then 关闭弹窗，不执行任何操作

**导入功能：**
- [ ] AC5: Given 管理员选择 JSON 文件，when 文件解析成功，then 弹窗显示即将导入的数据统计
- [ ] AC6: Given 管理员确认导入，when 导入开始前，then 自动下载当前数据备份文件
- [ ] AC7: Given 导入执行中，when 数据写入完成，then 显示成功提示并展示导入统计
- [ ] AC8: Given 上传无效 JSON 文件，when 解析失败，then 显示错误提示，不执行导入
- [ ] AC17: Given 管理员在导入弹窗中，when 点击取消，then 关闭弹窗，不执行导入和备份

**数据完整性：**
- [ ] AC9: Given 导出的 JSON 文件，when 在另一环境导入，then 所有数据（users、articles、categories）完整恢复
- [ ] AC10: Given 导入操作失败，when 事务回滚，then 原有数据保持不变

**自动备份功能：**
- [ ] AC11: Given 管理员在页面上，when 查看自动备份区域，then 显示当前配置状态（开关、间隔、上次/下次备份时间）
- [ ] AC12: Given 管理员开启自动备份并选择"周"，when 保存配置，then 系统每周日 00:00 自动执行备份
- [ ] AC13: Given 管理员开启自动备份并选择"月"，when 保存配置，then 系统每月1日 00:00 自动执行备份
- [ ] AC14: Given 管理员开启自动备份并选择"季度"，when 保存配置，then 系统每季度首日 00:00 自动执行备份
- [ ] AC15: Given 自动备份执行成功，when 备份完成，then 备份文件保存在服务器 backups/ 目录（文件名：`auto-backup-{YYYY-MM-DD-HHmmss}.json`），更新 lastBackupAt

## Additional Context

### Dependencies

- **node-cron**: 定时任务调度库（需新增依赖）
- 备份文件存储目录：`backups/`（需在服务器端创建）

### Testing Strategy

- 手动测试：导出 → 导入 → 验证数据完整性
- 边界测试：空数据库导出、大文件导入、无效 JSON 导入

### Notes

- 导入操作会清空现有数据，需在弹窗中明确警告
- JSON 文件应包含版本号，便于未来 schema 变更时的兼容处理
- 考虑文件大小限制（建议 10MB 以内）
- **大文件处理**: 前端解析 JSON 前检查文件大小，超过 10MB 提示用户文件过大
