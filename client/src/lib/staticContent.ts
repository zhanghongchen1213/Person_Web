type ContentType = "blog" | "doc";

export interface StaticCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  type: ContentType;
}

export interface StaticArticle {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImage: string | null;
  author: {
    id: number;
    name: string | null;
    avatar: string | null;
  };
  category: StaticCategory | null;
  categoryId: number | null;
  status: "draft" | "published" | "archived";
  type: ContentType;
  order: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ParsedFrontmatter {
  title?: string;
  slug?: string;
  summary?: string;
  coverImage?: string;
  category?: string;
  categorySlug?: string;
  categoryDescription?: string;
  status?: "draft" | "published" | "archived";
  type?: ContentType;
  order?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

const markdownModules = import.meta.glob("../content/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFrontmatter(raw: string): {
  frontmatter: ParsedFrontmatter;
  content: string;
} {
  if (!raw.startsWith("---")) {
    return { frontmatter: {}, content: raw.trim() };
  }

  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: {}, content: raw.trim() };
  }

  const block = raw.slice(3, end).trim();
  const content = raw.slice(end + 4).trim();
  const frontmatter: ParsedFrontmatter = {};

  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim() as keyof ParsedFrontmatter;
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    (frontmatter[key] as string | undefined) = value;
  }

  return { frontmatter, content };
}

function getNowIso(): string {
  return new Date().toISOString();
}

const parsedArticles: StaticArticle[] = (() => {
  const categories = new Map<string, StaticCategory>();
  let categoryId = 1;
  let articleId = 1;

  const result: StaticArticle[] = Object.entries(markdownModules)
    .map(([path, raw]) => {
      const { frontmatter, content } = parseFrontmatter(raw);
      const fileName = path.split("/").pop()?.replace(/\.md$/, "") ?? `article-${articleId}`;
      const title = frontmatter.title?.trim() || fileName;
      const slug = frontmatter.slug?.trim() || slugify(fileName);
      const type = frontmatter.type === "doc" ? "doc" : "blog";
      const categoryName =
        frontmatter.category?.trim() || (type === "doc" ? "文档" : "未分类");
      const categorySlug = frontmatter.categorySlug?.trim() || slugify(categoryName) || "uncategorized";
      const key = `${type}:${categorySlug}`;

      if (!categories.has(key)) {
        categories.set(key, {
          id: categoryId++,
          name: categoryName,
          slug: categorySlug,
          description: frontmatter.categoryDescription?.trim() || null,
          type,
        });
      }

      const category = categories.get(key) ?? null;
      const publishedAt = frontmatter.publishedAt?.trim() || null;
      const createdAt = frontmatter.createdAt?.trim() || publishedAt || getNowIso();
      const updatedAt = frontmatter.updatedAt?.trim() || createdAt;
      const status = frontmatter.status ?? "published";
      const order = Number(frontmatter.order ?? "0");

      return {
        id: articleId++,
        title,
        slug,
        summary: frontmatter.summary?.trim() || null,
        content,
        coverImage: frontmatter.coverImage?.trim() || null,
        author: { id: 1, name: "站长", avatar: null },
        category,
        categoryId: category?.id ?? null,
        status,
        type,
        order: Number.isFinite(order) ? order : 0,
        publishedAt,
        createdAt,
        updatedAt,
      } satisfies StaticArticle;
    })
    .filter(article => article.status === "published")
    .sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });

  return result;
})();

export function getAllArticles() {
  return parsedArticles;
}

export function getStats() {
  return {
    articleCount: parsedArticles.filter(a => a.type === "blog").length,
    categoryCount: new Set(parsedArticles.filter(a => a.type === "blog").map(a => a.category?.slug)).size,
  };
}

export function listArticles(options?: {
  limit?: number;
  page?: number;
  type?: ContentType;
  categorySlug?: string;
  search?: string;
}) {
  let filtered = [...parsedArticles];

  if (options?.type) {
    filtered = filtered.filter(a => a.type === options.type);
  }
  if (options?.categorySlug) {
    filtered = filtered.filter(a => a.category?.slug === options.categorySlug);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.summary ?? "").toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
    );
  }

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const start = (page - 1) * limit;

  return {
    articles: filtered.slice(start, start + limit),
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
  };
}

export function getArticleBySlug(slug: string) {
  return parsedArticles.find(article => article.slug === slug) ?? null;
}

export function getDocBySlug(slug: string) {
  return parsedArticles.find(article => article.slug === slug && article.type === "doc") ?? null;
}

export function getRelatedArticles(articleId: number, categoryId: number | null, limit = 4) {
  return parsedArticles
    .filter(article => article.id !== articleId)
    .filter(article => (categoryId ? article.categoryId === categoryId : true))
    .slice(0, limit);
}

export function getCategories(type?: ContentType) {
  const map = new Map<string, StaticCategory>();
  for (const article of parsedArticles) {
    if (!article.category) continue;
    if (type && article.category.type !== type) continue;
    map.set(`${article.category.type}:${article.category.slug}`, article.category);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getCategoryCounts() {
  const counts = new Map<number, { categoryId: number; categoryName: string; categorySlug: string; count: number }>();
  for (const article of parsedArticles) {
    if (!article.category) continue;
    const existing = counts.get(article.category.id);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(article.category.id, {
        categoryId: article.category.id,
        categoryName: article.category.name,
        categorySlug: article.category.slug,
        count: 1,
      });
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

export function getArchive() {
  const monthMap = new Map<string, {
    year: number;
    month: number;
    count: number;
    articles: Array<{
      id: number;
      title: string;
      slug: string;
      publishedAt: string | null;
      categoryName: string | null;
    }>;
  }>();

  for (const article of parsedArticles.filter(a => a.type === "blog")) {
    const date = article.publishedAt ? new Date(article.publishedAt) : new Date(article.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;
    const item = monthMap.get(key) ?? {
      year,
      month,
      count: 0,
      articles: [],
    };
    item.count += 1;
    item.articles.push({
      id: article.id,
      title: article.title,
      slug: article.slug,
      publishedAt: article.publishedAt,
      categoryName: article.category?.name ?? null,
    });
    monthMap.set(key, item);
  }

  return Array.from(monthMap.values()).sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  );
}

export function getDocTree(categorySlug?: string) {
  const docs = parsedArticles
    .filter(article => article.type === "doc")
    .filter(article => (categorySlug ? article.category?.slug === categorySlug : true))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  const grouped = new Map<string, {
    category: StaticCategory;
    articles: Array<{ id: number; title: string; slug: string; order: number }>;
  }>();

  for (const article of docs) {
    if (!article.category) continue;
    const key = article.category.slug;
    if (!grouped.has(key)) {
      grouped.set(key, { category: article.category, articles: [] });
    }
    grouped.get(key)?.articles.push({
      id: article.id,
      title: article.title,
      slug: article.slug,
      order: article.order,
    });
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.category.name.localeCompare(b.category.name)
  );
}
