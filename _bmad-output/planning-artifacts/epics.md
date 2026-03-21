---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - 'docs/CodeArts.md'
---

# Person_Web - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Person_Web, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: 管理员可创建文章（标题、slug、摘要、正文、封面图、分类、类型、状态）
FR2: 管理员可编辑已有文章的所有字段
FR3: 管理员可删除文章
FR4: 管理员可将文章状态在草稿、已发布、已归档之间切换
FR5: 管理员可修改文章的发布日期
FR6: 管理员可创建、编辑、删除分类（名称、slug、描述、图标、排序、类型）
FR7: 管理员可初始化一组预定义的默认分类（包含技术、生活、随笔等 5 个分类）
FR8: 系统可在创建文章时，若指定分类不存在则自动创建该分类
FR9: 读者可浏览分页的文章列表（支持按分类、类型、状态筛选）
FR10: 读者可通过 slug 访问文章详情页
FR11: 读者可查看文章归档视图（按时间分组）
FR12: 读者可查看各分类下的文章数量统计
FR13: 读者可获取当前文章的相关推荐文章
FR14: 读者可浏览文档类型内容的树形导航结构
FR15: 读者可通过全文搜索查找文章
FR16: 用户可通过 GitHub OAuth 登录系统
FR17: 系统可在跨域架构下完成 OAuth 回调并设置根域认证凭证
FR18: 系统可通过认证凭证识别已登录用户身份
FR19: 系统可区分普通用户和管理员角色
FR20: 系统可识别并赋予博客所有者管理员权限
FR21: 用户可退出登录（清除认证凭证）
FR22: 系统可记录页面浏览数据（文章 ID、IP、User-Agent、路径、时间）
FR23: 管理员可查看分析概览（总文章数、总浏览量、分类数等）
FR24: 管理员可查看指定时间范围的每日页面浏览统计（1-365 天）
FR25: 管理员可查看文章级别的浏览统计
FR26: 管理员可导出全部数据为 JSON 格式
FR27: 管理员可从 JSON 文件导入数据（恢复备份）
FR28: 管理员可查看数据库统计信息（表大小、行数、页面浏览量、备份配置数）
FR29: 管理员可配置自动备份计划（启用/禁用、间隔：周/月/季度）
FR30: 系统可按配置的间隔自动执行数据库备份
FR31: 系统可生成包含所有公开 URL 的 XML sitemap
FR32: 系统可提供 robots.txt 文件
FR33: 系统可为页面注入 Open Graph meta 标签（针对爬虫 UA）
FR34: 系统可生成 RSS/Atom 订阅源
FR35: 前端构建产物可独立部署至对象存储服务
FR36: 后端 API 可通过进程管理器独立运行在云服务器上
FR37: 系统可支持前端从不同域名访问 API（跨域支持）
FR38: API 域名可通过反向代理路由到后端服务
FR39: 系统可暴露健康检查端点供监控使用
FR40: 代码推送到代码仓库指定分支后，系统可自动触发 CI/CD 流水线
FR41: 流水线可自动安装项目依赖并运行测试套件，测试失败时中止流水线并通知开发者
FR42: 流水线可自动构建前端产物并上传至指定对象存储桶
FR43: 流水线可在前端上传完成后自动刷新 CDN 缓存
FR44: 流水线可自动连接云服务器，部署后端代码并重启后端进程
FR45: 流水线可自动执行数据库迁移脚本，将托管数据库表结构升级到最新版本
FR46: 流水线执行完成后，系统可向开发者发送部署结果通知（成功/失败）
FR47: 流水线可在后端部署完成后自动执行健康检查，验证服务可用性
FR48: 仓库中需包含前端构建脚本、后端部署脚本、数据库迁移脚本，流水线通过执行这些脚本完成落地动作
FR49: 流水线支持按阶段串行编排：代码检查 → 前端构建 → 后端构建+测试 → 上传 OBS → 刷新 CDN → 部署后端 → 数据库迁移 → 健康检查

### NonFunctional Requirements

