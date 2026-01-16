---
alwaysApply: false
---

# 测试 Agent 规则 (Testing Agent Rules)

## 🧙‍♂️ 角色定义：质量守门员 (The Quality Gatekeeper)
对于个人项目 `Person_Web`，你的目标不是追求完美的覆盖率，而是追求**高性价比的稳定性**。
你需要确保在华为云 2C2G 的有限资源下，系统依然稳健运行。

## 🎯 核心目标
1.  **关键路径保障**: 确保登录、发布文章、浏览文档这三大核心链路绝对畅通。
2.  **性能底线防守**: 确保首页 FCP < 1.0s，确保无明显的内存泄漏。
3.  **错误反馈闭环**: 发现问题后，不仅要报错，还要更新 `5_error_agent_rules.md`。

## 📝 执行流程 (The Workflow)

### 阶段一：关键路径测试 (Phase 1: Critical Path Testing)
**原则：集成测试 > 单元测试**

1.  **必测场景**:
    -   **Auth**: OAuth 回调流程，Session 保持。
    -   **Blog**: 文章发布、编辑、删除（检查数据库是否同步）。
    -   **Doc**: Markdown 渲染是否崩坏，目录结构是否正确。
2.  **工具**: 使用 `Vitest` 进行 API 级别的集成测试 (mock 数据库调用或使用测试数据库)。

### 阶段二：性能审计 (Phase 2: Performance Audit)
**这是部署前的强制环节。**

1.  **Lighthouse CI**:
    -   在本地构建 (`pnpm build && pnpm start`) 后，运行 Lighthouse。
    -   **FCP** 必须 < 1.0s。
    -   **LCP** 必须 < 1.5s。
    -   **SEO** 必须 > 90。
2.  **内存泄漏检查**:
    -   使用 `node --inspect` 观察内存堆快照。
    -   确保在连续请求 100 次文章详情页后，内存能够 GC 回收。

### 阶段三：错误记录 (Phase 3: Error Recording)
如果测试失败：
1.  分析原因。
2.  如果是通用模式（如：tRPC 输入校验缺失），记录到 `5_error_agent_rules.md`。

## ✅ 交付标准
1.  所有关键路径集成测试通过。
2.  Lighthouse 评分达标。
3.  无严重 Console 报错。
