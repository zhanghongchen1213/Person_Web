---
story_id: 3-4-fulltext-search-migration
epic_id: epic-3
epic_name: 内容消费与阅读体验
status: ready-for-dev
priority: medium
created_date: 2026-03-22
---

# Story 3.4: 全文搜索迁移（MySQL → PostgreSQL）

## User Story

As a 读者,
I want 通过全文搜索查找博客文章,
So that 我可以快速找到感兴趣的内容。

## Related Requirements

- FR15: 读者可通过全文搜索查找文章
- NFR3: 全文搜索响应时间 < 300ms
- ADR-04: 全文搜索从 MySQL ngram FULLTEXT 迁移至 PostgreSQL tsvector + GIN 索引，simple 分词配置，ILIKE 降级兜底

## Acceptance Criteria

### AC1: PostgreSQL 全文搜索实现

**Given** 读者在搜索框输入关键词
**When** 执行全文搜索
**Then** 使用 PostgreSQL tsvector + to_tsvector/to_tsquery 实现全文搜索
**And** 使用 simple 分词配置（兼容 MemfireDB）
**And** 搜索标题和正文内容字段
**And** 搜索结果按相关性排序

### AC2: GIN 索引优化

**Given** articles 表包含大量文章数据
**When** 数据库 schema 迁移执行
**Then** 在 articles 表创建 GIN 索引加速全文搜索
**And** 索引覆盖 title 和 content 字段的 tsvector
**And** 索引创建使用 Drizzle ORM 迁移脚本

### AC3: 性能要求

**Given** 用户执行全文搜索
**When** 搜索查询被处理
**Then** 搜索响应时间 < 300ms（NFR3）
**And** 使用 GIN 索引避免全表扫描
**And** 限制返回结果数量（默认最多 50 条）

### AC4: ILIKE 降级兜底

**Given** tsvector 搜索返回 0 结果
**When** 系统检测到空结果集
**Then** 自动降级为 ILIKE '%keyword%' 模糊搜索
**And** 降级搜索同样覆盖 title 和 content 字段
**And** 降级搜索结果按发布日期倒序排列

### AC5: 边界情况处理

**Given** 用户输入各种边界情况
**When** 执行搜索
**Then** 搜索关键词为空时返回空列表，不抛出异常
**And** 搜索关键词包含特殊字符时正确转义
**And** 数据库连接不可用时返回空结果并记录错误日志，不中断用户体验
**And** 搜索关键词过长（>100 字符）时截断处理

### AC6: 搜索结果格式

**Given** 搜索返回匹配结果
**When** 前端接收搜索结果
**Then** 返回文章 ID、标题、摘要、slug、发布日期、分类信息
**And** 不返回完整文章内容（减少数据传输）
**And** 包含总匹配数量用于分页
**And** 高亮匹配关键词（可选，前端实现）

## Tasks

### Task 1: 数据库 Schema 迁移

**Subtask 1.1: 创建 GIN 索引迁移脚本**
- [ ] 使用 Drizzle ORM 创建新的迁移文件
- [ ] 添加 GIN 索引到 articles 表
- [ ] 索引定义：`CREATE INDEX articles_search_idx ON articles USING GIN (to_tsvector('simple', title || ' ' || content))`
- [ ] 测试迁移脚本在本地 PostgreSQL 环境执行成功

**Subtask 1.2: 验证索引创建**
- [ ] 执行迁移脚本
- [ ] 使用 `\d articles` 或查询 pg_indexes 验证索引存在
- [ ] 使用 EXPLAIN ANALYZE 验证查询使用索引

### Task 2: 后端搜索 API 开发

**Subtask 2.1: 实现 tsvector 搜索逻辑**
- [ ] 在 server/db.ts 中创建/更新 searchArticles 函数
- [ ] 使用 sql 模板构建 to_tsvector 和 to_tsquery 查询
- [ ] 配置 simple 分词器（兼容 MemfireDB）
- [ ] 实现相关性排序（ts_rank 或 ts_rank_cd）
- [ ] 限制返回结果数量（默认 50 条）

**Subtask 2.2: 实现 ILIKE 降级逻辑**
- [ ] 检测 tsvector 搜索结果为空
- [ ] 自动执行 ILIKE '%keyword%' 降级搜索
- [ ] 降级搜索覆盖 title 和 content 字段
- [ ] 按发布日期倒序排列降级结果