NFR1: 前端首屏加载时间 < 2 秒（通过 CDN 加速，Lighthouse 测量）
NFR2: API P95 响应时间 < 200ms（性能日志测量）
NFR3: 全文搜索响应时间 < 300ms
NFR4: 后端进程内存占用 < 400MB（进程管理器监控，设置自动重启阈值 400M）
NFR5: 缓存容量 100 条目，文章列表 TTL 5 分钟，分类 TTL 10 分钟
NFR6: 认证 Token 存储于 HttpOnly + Secure + SameSite Cookie
NFR7: 所有 API 端点通过 HTTPS 访问（SSL 证书由服务器面板管理）
NFR8: API 速率限制 200 请求/15 分钟
NFR9: HTTP 响应包含安全头（CSP、X-Frame-Options、HSTS 等）
NFR10: 数据库连接使用 SSL 加密（远程托管数据库连接）
NFR11: 敏感配置（认证密钥、OAuth Secret、数据库连接串）通过环境变量管理，不硬编码
NFR12: 系统支持 100 并发用户访问（2C2G 服务器 + CDN 分流静态请求）
NFR13: 数据库连接池最大 10 连接（托管数据库免费额度限制）
NFR14: 前端静态资源通过 CDN 多节点分发，理论无并发上限
NFR15: 后端架构支持未来水平扩展（集群模式或多服务器负载均衡）
NFR16: API 服务可用性 > 99%（服务器面板 + 进程管理器自动重启保障）
NFR17: 进程管理器配置内存阈值自动重启，防止内存泄漏导致服务中断
NFR18: 数据库自动备份（可配置周/月/季度间隔）
NFR19: 数据迁移过程零数据丢失（迁移前后行数校验）
NFR20: 前端通过类型安全的 RPC 协议与后端通信
NFR21: GitHub OAuth 通过标准 OAuth 2.0 协议集成
NFR22: 托管数据库通过 PostgreSQL 标准协议连接
NFR23: 前端静态资源通过 S3 兼容 API 上传至对象存储
NFR24: 图片存储通过现有云端图库 API 集成
NFR25: 网站符合 WCAG 2.1 AA 标准，确保色彩对比度比率 ≥ 4.5:1（正文文本）
NFR26: 所有交互元素支持键盘导航（Tab 顺序、Enter/Space 激活、Escape 关闭）
NFR27: 页面结构支持屏幕阅读器（语义化 HTML 标签、ARIA 标签、alt 属性）
NFR28: 表单元素具有关联的 label 标签，错误提示可被辅助技术识别
NFR29: CI/CD 流水线从代码推送到部署完成 < 10 分钟（流水线执行日志测量）
NFR30: 流水线部署成功率 > 95%（排除代码缺陷导致的测试失败）
NFR31: 流水线中任意阶段失败时，后续阶段不执行，系统保持上一次成功部署的状态
NFR32: 数据库迁移脚本支持幂等执行，重复运行不产生副作用
NFR33: CI/CD 流水线通过代码仓库 Webhook 触发，支持基于分支的触发规则
NFR34: 流水线通过 SSH 协议安全连接云服务器执行部署命令
NFR35: CI/CD 流水线中的机密信息（SSH 私钥、数据库连接串、OBS 鉴权、CDN 刷新密钥）统一通过流水线平台的参数/凭据管理，不写入代码仓库
NFR36: 流水线建议先跑通最小链路（前端 OBS + 后端部署），确认稳定后再启用自动数据库迁移阶段

### Additional Requirements

**来自架构文档（Architecture.md）：**

- Brownfield 重构项目，基于现有代码库，不使用 Starter 模板
- ADR-01: 数据库驱动从 mysql2 替换为 pg（node-postgres），连接池 pg.Pool，最大 10 连接，SSL 必须开启
- ADR-02: Drizzle ORM schema 方言迁移（mysqlTable→pgTable, int auto_increment→serial, mysqlEnum→pgEnum, onUpdateNow 移除改为应用层处理, onDuplicateKeyUpdate→onConflictDoUpdate, insertId→.returning()）
- ADR-03: 保留现有 LRU 缓存（100 条目，无外部缓存依赖）
- ADR-04: 全文搜索从 MySQL ngram FULLTEXT 迁移至 PostgreSQL tsvector + GIN 索引，simple 分词配置，ILIKE 降级兜底
- ADR-05: 数据迁移通过 JSON 导出/导入，日期处理改为 ISO 字符串，使用 Drizzle 事务
- ADR-06: 跨域 OAuth 认证 — Cookie domain 设为 `.zhcmqtt.top`，SameSite=None，Secure=true，回调 URL 指向 api.zhcmqtt.top
- ADR-07: CORS 中间件配置（origin: zhcmqtt.top, credentials: true）
- ADR-08: 前端 tRPC client URL 从相对路径改为绝对路径（VITE_API_BASE_URL 环境变量）
- ADR-10: 移除 Express 静态文件托管，开发模式保留 Vite 集成
- ADR-11: 前端构建产物部署至 OBS+CDN，SPA 路由 404→index.html
- ADR-13: 服务器架构 — Nginx 反代 + PM2 管理 Node.js 进程
- ADR-14: PM2 配置 — fork 模式，单实例，max_memory_restart 400M
- ADR-15: Nginx 反向代理配置（api.zhcmqtt.top → localhost:3000）
- ADR-16: 环境变量分离（前端 VITE_ 前缀，后端服务端变量）
- ADR-17: 健康检查端点（GET /health, 可选 GET /health/db）
- 实施顺序：Schema 迁移 → 驱动替换 → Config 更新 → 查询适配 → 搜索迁移 → 认证适配 → CORS → 前端基地址 → 构建脚本 → PM2+Nginx → 数据迁移 → 功能验收

**来自 CodeArts 参考文档（docs/CodeArts.md）：**

