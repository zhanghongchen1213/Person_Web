---
epic: epic-2
story_id: 2-1-article-crud-adaptation
status: ready-for-dev
created: 2026-03-21
---

# Story 2.1: 文章 CRUD 操作适配

As a 管理员,
I want 在新的 PostgreSQL 数据库下创建、编辑、删除文章,
So that 我可以完整管理博客内容。

## Acceptance Criteria

**Given** 管理员已通过 OAuth 登录并具有管理员权限
**When** 管理员执行文章操作
**Then** 可创建文章（标题、slug、摘要、正文、封面图、分类、类型、状态）（FR1）
**And** 可编辑已有文章的所有字段（FR2）
**And** 可删除文章（FR3）
**And** 插入操作使用 .returning({ id: articles.id }) 获取新文章 ID
**And** 更新操作手动设置 updatedAt: new Date()
**And** upsert 操作使用 onConflictDoUpdate
**And** 文章写操作后调用 invalidateArticleCache() 清除缓存

## Tasks

### Task 1: 检查现有文章 CRUD 代码
- [ ] 读取 server/db.ts 中的文章相关函数
- [ ] 识别需要适配的 MySQL 特有语法

### Task 2: 适配文章创建操作
- [ ] 将 insertId 替换为 .returning({ id: articles.id })
- [ ] 确保所有字段正确映射到 PostgreSQL schema
- [ ] 添加单元测试验证创建功能

### Task 3: 适配文章更新操作
- [ ] 手动设置 updatedAt: new Date()（替代 onUpdateNow）
- [ ] 验证所有字段可正确更新
- [ ] 添加单元测试验证更新功能

### Task 4: 适配文章 upsert 操作
- [ ] 将 onDuplicateKeyUpdate 替换为 onConflictDoUpdate
- [ ] 测试冲突场景下的行为
- [ ] 添加集成测试

### Task 5: 验证缓存失效机制
- [ ] 确认 invalidateArticleCache() 在写操作后被调用
- [ ] 测试缓存失效后的数据一致性

### Task 6: 集成测试
- [ ] 编写端到端测试覆盖创建、编辑、删除流程
- [ ] 验证管理员权限检查
- [ ] 确保测试覆盖率 ≥ 80%

## Technical Notes

- 使用 Drizzle ORM 的 PostgreSQL 适配器
- 所有日期操作使用 JavaScript Date 对象
- 缓存使用现有 LRU 缓存实现
- 遵循 ADR-02 中的 schema 迁移规范

## Dependencies

- Epic 1 Story 1.1: Drizzle ORM Schema 迁移完成
- Epic 1 Story 1.3: 数据库查询语法适配完成

## Definition of Done

- [ ] 所有 acceptance criteria 通过
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试通过
- [ ] 代码审查通过
- [ ] 无 TypeScript 类型错误
- [ ] 缓存机制正常工作
