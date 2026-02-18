import { Request, Response, NextFunction } from "express";
import { getArticleBySlug } from "../db";

const CRAWLER_UA = /Googlebot|Bingbot|Twitterbot|facebookexternalhit|LinkedInBot|Slackbot/i;

function ogTags(meta: { title: string; description: string; image?: string; url?: string; type?: string }) {
  const tags = [
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:type" content="${meta.type || "website"}" />`,
    `<meta name="twitter:card" content="${meta.image ? "summary_large_image" : "summary"}" />`,
  ];
  if (meta.image) tags.push(`<meta property="og:image" content="${esc(meta.image)}" />`);
  if (meta.url) tags.push(`<meta property="og:url" content="${esc(meta.url)}" />`);
  return tags.join("\n");
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers["user-agent"] || "";
  if (!CRAWLER_UA.test(ua)) return next();

  const articleMatch = req.path.match(/^\/article\/([^/]+)$/);
  if (articleMatch) {
    getArticleBySlug(articleMatch[1]).then(article => {
      if (article) {
        res.locals.seoTags = ogTags({
          title: article.title,
          description: article.summary || article.title,
          image: article.coverImage || undefined,
          type: "article",
        });
      } else {
        res.locals.seoTags = ogTags({ title: "个人博客", description: "个人博客" });
      }
      next();
    }).catch(() => next());
  } else {
    res.locals.seoTags = ogTags({ title: "个人博客", description: "个人博客" });
    next();
  }
}
