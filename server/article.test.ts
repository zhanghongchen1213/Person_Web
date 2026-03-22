import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", () => ({
  getArticles: vi.fn(),
  getArticleBySlug: vi.fn(),
  getArticleById: vi.fn(),
  getStats: vi.fn(),
  getArchive: vi.fn(),
  createArticle: vi.fn(),
  updateArticle: vi.fn(),
  updateArticlePublishedAt: vi.fn(),
  deleteArticle: vi.fn(),
  upsertArticle: vi.fn(),
  getCategories: vi.fn(),
  getCategoryBySlug: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  initDefaultCategories: vi.fn(),
  findOrCreateCategory: vi.fn(),
  getArticleCountByCategory: vi.fn(),
  getCategoryWithArticles: vi.fn(),
  getDocTree: vi.fn(),
  getRelatedArticles: vi.fn(),
  getAnalyticsOverview: vi.fn(),
  getPageViewStats: vi.fn(),
  recordPageView: vi.fn(),
  getDatabaseStats: vi.fn(),
  exportAllData: vi.fn(),
  importAllData: vi.fn(),
  getBackupSettings: vi.fn(),
  updateBackupSettings: vi.fn(),
}));

import * as db from "./db";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      avatar: null,
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      avatar: null,
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("article.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns published articles for public users", async () => {
    const mockArticles = {
      articles: [
        {
          id: 1,
          title: "Test Article",
          slug: "test-article",
          summary: "Test summary",
          content: "Test content",
          coverImage: null,
          authorId: 1,
          categoryId: null,
          status: "published" as const,
          type: "blog" as const,
          order: 0,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 1, name: "Author", avatar: null },
          category: null,
        },
      ],
      total: 1,
      totalPages: 1,
    };

    vi.mocked(db.getArticles).mockResolvedValue(mockArticles);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.list({ limit: 10, page: 1, status: "published" });

    expect(result.articles).toHaveLength(1);
    expect(result.articles[0].title).toBe("Test Article");
    expect(db.getArticles).toHaveBeenCalledWith(
      expect.objectContaining({ status: "published" })
    );
  });
});

describe("article.bySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns article and increments view count", async () => {
    const mockArticle = {
      id: 1,
      title: "Test Article",
      slug: "test-article",
      summary: "Test summary",
      content: "Test content",
      coverImage: null,
      authorId: 1,
      categoryId: null,
      status: "published" as const,
      type: "blog" as const,
      order: 0,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { id: 1, name: "Author", avatar: null },
      category: null,
    };

    vi.mocked(db.getArticleBySlug).mockResolvedValue(mockArticle);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.bySlug({ slug: "test-article" });

    expect(result.title).toBe("Test Article");
  });

  it("throws NOT_FOUND for non-existent article", async () => {
    vi.mocked(db.getArticleBySlug).mockResolvedValue(null);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.article.bySlug({ slug: "non-existent" })).rejects.toThrow(
      "Article not found"
    );
  });
});

describe("article.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to create article", async () => {
    vi.mocked(db.createArticle).mockResolvedValue(1);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.create({
      title: "New Article",
      slug: "new-article",
      content: "Article content",
      status: "draft",
    });

    expect(result.id).toBe(1);
    expect(db.createArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Article",
        slug: "new-article",
        authorId: 1,
      })
    );
  });

  it("denies regular user from creating article", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.article.create({
        title: "New Article",
        slug: "new-article",
        content: "Article content",
      })
    ).rejects.toThrow("Admin access required");
  });
});

describe("article.stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns blog statistics", async () => {
    const mockStats = {
      articleCount: 10,
      categoryCount: 5,
    };

    vi.mocked(db.getStats).mockResolvedValue(mockStats);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.stats();

    expect(result.articleCount).toBe(10);
    expect(result.categoryCount).toBe(5);
  });
});

describe("category.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all categories", async () => {
    const mockCategories = [
      { id: 1, name: "Tech", slug: "tech", description: null, icon: null, sortOrder: 0, type: "blog" as const, createdAt: new Date() },
      { id: 2, name: "Life", slug: "life", description: null, icon: null, sortOrder: 1, type: "blog" as const, createdAt: new Date() },
    ];

    vi.mocked(db.getCategories).mockResolvedValue(mockCategories);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.category.list();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Tech");
  });
});

