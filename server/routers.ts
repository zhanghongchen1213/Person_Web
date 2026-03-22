import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import {
  appCache,
  generateArticleListKey,
  generateCategoryListKey,
  generateDocTreeKey,
  invalidateArticleCache,
  invalidateCategoryCache,
} from "./_core/cache";
import { restartScheduler } from "./_core/backup-scheduler";
import type { DatabaseExportData } from "./db";

// Admin procedure - only allows admin users
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Article routes
  article: router({
    // List articles (public) - with cache (TTL: 5 minutes)
    list: publicProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(50).default(10),
            page: z.number().min(1).default(1),
            status: z.enum(["draft", "published", "archived"]).optional(),
            type: z.enum(["blog", "doc"]).optional(),
            categorySlug: z.string().optional(),
            search: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const params = {
          limit: input?.limit ?? 10,
          page: input?.page ?? 1,
          status: input?.status ?? "published",
          type: input?.type,
          categorySlug: input?.categorySlug,
          search: input?.search,
        };

        // Generate cache key
        const cacheKey = generateArticleListKey(params);

        // Try to get from cache
        const cached = appCache.get(cacheKey);
        if (cached) {
          return cached as Awaited<ReturnType<typeof db.getArticles>>;
        }

        // Cache miss - fetch from database
        const result = await db.getArticles(params);

        // Store in cache with 5 minutes TTL
        appCache.set(cacheKey, result, 5 * 60 * 1000);

        return result;
      }),

    // Get single article by slug (public)
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await db.getArticleBySlug(input.slug);
        if (!article) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found",
          });
        }
        return article;
      }),

    // Get single article by ID (admin)
    byId: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const article = await db.getArticleById(input.id);
        if (!article) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found",
          });
        }
        return article;
      }),

    // Get stats (public)
    stats: publicProcedure.query(async () => {
      return await db.getStats();
    }),

    // Get archive (public) - with cache (TTL: 5 minutes)
    archive: publicProcedure.query(async () => {
      const cacheKey = "article:archive";
      const cached = appCache.get(cacheKey);
      if (cached) {
        return cached as Awaited<ReturnType<typeof db.getArchive>>;
      }
      const result = await db.getArchive();
      appCache.set(cacheKey, result, 5 * 60 * 1000);
      return result;
    }),

    // Get article count by category (public) - with cache (TTL: 10 minutes)
    countByCategory: publicProcedure.query(async () => {
      const cacheKey = "category:countByCategory";
      const cached = appCache.get(cacheKey);
      if (cached) {
        return cached as Awaited<ReturnType<typeof db.getArticleCountByCategory>>;
      }
      const result = await db.getArticleCountByCategory();
      appCache.set(cacheKey, result, 10 * 60 * 1000);
      return result;
    }),

    // Get related articles (public)
    related: publicProcedure
      .input(
        z.object({
          articleId: z.number(),
          categoryId: z.number().nullable(),
          limit: z.number().min(1).max(10).default(4),
        })
      )
      .query(async ({ input }) => {
        return await db.getRelatedArticles(
          input.articleId,
          input.categoryId,
          input.limit
        );
      }),

    // Search articles (public) - dedicated endpoint for full-text search
    search: publicProcedure
      .input(
        z.object({
          keyword: z.string().max(100),
          limit: z.number().min(1).max(50).default(50),
        })
      )
      .query(async ({ input, ctx }) => {
        if (!input.keyword.trim()) {
          return { articles: [], total: 0 };
        }

        // Rate limiting: max 10 searches per minute per IP
        const ip = ctx.req.ip || 'unknown';
        const rateLimitKey = `search:ratelimit:${ip}`;
        const currentCount = (appCache.get(rateLimitKey) as number) || 0;

        if (currentCount >= 10) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many search requests. Please try again later.",
          });
        }

        appCache.set(rateLimitKey, currentCount + 1, 60 * 1000);

        // Cache search results for 60 seconds
        const cacheKey = `search:${input.keyword}:${input.limit}`;
        const cached = appCache.get(cacheKey);
        if (cached) {
          return cached as { articles: any[]; total: number };
        }

        const result = await db.getArticles({
          search: input.keyword.slice(0, 100),
          limit: input.limit,
          status: "published",
        });

        const response = {
          articles: result.articles.map(a => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            summary: a.summary,
            publishedAt: a.publishedAt,
            category: a.category ? { name: a.category.name, slug: a.category.slug } : null,
          })),
          total: result.total,
        };

        appCache.set(cacheKey, response, 60 * 1000);
        return response;
      }),

    // Admin: list all articles including drafts
    adminList: adminProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(50).default(10),
            page: z.number().min(1).default(1),
            status: z.enum(["draft", "published", "archived"]).optional(),
            type: z.enum(["blog", "doc"]).optional(),
          })
          .optional()
      )
      .query(async ({ input, ctx }) => {
        return await db.getArticles({
          limit: input?.limit ?? 10,
          page: input?.page ?? 1,
          status: input?.status,
          type: input?.type,
        });
      }),

    // Create article (admin)
    // Supports categoryName for auto-creating category if it doesn't exist (FR8)
    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          slug: z.string().min(1).max(255),
          summary: z.string().optional(),
          content: z.string().min(1),
          coverImage: z.string().optional(),
          categoryId: z.number().optional(), // 分类 ID（直接指定）
          categoryName: z.string().min(1).max(100).optional(), // 分类名称（自动创建）
          status: z.enum(["draft", "published", "archived"]).default("draft"),
          type: z.enum(["blog", "doc"]).default("blog"),
          order: z.number().default(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { categoryName, ...articleData } = input;

        // If categoryName is provided but categoryId is not, auto-create category
        let resolvedCategoryId = articleData.categoryId;
        if (categoryName && !resolvedCategoryId) {
          const category = await db.findOrCreateCategory({
            name: categoryName,
            type: input.type,
          });
          resolvedCategoryId = category.id;

          // Invalidate category cache since a new category may have been created
          invalidateCategoryCache();
        }

        const articleId = await db.createArticle({
          ...articleData,
          categoryId: resolvedCategoryId,
          authorId: ctx.user.id,
        });

        // Invalidate article cache
        invalidateArticleCache();

        return { id: articleId };
      }),

    // Update article (admin)
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(255).optional(),
          slug: z.string().min(1).max(255).optional(),
          summary: z.string().optional(),
          content: z.string().min(1).optional(),
          coverImage: z.string().optional(),
          categoryId: z.number().optional(),
          status: z.enum(["draft", "published", "archived"]).optional(),
          type: z.enum(["blog", "doc"]).optional(),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateArticle(id, data);

        // Invalidate article cache
        invalidateArticleCache();

        return { success: true };
      }),

    // Delete article (admin)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteArticle(input.id);

        // Invalidate article cache
        invalidateArticleCache();

        return { success: true };
      }),

    // Upsert article by slug (admin) - for import/sync scenarios
    upsert: adminProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          slug: z.string().min(1).max(255),
          summary: z.string().optional(),
          content: z.string().min(1),
          coverImage: z.string().optional(),
          categoryId: z.number().optional(),
          status: z.enum(["draft", "published", "archived"]).default("draft"),
          type: z.enum(["blog", "doc"]).default("blog"),
          order: z.number().default(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const articleId = await db.upsertArticle({
          ...input,
          authorId: ctx.user.id,
        });

        // Invalidate article cache
        invalidateArticleCache();

        return { id: articleId };
      }),

    // Update article published date (admin)
    updatePublishedAt: adminProcedure
      .input(
        z.object({
          id: z.number(),
          publishedAt: z.date(),
        })
      )
      .mutation(async ({ input, ctx: _ctx }) => {
        // Verify article exists and belongs to current admin
        const article = await db.getArticleById(input.id);
        if (!article) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found",
          });
        }

        // Only admin can update any article
        // If we want to restrict to author only, uncomment below:
        // if (article.authorId !== ctx.user.id) {
        //   throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own articles" });
        // }

        await db.updateArticlePublishedAt(input.id, input.publishedAt);

        // Invalidate article cache
        invalidateArticleCache();

        // Return updated article
        const updatedArticle = await db.getArticleById(input.id);
        return updatedArticle;
      }),
  }),

  // Category routes
  category: router({
    // List categories (public) - with cache (TTL: 10 minutes)
    list: publicProcedure
      .input(
        z
          .object({
            type: z.enum(["blog", "doc"]).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        // Generate cache key
        const cacheKey = generateCategoryListKey({ type: input?.type });

        // Try to get from cache
        const cached = appCache.get(cacheKey);
        if (cached) {
          return cached as Awaited<ReturnType<typeof db.getCategories>>;
        }

        // Cache miss - fetch from database
        const result = await db.getCategories({ type: input?.type });

        // Store in cache with 10 minutes TTL
        appCache.set(cacheKey, result, 10 * 60 * 1000);

        return result;
      }),

    // Get category by slug (public)
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const category = await db.getCategoryBySlug(input.slug);
        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }
        return category;
      }),

    // Create category (admin)
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          slug: z.string().min(1).max(100),
          description: z.string().optional(),
          icon: z.string().optional(),
          sortOrder: z.number().optional(),
          type: z.enum(["blog", "doc"]).default("blog"),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createCategory(input);

        // Invalidate category cache
        invalidateCategoryCache();

        return { id };
      }),

    // Update category (admin)
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(100).optional(),
          slug: z.string().min(1).max(100).optional(),
          description: z.string().optional(),
          icon: z.string().optional(),
          sortOrder: z.number().optional(),
          type: z.enum(["blog", "doc"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCategory(id, data);

        // Invalidate category cache
        invalidateCategoryCache();

        return { success: true };
      }),

    // Delete category (admin)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCategory(input.id);

        // Invalidate category cache
        invalidateCategoryCache();

        return { success: true };
      }),

    // Initialize default categories (admin)
    initDefaults: adminProcedure.mutation(async () => {
      await db.initDefaultCategories();

      // Invalidate category cache after initialization
      invalidateCategoryCache();

      return { success: true };
    }),

    /**
     * Find or create a category by name.
     * If the category already exists, returns the existing one.
     * If not, creates a new category with auto-generated slug.
     * Used for the Write page Combobox to support creating new categories on the fly.
     */
    findOrCreate: adminProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          type: z.enum(["blog", "doc"]).default("blog"),
        })
      )
      .mutation(async ({ input }) => {
        const category = await db.findOrCreateCategory({
          name: input.name,
          type: input.type,
        });

        // Invalidate category cache (in case a new category was created)
        invalidateCategoryCache();

        return category;
      }),

    // Get category with articles (public) - enhanced query with N+1 optimization
    withArticles: publicProcedure
      .input(
        z.object({
          slug: z.string(),
          limit: z.number().min(1).max(50).default(10),
          page: z.number().min(1).default(1),
          status: z
            .enum(["draft", "published", "archived"])
            .default("published"),
        })
      )
      .query(async ({ input }) => {
        const result = await db.getCategoryWithArticles(input.slug, {
          limit: input.limit,
          page: input.page,
          status: input.status,
        });
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }
        return result;
      }),
  }),

  // Documentation routes
  doc: router({
    /**
     * Get document tree for navigation sidebar.
     * Returns categories of type 'doc' with their articles sorted by order.
     * Cached with 10 minutes TTL.
     */
    tree: publicProcedure
      .input(
        z
          .object({
            categorySlug: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        // Generate cache key
        const cacheKey = generateDocTreeKey(input?.categorySlug);

        // Try to get from cache
        const cached = appCache.get(cacheKey);
        if (cached) {
          return cached as Awaited<ReturnType<typeof db.getDocTree>>;
        }

        // Cache miss - fetch from database
        const result = await db.getDocTree(input?.categorySlug);

        // Store in cache with 10 minutes TTL
        appCache.set(cacheKey, result, 10 * 60 * 1000);

        return result;
      }),
  }),

  // Analytics routes
  analytics: router({
    overview: adminProcedure.query(async () => {
      const cacheKey = "analytics:overview";
      const cached = appCache.get(cacheKey);
      if (cached)
        return cached as Awaited<ReturnType<typeof db.getAnalyticsOverview>>;
      const result = await db.getAnalyticsOverview();
      appCache.set(cacheKey, result, 60 * 1000);
      return result;
    }),
    pageViewStats: adminProcedure
      .input(
        z.object({ days: z.number().min(1).max(365).default(30) }).optional()
      )
      .query(async ({ input }) => {
        const days = input?.days ?? 30;
        const cacheKey = `analytics:pageViewStats:${days}`;
        const cached = appCache.get(cacheKey);
        if (cached)
          return cached as Awaited<ReturnType<typeof db.getPageViewStats>>;
        const result = await db.getPageViewStats(days);
        appCache.set(cacheKey, result, 60 * 1000);
        return result;
      }),
    recordView: publicProcedure
      .input(
        z.object({
          articleId: z.number().optional(),
          path: z.string().max(500).optional(),
        })
      )
      .mutation(({ input, ctx }) => {
        // Use req.ip which respects Express "trust proxy" setting
        // This is safer than manually parsing x-forwarded-for (prevents IP spoofing)
        const ip = ctx.req.ip || null;
        const userAgent = ctx.req.headers["user-agent"] || null;
        // Fire-and-forget: don't await DB write to minimize response latency
        // .catch() prevents unhandled Promise rejection if getDb() throws
        db.recordPageView({
          articleId: input.articleId,
          ip,
          userAgent,
          path: input.path,
        }).catch(() => {});
        return { success: true };
      }),
  }),

  // Database management routes (admin only)
  database: router({
    // Get database statistics
    stats: adminProcedure.query(async () => {
      return await db.getDatabaseStats();
    }),

    // Export all data
    export: adminProcedure.query(async () => {
      return await db.exportAllData();
    }),

    // Import data (replaces all existing data)
    import: adminProcedure
      .input(
        z.object({
          version: z.string(),
          exportedAt: z.string(),
          data: z.object({
            users: z.array(z.record(z.string(), z.unknown())),
            articles: z.array(z.record(z.string(), z.unknown())),
            categories: z.array(z.record(z.string(), z.unknown())),
            pageViews: z.array(z.record(z.string(), z.unknown())).optional(),
            backupSettings: z
              .array(z.record(z.string(), z.unknown()))
              .optional(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const result = await db.importAllData(input as DatabaseExportData);

        // Invalidate all caches after import
        invalidateArticleCache();
        invalidateCategoryCache();

        return result;
      }),

    // Get backup settings
    backupSettings: adminProcedure.query(async () => {
      return await db.getBackupSettings();
    }),

    // Update backup settings
    updateBackupSettings: adminProcedure
      .input(
        z.object({
          enabled: z.boolean(),
          interval: z.enum(["weekly", "monthly", "quarterly"]),
        })
      )
      .mutation(async ({ input }) => {
        const result = await db.updateBackupSettings(
          input.enabled,
          input.interval
        );
        await restartScheduler();
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
