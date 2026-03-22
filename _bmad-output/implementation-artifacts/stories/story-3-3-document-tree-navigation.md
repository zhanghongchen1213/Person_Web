---
story_id: 3-3-document-tree-navigation
epic_id: epic-3
epic_name: 内容消费与阅读体验
status: ready-for-dev
priority: medium
created_date: 2026-03-22
---

# Story 3.3: 文档树导航

## User Story

As a 读者,
I want 通过树形导航浏览文档，查看面包屑路径并快速定位当前文档位置,
So that 我可以高效地在文档体系中导航和阅读系列化的技术文档。

## Related Requirements

- FR11: 文档类型文章以树形结构展示，按分类分组、按 order 字段排序
- FR12: 文档导航支持展开/折叠分类、当前文档高亮、上下篇导航
- NFR5: 文档树缓存 TTL 10 分钟，缓存容量 100 条目
- NFR25-NFR28: WCAG 2.1 AA 可访问性标准（键盘导航、屏幕阅读器支持）

## Current State Analysis

以下功能已在前序开发中部分实现，本 Story 需在此基础上完善和增强：

### 已实现

- **后端 API**: `doc.tree` tRPC procedure 已完成，支持按 categorySlug 筛选，10 分钟 LRU 缓存
- **数据模型**: `DocTree` / `DocTreeItem` 接口已定义（server/db.ts），查询使用批量 JOIN 避免 N+1
- **前端组件**: DocSidebar（展开/折叠树）、DocTOC（页内目录）、DocNavigation（上下篇）、DocLayout（三栏布局）已实现
- **路由**: `/docs/:category/:slug` 已注册，DocReader 页面已集成所有组件
- **类型定义**: `TocItem`、`DocNavItem`、`DocSidebarProps`、`DocTOCProps` 已定义（client/src/types/doc.ts）

### 待完善

- 面包屑导航组件（Breadcrumb）
- 文档首页/索引页（`/docs` 路由，展示所有文档分类概览）
- 移动端侧边栏体验优化（导航后自动关闭、滑动手势）
- URL 驱动的分类展开状态持久化
- 键盘快捷键支持（上下篇快速跳转）

## Acceptance Criteria

### AC1: 文档树侧边栏导航

**Given** 读者访问任意文档页面 `/docs/:category/:slug`
**When** 页面加载完成
**Then** 左侧侧边栏显示完整的文档树结构
**And** 文档按分类分组，分类按 sortOrder 排序，文档按 order 字段排序
**And** 当前文档所在分类自动展开
**And** 当前文档条目高亮显示（bg-primary 样式）
**And** 每个分类显示文档数量徽标

### AC2: 展开/折叠交互

**Given** 读者在文档侧边栏中
**When** 点击分类标题
**Then** 该分类的文档列表展开或折叠（toggle）
**And** 展开/折叠动画平滑过渡
**And** 展开状态图标从 ChevronRight 切换为 ChevronDown
**And** 支持键盘操作（Enter/Space 触发展开/折叠）

### AC3: 面包屑导航

**Given** 读者在文档详情页
**When** 页面加载完成
**Then** 文档内容区顶部显示面包屑路径：文档 > {分类名} > {文档标题}
**And** "文档" 链接指向文档首页 `/docs`
**And** 分类名链接指向该分类的第一篇文档
**And** 当前文档标题不可点击（纯文本展示）
**And** 面包屑使用语义化 `<nav aria-label="Breadcrumb">` 和 `<ol>` 标签

### AC4: 文档首页/索引页

**Given** 读者访问 `/docs` 路径
**When** 页面加载完成
**Then** 展示所有文档分类的概览卡片
**And** 每个分类卡片显示：分类名称、描述、文档数量
**And** 点击分类卡片跳转到该分类的第一篇文档
**And** 页面使用与博客一致的 brutalist 设计风格

### AC5: 上下篇导航

**Given** 读者在文档详情页底部
**When** 查看导航区域
**Then** 显示上一篇和下一篇文档的链接
**And** 导航跨分类连续（分类 A 最后一篇的下一篇是分类 B 的第一篇）
**And** 第一篇文档无"上一篇"，最后一篇文档无"下一篇"
**And** 支持键盘快捷键：`Alt+←` 上一篇，`Alt+→` 下一篇

