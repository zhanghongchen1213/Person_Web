import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

// Admin procedure - only allows admin users
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
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
    // List articles (public)
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(10),
        page: z.number().min(1).default(1),
        status: z.enum(["draft", "published", "archived"]).optional(),
        type: z.enum(["blog", "doc"]).optional(),
        categorySlug: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getArticles({
          limit: input?.limit ?? 10,
          page: input?.page ?? 1,
          status: input?.status ?? "published",
          type: input?.type,
          categorySlug: input?.categorySlug,
          search: input?.search,
        });
      }),

    // Get single article by slug (public)
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await db.getArticleBySlug(input.slug);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }
        return article;
      }),

    // Get single article by ID (admin)
    byId: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const article = await db.getArticleById(input.id);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }
        return article;
      }),

    // Get stats (public)
    stats: publicProcedure.query(async () => {
      return await db.getStats();
    }),

    // Get archive (public)
    archive: publicProcedure.query(async () => {
      return await db.getArchive();
    }),

    // Get article count by category (public)
    countByCategory: publicProcedure.query(async () => {
      return await db.getArticleCountByCategory();
    }),

    // Get related articles (public)
    related: publicProcedure
      .input(z.object({
        articleId: z.number(),
        categoryId: z.number().nullable(),
        limit: z.number().min(1).max(10).default(4),
      }))
      .query(async ({ input }) => {
        return await db.getRelatedArticles(input.articleId, input.categoryId, input.limit);
      }),

    // Admin: list all articles including drafts
    adminList: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(10),
        page: z.number().min(1).default(1),
        status: z.enum(["draft", "published", "archived"]).optional(),
        type: z.enum(["blog", "doc"]).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return await db.getArticles({
          limit: input?.limit ?? 10,
          page: input?.page ?? 1,
          status: input?.status,
          type: input?.type,
          authorId: ctx.user.id,
        });
      }),

    // Create article (admin)
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        summary: z.string().optional(),
        content: z.string().min(1),
        coverImage: z.string().optional(),
        categoryId: z.number().optional(), // 分类（建议填写）
        status: z.enum(["draft", "published", "archived"]).default("draft"),
        type: z.enum(["blog", "doc"]).default("blog"),
        order: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        const articleId = await db.createArticle({
          ...input,
          authorId: ctx.user.id,
        });
        return { id: articleId };
      }),

    // Update article (admin)
    update: adminProcedure
      .input(z.object({
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
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateArticle(id, data);
        return { success: true };
      }),

    // Delete article (admin)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteArticle(input.id);
        return { success: true };
      }),
  }),

  // Category routes
  category: router({
    // List categories (public)
    list: publicProcedure
      .input(z.object({
        type: z.enum(["blog", "doc"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getCategories({ type: input?.type });
      }),

    // Get category by slug (public)
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const category = await db.getCategoryBySlug(input.slug);
        if (!category) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
        }
        return category;
      }),

    // Create category (admin)
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(100),
        description: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().optional(),
        type: z.enum(["blog", "doc"]).default("blog"),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCategory(input);
        return { id };
      }),

    // Update category (admin)
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        slug: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().optional(),
        type: z.enum(["blog", "doc"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCategory(id, data);
        return { success: true };
      }),

    // Delete category (admin)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCategory(input.id);
        return { success: true };
      }),

    // Initialize default categories (admin)
    initDefaults: adminProcedure.mutation(async () => {
      await db.initDefaultCategories();
      return { success: true };
    }),

    // Get category with articles (public) - enhanced query with N+1 optimization
    withArticles: publicProcedure
      .input(z.object({
        slug: z.string(),
        limit: z.number().min(1).max(50).default(10),
        page: z.number().min(1).default(1),
        status: z.enum(["draft", "published", "archived"]).default("published"),
      }))
      .query(async ({ input }) => {
        const result = await db.getCategoryWithArticles(input.slug, {
          limit: input.limit,
          page: input.page,
          status: input.status,
        });
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
        }
        return result;
      }),
  }),

  // Documentation routes
  doc: router({
    /**
     * Get document tree for navigation sidebar.
     * Returns categories of type 'doc' with their articles sorted by order.
     */
    tree: publicProcedure
      .input(z.object({
        categorySlug: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getDocTree(input?.categorySlug);
      }),
  }),
});

export type AppRouter = typeof appRouter;
