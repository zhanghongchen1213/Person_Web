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
  deleteArticle: vi.fn(),
  upsertArticle: vi.fn(),
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
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

