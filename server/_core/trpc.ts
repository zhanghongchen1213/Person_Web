import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { logRequestPerformance } from "../performance";

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
