import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || "https://zhcmqtt.top")
  .trim()
  .replace(/\/$/, "");
const ROOT_DIR = process.cwd();
const CONTENT_DIR = resolve(ROOT_DIR, "client/src/content");
const OUTPUT_DIR = resolve(ROOT_DIR, "public");
const OUTPUT_SITEMAP = resolve(OUTPUT_DIR, "sitemap.xml");
const OUTPUT_ROBOTS = resolve(OUTPUT_DIR, "robots.txt");
const NOW = new Date().toISOString();

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) {
    return { frontmatter: {}, content: raw };
  }
  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: {}, content: raw };
  }
  const block = raw.slice(3, end).trim();
  const content = raw.slice(end + 4).trim();
  const frontmatter = {};
  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    frontmatter[key] = value;
  }
  return { frontmatter, content };
}

async function walkMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkMarkdownFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && extname(entry.name) === ".md") {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeDate(value) {
  if (!value) {
    return NOW;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return NOW;
  }
  return date.toISOString();
}

function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function buildDynamicRoutes() {
  const files = await walkMarkdownFiles(CONTENT_DIR);
  const routes = [];
  for (const filePath of files) {
    const raw = await readFile(filePath, "utf-8");
    const { frontmatter } = parseFrontmatter(raw);
    const fileName = filePath.split("/").pop()?.replace(/\.md$/, "") || "article";
    const slug = (frontmatter.slug || slugify(fileName)).trim();
    const type = frontmatter.type === "doc" ? "doc" : "blog";
    const categoryName = (frontmatter.category || (type === "doc" ? "文档" : "未分类")).trim();
    const categorySlug = (frontmatter.categorySlug || slugify(categoryName) || "uncategorized").trim();
    const updatedAt = normalizeDate(frontmatter.updatedAt || frontmatter.publishedAt || frontmatter.createdAt);

    if (type === "doc") {
      routes.push({
        path: `/docs/${categorySlug}/${slug}`,
        lastmod: updatedAt,
        changefreq: "weekly",
        priority: "0.7",
      });
      continue;
    }

    routes.push({
      path: `/article/${slug}`,
      lastmod: updatedAt,
      changefreq: "weekly",
      priority: "0.8",
    });
  }
  return routes;
}

async function generateSitemap() {
  const staticRoutes = [
    { path: "/", lastmod: NOW, changefreq: "daily", priority: "1.0" },
    { path: "/articles", lastmod: NOW, changefreq: "daily", priority: "0.9" },
    { path: "/archive", lastmod: NOW, changefreq: "weekly", priority: "0.8" },
    { path: "/about", lastmod: NOW, changefreq: "monthly", priority: "0.6" },
    { path: "/docs", lastmod: NOW, changefreq: "weekly", priority: "0.8" },
  ];
  const dynamicRoutes = await buildDynamicRoutes();
  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  const urlset = allRoutes
    .map((route) => {
      const location = `${SITE_URL}${route.path}`;
      return `  <url>
    <loc>${xmlEscape(location)}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>
`;
}

function generateRobots() {
  return `User-agent: *
Allow: /
Disallow: /404
Disallow: /*?*search=

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const sitemapContent = await generateSitemap();
  const robotsContent = generateRobots();
  await writeFile(OUTPUT_SITEMAP, sitemapContent, "utf-8");
  await writeFile(OUTPUT_ROBOTS, robotsContent, "utf-8");
  console.log(
    JSON.stringify(
      {
        success: true,
        siteUrl: SITE_URL,
        output: {
          sitemap: OUTPUT_SITEMAP.replace(`${ROOT_DIR}/`, ""),
          robots: OUTPUT_ROBOTS.replace(`${ROOT_DIR}/`, ""),
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ success: false, error: message }, null, 2));
  process.exit(1);
});
