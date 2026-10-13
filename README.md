![我用 AI，给自己的文字搭了个家](https://image-osb.obs.cn-east-3.myhuaweicloud.com/blog/2026-01-20/person-blog/r02/cover/cover-wechat-009513a07ee6.webp)

![MIT License](https://img.shields.io/badge/license-MIT-111111?style=flat-square)![React 19](https://img.shields.io/badge/React-19-111111?style=flat-square&logo=react&logoColor=white)![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-111111?style=flat-square&logo=typescript&logoColor=white)![Vite 7](https://img.shields.io/badge/Vite-7-111111?style=flat-square&logo=vite&logoColor=white)![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-111111?style=flat-square&logo=tailwindcss&logoColor=white)![Node.js 22](https://img.shields.io/badge/Node.js-22-111111?style=flat-square&logo=nodedotjs&logoColor=white)

**留白、醒目大字和深色线条的个人博客。**
文章写在本地 Markdown 里。换成你的名字、头像和文章，就能部署成自己的静态站点。

[预览](#预览) · [跑起来](#跑起来) · [换成自己的站点](#换成自己的站点) · [写文章](#写文章) · [构建与部署](#构建与部署) · [交流与贡献](#交流与贡献)

## 这是什么

这是一套个人博客的源码。首页、文章列表、阅读页、归档和关于页用同一套排版：大标题、明确的边框，以及比较多的留白。

文章放在 `client/src/content` 的 Markdown 文件里，由 React、TypeScript、Vite 和 Tailwind CSS 构建成静态站点。不需要数据库、后端或管理后台。

现在的 [鸿尘客](https://zhcmqtt.top/) 已是后续重写的站点。本仓库保留的是这一版留白与墨线的博客。从零替换资料、写文章到部署上线的步骤，写在文末的开源资料里。

## 预览


| 首页                                                                                                                          | 文章列表                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ![首页：留白、醒目大字与深色线条](https://image-osb.obs.cn-east-3.myhuaweicloud.com/blog/2026-01-20/person-blog/r02/001.webp) | ![文章列表：分类、标题、摘要和日期](https://image-osb.obs.cn-east-3.myhuaweicloud.com/blog/2026-01-20/person-blog/r02/002.webp) |


| 阅读页                                                                                                                | 归档                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| ![阅读页：正文与右侧目录](https://image-osb.obs.cn-east-3.myhuaweicloud.com/blog/2026-01-20/person-blog/r02/003.webp) | ![归档：按年份和月份展开](https://image-osb.obs.cn-east-3.myhuaweicloud.com/blog/2026-01-20/person-blog/r02/004.webp) |

截图来自这一版源码对应的页面。

## 功能


|          |                                                                   |
| -------- | ----------------------------------------------------------------- |
| **页面** | 首页、文章列表、阅读页、归档、关于，以及文档索引`/docs`           |
| **阅读** | Markdown 标题生成右侧目录，并显示发布日期、估算阅读时间和相关文章 |
| **查找** | 按分类筛选；搜索范围包含正文。筛选条件写入地址栏，刷新后保留      |
| **归档** | 按年份、月份展开，也可查看分类统计。月份来自文章的`publishedAt`   |
| **状态** | `status: published` 出现在站点中，`draft` 不出现在列表中          |
| **文档** | `type: doc` 的 Markdown 进入 `/docs/:category/:slug`              |
| **SEO**  | 构建时生成`sitemap.xml` 与 `robots.txt`                           |

## 跑起来

需要 Node.js 22，版本不低于 22.13，以及 Git。npm 随 Node.js 安装包提供。下面的命令都在仓库根目录执行，根目录应能看到 `package.json`、`package-lock.json` 和 `vite.config.ts`。

```bash
git clone https://github.com/zhanghongchen1213/Web_blog.git
cd Web_blog
npm ci
npm run dev
```

`npm ci` 按锁文件安装依赖，请保留仓库里的 `.npmrc`。启动后打开终端里的 Local 地址。`Ctrl+C` 停止开发服务器。


| 命令                   | 作用                                       |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | 启动开发服务器。保存 Markdown 后会重新加载 |
| `npm run check`        | TypeScript 检查                            |
| `npm run build`        | 生成 SEO 文件并构建。产物在`dist/public`   |
| `npm run start`        | 预览构建结果，默认端口`4173`               |
| `npm run lint`         | 检查`client/src`                           |
| `npm run seo:generate` | 只生成站点地图和`robots.txt`               |

## 目录

```text
.
├── package.json
├── vite.config.ts
├── scripts/generate-seo-assets.mjs
└── client/
    ├── index.html
    ├── public/                 # 图片等静态文件，访问路径从 / 开始
    └── src/
        ├── pages/              # Home、Articles、ArticleDetail、Archive、About
        ├── components/         # Navbar、Footer
        ├── lib/                # seo.ts、staticContent.ts
        └── content/blog/       # 文章 Markdown
```


| 路径                    | 页面     |
| ----------------------- | -------- |
| `/`                     | 首页     |
| `/articles`             | 文章列表 |
| `/article/:slug`        | 阅读页   |
| `/archive`              | 归档     |
| `/about`                | 关于     |
| `/docs`                 | 文档索引 |
| `/docs/:category/:slug` | 文档阅读 |

## 换成自己的站点


| 要改的内容                       | 文件                               |
| -------------------------------- | ---------------------------------- |
| 首页大标题、简介、主题标签       | `client/src/pages/Home.tsx`        |
| 导航左侧站点标识                 | `client/src/components/Navbar.tsx` |
| 头像、姓名、技术栈、项目与经历   | `client/src/pages/About.tsx`       |
| 页脚介绍与联系方式               | `client/src/components/Footer.tsx` |
| 网站名称、描述、作者             | `client/src/lib/seo.ts`            |
| 文章默认作者名（当前为「站长」） | `client/src/lib/staticContent.ts`  |
| 初始网页标题与描述               | `client/index.html`                |

`Home.tsx` 的 `SEOHead` 和 `About.tsx` 的个人资料也要一起替换。改完后全局搜索原站名称、账号和联系方式。

头像放在 `client/public/images/`，页面里使用 `/images/avatar.jpg`。浏览器路径不包含 `client/public`。没有对应账号的联系方式删掉入口。页脚备案使用自己的信息；没有可展示的备案信息，就删除该区块。

`client/index.html` 末尾带有原站统计脚本。搜索 `data-cf-beacon`，删除包含它的整行 `<script>`，再配置自己的统计。

## 写文章

在 `client/src/content/blog` 新建 `.md`。文件只要还在 `client/src/content` 下就会被扫描，备份请放到仓库外。

```markdown
---
title: 你好，这是我的第一篇博客
slug: my-first-post
summary: 记录我搭建个人博客的第一步。
category: 生活记录
categorySlug: life
type: blog
status: published
publishedAt: 2026-01-20
---

## 为什么想写博客

先写下一篇，再慢慢把这里填满。
```


| 字段                        | 说明                                                   |
| --------------------------- | ------------------------------------------------------ |
| `title`                     | 列表和阅读页标题                                       |
| `slug`                      | 文章地址最后一段。使用不重复的英文短名，发布后尽量不改 |
| `summary`                   | 列表摘要，保持单行                                     |
| `category` / `categorySlug` | 展示名与英文标识。同一分类始终用同一个标识             |
| `type`                      | 普通文章填`blog`，文档填 `doc`                         |
| `status`                    | 要展示填`published`，草稿填 `draft`                    |
| `publishedAt`               | `YYYY-MM-DD`，决定归档月份                             |

元信息按行解析。正文图片放在 `client/public/images/`，在 Markdown 里写成 `/images/my-project.png`。文件名和格式与真实文件一致。

## 构建与部署

站点公开地址写在仓库根目录的 `.env.production`：

```dotenv
VITE_SITE_URL=https://your-blog.pages.dev
```

本地预览可先写成 `http://localhost:4173`。拿到托管地址后改成实际地址，再重新构建。这里只放公开网址。

当前 `scripts/generate-seo-assets.mjs` 把站点地图写到仓库根目录的 `public/`，Vite 读取的是 `client/public`。上线前把输出目录改为：

```js
const OUTPUT_DIR = resolve(ROOT_DIR, "client/public");
```

并让生成脚本读到同一份环境变量。`package.json` 里只替换 `seo:generate` 的值：

```json
"seo:generate": "node --env-file=.env.production scripts/generate-seo-assets.mjs"
```

然后在根目录执行：

```bash
npm run check
npm run build
npm run start
```

确认 `dist/public` 中有 `index.html`、`assets`、`sitemap.xml` 和 `robots.txt`。打开 `/sitemap.xml` 与 `/robots.txt`，核对里面的域名。

部署到 Cloudflare Pages 时使用 Direct Upload，上传 `dist/public` 这一层，根上直接是 `index.html` 和 `assets`。这个项目使用浏览器路由，Pages 会回退到首页再由 React 匹配地址，不要额外放入顶层 `404.html`。

同一个 Direct Upload 项目不能直接改成 Git 集成。若希望推送后自动部署，另建一个 Git 集成的 Pages 项目。绑定自己的域名后，把 `VITE_SITE_URL` 改成正式地址，重新构建并再部署一次。

## 遇到问题时


| 现象                          | 先看哪里                                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm ci` 提示 Node 版本不支持 | `node -v` 是否不低于 22.13，是否在仓库根目录，且保留了 `.npmrc`                                          |
| 文章没有出现在列表            | 文件是否在`client/src/content` 下，`type` 是否为 `blog`，`status` 是否为 `published`，文首元信息是否完整 |
| 图片本地有、线上没有          | 文件是否进入`dist/public/images`，文件名大小写和 Markdown 路径是否一致                                   |
| 首页正常、刷新文章地址失败    | 上传的是否为`dist/public` 的内容，是否多放了顶层 `404.html`                                              |
| 归档月份不对                  | `publishedAt` 是否为有效日期                                                                             |
| 站点地图仍是旧域名            | `.env.production` 与 `seo:generate` 是否读到该文件，以及是否重新构建并上传                               |

## 交流与贡献

部署、写文章和上线时遇到问题，可以到 [Issues](https://github.com/zhanghongchen1213/Web_blog/issues) 提问。用这套源码做出自己的博客后，也欢迎在 Issue 里留下站点地址。

发现 Bug 或有明确的改动建议，请 [提交 Issue](https://github.com/zhanghongchen1213/Web_blog/issues/new)。本仓库没有单独的贡献说明和安全政策，改代码前先用 Issue 说明改动范围。不要在公开 Issue 里贴密钥、统计令牌或 `.env` 内容。

**本文资料 · 接着动手**

**鸿尘客公众号**
扫码关注鸿尘客公众号，回复 **“查看原文”**，获取本文开源资料与配套内容。

![鸿尘客公众号二维码](https://image-osb.obs.cn-east-3.myhuaweicloud.com/wemedia/wxlogo.webp)

**鸿尘客独立站**

点击下方获取本文**开源资料**与**配套内容**
[开源资料：https://zhcmqtt.top/article/person-blog](https://zhcmqtt.top/article/person-blog)

![官网](https://image-osb.obs.cn-east-3.myhuaweicloud.com/wemedia/honchic_logo.webp)

## 许可

本仓库以 **MIT License** 授权。SPDX 标识符为 `MIT`，版权人是鸿尘客，版权年份为 2026。具有法律效力的许可全文在仓库根目录的 [LICENSE](LICENSE)。`package.json` 的 `license` 字段同为 `MIT`，与该文件一致。

在所有副本或实质性部分中保留上述版权声明和许可声明的前提下，可以免费使用、复制、修改、合并、发布、分发、再许可或销售本软件及其配套文档。软件按「原样」提供，不包含适销性、特定用途适用性、不侵权等任何明示或暗示担保。作者与版权人不对因使用或无法使用本软件引起的索赔、损害或其他责任负责。

本授权覆盖本仓库中的源代码、配置、脚本和文档。第三方依赖保留各自许可证，不因本仓库采用 MIT 而改变。
