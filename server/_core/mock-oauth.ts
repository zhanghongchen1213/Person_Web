import { Express, Request, Response } from "express";
import { ExchangeTokenResponse, GetUserInfoResponse } from "./types/manusTypes";
import { ENV } from "./env";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { upsertUser } from "../db";

/**
 * 注册 Mock OAuth 路由，用于开发和测试环境。
 * 这些路由模拟了真实 OAuth 提供商的行为。
 */
export function registerMockOAuthRoutes(app: Express) {
  console.log("[MockOAuth] Registering mock OAuth routes...");

  // 1. 模拟 OAuth 登录页面重定向
  // 客户端重定向到这里，我们直接带上 code 跳回 redirectUri
  app.get("/app-auth", (req: Request, res: Response) => {
    const redirectUri = req.query.redirectUri as string;
    const state = req.query.state as string;

    if (!redirectUri || !state) {
      res.status(400).send("Missing redirectUri or state");
      return;
    }

    console.log(`[MockOAuth] /app-auth called. Redirecting to ${redirectUri}`);

    const callbackUrl = new URL(redirectUri);
    // 生成一个模拟的 Authorization Code
    callbackUrl.searchParams.set("code", "mock-auth-code-" + Date.now());
    callbackUrl.searchParams.set("state", state);
    
    // 重定向回客户端应用的回调地址
    res.redirect(callbackUrl.toString());
  });

  // 2. 模拟 Exchange Token 接口
  // SDK 调用此接口用 code 换取 token
  app.post(
    "/webdev.v1.WebDevAuthPublicService/ExchangeToken",
    (req: Request, res: Response) => {
      console.log("[MockOAuth] ExchangeToken called");
      
      const response: ExchangeTokenResponse = {
        accessToken: "mock-access-token-" + Date.now(),
        tokenType: "Bearer",
        expiresIn: 3600,
        scope: "profile email",
        idToken: "mock-id-token",
      };
      
      res.json(response);
    }
  );

  // 3. 模拟 Get User Info 接口
  // SDK 调用此接口用 token 获取用户信息
  app.post(
    "/webdev.v1.WebDevAuthPublicService/GetUserInfo",
    (req: Request, res: Response) => {
      console.log("[MockOAuth] GetUserInfo called");
      
      // 返回一个模拟用户
      // 如果没有配置 ownerOpenId，则默认这个用户就是管理员
      const mockOpenId = "mock-user-openid-dev";
      
      // 检查当前用户是否应该具有 Admin 权限
      // 在开发模式下，通常我们希望测试用户就是 Admin
      // 如果 ENV.ownerOpenId 未设置，或者匹配 mockOpenId，则此用户将获得 admin 权限（由 db.ts 处理）
      
      const response: GetUserInfoResponse = {
        openId: mockOpenId,
        projectId: "mock-project-id",
        name: "Developer Admin",
        email: "dev@example.com",
        platform: "REGISTERED_PLATFORM_GITHUB", 
        loginMethod: "github",
      };
      
      res.json(response);
    }
  );

  // 4. 开发环境专用：一键登录管理员测试入口
  app.get("/api/dev/login-admin", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== "development") {
      res.status(403).send("Only available in development mode");
      return;
    }

    console.log("[MockOAuth] Dev admin login requested");

    const mockOpenId = "mock-admin-openid-dev";
    const cookieOptions = getSessionCookieOptions(req);

    try {
      // 创建或更新管理员用户
      await upsertUser({
        openId: mockOpenId,
        name: "Test Admin",
        email: "admin@test.local",
        avatar: null,
        role: "admin",
        lastSignedIn: new Date(),
      });

      // 创建会话 token
      const sessionToken = await sdk.createSessionToken(mockOpenId, {
        name: "Test Admin",
      });

      // 设置 cookie
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[MockOAuth] Admin session created successfully");
      res.redirect("/admin/database");
    } catch (error) {
      console.error("[MockOAuth] Failed to create admin session:", error);
      res.status(500).send("Failed to create admin session");
    }
  });

  console.log("[MockOAuth] Routes registered: GET /app-auth, GET /api/dev/login-admin, POST /webdev.v1.WebDevAuthPublicService/*");
}