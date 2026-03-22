---
title: Cloudflare Analytics 接入方案
slug: cloudflare-analytics-plan
summary: 纯静态站点下的访问统计接入建议
category: 博客
categorySlug: blog
type: blog
status: published
publishedAt: 2026-03-21T00:00:00.000Z
---

# Cloudflare Analytics 接入方案

纯静态站点不需要数据库，也能保留访问统计能力。

核心思路：

1. 保留静态页面分发（OBS + CDN）
2. 在前端注入 Cloudflare Beacon 脚本
3. 在 Cloudflare 仪表盘查看 PV、UV、Top Pages