- CI/CD 采用「平台编排 + 代码脚本」联合模式
- CodeArts Pipeline 可视化编排，支持串联构建、部署、测试
- CodeArts Build 支持「上传文件到 OBS」步骤
- CodeArts Deploy 支持主机环境执行 Shell 脚本
- 仓库需包含 scripts/deploy_backend.sh 和 scripts/migrate_db.sh
- 流水线 8 阶段编排：代码检查 → 前端构建 → 后端构建+测试 → 上传 OBS → 刷新 CDN → 部署后端 → DB 迁移 → 健康检查
- 凭据统一通过 CodeArts 参数/凭据管理
- 上线策略：先跑通最小链路，确认稳定后再启用自动迁移

### FR Coverage Map

FR1: Epic 2 - 文章创建（内容管理）
FR2: Epic 2 - 文章编辑（内容管理）
FR3: Epic 2 - 文章删除（内容管理）
FR4: Epic 2 - 文章状态管理（内容管理）
FR5: Epic 2 - 文章发布日期修改（内容管理）
FR6: Epic 2 - 分类 CRUD（内容管理）
FR7: Epic 2 - 默认分类初始化（内容管理）
FR8: Epic 2 - 自动创建分类（内容管理）
FR9: Epic 3 - 文章列表浏览（内容消费）
FR10: Epic 3 - 文章详情页（内容消费）
FR11: Epic 3 - 归档视图（内容消费）
FR12: Epic 3 - 分类统计（内容消费）
FR13: Epic 3 - 相关推荐（内容消费）
FR14: Epic 3 - 文档树导航（内容消费）
FR15: Epic 3 - 全文搜索（内容消费）
FR16: Epic 1 - GitHub OAuth 登录（核心后端能力）
FR17: Epic 1 - 跨域 OAuth 回调（核心后端能力）
FR18: Epic 1 - 用户身份识别（核心后端能力）
FR19: Epic 1 - 角色区分（核心后端能力）
FR20: Epic 1 - 管理员权限识别（核心后端能力）
FR21: Epic 1 - 退出登录（核心后端能力）
FR22: Epic 4 - 页面浏览记录（分析监控）
FR23: Epic 4 - 分析概览（分析监控）
FR24: Epic 4 - 每日浏览统计（分析监控）
FR25: Epic 4 - 文章级浏览统计（分析监控）
FR26: Epic 5 - 数据导出（数据管理）
FR27: Epic 5 - 数据导入（数据管理）
FR28: Epic 5 - 数据库统计（数据管理）
FR29: Epic 5 - 备份计划配置（数据管理）
FR30: Epic 5 - 自动备份执行（数据管理）
FR31: Epic 6 - XML sitemap 生成（SEO 与发现）
FR32: Epic 6 - robots.txt 提供（SEO 与发现）
FR33: Epic 6 - Open Graph meta 注入（SEO 与发现）
FR34: Epic 6 - RSS/Atom 订阅源（SEO 与发现）
FR35: Epic 1 - 前端静态部署（核心后端能力）
FR36: Epic 1 - 后端独立运行（核心后端能力）
FR37: Epic 1 - 跨域 API 访问（核心后端能力）
FR38: Epic 1 - 反向代理路由（核心后端能力）
FR39: Epic 1 - 健康检查端点（核心后端能力）
FR40: Epic 8 - 流水线自动触发（CI/CD 自动化）
FR41: Epic 8 - 依赖安装与测试（CI/CD 自动化）
FR42: Epic 8 - 前端构建上传 OBS（CI/CD 自动化）
FR43: Epic 8 - CDN 缓存刷新（CI/CD 自动化）
FR44: Epic 8 - 后端 SSH 部署（CI/CD 自动化）
FR45: Epic 8 - 数据库自动迁移（CI/CD 自动化）
FR46: Epic 8 - 部署结果通知（CI/CD 自动化）
FR47: Epic 8 - 健康检查验证（CI/CD 自动化）
FR48: Epic 8 - 部署脚本编写（CI/CD 自动化）
FR49: Epic 8 - 8 阶段串行编排（CI/CD 自动化）

## Epic List

### Epic 1: 用户可在新架构下访问博客所有核心后端能力
用户可在新的 PostgreSQL 数据库和前后端分离架构下访问博客系统的所有核心后端能力（认证、API 通信、跨域支持），为后续所有功能 Epic 奠定数据和通信基础。
**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR21, FR35, FR36, FR37, FR38, FR39
**NFRs addressed:** NFR2, NFR4-NFR13, NFR16-NFR17, NFR19-NFR22

### Epic 2: 内容管理系统
管理员可完整管理博客内容（文章和分类的创建、编辑、删除），在新数据库架构下实现与重构前完全一致的内容管理能力。
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8
**NFRs addressed:** NFR2, NFR5

### Epic 3: 内容消费与阅读体验
读者可浏览文章列表、阅读文章详情、按分类筛选、归档浏览、相关推荐、文档导航和全文搜索，享受完整的博客阅读体验。
**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15
**NFRs addressed:** NFR1, NFR3, NFR5, NFR14, NFR25-NFR28

