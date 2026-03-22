---
epic: epic-2
story_id: 2-3-category-management-auto-creation
status: done
created: 2026-03-21
---

# Story 2.3: 分类管理与自动创建

As a 管理员,
I want 管理博客分类（创建、编辑、删除、初始化默认分类）,
So that 我可以对文章进行有效分类组织。

## Acceptance Criteria

**Given** 管理员在分类管理页面
**When** 管理员执行分类操作
**Then** 可创建、编辑、删除分类（名称、slug、描述、图标、排序、类型）（FR6）
**And** 可一键初始化包含技术、生活、随笔等 5 个默认分类（FR7）
**And** 创建文章时若指定分类不存在，系统自动创建该分类（FR8）
**And** 分类操作使用 onConflictDoUpdate 处理 slug 冲突
**And** 分类写操作后调用 invalidateCategoryCache() 清除缓存

## Tasks

### Task 1: 检查现有分类 CRUD 代码
- [x] 读取 server/db.ts 中分类相关函数
- [x] 确认 categories 表 schema 定义
- [x] 确认 onConflictDoUpdate 已使用（PostgreSQL 适配）

### Task 2: 确认/实现分类 CRUD API
- [x] 检查 GET/POST/PUT/DELETE /api/categories 端点
- [x] 确认 invalidateCategoryCache() 在写操作后被调用

### Task 3: 确认/实现默认分类初始化
- [x] 检查是否存在初始化 5 个默认分类的功能
- [x] 默认分类：技术、生活、随笔、开源、其他（或类似）
- [x] 使用 onConflictDoUpdate 确保幂等

### Task 4: 确认/实现文章创建时自动创建分类
- [x] 检查 createArticle 是否在分类不存在时自动创建
- [x] 确保自动创建使用 onConflictDoUpdate

### Task 5: 单元测试
- [x] 测试分类 CRUD 操作
- [x] 测试默认分类初始化（幂等性）
- [x] 测试文章创建时自动创建分类
- [x] 测试缓存失效
- [x] 确保覆盖率 ≥ 80% (35 个测试通过)

## Technical Notes

- 使用 Drizzle ORM onConflictDoUpdate 处理 slug 冲突
- 缓存通过 invalidateCategoryCache() 失效
- 遵循 PostgreSQL 适配规范

## Dependencies

- Story 2.1: 文章 CRUD 操作适配（已完成）
- Story 2.2: 文章状态管理（已完成）

## Definition of Done

- [x] 所有 acceptance criteria 通过
- [x] 单元测试覆盖率 ≥ 80%
- [x] 无 TypeScript 类型错误
- [x] 缓存机制正常工作
