/**
 * Volunteer session helpers.
 *
 * Cookies are signed with HMAC-SHA256 so they cannot be forged.
 * Set VOLUNTEER_SESSION_SECRET in your environment (required in production).
 * Access keys are 6-character uppercase alphanumeric strings (no I/O/1/0).
 */

import { createHmac, randomBytes } from "crypto";

export interface VolunteerSession {
  /** UUID of the organisation the volunteer authenticated against. */
  orgId: string;
  orgName: string;
  /** DB row ID of the org_access_keys entry that was used. */
  keyId: string;
  /** Expiry as Unix epoch milliseconds. */
  exp: number;
}

export const COOKIE_NAME = "wm-volunteer";

/** 8-hour volunteer shift session. */
const SESSION_MS = 8 * 60 * 60 * 1000;

/** Characters that are unambiguous in print / handwriting. */
const KEY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function keySecret(): string {
  const s = process.env.VOLUNTEER_ACCESS_KEY_SECRET ?? process.env.VOLUNTEER_SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    throw new Error("VOLUNTEER_ACCESS_KEY_SECRET (or VOLUNTEER_SESSION_SECRET) must be set in production.");
  }
  return s ?? "dev-insecure-change-me";
}

function secret(): string {
  const s = process.env.VOLUNTEER_SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    throw new Error("VOLUNTEER_SESSION_SECRET env var must be set in production.");
  }
  return s ?? "dev-insecure-change-me";
}

/** Generate a random 6-character access key code. */
export function generateAccessKeyCode(): string {
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => KEY_CHARS[b % KEY_CHARS.length]).join("");
}

/** Canonicalize user-entered key for reliable comparisons. */
export function normalizeAccessKeyCode(value: string): string {
  return value.replace(/[\s\-]/g, "").toUpperCase().slice(0, 6);
}

/** HMAC hash used for DB storage and lookups (keeps plaintext out of DB). */
export function hashAccessKeyCode(code: string): string {
  const normalized = normalizeAccessKeyCode(code);
  return createHmac("sha256", keySecret()).update(normalized).digest("hex");
}

/** Keep only a hint for support workflows and UI tables. */
export function keyHint(code: string): string {
  const normalized = normalizeAccessKeyCode(code);
  return normalized.slice(-4).padStart(4, "*");
}

/** Create a signed cookie value for the volunteer session. */
export function createVolunteerToken(
  session: Omit<VolunteerSession, "exp">
): string {
  const payload: VolunteerSession = { ...session, exp: Date.now() + SESSION_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/** Verify a signed cookie value. Returns null if invalid or expired. */
export function verifyVolunteerToken(token: string): VolunteerSession | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const data = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac("sha256", secret()).update(data).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as VolunteerSession;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