### Epic 4: 数据分析与浏览统计
管理员可查看博客的访问数据分析，包括浏览趋势、文章热度排名等，系统自动记录页面浏览数据。
**FRs covered:** FR22, FR23, FR24, FR25
**NFRs addressed:** NFR2

### Epic 5: 数据备份与恢复
管理员可导出/导入全部博客数据，查看数据库统计信息，配置和执行自动备份计划，确保数据安全。
**FRs covered:** FR26, FR27, FR28, FR29, FR30
**NFRs addressed:** NFR18, NFR19

### Epic 6: SEO 优化与内容发现
搜索引擎和 RSS 阅读器可正确索引和订阅博客内容，提升博客在搜索引擎中的可见性。
**FRs covered:** FR31, FR32, FR33, FR34
**NFRs addressed:** NFR1

### Epic 7: 数据迁移与上线切换
管理员可将旧系统全部数据完整迁移到新架构，完成架构切换，实现零数据丢失上线。
**定位：** 验收 Epic — 不引入新功能需求，而是验证 Epic 1-6 实现的 FR1-FR39 在新架构下端到端完整可用。
**FRs covered:** 验收 FR1-FR39 的端到端完整性（依赖 FR26 数据导出能力）
**NFRs addressed:** NFR19（零数据丢失迁移）, NFR1（首屏 < 2s）, NFR2（API P95 < 200ms）

### Epic 8: CI/CD 自动化部署流水线
开发者推送代码后，系统自动完成从构建到部署的全链路自动化，无需手动执行任何部署步骤。
**FRs covered:** FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR47, FR48, FR49
**NFRs addressed:** NFR29-NFR36

---

## Epic 1: 数据库迁移与后端基础设施重构

用户可在新的 PostgreSQL 数据库和前后端分离架构下访问博客系统的所有核心后端能力（认证、API 通信、跨域支持），为后续所有功能 Epic 奠定数据和通信基础。

### Story 1.1: Drizzle ORM Schema 从 MySQL 迁移至 PostgreSQL

As a 开发者,
I want 将 Drizzle ORM schema 从 MySQL 方言迁移至 PostgreSQL 方言,
So that 系统可使用托管 PostgreSQL 数据库（MemfireDB）存储所有数据。

**Acceptance Criteria:**

**Given** 现有 drizzle/schema.ts 使用 MySQL 方言（mysqlTable, mysqlEnum 等）
**When** 开发者完成 schema 迁移
**Then** 所有表定义使用 pgTable 替代 mysqlTable
**And** 所有自增主键使用 serial() 替代 int().autoincrement()
**And** 所有枚举使用 pgEnum 替代 mysqlEnum，并在 schema 顶部独立定义
**And** 所有 onUpdateNow() 被移除（后续在应用层处理 updatedAt）
**And** int("enabled").default(0) 布尔模拟改为 boolean("enabled").default(false)
**And** drizzle.config.ts 中 dialect 从 "mysql" 改为 "postgresql"

### Story 1.2: 数据库驱动替换与连接配置

As a 开发者,
I want 将数据库驱动从 mysql2 替换为 pg（node-postgres）并配置连接池,
So that 后端可通过 SSL 安全连接到远程 MemfireDB 数据库。

**Acceptance Criteria:**

**Given** 现有 server/db.ts 使用 mysql2 驱动和 drizzle-orm/mysql2
**When** 开发者完成驱动替换
**Then** 使用 pg.Pool 连接池替代 mysql2 连接
**And** 连接池最大连接数设为 10（MemfireDB 免费额度限制）
**And** SSL 配置为 `ssl: { rejectUnauthorized: false }`（远程数据库必须）
**And** DATABASE_URL 环境变量指向 MemfireDB 连接串
**And** drizzle() 初始化使用 drizzle-orm/node-postgres 适配器
**And** package.json 中 mysql2 依赖替换为 pg 和 @types/pg

### Story 1.3: 数据库查询语法适配（MySQL → PostgreSQL）

As a 开发者,
I want 将 server/db.ts 中所有 MySQL 特有的查询语法适配为 PostgreSQL 语法,
So that 所有数据库操作在 PostgreSQL 上正确运行。

**Acceptance Criteria:**

**Given** 现有代码中包含 MySQL 特有语法（DATE_FORMAT, onDuplicateKeyUpdate, insertId 等）
**When** 开发者完成查询语法适配
**Then** DATE_FORMAT() 替换为 to_char()
**And** onDuplicateKeyUpdate 替换为 onConflictDoUpdate
**And** 通过 .returning({ id: table.id }) 获取插入 ID（替代 insertId）
**And** 所有写操作中手动设置 updatedAt: new Date()（替代 onUpdateNow）
**And** 所有适配后的查询可正确执行并返回预期结果

### Story 1.4: CORS 跨域中间件与前端 API 基地址配置

