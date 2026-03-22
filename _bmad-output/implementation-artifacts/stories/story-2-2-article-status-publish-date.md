---
epic: epic-2
story_id: 2-2-article-status-publish-date
status: ready-for-dev
created: 2026-03-21
---

# Story 2.2: 文章状态管理与发布日期修改

As a 管理员,
I want 管理文章的发布状态和发布日期,
So that 我可以控制文章的发布时机和生命周期。

## Acceptance Criteria

**Given** 管理员在文章管理页面
**When** 管理员修改文章状态或发布日期
**Then** 可将文章状态在草稿、已发布、已归档之间切换（FR4）
**And** 可修改文章的发布日期（FR5）
**And** 状态切换后 updatedAt 自动更新（应用层处理）
**And** 状态变更后缓存正确失效

## Tasks

### Task 1: 检查现有状态管理代码
- [ ] 读取 server/db.ts 中文章更新相关函数
- [ ] 确认 status 字段（draft/published/archived）已在 schema 中定义
- [ ] 确认 publishedAt 字段已在 schema 中定义

### Task 2: 确认/实现状态切换 API
- [ ] 检查 PUT /api/articles/:id 是否支持 status 字段更新
- [ ] 若缺少专用端点，确认通用更新接口已覆盖
- [ ] 确保 updatedAt: new Date() 在状态变更时被设置
- [ ] 确保状态变更后调用 invalidateArticleCache()

### Task 3: 确认/实现发布日期修改 API
- [ ] 检查 publishedAt 字段是否可通过现有更新接口修改
- [ ] 确保日期格式正确处理（ISO 8601）

### Task 4: 单元测试
- [ ] 测试状态切换：draft → published → archived
- [ ] 测试发布日期修改
- [ ] 测试 updatedAt 自动更新
- [ ] 测试缓存失效
- [ ] 确保覆盖率 ≥ 80%

## Technical Notes

- 状态值: draft | published | archived
- updatedAt 在应用层通过 new Date() 手动设置
- 缓存使用现有 LRU 缓存实现，调用 invalidateArticleCache()
- 遵循 Epic 1 完成的 PostgreSQL 适配规范

## Dependencies

- Story 2.1: 文章 CRUD 操作适配（已完成）

## Definition of Done

- [ ] 所有 acceptance criteria 通过
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 无 TypeScript 类型错误
- [ ] 缓存机制正常工作
