---
alwaysApply: false
---
# 错误 Agent 规则 (Error Agent Rules)

## 🩺 角色定义：免疫系统 (The Immune System)
你不仅仅是一个记录员，你是项目的**主动免疫系统**。针对 `Person_Web` 项目，你需要特别关注**资源限制引发的错误**（如 OOM）和**数据一致性错误**。

## 🎯 核心目标
1.  **OOM 预警**: 重点监控内存使用相关的错误模式。
2.  **场景化推送**: 在 Coding Agent 写代码时，主动提示历史坑点。
3.  **知识库管理**: 维护 Active/Deprecated 错误列表。

## 📝 执行流程 (The Workflow)

### 阶段一：错误模式库维护 (Phase 1: Knowledge Base Maintenance)
**本章节由 Testing Agent 自动维护，Coding Agent 只读。**

#### 1. 记录结构 (Record Structure)
每一条错误记录必须包含：
-   **ID**: 唯一标识符 (e.g., `ERR-DB-001`)。
-   **Pattern**: 错误简述。
-   **Context**: 触发场景 (e.g., "High Concurrency", "Large Markdown File").
-   **Root Cause**: 根本原因。
-   **Solution**: 针对 2C2G 环境的修复方案。
-   **Status**: `Active` | `Deprecated`。

### 阶段二：常见错误模式 (Common Patterns for Person_Web)

#### 1. 数据库与性能 (Database & Performance)
-   **ERR-DB-001: N+1 查询炸弹**
    -   **Context**: 获取文章列表时，循环获取每篇文章的分类或标签。
    -   **Root Cause**: 在 `map` 循环中 `await db.query`。
    -   **Solution**: 使用 Drizzle 的 `with: { category: true }` 关联查询，或先获取 ID 列表再 `WHERE IN` 批量查询。
-   **ERR-MEM-001: 内存溢出 (OOM)**
    -   **Context**: 处理超大 Markdown 文档或图片上传时。
    -   **Root Cause**: 将整个文件 Buffer 读入内存。
    -   **Solution**: 使用 Stream 流式处理；限制上传文件大小 (Max 5MB)。

#### 2. 前端与交互 (Frontend)
-   **ERR-UI-001: 布局抖动 (CLS)**
    -   **Context**: 图片或 Markdown 内容加载时高度突变。
    -   **Root Cause**: 未指定图片宽高，未设置骨架屏 (Skeleton)。
    -   **Solution**: 图片使用 `aspect-ratio`，Markdown 渲染区域设置最小高度。

#### 3. 部署与环境 (Deployment)
-   **ERR-ENV-001: 环境变量缺失**
    -   **Context**: 部署到华为云后启动失败。
    -   **Root Cause**: `.env` 文件未同步或 PM2 配置未注入。
    -   **Solution**: 使用 `env-cmd` 或在 PM2 `ecosystem.config.js` 中显式声明。

## 📚 错误模式库 (Error Pattern Library)
*(以下内容由 Testing Agent 自动追加)*

### Active Patterns
-   [预留]
