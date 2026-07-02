import type { IncomingMessage } from "node:http";
import { encode } from "next-auth/jwt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseCookieHeader,
  resolveSocketIdentity,
} from "../../src/server/socket-auth";

const SECRET = "socket-auth-test-secret";

function fakeRequest(cookie?: string): IncomingMessage {
  return { headers: cookie ? { cookie } : {} } as IncomingMessage;
}

function sessionToken(payload: Record<string, unknown>, secret = SECRET) {
  return encode({ token: payload, secret });
}

describe("parseCookieHeader", () => {
  it("parses multiple cookies and trims whitespace", () => {
    expect(parseCookieHeader("a=1; b=two ;c= three")).toEqual({
      a: "1",
      b: "two",
      c: "three",
    });
  });

  it("keeps '=' characters inside values", () => {
    expect(parseCookieHeader("token=abc=def==")).toEqual({
      token: "abc=def==",
    });
  });

  it("decodes URI-encoded values and keeps malformed ones raw", () => {
    expect(parseCookieHeader("a=hello%20world; b=%E0%A4%A")).toEqual({
      a: "hello world",
      b: "%E0%A4%A",
    });
  });

  it("skips nameless or separator-less segments", () => {
    expect(parseCookieHeader("=orphan; noseparator; a=1")).toEqual({ a: "1" });
  });

  it("returns an empty record for a missing header", () => {
    expect(parseCookieHeader(undefined)).toEqual({});
  });
});

describe("resolveSocketIdentity", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", SECRET);
    // http origin → unprefixed cookie name, matching the dev/test servers
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves the user behind a valid session cookie", async () => {
    const token = await sessionToken({ sub: "user-1", name: "Wayfarer" });
    const identity = await resolveSocketIdentity(
      fakeRequest(`next-auth.session-token=${token}`),
    );
    expect(identity).toEqual({ userId: "user-1", name: "Wayfarer" });
  });

  it("omits the name when the token has none", async () => {
    const token = await sessionToken({ sub: "user-2" });
    const identity = await resolveSocketIdentity(
      fakeRequest(`next-auth.session-token=${token}`),
    );
    expect(identity).toEqual({ userId: "user-2", name: undefined });
  });

  it("reassembles chunked session cookies", async () => {
    const token = await sessionToken({ sub: "user-3", name: "Chunky" });
    const half = Math.ceil(token.length / 2);
    const cookie = [
      `next-auth.session-token.0=${token.slice(0, half)}`,
      `next-auth.session-token.1=${token.slice(half)}`,
    ].join("; ");
    const identity = await resolveSocketIdentity(fakeRequest(cookie));
    expect(identity).toEqual({ userId: "user-3", name: "Chunky" });
  });

  it("uses the __Secure- cookie name behind an https origin", async () => {
    vi.stubEnv("NEXTAUTH_URL", "https://tessera.example");
    const token = await sessionToken({ sub: "user-4", name: "Secure" });
    const identity = await resolveSocketIdentity(
      fakeRequest(`__Secure-next-auth.session-token=${token}`),
    );
    expect(identity).toEqual({ userId: "user-4", name: "Secure" });
  });

  it("returns null without a session cookie", async () => {
    await expect(resolveSocketIdentity(fakeRequest())).resolves.toBeNull();
    await expect(
      resolveSocketIdentity(fakeRequest("theme=dark; other=1")),
    ).resolves.toBeNull();
  });

  it("rejects garbage tokens", async () => {
    await expect(
      resolveSocketIdentity(
        fakeRequest("next-auth.session-token=not-a-real-jwt"),
      ),
    ).resolves.toBeNull();
  });

  it("rejects tokens signed with a different secret", async () => {
    const forged = await sessionToken({ sub: "victim" }, "attacker-secret");
    await expect(
      resolveSocketIdentity(fakeRequest(`next-auth.session-token=${forged}`)),
    ).resolves.toBeNull();
  });

  it("rejects tokens without a subject", async () => {
    const token = await sessionToken({ name: "No Subject" });
    await expect(
      resolveSocketIdentity(fakeRequest(`next-auth.session-token=${token}`)),
    ).resolves.toBeNull();
  });
});
