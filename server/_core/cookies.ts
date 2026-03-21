import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const isLocalhost = LOCAL_HOSTS.has(hostname) || hostname === "127.0.0.1";

  // Cross-origin production: sameSite "none" + secure required for cross-domain cookies
  // Development / same-origin: sameSite "lax" is sufficient
  const isCrossOrigin = !isLocalhost && process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    path: "/",
    sameSite: isCrossOrigin ? "none" as const : "lax" as const,
    secure: isCrossOrigin ? true : (isLocalhost ? false : isSecureRequest(req)),
    ...(isCrossOrigin && { domain: ".zhcmqtt.top" }),
  };
}
