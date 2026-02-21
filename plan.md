# Person_Web 全面优化计划

> 生成时间: 2026-02-21
> 基于项目分析结果

## Phase 1: 性能优化

### 1.1 路由懒加载 (Code Splitting)
- **文件**: `client/src/App.tsx`
- **改动**: 使用 `React.lazy()` + `Suspense` 对所有页面组件进行懒加载
- **效果**: 首屏只加载当前路由代码，减少初始 bundle 体积

### 1.2 Gzip 压缩中间件
- **文件**: `server/_core/index.ts`
- **改动**: 添加 `compression` 中间件
- **效果**: 减少 50-70% 的传输体积

### 1.3 静态资源长缓存
- **文件**: `server/_core/vite.ts`
- **改动**: 为 hashed 静态资源设置 `Cache-Control: max-age=31536000, immutable`
- **效果**: 回访用户无需重新下载静态资源

### 1.4 Vite 手动分包
- **文件**: `vite.config.ts`
- **改动**: 配置 `rollupOptions.output.manualChunks`，分离 react/radix/framer-motion
- **效果**: 利用浏览器并行加载和长期缓存

## Phase 2: 安全加固

### 2.1 安全响应头 (Helmet)
- **文件**: `server/_core/index.ts`
- **改动**: 添加 `helmet` 中间件
- **效果**: 防御 XSS、点击劫持等攻击

### 2.2 API 限流
- **文件**: `server/_core/index.ts`
- **改动**: 添加 `express-rate-limit`
- **效果**: 防止暴力破解和滥用

### 2.3 修复 Mock OAuth 生产泄露
- **文件**: `server/_core/index.ts`
- **改动**: Mock OAuth 仅在 `NODE_ENV=development` 时启用
- **效果**: 消除生产环境安全隐患

## Phase 3: 代码质量

### 3.1 ESLint 配置
- **文件**: 新建 `eslint.config.js`
- **改动**: ESLint flat config + TypeScript + React 规则
- **效果**: 统一代码风格，捕获潜在错误