### AC6: 移动端响应式体验

**Given** 读者在移动设备上访问文档页面
**When** 点击侧边栏中的文档链接
**Then** 侧边栏自动关闭，显示文档内容
**And** 侧边栏通过汉堡菜单按钮切换显示/隐藏
**And** 侧边栏打开时显示半透明遮罩层
**And** 右侧 TOC 在 xl 以下断点隐藏

### AC7: 缓存与性能

**Given** 文档树 API 被请求
**When** 相同查询在 10 分钟内再次被请求
**Then** 从 LRU 缓存返回结果
**And** 缓存命中时响应时间 < 50ms
**And** 文档写操作（创建/更新/删除）后自动清除文档树缓存

### AC8: 可访问性支持

**Given** 读者使用辅助技术浏览文档
**When** 使用键盘或屏幕阅读器
**Then** 侧边栏导航使用 `<nav aria-label="Documentation navigation">`
**And** 展开/折叠按钮具有 `aria-expanded` 属性
**And** 当前文档链接具有 `aria-current="page"` 属性
**And** 所有交互元素支持 Tab 键导航和 Enter/Space 激活
**And** 色彩对比度符合 WCAG 2.1 AA 标准（≥ 4.5:1）

## Tasks

### Task 1: 面包屑导航组件

**Subtask 1.1: 创建 DocBreadcrumb 组件**
- [ ] 在 `client/src/components/doc/` 下创建 `DocBreadcrumb.tsx`
- [ ] 实现面包屑路径：文档 > 分类名 > 文档标题
- [ ] 使用语义化 HTML（`<nav aria-label="Breadcrumb">`、`<ol>`、`<li>`）
- [ ] "文档" 链接指向 `/docs`，分类名链接指向该分类第一篇文档
- [ ] 当前文档标题使用 `aria-current="page"` 标记

**Subtask 1.2: 集成到 DocReader 页面**
- [ ] 在 DocContent 组件的 header 区域上方添加面包屑
- [ ] 从 docTree 数据中提取当前分类信息传入面包屑组件
- [ ] 导出组件并更新 `client/src/components/doc/index.ts`

### Task 2: 文档首页/索引页

**Subtask 2.1: 创建 DocIndex 页面**
- [ ] 在 `client/src/pages/` 下创建 `DocIndex.tsx`
- [ ] 调用 `trpc.doc.tree.useQuery()` 获取文档树数据
- [ ] 展示分类概览卡片（分类名、描述、文档数量）
- [ ] 点击卡片跳转到该分类第一篇文档 `/docs/:categorySlug/:firstArticleSlug`
- [ ] 实现加载状态骨架屏和空状态展示

**Subtask 2.2: 注册路由**
- [ ] 在 `client/src/App.tsx` 中添加 `/docs` 路由，指向 DocIndex 页面
- [ ] 确保 `/docs` 路由在 `/docs/:category/:slug` 之前注册（精确匹配优先）

### Task 3: 侧边栏增强

**Subtask 3.1: URL 驱动的展开状态**
- [ ] DocSidebar 根据当前 URL 中的 category 参数自动展开对应分类
- [ ] 切换文档时保持其他分类的展开/折叠状态不变

**Subtask 3.2: 移动端自动关闭**
- [ ] 在 DocSidebar 的 `onNavigate` 回调中触发侧边栏关闭
- [ ] DocLayout 将 `setSidebarOpen(false)` 通过 props 传递给 sidebar

**Subtask 3.3: 可访问性增强**
- [ ] 为当前文档链接添加 `aria-current="page"` 属性
- [ ] 确保 CollapsibleTrigger 正确设置 `aria-expanded`
- [ ] 验证 Tab 键导航顺序合理（分类 → 文档列表 → 下一个分类）

### Task 4: 键盘快捷键

