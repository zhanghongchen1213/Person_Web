import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", () => ({
  getArticles: vi.fn(),
  getArticleBySlug: vi.fn(),
  getArticleById: vi.fn(),
  incrementViewCount: vi.fn(),
  getStats: vi.fn(),
  getArchive: vi.fn(),
  createArticle: vi.fn(),
  updateArticle: vi.fn(),
  deleteArticle: vi.fn(),
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getTags: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

import * as db from "./db";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
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
    } as TrpcContext["res"],
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
    } as TrpcContext["res"],
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
          status: "published",
          viewCount: 100,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 1, name: "Author", avatar: null },
          category: null,
          tags: [],
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
      viewCount: 100,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { id: 1, name: "Author", avatar: null },
      category: null,
      tags: [],
    };

    vi.mocked(db.getArticleBySlug).mockResolvedValue(mockArticle);
    vi.mocked(db.incrementViewCount).mockResolvedValue();

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.bySlug({ slug: "test-article" });

    expect(result.title).toBe("Test Article");
    expect(db.incrementViewCount).toHaveBeenCalledWith(1);
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
      tagCount: 15,
      totalViews: 1000,
    };

    vi.mocked(db.getStats).mockResolvedValue(mockStats);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.article.stats();

    expect(result.articleCount).toBe(10);
    expect(result.totalViews).toBe(1000);
  });
});

describe("category.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all categories", async () => {
    const mockCategories = [
      { id: 1, name: "Tech", slug: "tech", description: null, createdAt: new Date() },
      { id: 2, name: "Life", slug: "life", description: null, createdAt: new Date() },
    ];

    vi.mocked(db.getCategories).mockResolvedValue(mockCategories);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.category.list();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Tech");
  });
});

describe("tag.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all tags", async () => {
    const mockTags = [
      { id: 1, name: "JavaScript", slug: "javascript", createdAt: new Date() },
      { id: 2, name: "React", slug: "react", createdAt: new Date() },
    ];

    vi.mocked(db.getTags).mockResolvedValue(mockTags);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tag.list();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("JavaScript");
  });
});
