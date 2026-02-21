import { Request, Response, NextFunction } from "express";
import { getArticleBySlug } from "../db";

const CRAWLER_UA = /Googlebot|Bingbot|Twitterbot|facebookexternalhit|LinkedInBot|Slackbot/i;

function ogTags(meta: { title: string; description: string; image?: string; url?: string; type?: string }) {
  const tags = [
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:type" content="${meta.type || "website"}" />`,
    `<meta name="twitter:card" content="${meta.image ? "summary_large_image" : "summary"}" />`,
  ];
  if (meta.image) tags.push(`<meta property="og:image" content="${esc(meta.image)}" />`);
  if (meta.url) {
    tags.push(`<meta property="og:url" content="${esc(meta.url)}" />`);
    tags.push(`<link rel="canonical" href="${esc(meta.url)}" />`);
  }
  return tags.join("\n");
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function jsonLd(data: {
  headline: string; description: string; url: string;
  image?: string; datePublished: Date | null; dateModified: Date | null;
  authorName?: string;
}) {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: data.headline,
    description: data.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": data.url },
    author: { "@type": "Person", name: data.authorName || "Anonymous" },
    publisher: { "@type": "Organization", name: "个人博客" },
  };
  if (data.image) ld.image = data.image;
  if (data.datePublished) ld.datePublished = data.datePublished.toISOString();
  if (data.dateModified) ld.dateModified = data.dateModified.toISOString();
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

export function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers["user-agent"] || "";
  if (!CRAWLER_UA.test(ua)) return next();

  const articleMatch = req.path.match(/^\/article\/([^/]+)$/);
  if (articleMatch) {
    getArticleBySlug(articleMatch[1]).then(article => {
      if (article) {
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const url = `${baseUrl}${req.path}`;
        const description = article.summary || article.title;
        res.locals.seoTags = ogTags({
          title: article.title,
          description,
          image: article.coverImage || undefined,
          url,
          type: "article",
        }) + "\n" + jsonLd({
          headline: article.title,
          description,
          image: article.coverImage || undefined,
          url,
          datePublished: article.publishedAt || article.createdAt,
          dateModified: article.updatedAt || article.publishedAt || article.createdAt,
          authorName: article.author?.name || undefined,
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
