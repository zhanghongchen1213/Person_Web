import { getArticles } from "../db";
import { appCache } from "./cache";

const SITEMAP_KEY = "sitemap:xml";
const ONE_HOUR = 60 * 60 * 1000;

export async function generateSitemap(baseUrl: string): Promise<string> {
  const cached = appCache.get(SITEMAP_KEY) as string | undefined;
  if (cached) return cached;

  const { articles } = await getArticles({ limit: 1000, status: "published" });

  const urls = [
    `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${baseUrl}/articles</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    ...articles.map(a => {
      const lastmod = a.updatedAt ? new Date(a.updatedAt).toISOString().split("T")[0] : "";
      return `<url><loc>${baseUrl}/article/${encodeURIComponent(a.slug)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
  appCache.set(SITEMAP_KEY, xml, ONE_HOUR);
  return xml;
}