describe("article.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to update article and invalidates cache", async () => {
    vi.mocked(db.updateArticle).mockResolvedValue(undefined);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.update({
      id: 1,
      title: "Updated Title",
      content: "Updated content",
      status: "published",
    });

    expect(result.success).toBe(true);
    expect(db.updateArticle).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ title: "Updated Title", status: "published" })
    );
  });

  it("sets updatedAt via db.updateArticle (PostgreSQL adaptation)", async () => {
    vi.mocked(db.updateArticle).mockResolvedValue(undefined);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.article.update({ id: 2, title: "Another Update" });

    // updateArticle is responsible for setting updatedAt: new Date() internally
    expect(db.updateArticle).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ title: "Another Update" })
    );
  });

  it("denies regular user from updating article", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.article.update({ id: 1, title: "Hacked" })
    ).rejects.toThrow("Admin access required");
  });

  it("denies unauthenticated user from updating article", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.article.update({ id: 1, title: "Hacked" })
    ).rejects.toThrow();
  });
});

describe("article.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to delete article and invalidates cache", async () => {
    vi.mocked(db.deleteArticle).mockResolvedValue(undefined);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.delete({ id: 1 });

    expect(result.success).toBe(true);
    expect(db.deleteArticle).toHaveBeenCalledWith(1);
  });

  it("denies regular user from deleting article", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.article.delete({ id: 1 })
    ).rejects.toThrow("Admin access required");
  });

  it("denies unauthenticated user from deleting article", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.article.delete({ id: 1 })
    ).rejects.toThrow();
  });
});

describe("article.upsert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to upsert article (insert new) and invalidates cache", async () => {
    vi.mocked(db.upsertArticle).mockResolvedValue(42);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.upsert({
      title: "New Doc",
      slug: "new-doc",
      content: "Doc content",
      status: "draft",
      type: "doc",
      order: 0,
    });

    expect(result.id).toBe(42);
    expect(db.upsertArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Doc",
        slug: "new-doc",
        authorId: 1,
      })
    );
  });

  it("allows admin to upsert article (update on conflict) using onConflictDoUpdate", async () => {
    // db.upsertArticle uses onConflictDoUpdate targeting articles.slug
    vi.mocked(db.upsertArticle).mockResolvedValue(7);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.upsert({
      title: "Existing Doc Updated",
      slug: "existing-doc",
      content: "Updated content",
      status: "published",
      type: "blog",
      order: 1,
    });

    expect(result.id).toBe(7);
    expect(db.upsertArticle).toHaveBeenCalledTimes(1);
  });

  it("denies regular user from upserting article", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.article.upsert({
        title: "Doc",
        slug: "doc",
        content: "Content",
        status: "draft",
        type: "blog",
        order: 0,
      })
    ).rejects.toThrow("Admin access required");
  });
});

describe("article.updateStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("管理员可将文章从 draft 切换为 published", async () => {
    vi.mocked(db.updateArticle).mockResolvedValue(undefined);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.update({
      id: 1,
      status: "published",
    });

    expect(result.success).toBe(true);
    expect(db.updateArticle).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: "published" })
    );
  });

  it("管理员可将文章切换为 archived", async () => {
    vi.mocked(db.updateArticle).mockResolvedValue(undefined);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.update({
      id: 2,
      status: "archived",
    });

    expect(result.success).toBe(true);
    expect(db.updateArticle).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ status: "archived" })
    );
  });

  it("状态切换后 updatedAt 被更新（db.updateArticle 自动处理）", async () => {
    vi.mocked(db.updateArticle).mockResolvedValue(undefined);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.article.update({ id: 3, status: "published" });

    // updateArticle in db.ts always sets updatedAt: new Date()
    expect(db.updateArticle).toHaveBeenCalledTimes(1);
    expect(db.updateArticle).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ status: "published" })
    );
  });

  it("状态变更后缓存失效（invalidateArticleCache 被调用）", async () => {
    vi.mocked(db.updateArticle).mockResolvedValue(undefined);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Call update to trigger cache invalidation
    await caller.article.update({ id: 4, status: "published" });

    // updateArticle is called, which triggers invalidateArticleCache() in routers.ts
    expect(db.updateArticle).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ status: "published" })
    );
  });

  it("普通用户无法修改状态", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.article.update({ id: 1, status: "published" })
    ).rejects.toThrow("Admin access required");
  });
});

