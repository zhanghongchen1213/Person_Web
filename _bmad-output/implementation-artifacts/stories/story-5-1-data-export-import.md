---
storyId: '5-1'
epicId: 5
title: '数据导出与导入'
status: 'ready-for-dev'
priority: 'high'
storyPoints: 5
dependencies: ['1-1', '1-2', '1-3']
blockedBy: []
blocks: ['5-2']
created: '2026-03-22'
---

# Story 5.1: 数据导出与导入

## Story Description

**As a** 管理员,
**I want** 导出和导入博客全部数据,
**So that** 我可以备份数据并在需要时恢复。

## Background & Context

- 本 Story 实现数据导出/导入功能，为数据备份、迁移和恢复提供基础能力
- 导出格式为 JSON，包含所有表数据（articles、categories、users、page_views、backup_configs）
- 导入使用 Drizzle ORM 事务确保原子性，任何表写入失败时整个事务回滚
- 日期字段使用 ISO 字符串格式（PostgreSQL 原生支持）
- 导入后校验行数一致性，确保零数据丢失（NFR19）
- 参考架构决策：ADR-05（数据迁移通过 JSON 导出/导入，日期处理改为 ISO 字符串，使用 Drizzle 事务）

## Current State Analysis

### 现有文件检查

需要检查以下文件是否已存在数据导出/导入相关代码：

- `server/db.ts` — 数据库操作函数
- `server/routers.ts` — tRPC 路由定义
- `drizzle/schema.ts` — 数据库表结构

### 预期实现位置

- 数据库函数：`server/db.ts` 中新增 `exportAllData()` 和 `importAllData()` 函数
- tRPC 路由：`server/routers.ts` 中新增 `database.export` 和 `database.import` mutation
- 前端页面：`/admin/database` 页面（可能已存在，需验证）

## Acceptance Criteria

**Given** 管理员访问 /admin/database 页面
**When** 管理员执行导出或导入操作
**Then:**

- [ ] **AC-1**: 可导出全部数据为 JSON 格式（FR26）
- [ ] **AC-2**: 可从 JSON 文件导入数据恢复备份（FR27）
- [ ] **AC-3**: 导入使用 Drizzle ORM 事务（db.transaction()）确保原子性
- [ ] **AC-4**: 日期字段使用 ISO 字符串格式（PostgreSQL 原生支持）
- [ ] **AC-5**: 导入后校验行数一致性（NFR19）
- [ ] **AC-6**: 导入过程中任何表写入失败时，整个事务回滚，数据库恢复到导入前状态
- [ ] **AC-7**: 导入 JSON 格式不合法或字段缺失时，返回明确的错误信息并中止导入
- [ ] **AC-8**: 导出失败时返回错误提示，不生成不完整的 JSON 文件

## Tasks

### Task 1: 实现 exportAllData 数据库函数（AC-1, AC-4, AC-8）

**File**: `server/db.ts`

**实现要点:**

1. 查询所有表数据：articles、categories、users、page_views、backup_configs
2. 日期字段自动转换为 ISO 字符串（PostgreSQL 原生支持）
3. 返回包含所有表数据的 JSON 对象
4. 错误处理：数据库连接失败或查询失败时抛出异常

**函数签名:**

```typescript
export async function exportAllData(): Promise<{
  articles: Array<typeof articles.$inferSelect>;
  categories: Array<typeof categories.$inferSelect>;
  users: Array<typeof users.$inferSelect>;
  pageViews: Array<typeof pageViews.$inferSelect>;
  backupConfigs: Array<typeof backupConfigs.$inferSelect>;
  exportedAt: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [articlesData, categoriesData, usersData, pageViewsData, backupConfigsData] = await Promise.all([
    db.select().from(articles),
    db.select().from(categories),
    db.select().from(users),
    db.select().from(pageViews),
    db.select().from(backupConfigs),
  ]);

  return {
    articles: articlesData,
    categories: categoriesData,
    users: usersData,
    pageViews: pageViewsData,
    backupConfigs: backupConfigsData,
    exportedAt: new Date().toISOString(),
  };
}
```

### Task 2: 实现 importAllData 数据库函数（AC-2, AC-3, AC-4, AC-5, AC-6, AC-7）

**File**: `server/db.ts`

**实现要点:**

1. 使用 `db.transaction()` 包裹所有写操作
2. 清空所有表（DELETE FROM）
3. 批量插入导入数据
4. 导入后查询各表行数，与导入数据行数对比
5. 行数不一致时抛出异常，触发事务回滚
6. JSON 格式校验：检查必需字段是否存在
7. 错误处理：任何步骤失败都触发事务回滚

**函数签名:**

