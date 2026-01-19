export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  if (!oauthPortalUrl) {
    console.warn("VITE_OAUTH_PORTAL_URL is not defined");
    return "#";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (e) {
    console.error("Invalid OAuth Portal URL:", oauthPortalUrl);
    return "#";
  }
};

// Generate GitHub OAuth login URL
export const getGitHubLoginUrl = () => {
  const state = Math.random().toString(36).substring(7);
  return `/api/auth/github/login?state=${state}`;
};