describe("article.updatePublishDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("管理员可修改发布日期", async () => {
    const mockArticle = {
      id: 10,
      title: "Test Article",
      slug: "test-article",
      summary: null,
      content: "Content",
      coverImage: null,
      authorId: 1,
      categoryId: null,
      status: "published" as const,
      type: "blog" as const,
      order: 0,
      publishedAt: new Date("2026-01-15T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.updateArticlePublishedAt).mockResolvedValue(undefined);
    vi.mocked(db.getArticleById)
      .mockResolvedValueOnce(mockArticle)  // first call: verify article exists
      .mockResolvedValueOnce({ ...mockArticle, publishedAt: new Date("2026-03-01T00:00:00.000Z") }); // second call: return updated

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const newDate = new Date("2026-03-01T00:00:00.000Z");
    const result = await caller.article.updatePublishedAt({
      id: 10,
      publishedAt: newDate,
    });

    expect(db.updateArticlePublishedAt).toHaveBeenCalledWith(10, newDate);
    expect(result?.publishedAt).toEqual(new Date("2026-03-01T00:00:00.000Z"));
  });

  it("文章不存在时返回 NOT_FOUND 错误", async () => {
    vi.mocked(db.getArticleById).mockResolvedValue(null);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.article.updatePublishedAt({
        id: 999,
        publishedAt: new Date("2026-03-01T00:00:00.000Z"),
      })
    ).rejects.toThrow("Article not found");
  });

  it("普通用户无法修改发布日期", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.article.updatePublishedAt({
        id: 1,
        publishedAt: new Date("2026-03-01T00:00:00.000Z"),
      })
    ).rejects.toThrow("Admin access required");
  });
});

// ============================================
// Analytics Tests (Story 4-2)
// ============================================

describe("analytics.overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns complete overview with all required fields for admin", async () => {
    const mockOverview = {
      totalArticles: 15,
      publishedArticles: 10,
      draftArticles: 5,
      totalViews: 200,
      totalUsers: 3,
      totalCategories: 4,
      articlesByCategory: [
        { name: "Tech", count: 5 },
        { name: "Life", count: 3 },
      ],
      articlesByMonth: [
        { month: "2026-02", count: 4 },
        { month: "2026-03", count: 6 },
      ],
      topArticles: [
        { title: "Popular Article", slug: "popular-article", viewCount: 50 },
        { title: "Second Article", slug: "second-article", viewCount: 30 },
      ],
    };

    vi.mocked(db.getAnalyticsOverview).mockResolvedValue(mockOverview);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.overview();

    expect(result).toHaveProperty("totalArticles");
    expect(result).toHaveProperty("publishedArticles");
    expect(result).toHaveProperty("draftArticles");
    expect(result).toHaveProperty("totalViews");
    expect(result).toHaveProperty("totalUsers");
    expect(result).toHaveProperty("totalCategories");
    expect(result).toHaveProperty("articlesByCategory");
    expect(result).toHaveProperty("articlesByMonth");
    expect(result).toHaveProperty("topArticles");
    expect(result.totalArticles).toBe(15);
    expect(result.totalViews).toBe(200);
  });

  it("topArticles are sorted by viewCount descending", async () => {
    const mockOverview = {
      totalArticles: 2,
      publishedArticles: 2,
      draftArticles: 0,
      totalViews: 100,
      totalUsers: 1,
      totalCategories: 1,
      articlesByCategory: [],
      articlesByMonth: [],
      topArticles: [
        { title: "Most Popular", slug: "most-popular", viewCount: 80 },
        { title: "Second", slug: "second", viewCount: 15 },
      ],
    };

    vi.mocked(db.getAnalyticsOverview).mockResolvedValue(mockOverview);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.overview();

    expect(result.topArticles).toHaveLength(2);
    expect(result.topArticles[0].viewCount).toBeGreaterThanOrEqual(result.topArticles[1].viewCount);
    // Verify descending order
    for (let i = 0; i < result.topArticles.length - 1; i++) {
      expect(result.topArticles[i].viewCount).toBeGreaterThanOrEqual(
        result.topArticles[i + 1].viewCount
      );
    }
  });

  it("denies unauthenticated user access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.analytics.overview()).rejects.toThrow();
  });

  it("denies regular user access (FORBIDDEN)", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.analytics.overview()).rejects.toThrow(
      "Admin access required"
    );
  });
});