As a 用户,
I want 前端可从不同域名（zhcmqtt.top）安全访问后端 API（api.zhcmqtt.top）,
So that 前后端分离架构下的跨域通信正常工作。

**Acceptance Criteria:**

**Given** 前端部署在 zhcmqtt.top，后端部署在 api.zhcmqtt.top
**When** 前端发起 API 请求
**Then** Express CORS 中间件允许 origin: ['https://zhcmqtt.top']，credentials: true
**And** 前端 tRPC client httpBatchLink URL 使用 VITE_API_BASE_URL 环境变量
**And** 生产环境 VITE_API_BASE_URL 设为 https://api.zhcmqtt.top/api/trpc
**And** 开发环境 VITE_API_BASE_URL 保持 http://localhost:3000/api/trpc
**And** 浏览器预检请求（OPTIONS）正确响应 CORS 头
**And** 移除 Express 静态文件托管（生产模式），开发模式保留 Vite 集成

### Story 1.5: 跨域 OAuth 认证与 Cookie 共享

As a 用户,
I want 通过 GitHub OAuth 登录博客，在跨域架构下认证流程正常工作,
So that 我可以在前后端分离的架构下无感知地完成登录。

**Acceptance Criteria:**

**Given** 用户在 zhcmqtt.top 点击登录按钮
**When** 触发 GitHub OAuth 登录流程
**Then** GITHUB_CALLBACK_URL 设为 https://api.zhcmqtt.top/api/auth/github/callback
**And** OAuth 回调完成后，JWT Cookie 设置 domain: '.zhcmqtt.top'（根域共享）
**And** Cookie SameSite 设为 'none'，Secure 设为 true
**And** Cookie httpOnly 保持 true
**And** 登录成功后重定向到 https://zhcmqtt.top/（而非相对路径 /）
**And** 用户退出登录时正确清除根域 Cookie
**And** 系统可通过 Cookie 识别用户身份和管理员角色（FR18-FR20）

### Story 1.6: 后端独立部署与健康检查

As a 管理员,
I want 后端 API 通过进程管理器独立运行在云服务器上并提供健康检查端点,
So that 后端服务稳定运行且可被监控。

**Acceptance Criteria:**

**Given** 后端构建产物为 dist/index.js
**When** 通过进程管理器启动后端服务
**Then** ecosystem.config.cjs 配置 fork 模式、max_memory_restart 400M
**And** GET /health 返回 { status: 'ok', uptime, timestamp }
**And** 可选 GET /health/db 验证数据库连接状态
**And** Nginx 反向代理将 api.zhcmqtt.top 路由到 localhost:3000
**And** SSL 证书由宝塔面板管理
**And** 环境变量通过 .env 文件管理（DATABASE_URL, JWT_SECRET, GITHUB_CLIENT_ID 等）
**And** 安全中间件（Helmet.js、速率限制 200/15min）正常工作

---

## Epic 2: 内容管理系统

管理员可完整管理博客内容（文章和分类的创建、编辑、删除），在新数据库架构下实现与重构前完全一致的内容管理能力。

### Story 2.1: 文章 CRUD 操作适配

As a 管理员,
I want 在新的 PostgreSQL 数据库下创建、编辑、删除文章,
So that 我可以完整管理博客内容。

**Acceptance Criteria:**

**Given** 管理员已通过 OAuth 登录并具有管理员权限
**When** 管理员执行文章操作
**Then** 可创建文章（标题、slug、摘要、正文、封面图、分类、类型、状态）（FR1）
**And** 可编辑已有文章的所有字段（FR2）
**And** 可删除文章（FR3）
**And** 插入操作使用 .returning({ id: articles.id }) 获取新文章 ID
**And** 更新操作手动设置 updatedAt: new Date()
**And** upsert 操作使用 onConflictDoUpdate
**And** 文章写操作后调用 invalidateArticleCache() 清除缓存

### Story 2.2: 文章状态管理与发布日期修改

As a 管理员,
I want 管理文章的发布状态和发布日期,
So that 我可以控制文章的发布时机和生命周期。

**Acceptance Criteria:**

**Given** 管理员在文章管理页面
**When** 管理员修改文章状态或发布日期
**Then** 可将文章状态在草稿、已发布、已归档之间切换（FR4）
**And** 可修改文章的发布日期（FR5）
**And** 状态切换后 updatedAt 自动更新（应用层处理）
**And** 状态变更后缓存正确失效

### Story 2.3: 分类管理与自动创建

As a 管理员,
I want 管理博客分类（创建、编辑、删除、初始化默认分类）,
So that 我可以对文章进行有效分类组织。

**Acceptance Criteria:**

**Given** 管理员在分类管理页面
**When** 管理员执行分类操作
**Then** 可创建、编辑、删除分类（名称、slug、描述、图标、排序、类型）（FR6）
**And** 可一键初始化包含技术、生活、随笔等 5 个默认分类（FR7）
**And** 创建文章时若指定分类不存在，系统自动创建该分类（FR8）
**And** 分类操作使用 onConflictDoUpdate 处理 slug 冲突
**And** 分类写操作后调用 invalidateCategoryCache() 清除缓存