**Subtask 2.3: 边界情况处理**
- [ ] 处理空关键词输入（返回空数组）
- [ ] 处理特殊字符转义（防止 SQL 注入）
- [ ] 处理数据库连接错误（返回空结果 + 日志记录）
- [ ] 处理过长关键词（截断到 100 字符）

**Subtask 2.4: tRPC Procedure 集成**
- [ ] 创建/更新 searchArticles tRPC procedure
- [ ] 定义输入 schema（keyword: string, limit?: number）
- [ ] 定义输出 schema（文章列表 + 总数）
- [ ] 添加输入验证（zod schema）

### Task 3: 性能优化与测试

**Subtask 3.1: 性能测试**
- [ ] 使用 EXPLAIN ANALYZE 分析查询计划
- [ ] 验证 GIN 索引被正确使用
- [ ] 测试搜索响应时间 < 300ms（使用包含 1000+ 文章的数据集）
- [ ] 测试降级搜索性能

**Subtask 3.2: 单元测试**
- [ ] 测试正常搜索返回匹配结果
- [ ] 测试空关键词返回空数组
- [ ] 测试特殊字符正确处理
- [ ] 测试 ILIKE 降级逻辑触发
- [ ] 测试数据库错误处理

**Subtask 3.3: 集成测试**
- [ ] 测试完整搜索流程（前端 → tRPC → 数据库）
- [ ] 测试搜索结果格式正确
- [ ] 测试分页参数正确处理
- [ ] 测试并发搜索请求

### Task 4: 前端集成

**Subtask 4.1: 搜索 UI 组件**
- [ ] 创建/更新搜索框组件
- [ ] 实现搜索输入防抖（300ms）
- [ ] 显示搜索加载状态
- [ ] 显示搜索结果列表

**Subtask 4.2: 搜索结果展示**
- [ ] 展示文章标题、摘要、发布日期
- [ ] 实现关键词高亮（可选）
- [ ] 显示"无结果"提示
- [ ] 支持点击跳转到文章详情页

**Subtask 4.3: 错误处理**
- [ ] 处理搜索 API 错误
- [ ] 显示友好错误提示
- [ ] 实现重试机制（可选）

### Task 5: 文档与验收

**Subtask 5.1: 技术文档**
- [ ] 记录 PostgreSQL 全文搜索实现方案
- [ ] 记录 GIN 索引配置
- [ ] 记录降级策略说明
- [ ] 更新 API 文档

**Subtask 5.2: 验收测试**
- [ ] 验证搜索功能正常工作
- [ ] 验证搜索响应时间 < 300ms
- [ ] 验证降级逻辑正确触发
- [ ] 验证边界情况正确处理
- [ ] 验证搜索结果准确性

## Technical Notes

### PostgreSQL 全文搜索语法

```sql
-- 基础 tsvector 搜索
SELECT * FROM articles
WHERE to_tsvector('simple', title || ' ' || content) @@ to_tsquery('simple', 'keyword')
ORDER BY ts_rank(to_tsvector('simple', title || ' ' || content), to_tsquery('simple', 'keyword')) DESC;

-- GIN 索引创建
CREATE INDEX articles_search_idx ON articles
USING GIN (to_tsvector('simple', title || ' ' || content));

-- ILIKE 降级搜索
SELECT * FROM articles
WHERE title ILIKE '%keyword%' OR content ILIKE '%keyword%'
ORDER BY published_at DESC;
```

### Drizzle ORM 实现示例

```typescript
// 使用 sql 模板构建全文搜索
import { sql } from 'drizzle-orm';

const searchKeyword = 'example';
const results = await db
  .select()
  .from(articles)
  .where(
    sql`to_tsvector('simple', ${articles.title} || ' ' || ${articles.content}) @@ to_tsquery('simple', ${searchKeyword})`
  )
  .limit(50);
```

### 性能考虑

- GIN 索引会增加写操作开销，但大幅提升搜索性能
- simple 分词器适合 MemfireDB，不需要额外语言包
- 限制返回结果数量避免大数据集传输
- 使用降级策略确保用户总能得到结果

## Definition of Done

- [ ] GIN 索引成功创建并在查询中使用
- [ ] tsvector 全文搜索正确实现
- [ ] ILIKE 降级逻辑正确触发
- [ ] 搜索响应时间 < 300ms（NFR3）
- [ ] 所有边界情况正确处理
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试通过
- [ ] 前端搜索 UI 正常工作
- [ ] 代码通过 code-reviewer 审查
- [ ] 技术文档已更新
