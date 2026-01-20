import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

/**
 * GitHub OAuth 配置
 */
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback";

/**
 * GitHub OAuth 端点
 */
const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_API_URL = "https://api.github.com/user";

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

/**
 * 注册 GitHub OAuth 路由
 */
export function registerGitHubOAuthRoutes(app: Express) {
  console.log("[GitHubOAuth] Registering GitHub OAuth routes...");

  // 1. 发起 GitHub OAuth 登录
  app.get("/api/auth/github/login", (req: Request, res: Response) => {
    const state = req.query.state as string || Math.random().toString(36).substring(7);

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_CALLBACK_URL,
      scope: "read:user user:email",
      state: state,
    });

    const authUrl = `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
    console.log(`[GitHubOAuth] Redirecting to GitHub: ${authUrl}`);

    res.redirect(authUrl);
  });

  // 2. GitHub OAuth 回调处理
  app.get("/api/auth/github/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code) {
      console.error("[GitHubOAuth] Missing authorization code");
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    try {
      // 交换 code 获取 access_token
      const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: GITHUB_CALLBACK_URL,
        }),
      });

      const tokenData: GitHubTokenResponse = await tokenResponse.json();

      if (!tokenData.access_token) {
        console.error("[GitHubOAuth] Failed to get access token");
        res.status(400).json({ error: "Failed to get access token" });
        return;
      }

      console.log("[GitHubOAuth] Successfully obtained access token");

      // 获取 GitHub 用户信息
      const userResponse = await fetch(GITHUB_USER_API_URL, {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
          "Accept": "application/json",
        },
      });

      const githubUser: GitHubUser = await userResponse.json();

      if (!githubUser.id) {
        console.error("[GitHubOAuth] Failed to get user info");
        res.status(400).json({ error: "Failed to get user info" });
        return;
      }

      console.log(`[GitHubOAuth] User authenticated: ${githubUser.login}`);

      // 生成 openId (使用 github:id 格式)
      const openId = `github:${githubUser.id}`;

      // 保存或更新用户信息到数据库
      await db.upsertUser({
        openId: openId,
        name: githubUser.name || githubUser.login,
        email: githubUser.email || null,
        loginMethod: "github",
        lastSignedIn: new Date(),
      });

      console.log(`[GitHubOAuth] User saved to database: ${openId}`);

      // 创建会话 token
      console.log(`[GitHubOAuth] Creating session with appId: ${ENV.appId}`);
      const sessionToken = await sdk.createSessionToken(openId, {
        name: githubUser.name || githubUser.login,
        expiresInMs: ONE_YEAR_MS,
      });

      // 设置 cookie
      const cookieOptions = getSessionCookieOptions(req);
      console.log(`[GitHubOAuth] Cookie options:`, cookieOptions);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[GitHubOAuth] Session created, redirecting to home");

      // 重定向到首页
      res.redirect(302, "/");
    } catch (error) {
      console.error("[GitHubOAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  console.log("[GitHubOAuth] Routes registered: GET /api/auth/github/login, GET /api/auth/github/callback");
}
