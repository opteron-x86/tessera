import type { IncomingMessage } from "node:http";
import { getToken } from "next-auth/jwt";

export type SocketIdentity = {
  userId: string;
  name?: string;
};

/**
 * Parse a raw Cookie header into a name → value record. Socket.IO hands us the
 * bare Node handshake request, and next-auth's SessionStore only reads the
 * pre-parsed `req.cookies` shape — it never falls back to the header string.
 */
export function parseCookieHeader(
  header: string | undefined,
): Partial<Record<string, string>> {
  const cookies: Partial<Record<string, string>> = {};
  if (!header) {
    return cookies;
  }

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) {
      continue;
    }
    const name = part.slice(0, separator).trim();
    if (!name) {
      continue;
    }
    const value = part.slice(separator + 1).trim();
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }

  return cookies;
}

/**
 * Resolve the signed-in user behind a Socket.IO handshake by verifying the
 * NextAuth session JWT on its cookies. Returns null for guests, expired
 * sessions, and forged tokens — identity never comes from event payloads.
 */
export async function resolveSocketIdentity(
  request: IncomingMessage,
): Promise<SocketIdentity | null> {
  const token = await getToken({
    req: Object.assign(request, {
      cookies: parseCookieHeader(request.headers.cookie),
    }),
  });

  if (!token?.sub) {
    return null;
  }

  return {
    userId: token.sub,
    name:
      typeof token.name === "string" && token.name ? token.name : undefined,
  };
}