```typescript
export async function importAllData(data: {
  articles: Array<any>;
  categories: Array<any>;
  users: Array<any>;
  pageViews: Array<any>;
  backupConfigs: Array<any>;
}): Promise<{ success: boolean; rowCounts: Record<string, number> }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate JSON structure
  if (!data.articles || !data.categories || !data.users || !data.pageViews || !data.backupConfigs) {
    throw new Error("Invalid JSON format: missing required tables");
  }

  return await db.transaction(async (tx) => {
    // Clear all tables
    await tx.delete(pageViews);
    await tx.delete(articles);
    await tx.delete(categories);
    await tx.delete(backupConfigs);
    await tx.delete(users);

    // Insert data
    if (data.users.length > 0) await tx.insert(users).values(data.users);
    if (data.categories.length > 0) await tx.insert(categories).values(data.categories);
    if (data.articles.length > 0) await tx.insert(articles).values(data.articles);
    if (data.pageViews.length > 0) await tx.insert(pageViews).values(data.pageViews);
    if (data.backupConfigs.length > 0) await tx.insert(backupConfigs).values(data.backupConfigs);

    // Verify row counts
    const [articlesCount, categoriesCount, usersCount, pageViewsCount, backupConfigsCount] = await Promise.all([
      tx.select({ count: sql<number>`count(*)` }).from(articles),
      tx.select({ count: sql<number>`count(*)` }).from(categories),
      tx.select({ count: sql<number>`count(*)` }).from(users),
      tx.select({ count: sql<number>`count(*)` }).from(pageViews),
      tx.select({ count: sql<number>`count(*)` }).from(backupConfigs),
    ]);

    const rowCounts = {
      articles: Number(articlesCount[0].count),
      categories: Number(categoriesCount[0].count),
      users: Number(usersCount[0].count),
      pageViews: Number(pageViewsCount[0].count),
      backupConfigs: Number(backupConfigsCount[0].count),
    };

    // Verify consistency
    if (
      rowCounts.articles !== data.articles.length ||
      rowCounts.categories !== data.categories.length ||
      rowCounts.users !== data.users.length ||
      rowCounts.pageViews !== data.pageViews.length ||
      rowCounts.backupConfigs !== data.backupConfigs.length
    ) {
      throw new Error("Row count mismatch after import");
    }

    return { success: true, rowCounts };
  });
}
```

### Task 3: 添加 database.export tRPC 路由（AC-1, AC-8）

**File**: `server/routers.ts`

**实现要点:**

1. 使用 `adminProcedure` 保护（仅管理员可导出）
2. 调用 `exportAllData()` 获取数据
3. 返回 JSON 数据
4. 错误处理：捕获异常并返回错误信息

**路由定义:**

```typescript
// In database router
export: adminProcedure
  .mutation(async () => {
    try {
      const data = await db.exportAllData();
      return { success: true, data };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Export failed: ${error.message}`,
      });
    }
  }),