describe("analytics.pageViewStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPageViewStats = {
    totalViews: 500,
    todayViews: 12,
    dailyViews: [
      { date: "2026-03-20", views: 20, uniqueVisitors: 15 },
      { date: "2026-03-21", views: 25, uniqueVisitors: 18 },
      { date: "2026-03-22", views: 12, uniqueVisitors: 10 },
    ],
    articleViews: [
      { articleId: 1, title: "Top Article", slug: "top-article", views: 50 },
      { articleId: 2, title: "Second Article", slug: "second-article", views: 30 },
    ],
    topPaths: [
      { path: "/blog/top-article", views: 50 },
      { path: "/", views: 40 },
    ],
  };

  it("returns daily views for admin with default 30 days", async () => {
    vi.mocked(db.getPageViewStats).mockResolvedValue(mockPageViewStats);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.pageViewStats();

    expect(result).toBeDefined();
    expect(result.totalViews).toBe(500);
    expect(result.todayViews).toBe(12);
    expect(result.dailyViews.length).toBeGreaterThan(0);
    expect(result.dailyViews[0]).toHaveProperty("date");
    expect(result.dailyViews[0]).toHaveProperty("views");
    expect(result.dailyViews[0]).toHaveProperty("uniqueVisitors");
    expect(db.getPageViewStats).toHaveBeenCalledWith(30);
  });

  it("accepts custom days parameter (7 days)", async () => {
    vi.mocked(db.getPageViewStats).mockResolvedValue(mockPageViewStats);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.analytics.pageViewStats({ days: 7 });

    expect(db.getPageViewStats).toHaveBeenCalledWith(7);
  });

  it("accepts days parameter up to 365", async () => {
    vi.mocked(db.getPageViewStats).mockResolvedValue(mockPageViewStats);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.analytics.pageViewStats({ days: 365 });

    expect(db.getPageViewStats).toHaveBeenCalledWith(365);
  });

  it("returns articleViews with title and slug", async () => {
    vi.mocked(db.getPageViewStats).mockResolvedValue(mockPageViewStats);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.pageViewStats({ days: 30 });

    for (const av of result.articleViews) {
      expect(av.title).toBeTruthy();
      expect(av.slug).toBeTruthy();
      expect(av.views).toBeGreaterThan(0);
    }
  });

  it("returns topPaths data", async () => {
    vi.mocked(db.getPageViewStats).mockResolvedValue(mockPageViewStats);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.pageViewStats({ days: 30 });

    expect(result.topPaths.length).toBeGreaterThan(0);
    expect(result.topPaths[0]).toHaveProperty("path");
    expect(result.topPaths[0]).toHaveProperty("views");
  });

  it("denies unauthenticated user access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.analytics.pageViewStats({ days: 30 })
    ).rejects.toThrow();
  });

  it("denies regular user access (FORBIDDEN)", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.analytics.pageViewStats({ days: 30 })
    ).rejects.toThrow("Admin access required");
  });
});

describe("analytics.recordView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows public user to record a page view", async () => {
    vi.mocked(db.recordPageView).mockResolvedValue(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.recordView({
      articleId: 1,
      path: "/blog/test-article",
    });

    expect(result.success).toBe(true);
  });

  it("allows recording view without articleId (general page view)", async () => {
    vi.mocked(db.recordPageView).mockResolvedValue(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.recordView({
      path: "/about",
    });

    expect(result.success).toBe(true);
  });
});
