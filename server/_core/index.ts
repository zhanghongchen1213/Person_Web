import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerMockOAuthRoutes } from "./mock-oauth";
import { registerGitHubOAuthRoutes } from "./github-oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { logCacheStats } from "../performance";

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
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Register Mock OAuth routes for local development and Docker testing
  // Enable when OAUTH_SERVER_URL points to localhost (indicating local testing)
  const oauthServerUrl = process.env.OAUTH_SERVER_URL || "";
  const isLocalOAuth = oauthServerUrl.includes("localhost") || oauthServerUrl.includes("127.0.0.1");

  if (process.env.NODE_ENV === "development" || isLocalOAuth) {
    registerMockOAuthRoutes(app);
    console.log("[MockOAuth] Mock OAuth routes registered for local testing");
  }

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // GitHub OAuth routes
  registerGitHubOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Start performance monitoring - log cache stats every 5 minutes
    const STATS_INTERVAL = 5 * 60 * 1000; // 5 minutes
    setInterval(() => {
      logCacheStats();
    }, STATS_INTERVAL);

    console.log('[Performance Monitor] Started - Stats will be logged every 5 minutes');
  });
}

startServer().catch(console.error);