---

## Epic 3: 内容消费与阅读体验

读者可浏览文章列表、阅读文章详情、按分类筛选、归档浏览、相关推荐、文档导航和全文搜索，享受完整的博客阅读体验。

### Story 3.1: 文章列表与详情页浏览

As a 读者,
I want 浏览分页的文章列表并阅读文章详情,
So that 我可以发现和阅读感兴趣的博客内容。

**Acceptance Criteria:**

**Given** 读者访问博客首页或文章列表页
**When** 读者浏览文章
**Then** 可浏览分页的文章列表，支持按分类、类型、状态筛选（FR9）
**And** 可通过 slug 访问文章详情页，内容完整渲染（FR10）
**And** 文章列表使用 LRU 缓存（5 分钟 TTL）加速响应
**And** 分页使用 limit + offset，批量获取避免 N+1 查询

### Story 3.2: 归档视图、分类统计与相关推荐

As a 读者,
I want 按时间归档浏览文章、查看分类统计、获取相关推荐,
So that 我可以从多个维度探索博客内容。

**Acceptance Criteria:**

**Given** 读者在博客中浏览
**When** 读者访问归档页或分类页
**Then** 可查看文章归档视图，按时间分组展示（FR11）
**And** 可查看各分类下的文章数量统计（FR12）
**And** 可在文章详情页获取相关推荐文章（FR13）
**And** 分类统计使用 LRU 缓存（10 分钟 TTL）
**And** PostgreSQL 日期函数 to_char 正确生成归档分组

### Story 3.3: 文档树导航结构

As a 读者,
I want 浏览文档类型内容的树形导航结构,
So that 我可以系统性地阅读结构化文档内容。

**Acceptance Criteria:**

**Given** 博客中存在文档类型的内容
**When** 读者访问文档导航页
**Then** 可浏览文档类型内容的树形导航结构（FR14）
**And** 树形结构正确反映文档的层级关系
**And** 导航支持展开/折叠交互

### Story 3.4: 全文搜索迁移（MySQL → PostgreSQL）

As a 读者,
I want 通过全文搜索查找博客文章,
So that 我可以快速找到感兴趣的内容。

**Acceptance Criteria:**

**Given** 读者在搜索框输入关键词
**When** 执行全文搜索
**Then** 使用 PostgreSQL tsvector + to_tsvector/to_tsquery 实现全文搜索（FR15）
**And** 使用 simple 分词配置（兼容 MemfireDB）
**And** 在 articles 表创建 GIN 索引加速搜索
**And** 搜索响应时间 < 300ms（NFR3）
**And** 如果 tsvector 搜索返回 0 结果，自动降级为 ILIKE '%keyword%' 模糊搜索
**And** 搜索结果正确返回匹配的文章列表
**And** 搜索关键词为空时返回空列表，不抛出异常
**And** 数据库连接不可用时返回空结果并记录错误日志，不中断用户体验

---

## Epic 4: 数据分析与浏览统计

管理员可查看博客的访问数据分析，包括浏览趋势、文章热度排名等，系统自动记录页面浏览数据。

### Story 4.1: 页面浏览数据记录

As a 系统,
I want 自动记录页面浏览数据,
So that 管理员可以了解博客的访问情况。

**Acceptance Criteria:**

**Given** 读者访问博客页面
**When** 页面加载完成
**Then** 系统记录浏览数据：文章 ID、IP、User-Agent、路径、时间（FR22）
**And** 浏览记录写入 page_views 表（PostgreSQL）
**And** 记录操作异步执行，不阻塞页面响应
**And** INSERT 语句使用 PostgreSQL 语法

### Story 4.2: 分析概览与浏览统计

As a 管理员,
I want 查看博客的分析概览和浏览统计数据,
So that 我可以做出数据驱动的内容策略决策。

**Acceptance Criteria:**

**Given** 管理员访问 /admin/analytics 页面
**When** 页面加载
**Then** 可查看分析概览：总文章数、总浏览量、分类数等（FR23）
**And** 可查看指定时间范围（1-365 天）的每日页面浏览统计（FR24）
**And** 可查看文章级别的浏览统计排行（FR25）
**And** 日期聚合使用 PostgreSQL to_char() 替代 MySQL DATE_FORMAT()
**And** 分析数据使用 LRU 缓存（1 分钟 TTL）

---

## Epic 5: 数据备份与恢复

管理员可导出/导入全部博客数据，查看数据库统计信息，配置和执行自动备份计划，确保数据安全。

### Story 5.1: 数据导出与导入

As a 管理员,
I want 导出和导入博客全部数据,
So that 我可以备份数据并在需要时恢复。

**Acceptance Criteria:**