```

### Task 4: 添加 database.import tRPC 路由（AC-2, AC-3, AC-6, AC-7）

**File**: `server/routers.ts`

**实现要点:**

1. 使用 `adminProcedure` 保护（仅管理员可导入）
2. input 校验：接收完整的数据对象
3. 调用 `importAllData()` 执行导入
4. 返回导入结果和行数统计
5. 错误处理：捕获异常并返回明确错误信息

**路由定义:**

```typescript
// In database router
import: adminProcedure
  .input(
    z.object({
      articles: z.array(z.any()),
      categories: z.array(z.any()),
      users: z.array(z.any()),
      pageViews: z.array(z.any()),
      backupConfigs: z.array(z.any()),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const result = await db.importAllData(input);
      return result;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Import failed: ${error.message}`,
      });
    }
  }),
```

### Task 5: 前端页面实现 — 数据导出功能

**File**: `src/pages/admin/Database.tsx`（或类似路径）

**实现要点:**

1. 添加"导出数据"按钮
2. 调用 `trpc.database.export.mutate()`
3. 将返回的 JSON 数据转换为 Blob
4. 触发浏览器下载（文件名：`backup-YYYY-MM-DD.json`）
5. 显示加载状态和错误提示

### Task 6: 前端页面实现 — 数据导入功能

**File**: `src/pages/admin/Database.tsx`

**实现要点:**

1. 添加"导入数据"文件上传按钮
2. 读取上传的 JSON 文件
3. 解析 JSON 并校验格式
4. 调用 `trpc.database.import.mutate(data)`
5. 显示导入进度、成功提示和行数统计
6. 错误处理：显示明确的错误信息

### Task 7: 编写集成测试 — 数据导出（AC-1, AC-4, AC-8）

**File**: `server/__tests__/data-export-import.test.ts`（新建）

**测试用例:**

1. 管理员可成功导出数据，返回包含所有表的 JSON
2. 导出的 JSON 包含 exportedAt 时间戳
3. 日期字段为 ISO 字符串格式
4. 数据库连接失败时抛出异常
5. 非管理员调用 export 返回 FORBIDDEN 错误

### Task 8: 编写集成测试 — 数据导入（AC-2, AC-3, AC-5, AC-6, AC-7）

**File**: `server/__tests__/data-export-import.test.ts`

**测试用例:**

1. 管理员可成功导入数据，返回成功状态和行数统计
2. 导入后各表行数与导入数据一致
3. 导入使用事务，中途失败时数据库回滚到导入前状态
4. JSON 格式不合法时返回错误信息
5. 缺少必需字段时返回错误信息
6. 非管理员调用 import 返回 FORBIDDEN 错误

### Task 9: 编写集成测试 — 导出导入完整流程（AC-5）

**File**: `server/__tests__/data-export-import.test.ts`

**测试用例:**

1. 导出数据 → 清空数据库 → 导入数据 → 验证数据完整性
2. 导入后所有表行数与导出前一致
3. 导入后随机抽样验证数据内容一致

### Task 10: TypeScript 编译验证

执行以下命令确认无类型错误：

```bash
npx tsc --noEmit
```

**预期结果:** 编译通过，无错误输出。

### Task 11: 端到端手动验证

通过浏览器完成以下操作：

1. 以管理员身份登录
2. 访问 /admin/database 页面
3. 点击"导出数据"按钮 → 确认下载 JSON 文件
4. 打开 JSON 文件 → 确认包含所有表数据和 exportedAt 时间戳
5. 点击"导入数据"按钮 → 上传刚导出的 JSON 文件
6. 确认导入成功提示和行数统计
7. 验证数据完整性（浏览文章列表、分类等）

## Technical Notes

### JSON 数据结构

```json
{
  "articles": [...],
  "categories": [...],
  "users": [...],
  "pageViews": [...],
  "backupConfigs": [...],
  "exportedAt": "2026-03-22T14:57:53.210Z"
}
```

### 事务回滚机制

Drizzle ORM 事务特性：
- 任何 `throw` 或 `reject` 都会触发事务回滚
- 回滚后数据库恢复到事务开始前的状态
- 确保数据一致性，避免部分导入导致数据损坏

### 文件变更清单

| 文件 | 变更类型 | 描述 |
|------|---------|------|
| `server/db.ts` | 新增函数 | 添加 `exportAllData()` 和 `importAllData()` |
| `server/routers.ts` | 新增路由 | 添加 `database.export` 和 `database.import` |
| `src/pages/admin/Database.tsx` | 修改/新建 | 添加导出/导入 UI |
| `server/__tests__/data-export-import.test.ts` | 新建文件 | 数据导出/导入集成测试 |

### 安全考虑

- 导出/导入操作仅限管理员（`adminProcedure`）
- 导入前校验 JSON 格式，防止注入攻击
- 使用事务确保原子性，避免数据损坏
- 导入失败时明确提示错误原因

## Testing Requirements

### 验证清单

1. **静态类型检查**
   - `npx tsc --noEmit` 通过
   - 新增函数/路由的类型签名正确

2. **单元测试**
   - `exportAllData()` 返回正确的数据结构
   - `importAllData()` 事务回滚机制正确
   - JSON 格式校验正确

3. **集成测试**
   - 导出 → 导入 → 验证完整流程
   - 行数一致性校验
   - 权限校验（非管理员被拒绝）
   - 错误处理（格式不合法、字段缺失）

4. **端到端验证**
   - 通过浏览器完成导出/导入全流程
   - 验证数据完整性

## Dependencies

### 前置依赖

- **Story 1.1**: Drizzle ORM Schema 从 MySQL 迁移至 PostgreSQL（表定义）
- **Story 1.2**: 数据库驱动替换与连接配置（pg 驱动 + 连接池）
- **Story 1.3**: 数据库查询语法适配（事务支持）

### 被阻塞的后续 Story

- **Story 5.2**: 数据库统计与自动备份（依赖本 story 的导出能力）
- **Story 7.1**: 旧系统数据导出与新系统数据导入（依赖本 story 的导入能力）

### 包依赖

- 无新增包依赖（所有需要的包已在 Epic 1 中安装）

## Dev Notes

### 实施顺序建议

1. 实现数据库函数（Task 1-2）
2. 添加 tRPC 路由（Task 3-4）
3. 实现前端页面（Task 5-6）
4. 编写测试（Task 7-9）
5. 编译验证（Task 10）
6. 端到端手动验证（Task 11）

### 风险与注意事项

- **数据安全**: 导入操作会清空所有表，需在 UI 中明确警告用户
- **大数据量**: 如果数据量很大（>10MB），考虑分批导入或使用流式处理
- **外键约束**: 导入顺序需遵循外键依赖（users → categories → articles → pageViews）
- **备份建议**: 导入前建议先导出当前数据作为备份
