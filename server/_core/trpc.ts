import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { logRequestPerformance } from "../performance";

// Issue 2 Fix: Simple rate limiter for export/import operations
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute

function checkRateLimit(key: string): void {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded. Please try again later.",
    });
  }

  record.count++;
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

/**
 * Performance monitoring middleware
 * Tracks request duration and logs slow queries (> 500ms)
 */
const performanceMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const startTime = performance.now();

  try {
    const result = await next();
    const duration = performance.now() - startTime;

    // Log request performance
    logRequestPerformance(
      `${type}.${path}`,
      duration,
      'success',
      ctx.user?.id
    );

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    // Log failed request
    logRequestPerformance(
      `${type}.${path}`,
      duration,
      'error',
      ctx.user?.id
    );

    throw error;
  }
});

export const router = t.router;
export const publicProcedure = t.procedure.use(performanceMiddleware);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(performanceMiddleware).use(requireUser);

export const adminProcedure = t.procedure.use(performanceMiddleware).use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// Issue 2 Fix: Rate-limited admin procedure for sensitive operations
export const rateLimitedAdminProcedure = t.procedure.use(performanceMiddleware).use(
  t.middleware(async opts => {
    const { ctx, next, path } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    // Apply rate limiting
    checkRateLimit(`admin:${ctx.user.id}:${path}`);

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
