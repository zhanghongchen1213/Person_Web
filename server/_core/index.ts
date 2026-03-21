import "dotenv/config";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerMockOAuthRoutes } from "./mock-oauth";
import { registerGitHubOAuthRoutes } from "./github-oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { setupVite } from "./vite";
import { logCacheStats } from "../performance";
import { initBackupScheduler } from "./backup-scheduler";
import { ensureFulltextIndex, ensurePageViewsTable } from "../db";
import { seoMiddleware } from "./seo";
import { generateSitemap } from "./sitemap";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.use(compression());
  app.use(helmet({
    contentSecurityPolicy: false, // CSP handled by Nginx in production
  }));

  // CORS middleware - must be before all route handlers
  const allowedOrigins = process.env.NODE_ENV === "production"
    ? (process.env.CORS_ALLOWED_ORIGINS?.split(",").map(o => o.trim()).filter(Boolean) || ["https://zhcmqtt.top", "https://www.zhcmqtt.top"])
    : ["http://localhost:5173", "http://localhost:3000"];

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  // HIGH #5: FRONTEND_URL 与 CORS 交叉校验
  if (process.env.NODE_ENV === "production") {
    try {
      const frontendOrigin = new URL(ENV.frontendUrl).origin;
      if (!allowedOrigins.includes(frontendOrigin)) {
        console.warn(
          `[ENV] WARNING: FRONTEND_URL origin "${frontendOrigin}" is NOT in CORS_ALLOWED_ORIGINS [${allowedOrigins.join(", ")}]. ` +
          "OAuth redirects may fail due to CORS blocking."
        );
      }
    } catch {
      console.warn("[ENV] WARNING: FRONTEND_URL is not a valid URL:", ENV.frontendUrl);
    }
  }

  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Register Mock OAuth routes for local development only
  if (process.env.NODE_ENV === "development") {
    registerMockOAuthRoutes(app);
    console.log("[MockOAuth] Mock OAuth routes registered for local testing");
  }

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // GitHub OAuth routes
  registerGitHubOAuthRoutes(app);
  // Sitemap and robots.txt
  app.get("/sitemap.xml", async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const xml = await generateSitemap(baseUrl);
    res.set("Content-Type", "application/xml").send(xml);
  });

  app.get("/robots.txt", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.set("Content-Type", "text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`);
  });

  // SEO crawler middleware
  app.use(seoMiddleware);

  // API rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", apiLimiter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Development mode: use Vite dev server for HMR
  // Production mode: static files served by Nginx, Express only handles API
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  }
  // Production mode: no static file serving - handled by Nginx/CDN

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Initialize backup scheduler
    initBackupScheduler().then(() => {
      console.log('[Backup Scheduler] Initialized');
    }).catch((err) => {
      console.error('[Backup Scheduler] Failed to initialize:', err);
    });

    // Ensure fulltext index for search
    ensureFulltextIndex().catch((err) => {
      console.warn('[Fulltext Index] Failed:', err);
    });

    // Ensure page_views table exists
    ensurePageViewsTable().catch((err) => {
      console.warn('[Page Views Table] Failed:', err);
    });

    // Start performance monitoring - log cache stats every 5 minutes
    const STATS_INTERVAL = 5 * 60 * 1000; // 5 minutes
    setInterval(() => {
      logCacheStats();
    }, STATS_INTERVAL);

    console.log('[Performance Monitor] Started - Stats will be logged every 5 minutes');
  });
}

startServer().catch(console.error);