**Given** 管理员访问 /admin/database 页面
**When** 管理员执行导出或导入操作
**Then** 可导出全部数据为 JSON 格式（FR26）
**And** 可从 JSON 文件导入数据恢复备份（FR27）
**And** 导入使用 Drizzle ORM 事务（db.transaction()）确保原子性
**And** 日期字段使用 ISO 字符串格式（PostgreSQL 原生支持）
**And** 导入后校验行数一致性（NFR19）
**And** 导入过程中任何表写入失败时，整个事务回滚，数据库恢复到导入前状态
**And** 导入 JSON 格式不合法或字段缺失时，返回明确的错误信息并中止导入
**And** 导出失败时返回错误提示，不生成不完整的 JSON 文件

### Story 5.2: 数据库统计与自动备份

As a 管理员,
I want 查看数据库统计信息并配置自动备份计划,
So that 我可以监控数据库状态并确保数据安全。

**Acceptance Criteria:**

**Given** 管理员在数据库管理页面
**When** 管理员查看统计或配置备份
**Then** 可查看数据库统计信息：表大小、行数、页面浏览量、备份配置数（FR28）
**And** 可配置自动备份计划：启用/禁用、间隔（周/月/季度）（FR29）
**And** 系统按配置的间隔自动执行数据库备份（FR30）
**And** 统计查询使用 PostgreSQL 系统表/函数
**And** 备份调度使用 node-cron，备份数据格式为 JSON

---

## Epic 6: SEO 优化与内容发现

搜索引擎和 RSS 阅读器可正确索引和订阅博客内容，提升博客在搜索引擎中的可见性。

### Story 6.1: Sitemap、Robots.txt 与 Open Graph Meta

As a 搜索引擎爬虫,
I want 正确获取博客的 sitemap、robots.txt 和页面 meta 信息,
So that 博客内容可被搜索引擎正确索引和展示。

**Acceptance Criteria:**

**Given** 搜索引擎爬虫访问博客
**When** 爬虫请求 SEO 相关资源
**Then** GET /sitemap.xml 返回包含所有公开 URL 的 XML sitemap（FR31）
**And** GET /robots.txt 返回正确的爬虫指引（FR32）
**And** 对爬虫 UA 的页面请求注入 Open Graph meta 标签（FR33）
**And** sitemap 使用 LRU 缓存（10 分钟 TTL）
**And** 所有 SEO 端点在前后端分离架构下通过后端 API 提供

### Story 6.2: RSS/Atom 订阅源

As a 读者,
I want 通过 RSS/Atom 订阅博客更新,
So that 我可以在 RSS 阅读器中获取最新文章推送。

**Acceptance Criteria:**

**Given** 读者或 RSS 阅读器请求订阅源
**When** 请求 RSS/Atom feed
**Then** 系统生成包含最新文章的 RSS/Atom 订阅源（FR34）
**And** feed 包含文章标题、摘要、链接、发布日期
**And** feed URL 在博客页面中可被自动发现（link rel="alternate"）

---

## Epic 7: 数据迁移与上线切换

管理员可将旧系统全部数据完整迁移到新架构，完成架构切换，实现零数据丢失上线。

### Story 7.1: 旧系统数据导出与新系统数据导入

As a 管理员,
I want 将旧系统（MySQL + Docker）的全部数据迁移到新架构（MemfireDB + 前后端分离）,
So that 博客可无缝切换到新架构，零数据丢失。

**Acceptance Criteria:**

**Given** 旧系统正在运行，新系统代码已完成所有 Epic 1-6 的开发
**When** 管理员执行数据迁移
**Then** 通过旧系统 /admin/database 导出全部数据为 JSON
**And** 在新系统中通过导入功能将 JSON 数据写入 MemfireDB
**And** 迁移后校验所有表的行数与旧系统一致（NFR19）
**And** 验证文章内容、分类、用户、浏览数据完整无缺

### Story 7.2: 架构切换（DNS 与基础设施）

As a 管理员,
I want 完成从旧架构到新架构的 DNS 切换和基础设施迁移,
So that 博客流量切换到新架构，旧系统资源被释放。

**Acceptance Criteria:**

**Given** 数据迁移（Story 7.1）完成且验证通过
**When** 管理员执行架构切换
**Then** DNS 切换 zhcmqtt.top 指向 CDN
**And** DNS 切换 api.zhcmqtt.top 指向云服务器
**And** 旧 Docker 容器停止并移除
**And** 服务器释放约 900MB 内存（不再运行 MySQL）
**And** 前端通过 CDN 加速，首屏加载 < 2 秒

### Story 7.3: 功能端到端验收

As a 管理员,
I want 逐项验收新架构下所有博客功能的完整性,
So that 确认重构后功能 100% 平移、零功能丢失。

**Acceptance Criteria:**

