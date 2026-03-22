---
title: 基于 OpenClaw + Claude Code 的智能资讯检索、整合与主动推送平台
slug: 2026-03-01-openclaw-ai
summary: 基于 Astro 构建的静态资讯聚合站点，通过 Claude Code 原生能力实现多领域资讯的自动检索与智能整合；结合 OpenClaw 定时调度实现每日自动更新，并通过飞书机器人将日报摘要主动推送给用户
category: AI自动化
categorySlug: blog
type: blog
status: published
publishedAt: 2026-03-01T00:00:00.000Z
---

# 🚀 基于 OpenClaw + Claude Code 的智能资讯检索、整合与主动推送平台

`AI 资讯检索` · `智能整合摘要` · `定时自动更新` · `飞书主动推送`

基于 Astro 构建的静态资讯聚合站点，通过 Claude Code 原生能力实现多领域资讯的自动检索与智能整合；结合 OpenClaw 定时调度实现每日自动更新，并通过飞书机器人将日报摘要主动推送给用户。

[🌐 在线预览](https://zhanghongchen1213.github.io/Ai_auto_push) · [📦 开源地址](https://github.com/zhanghongchen1213/Ai_auto_push)

### 📸 效果展示

#### 🌐 网页预览

| 网页预览 | 日报预览 |
|:---:|:---:|
| [![网页预览](https://i.imgs.ovh/2026/02/27/yidP8h.md.png)](https://imgloc.com/image/yidP8h) | [![日报预览](https://i.imgs.ovh/2026/02/27/yiB4cq.md.jpeg)](https://imgloc.com/image/yiB4cq) |

#### ⏰ 定时任务

| 定时任务创建 | 定时任务 |
|:---:|:---:|
| [![定时任务创建](https://i.imgs.ovh/2026/02/27/yidsPx.md.png)](https://imgloc.com/image/yidsPx) | [![定时任务](https://i.imgs.ovh/2026/02/27/yidQte.md.png)](https://imgloc.com/image/yidQte) |

---

## 📋 项目简介

**AI Auto Push** 是一个创新的全自动化资讯聚合平台，核心理念是 **"零人工干预，主动送达"**：

> 定时触发 → 专业站点爬取 → AI 智能筛选与摘要 → Markdown 生成 → Git 自动发布 → 飞书机器人主动推送日报

整个流程由 Claude Code 的 Skill 系统驱动，通过 **OpenClaw** 实现定时调度，每晚自动抓取更新内容并发布到 GitHub Pages，每早通过飞书机器人将精选日报摘要主动推送给用户。无需任何外部 API Key，无需额外的爬虫框架或 NLP 服务，真正实现了 **全链路自动化 + 主动信息推送**。

### 覆盖领域

| 领域 | 图标 | 数据来源 | 更新频率 |
|:---:|:---:|:---|:---:|
| **AI 技术** | 🤖 | ai-bot.cn · 机器之心 · 36氪AI频道 | 每日 |
| **跨境电商** | 🌐 | 雨果跨境 · Hugo · 36氪跨境频道 | 每日 |
| **产品创业** | 💡 | 36氪创投 · i黑马 · 投中网 | 每日 |
| **GitHub 热门** | ⭐ | GitHub Trending · HelloGitHub | 每日 |

---

## ✨ 功能特性

### 内容管道
- 🔄 **全自动化工作流** — 一条 `/ai-auto-push` 命令完成抓取→筛选→生成→发布全流程
- 🎯 **严格日期过滤** — 只收录当日资讯，杜绝历史内容混入
- 🧠 **AI 智能摘要** — Claude 原生能力筛选去重，生成 150-200 字专业摘要
- 🔗 **双链接溯源** — 同时保留聚合来源和原文链接，信息可追溯
- ⚡ **4 领域并行** — 子 Agent 并发处理，大幅缩短执行时间

### 定时调度与主动推送
- ⏰ **OpenClaw 定时调度** — 每晚 21:50 自动触发内容管道，无需手动执行
- 📨 **飞书机器人推送** — 每早 8:00 自动生成简要日报并推送到飞书
- 📊 **运行结果通知** — 管道执行完成后即时推送运行状态报告
- 🔁 **双任务协同** — 晚间采集发布 + 早间摘要推送，形成完整信息闭环

### 前端展示
- 📅 **日期导航** — 日历弹窗 + 前后日切换，快速浏览历史日报
- 🔍 **全文搜索** — Pagefind 静态搜索引擎，支持中文分词
- 🏷️ **领域 Tab 筛选** — 按领域分类浏览，一键切换
- 📱 **响应式设计** — Tailwind CSS 驱动，完美适配移动端

### 工程化
- 🛡️ **TypeScript 全覆盖** — 严格类型检查，内容 Schema 校验
- 🧪 **单元测试** — Vitest + jsdom，保障核心逻辑正确性
- 🚀 **自动部署** — Push 即触发 GitHub Actions → GitHub Pages
- 📦 **零外部依赖** — 不依赖任何第三方 API Key 或爬虫服务

---

## 🛠️ 技术栈

| 类别 | 技术 | 版本 | 说明 |
|:---:|:---|:---:|:---|
| 框架 | Astro | 5.17 | 静态站点生成器，内容驱动架构 |
| 语言 | TypeScript | 5.9 | 严格模式，全量类型覆盖 |
| 样式 | Tailwind CSS | 4.2 | 原子化 CSS，响应式设计 |
| 内容 | MDX | 4.3 | Markdown + JSX 混合渲染 |
| 搜索 | Pagefind | 1.4 | 静态全文搜索，支持中文 |
| 图片 | Sharp | 0.34 | 构建时图片压缩优化 |
| 测试 | Vitest | 4.0 | 单元测试 + jsdom DOM 模拟 |
| 包管理 | pnpm | 10.4 | 高效依赖管理 |
| CI/CD | GitHub Actions | — | 自动构建部署到 GitHub Pages |
| AI 引擎 | Claude Code | — | Skill 驱动的内容管道 |
| 定时调度 | OpenClaw | — | Cron 定时任务，自动触发 Skill |
| 消息推送 | 飞书机器人 | — | Webhook 推送日报摘要 |

---

## 🏗️ 架构设计

### 内容管道架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     OpenClaw 定时调度层                          │
│          定时任务 1 (21:50) ──→ 触发内容管道                     │
│          定时任务 2 (08:00) ──→ 触发日报推送                     │
├─────────────────────────────────────────────────────────────────┤
│                    Claude Code Skill 系统                        │
│                    /ai-auto-push 命令触发                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ AI技术    │  │ 跨境电商  │  │ 产品创业  │  │ GitHub   │       │
│  │ SubAgent │  │ SubAgent │  │ SubAgent │  │ SubAgent │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │             │
│       ▼              ▼              ▼              ▼             │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           阶段 1: WebFetch + WebSearch               │       │
│  │     专业站点爬取（优先） + 搜索引擎补充               │       │
│  └──────────────────────┬──────────────────────────────┘       │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           阶段 2: 严格日期过滤 + AI 筛选              │       │
│  │     只保留当日内容 → 去重 → 质量排序 → Top 3-5       │       │
│  └──────────────────────┬──────────────────────────────┘       │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           阶段 3: Markdown 生成                      │       │
│  │     frontmatter + 摘要 + 双链接格式                   │       │
│  └──────────────────────┬──────────────────────────────┘       │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           阶段 4: Git 自动发布                        │       │
│  │     git add → commit → push（全程无人工干预）         │       │
│  └──────────────────────┬──────────────────────────────┘       │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           GitHub Actions 自动部署                     │       │
│  │     Build → Pagefind 索引 → Deploy to Pages          │       │
│  └──────────────────────┬──────────────────────────────┘       │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           飞书机器人推送                               │       │
│  │     运行结果通知 (21:50) + 日报摘要推送 (08:00)       │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 前端架构

```
Astro SSG (静态生成)
├── 内容集合 (Content Collections)
│   └── daily/*.md → Zod Schema 校验 → 类型安全的数据层
├── 页面路由
│   ├── / (首页 → 重定向到最新日期)
│   ├── /daily/[date] (动态日期页)
│   └── /search (Pagefind 搜索页)
├── 组件层
│   ├── BaseLayout → Header + Footer + SEO Meta
│   ├── DateNavigation → 日历弹窗 + 日期切换
│   ├── DomainSection → Tab 筛选 + 领域卡片
│   └── NewsCard → 资讯摘要 + 来源链接
└── 构建产物
    └── dist/ → 纯静态 HTML/CSS/JS → GitHub Pages
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- pnpm >= 10.4
- Git
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) （用于运行内容管道）

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/zhanghongchen1213/Ai_auto_push.git
cd Ai_auto_push

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev
# 访问 http://localhost:4321/Ai_auto_push/

# 4. 构建生产版本
pnpm build

# 5. 预览构建结果
pnpm preview
```

### 运行内容管道

```bash
# 在 Claude Code CLI 中执行
/ai-auto-push
```

一条命令即可完成当日 4 个领域的资讯抓取、筛选、生成和发布。

---

## 🔄 内容管道

### 工作原理

内容管道由 `.claude/skills/ai-auto-push/SKILL.md` 定义，通过 Claude Code 的 Skill 系统驱动：

```
用户执行 /ai-auto-push
        │
        ▼
Step 0: 初始化（获取日期、创建目录、生成任务清单）
        │
        ▼
Step 1: 并行启动 4 个子 Agent，每个负责一个领域
        ├── WebFetch 爬取专业站点（优先）
        ├── WebSearch 搜索补充
        └── 严格日期过滤（只保留当日内容）
        │
        ▼
Step 2: AI 筛选摘要（去重、质量排序、生成 150-200 字摘要）
        │
        ▼
Step 3: 生成 Markdown 文件（frontmatter + 摘要 + 双链接）
        │
        ▼
Step 4: Git 自动发布（add → commit → push，全程无确认）
        │
        ▼
Step 5: 汇总报告（领域状态、条目数、数据来源）
```

### 生成文件格式

每日每个领域生成一个 Markdown 文件，路径为 `src/content/daily/{date}/{slug}.md`：

```markdown
---
title: "AI技术日报"
domain: "ai-tech"
date: "2026-02-27"
itemCount: 5
generatedAt: "2026-02-27T15:40:00+08:00"
---

## 资讯标题

150-200 字中文摘要，专业客观，信息密度高...

**来源：** [聚合站点](https://example.com) | **原文：** [阅读原文](https://original.com)
```

---

## 📡 OpenClaw 定时调度与飞书推送

### 概述

通过 [OpenClaw](https://openclaw.com) 平台，将 `ai-auto-push` 技能部署为定时任务，配合飞书机器人 Webhook 实现 **全链路无人值守** 的资讯采集与主动推送。

```
┌──────────────────────────────────────────────────────┐
│                   OpenClaw 工作区                      │
│                                                      │
│  ┌────────────────────┐  ┌────────────────────┐     │
│  │  定时任务 1 (21:50) │  │  定时任务 2 (08:00) │     │
│  │  内容采集 & 发布    │  │  日报生成 & 推送    │     │
│  └─────────┬──────────┘  └─────────┬──────────┘     │
│            │                       │                  │
│            ▼                       ▼                  │
│  ┌──────────────────┐  ┌───────────────────────┐    │
│  │ /ai-auto-push    │  │ 读取昨日 4 个领域文件  │    │
│  │ 抓取→筛选→发布    │  │ 生成简要日报摘要      │    │
│  └─────────┬────────┘  └──────────┬────────────┘    │
│            │                       │                  │
│            ▼                       ▼                  │
│  ┌─────────────────────────────────────────────┐    │
│  │            飞书机器人 Webhook                 │    │
│  │  21:50 → 推送运行结果报告                     │    │
│  │  08:00 → 推送精选日报 + 网页链接              │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

### 定时任务配置

#### 定时任务 1：内容采集与发布（每晚 21:50）

| 配置项 | 值 |
|:---|:---|
| 触发时间 | 每天 21:50 |
| 执行技能 | `ai-auto-push` |
| 工作内容 | 抓取 4 个领域当日资讯 → AI 筛选摘要 → 生成 Markdown → Git 提交推送 |
| 推送内容 | 技能运行结果（成功/失败状态、各领域条目数） |
| 推送方式 | 飞书机器人 Webhook |

---

#### 定时任务 2：日报摘要推送（每早 08:00）

| 配置项 | 值 |
|:---|:---|
| 触发时间 | 每天 08:00 |
| 数据来源 | `src/content/daily/{昨日日期}/` 下的 4 个 Markdown 文件 |
| 工作内容 | 读取昨日生成的 ai-tech / cross-border-ecom / product-startup / github-trending 文件，生成简要日报 |
| 推送内容 | 精选日报摘要 + 网页链接 `https://zhanghongchen1213.github.io/Ai_auto_push/` |
| 推送方式 | 飞书机器人 Webhook |

---

### 部署步骤

1. 将 `ai-auto-push` 技能迁移到 OpenClaw 工作区
2. 在 OpenClaw 控制台创建两个定时任务
3. 配置飞书机器人 Webhook 地址
4. 测试运行，确认两个任务均正常触发和推送

### 飞书推送效果示例

**21:50 运行结果通知：**
> ✅ AI Auto Push 日报生成完成（2026-02-27）
> - AI技术：5 条 | 跨境电商：4 条 | 产品创业：4 条 | GitHub热门：5 条
> - 已自动推送至 GitHub Pages

**08:00 日报摘要推送：**
> 📰 今日资讯速览（2026-02-27）
> 🤖 AI技术：GPT-5 发布、Claude 4.6 更新...
> 🌐 跨境电商：欧盟新关税政策、Temu 市场份额...
> 💡 产品创业：中科第五纪融资、浩纳光电 B 轮...
> ⭐ GitHub：Rust 新框架、AI Agent 工具链...
> 🔗 查看完整日报：https://zhanghongchen1213.github.io/Ai_auto_push/

---

## 📁 项目结构

```
Ai_auto_push/
├── .claude/
│   └── skills/
│       └── ai-auto-push/        # 内容管道 Skill 定义
│           └── SKILL.md
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 部署配置
├── src/
│   ├── components/
│   │   ├── ui/                   # 通用 UI 组件
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   ├── DateNavigation.astro
│   │   │   └── CalendarPopup.astro
│   │   ├── news/                 # 资讯展示组件
│   │   │   ├── NewsCard.astro
│   │   │   ├── NewsList.astro
│   │   │   └── DomainSection.astro
│   │   └── search/               # 搜索组件
│   ├── config/
│   │   ├── site.ts               # 站点元数据配置
│   │   └── domains.ts            # 领域配置（颜色、图标等）
│   ├── content/
│   │   └── daily/                # 每日资讯 Markdown 文件
│   │       ├── 2026-02-25/
│   │       ├── 2026-02-26/
│   │       └── 2026-02-27/
│   │           ├── ai-tech.md
│   │           ├── cross-border-ecom.md
│   │           ├── product-startup.md
│   │           └── github-trending.md
│   ├── layouts/
│   │   └── BaseLayout.astro      # 全局布局
│   ├── lib/
│   │   ├── date-utils.ts         # 日期工具函数
│   │   └── content-utils.ts      # 内容处理工具
│   ├── pages/
│   │   ├── index.astro           # 首页
│   │   ├── daily/[date].astro    # 日报动态路由
│   │   └── search.astro          # 搜索页
│   ├── styles/                   # 全局样式
│   ├── types/
│   │   └── index.ts              # TypeScript 类型定义
│   └── content.config.ts         # 内容集合 Schema
├── tests/                        # 测试文件
├── public/                       # 静态资源
├── astro.config.mjs              # Astro 配置
├── tailwind.config.ts            # Tailwind 配置
├── tsconfig.json                 # TypeScript 配置
└── package.json
```

---

## 🏷️ 领域配置

领域定义在 `src/config/domains.ts` 中，每个领域包含完整的视觉和数据源配置：

```typescript
{
  slug: "ai-tech",
  name: "AI技术",
  icon: "🤖",
  color: "#3B82F6",
  bgColor: "#EFF6FF",
  pillBg: "#DBEAFE",
  pillText: "#1E40AF"
}
```

| 属性 | 说明 |
|:---|:---|
| `slug` | URL 标识符，对应 Markdown 文件名和 frontmatter 中的 domain 字段 |
| `name` | 中文显示名称 |
| `icon` | Emoji 图标 |
| `color` | 主题色（用于标题、边框等） |
| `bgColor` | 卡片背景色 |
| `pillBg` / `pillText` | 标签胶囊的背景色和文字色 |

### 添加新领域

1. 在 `src/config/domains.ts` 中添加领域配置
2. 在 `src/content.config.ts` 的 domain 枚举中添加新 slug
3. 在 `.claude/skills/ai-auto-push/SKILL.md` 中添加对应的抓取规则
4. 运行 `/ai-auto-push` 即可自动生成新领域的日报

---

## 🌐 部署说明

### GitHub Pages 自动部署

项目已配置 GitHub Actions，每次 push 到 `main` 分支自动触发部署：

```yaml
# .github/workflows/deploy.yml 核心流程
触发条件: push to main / 手动触发
    ↓
Checkout → Setup pnpm → Setup Node.js 20
    ↓
pnpm install --frozen-lockfile
    ↓
pnpm build  (Astro 构建 + Pagefind 中文索引)
    ↓
Upload Artifact → Deploy to GitHub Pages
```

### 首次部署配置

1. 进入仓库 **Settings → Pages**
2. Source 选择 **GitHub Actions**
3. Push 代码到 `main` 分支，等待 Actions 完成
4. 访问 `https://<username>.github.io/Ai_auto_push/`

### 自定义域名（可选）

```bash
# 在 public/ 目录下创建 CNAME 文件
echo "your-domain.com" > public/CNAME
```

同时修改 `astro.config.mjs` 中的 `site` 和 `base` 配置。

---

## 💻 开发指南

### 常用命令

| 命令 | 说明 |
|:---|:---|
| `pnpm dev` | 启动开发服务器（热更新） |
| `pnpm build` | 构建生产版本 + Pagefind 索引 |
| `pnpm preview` | 预览构建产物 |
| `pnpm test` | 运行单元测试 |
| `/ai-auto-push` | 执行内容管道（Claude Code 中） |

### 路径别名

项目配置了 TypeScript 路径别名，开发时可直接使用：

```typescript
import { formatDate } from '@lib/date-utils';
import { getDomainConfig } from '@config/domains';
import type { NewsEntry } from '@types/index';
```

| 别名 | 实际路径 |
|:---|:---|
| `@components/*` | `src/components/*` |
| `@layouts/*` | `src/layouts/*` |
| `@config/*` | `src/config/*` |
| `@lib/*` | `src/lib/*` |
| `@styles/*` | `src/styles/*` |
| `@types/*` | `src/types/*` |

### 内容 Schema 校验

内容集合使用 Zod 进行严格校验，定义在 `src/content.config.ts`：

```typescript
// domain 字段只接受以下枚举值
domain: z.enum([
  "ai-tech",
  "cross-border-ecom",
  "product-startup",
  "github-trending"
])
```

不符合 Schema 的 Markdown 文件会在构建时报错，确保数据一致性。

---

## ❓ 常见问题

### Q: 内容管道需要配置 API Key 吗？

**不需要。** 内容管道完全依赖 Claude Code 的原生工具（WebFetch、WebSearch、Write），无需任何外部 API Key。只要安装了 Claude Code CLI 即可运行。

### Q: 如何修改抓取的资讯站点？

编辑 `.claude/skills/ai-auto-push/SKILL.md` 中对应领域的 **专业站点爬取** 和 **WebSearch 补充搜索** 部分，添加或替换站点 URL 和搜索关键词。

### Q: 某个领域当天没有资讯怎么办？

管道会自动处理：生成 `itemCount: 0` 的空文件，汇总报告中标记该领域状态。不会影响其他领域的正常运行。

### Q: 搜索功能不工作？

确保构建命令包含 Pagefind 索引步骤：

```bash
pnpm build  # 已包含 pagefind --site dist --force-language zh-cn
```

同时检查 CSP 策略是否允许 `wasm-unsafe-eval`（Pagefind 依赖 WASM）。

### Q: 如何添加新的资讯领域？

参考 [领域配置](#-领域配置) 章节，需要修改三个文件：
1. `src/config/domains.ts` — 前端展示配置
2. `src/content.config.ts` — Schema 枚举值
3. `.claude/skills/ai-auto-push/SKILL.md` — 抓取规则

### Q: Git push 失败怎么办？

管道内置重试机制，push 失败时自动重试最多 2 次。如果仍然失败，检查：
- 网络连接是否正常
- Git 远程仓库权限是否配置
- 是否有未解决的合并冲突

---

<div align="center">

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

---

**如果这个项目对你有帮助，欢迎 Star ⭐ 支持一下！**

[![Star History Chart](https://api.star-history.com/svg?repos=zhanghongchen1213/Ai_auto_push&type=Date)](https://star-history.com/#zhanghongchen1213/Ai_auto_push&Date)

</div>