**Subtask 4.1: 上下篇快捷键**
- [ ] 创建 `useDocKeyboardNav` hook（`client/src/hooks/`）
- [ ] 监听 `Alt+ArrowLeft`（上一篇）和 `Alt+ArrowRight`（下一篇）
- [ ] 使用 wouter 的 `useLocation` 进行导航
- [ ] 在 DocReader 页面中集成该 hook

### Task 5: 测试

**Subtask 5.1: 单元测试**
- [ ] 测试 DocBreadcrumb 组件渲染（路径正确、链接正确、aria 属性）
- [ ] 测试 DocIndex 页面渲染（分类卡片、空状态、加载状态）
- [ ] 测试 calculateNavigation 函数（边界情况：首篇、末篇、跨分类）
- [ ] 测试 useDocKeyboardNav hook（快捷键触发导航）

**Subtask 5.2: 集成测试**
- [ ] 测试完整的文档导航流程（首页 → 文档详情 → 上下篇切换）
- [ ] 测试侧边栏展开/折叠交互
- [ ] 测试面包屑导航链接正确性
- [ ] 测试移动端侧边栏自动关闭

**Subtask 5.3: 性能测试**
- [ ] 验证文档树缓存命中时响应时间 < 50ms
- [ ] 验证文档首页加载时间 < 2 秒（Lighthouse）

## Technical Notes

### 文档树 API 响应结构

```typescript
// server/db.ts - 已实现
interface DocTreeItem {
  id: number;
  title: string;
  slug: string;
  order: number;
  summary: string | null;
}

interface DocTree {
  category: Category;  // { id, name, slug, description, icon, sortOrder, type }
  articles: DocTreeItem[];
}

// tRPC: doc.tree.useQuery({ categorySlug?: string }) → DocTree[]
```

### 面包屑组件接口设计

```typescript
interface DocBreadcrumbProps {
  categoryName: string;
  categorySlug: string;
  articleTitle: string;
  firstArticleSlug?: string; // 分类第一篇文档的 slug，用于分类链接
}
```

### 文档首页路由注册

```typescript
// client/src/App.tsx - 需要在 /docs/:category/:slug 之前添加
const DocIndex = React.lazy(() => import("./pages/DocIndex"));

// Switch 内部
<Route path="/docs" component={DocIndex} />
<Route path="/docs/:category/:slug" component={DocReader} />
```

### 键盘快捷键 Hook

```typescript
// client/src/hooks/useDocKeyboardNav.ts
function useDocKeyboardNav(
  prev: DocNavItem | null,
  next: DocNavItem | null
): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowLeft" && prev) {
        navigate(`/docs/${prev.categorySlug}/${prev.slug}`);
      }
      if (e.altKey && e.key === "ArrowRight" && next) {
        navigate(`/docs/${next.categorySlug}/${next.slug}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);
}
```

### 缓存策略（已实现）

```typescript
// server/_core/cache.ts
generateDocTreeKey(categorySlug?: string) → "doc:tree:all" | "doc:tree:category:{slug}"
// TTL: 10 minutes, invalidated on article create/update/delete
```

## Dependencies

- **上游依赖:**
  - Epic 1 完成（数据库基础设施、跨域配置）✅
  - Epic 2 完成（文章 CRUD、分类管理）✅
  - Story 3.1 完成（文章列表/详情 API、Markdown 渲染）✅

- **下游依赖:**
  - Story 3.4（全文搜索）可能复用文档树侧边栏组件

## Definition of Done

- [ ] 所有 Task 和 Subtask 完成
- [ ] 文档树侧边栏正确展示，展开/折叠交互正常
- [ ] 面包屑导航显示正确路径，链接可用
- [ ] 文档首页 `/docs` 展示分类概览，可跳转到具体文档
- [ ] 上下篇导航正常工作（包括跨分类连续导航）
- [ ] 键盘快捷键 `Alt+←/→` 可触发上下篇跳转
- [ ] 移动端侧边栏导航后自动关闭
- [ ] 缓存机制正常（10 分钟 TTL，写操作后失效）
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试通过
- [ ] 可访问性检查通过（语义化 HTML、aria 属性、键盘导航、色彩对比度）
- [ ] 代码审查通过

## Estimation

- **Story Points:** 5
- **Estimated Hours:** 10-14 小时