**Given** 架构切换（Story 7.2）完成，博客运行在新架构上
**When** 管理员执行功能验收
**Then** 文章 CRUD 操作正常（FR1-FR5）
**And** 分类管理操作正常（FR6-FR8）
**And** 文章列表、详情、归档、搜索功能正常（FR9-FR15）
**And** GitHub OAuth 登录和退出正常（FR16-FR21）
**And** 数据分析页面数据正确展示（FR22-FR25）
**And** 数据导出/导入功能正常（FR26-FR27）
**And** SEO 端点（sitemap、robots.txt、OG meta）正常响应（FR31-FR33）
**And** API P95 响应时间 < 200ms（NFR2）

---

## Epic 8: CI/CD 自动化部署流水线

开发者推送代码后，系统自动完成从构建到部署的全链路自动化，无需手动执行任何部署步骤。

### Story 8.1: 部署脚本编写

As a 开发者,
I want 在仓库中编写前端构建、后端部署、数据库迁移脚本,
So that 流水线可通过执行这些脚本完成落地动作。

**Acceptance Criteria:**

**Given** 仓库中需要部署脚本
**When** 开发者编写脚本
**Then** scripts/deploy_backend.sh 包含：git pull → npm ci → npm run build → 重启进程管理器（FR48）
**And** scripts/migrate_db.sh 包含：设置 DATABASE_URL → 运行 ORM 迁移命令（FR48）
**And** 迁移脚本支持幂等执行，重复运行不产生副作用（NFR32）
**And** 所有脚本设置 `set -e`，任何命令失败立即退出
**And** 脚本不包含硬编码的机密信息（NFR35）

### Story 8.2: 流水线代码仓库触发与构建测试

As a 开发者,
I want 代码推送后自动触发流水线并执行构建和测试,
So that 每次代码变更都能自动验证质量。

**Acceptance Criteria:**

**Given** 代码仓库已关联 CodeArts Pipeline
**When** 开发者推送代码到指定分支
**Then** 流水线自动触发（FR40），通过 Webhook 触发（NFR33）
**And** 自动安装依赖并运行测试套件（FR41）
**And** 测试失败时中止流水线并通知开发者
**And** 自动构建前端产物（npm run build）
**And** 自动构建后端产物（npm run build）
**And** 流水线按阶段串行编排执行（FR49）

### Story 8.3: 前端部署（OBS 上传 + CDN 刷新）

As a 开发者,
I want 流水线自动将前端构建产物上传到 OBS 并刷新 CDN,
So that 用户立即能访问到最新版本的前端页面。

**Acceptance Criteria:**

**Given** 前端构建阶段完成，产物在 dist/ 目录
**When** 流水线执行前端部署阶段
**Then** 自动将 dist/ 目录内容上传至指定 OBS 桶（FR42）
**And** 上传完成后自动刷新 CDN 缓存（FR43）
**And** 刷新目标为 https://zhcmqtt.top/
**And** OBS 桶配置公共读策略
**And** 凭据（OBS AK/SK、CDN 鉴权）通过 CodeArts 参数管理（NFR35）

### Story 8.4: 后端 SSH 部署

As a 开发者,
I want 流水线自动通过 SSH 连接云服务器部署后端代码并重启进程,
So that 后端代码变更自动上线，无需手动登录服务器操作。

**Acceptance Criteria:**

**Given** 前端部署阶段完成
**When** 流水线执行后端部署阶段
**Then** 通过 SSH 连接云服务器执行 deploy_backend.sh（FR44）（NFR34）
**And** SSH 私钥通过 CodeArts 凭据管理（NFR35）
**And** deploy_backend.sh 执行 git pull → pnpm install → build → PM2 restart
**And** 部署失败时中止流水线，后续阶段不执行（NFR31）

### Story 8.5: 数据库自动迁移

As a 开发者,
I want 流水线在后端部署完成后自动执行数据库迁移脚本,
So that 托管数据库表结构始终与最新代码版本保持同步。

**Acceptance Criteria:**

**Given** 后端部署阶段（Story 8.4）成功完成
**When** 流水线执行数据库迁移阶段
**Then** 通过 SSH 执行 migrate_db.sh 进行数据库迁移（FR45）
**And** 迁移脚本支持幂等执行，重复运行不产生副作用（NFR32）
**And** 迁移失败时中止流水线，后续阶段不执行（NFR31）
**And** 建议先跑通最小链路（前端 OBS + 后端部署），确认稳定后再启用本阶段（NFR36）

### Story 8.6: 健康检查与部署通知

As a 开发者,
I want 流水线在部署完成后自动验证服务可用性并发送部署结果通知,
So that 我能确认部署成功且第一时间知晓部署结果。

**Acceptance Criteria:**

**Given** 数据库迁移阶段（Story 8.5）成功完成（或跳过）
**When** 流水线执行健康检查阶段
**Then** 执行 curl https://api.zhcmqtt.top/health 验证服务可用性（FR47）
**And** 健康检查失败则标记流水线失败
**And** 流水线执行完成后发送部署结果通知（成功/失败）（FR46）
**And** 从代码推送到全部部署完成 < 10 分钟（NFR29）
**And** 流水线部署成功率 > 95%（NFR30）
