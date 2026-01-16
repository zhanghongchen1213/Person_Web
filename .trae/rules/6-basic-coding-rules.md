# 基础编码规范 (Basic Coding Rules)

## 1. 命名规范 (Naming Conventions)

- **变量/函数**: `camelCase` (e.g., `userProfile`, `fetchData`).
- **组件**: `PascalCase` (e.g., `ArticleCard.tsx`).
- **文件**:
  - React 组件文件: `PascalCase.tsx`
  - 工具函数/Hook: `camelCase.ts`
  - 常量/配置: `camelCase.ts` 或 `UPPER_CASE.ts` (仅限全局常量)
- **数据库**:
  - 表名: `snake_case` (e.g., `user_posts`).
  - 字段名: `camelCase` (在 Drizzle Schema 中定义时), 数据库底层会自动映射。

## 2. React & Hooks 规范

- **Hook 规则**: 只能在组件顶层调用 Hook，严禁在条件语句或循环中使用。
- **Effect 清理**: `useEffect` 必须返回清理函数（如果有副作用）。
- **依赖数组**: `useEffect` 和 `useMemo` 的依赖数组必须完整，禁止随意以此来规避 ESLint 警告。
- **组件拆分**: 单个组件文件超过 200 行时，考虑拆分为子组件。

## 3. TypeScript 规范

- **Strict Mode**: 必须开启 `strict: true`。
- **No Any**: 严禁使用 `any`。如果类型确实难以定义，使用 `unknown` 并配合类型守卫。
- **Interface vs Type**:
  - 对象结构优先使用 `interface`。
  - 联合类型/工具类型使用 `type`。
- **Props 定义**: 组件 Props 必须定义接口，例如 `interface ButtonProps { ... }`。

## 4. CSS / Tailwind 规范

- **Utility First**: 优先使用 Tailwind 类名。
- **排序**: 建议遵循逻辑顺序 (Layout -> Box Model -> Typography -> Visual -> Misc)。
- **Shadcn/ui**: 修改 Shadcn 组件时，尽量通过 `className` 覆盖，避免直接修改 `components/ui` 下的源码（除非是全局样式调整）。

## 5. 注释与文档

- **自解释代码**: 代码逻辑清晰优先于注释。
- **JSDoc**: 复杂的工具函数必须添加 JSDoc 注释，说明参数、返回值和副作用。
- **TODO**: 使用 `// TODO:` 标记待办事项。

## 6. Git 提交规范

- 格式: `type(scope): subject`
- 示例:
  - `feat(auth): add login page`
  - `fix(db): resolve connection timeout`
  - `docs(readme): update deployment guide`
  - `refactor(ui): optimize article list rendering`
