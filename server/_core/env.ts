/** 去除 URL 尾部斜杠，避免拼接路径时出现双斜杠 */
function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

const isProduction = process.env.NODE_ENV === "production";

// 生产环境下 FRONTEND_URL 必须显式配置，不可回退到 localhost
const rawFrontendUrl = process.env.FRONTEND_URL ?? "";
if (isProduction && !rawFrontendUrl) {
  throw new Error(
    "[ENV] FRONTEND_URL is required in production. " +
    "Set it to the frontend origin (e.g. https://your-domain.com)."
  );
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // 前端 URL，用于 OAuth 回调后重定向
  // 开发环境默认: http://localhost:5173 (Vite dev server)
  // 生产环境: 必须通过环境变量配置为实际前端域名
  frontendUrl: trimTrailingSlash(rawFrontendUrl || "http://localhost:5173"),
  // Cookie domain，用于跨域 Cookie 设置
  // undefined 时浏览器默认使用当前域名
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
};
