import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const EBAY_ENV = process.env.EBAY_ENV ?? "sandbox";
const IS_SANDBOX = EBAY_ENV === "sandbox";

export const EBAY_AUTH_BASE = IS_SANDBOX
  ? "https://auth.sandbox.ebay.com"
  : "https://auth.ebay.com";

const EBAY_API_BASE = IS_SANDBOX
  ? "https://api.sandbox.ebay.com"
  : "https://api.ebay.com";

// Scopes needed to read/write sell inventory
export const EBAY_SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
].join(" ");

// ---------------------------------------------------------------------------
// Encryption helpers (AES-256-GCM)
// ---------------------------------------------------------------------------

function getEncKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  // Accept hex string (64 chars = 32 bytes) or raw 32-char string
  if (key.length === 64) return Buffer.from(key, "hex");
  return Buffer.from(key.padEnd(32, "0").slice(0, 32));
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Store as iv:tag:ciphertext (all hex)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(stored: string): string {
  const [ivHex, tagHex, encHex] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", getEncKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc).toString("utf8") + decipher.final("utf8");
}

// ---------------------------------------------------------------------------
// OAuth URL
// ---------------------------------------------------------------------------

export function getEbayAuthUrl(): string {
  const clientId = process.env.EBAY_CLIENT_ID;
  const ruName = process.env.EBAY_REDIRECT_URI; // eBay calls this the RuName
  if (!clientId || !ruName) {
    throw new Error("EBAY_CLIENT_ID and EBAY_REDIRECT_URI must be set");
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: ruName,
    response_type: "code",
    scope: EBAY_SCOPES,
    prompt: "login",
  });
  return `${EBAY_AUTH_BASE}/oauth2/authorize?${params}`;
}

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------

export interface EbayTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
}

function basicAuth(): string {
  const id = process.env.EBAY_CLIENT_ID ?? "";
  const secret = process.env.EBAY_CLIENT_SECRET ?? "";
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

export async function exchangeCodeForTokens(code: string): Promise<EbayTokens> {
  const ruName = process.env.EBAY_REDIRECT_URI ?? "";
  const res = await fetch(`${EBAY_API_BASE}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: ruName,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function refreshEbayTokens(refreshToken: string): Promise<EbayTokens> {
  const res = await fetch(`${EBAY_API_BASE}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: EBAY_SCOPES,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay token refresh failed: ${res.status} ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Supabase helpers (service role — bypasses RLS for writes)
// ---------------------------------------------------------------------------

function serviceClient() {
  return createSupabaseServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function storeEbayConnection(
  userId: string,
  tokens: EbayTokens,
  ebayUserId?: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const { error } = await serviceClient()
    .from("ebay_connections")
    .upsert(
      {
        user_id: userId,
        ebay_user_id: ebayUserId ?? null,
        access_token_enc: encryptToken(tokens.access_token),
        refresh_token_enc: encryptToken(tokens.refresh_token),
        token_expires_at: expiresAt,
        scope: tokens.token_type,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(`Failed to store eBay connection: ${error.message}`);
}

export async function getEbayConnection(userId: string): Promise<{
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  ebay_user_id: string | null;
} | null> {
  const { data, error } = await serviceClient()
    .from("ebay_connections")
    .select("access_token_enc, refresh_token_enc, token_expires_at, ebay_user_id")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    access_token: decryptToken(data.access_token_enc),
    refresh_token: decryptToken(data.refresh_token_enc),
    token_expires_at: data.token_expires_at,
    ebay_user_id: data.ebay_user_id,
  };
}

export async function deleteEbayConnection(userId: string): Promise<void> {
  const { error } = await serviceClient()
    .from("ebay_connections")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(`Failed to delete eBay connection: ${error.message}`);
}

/** Returns a valid access token, refreshing if needed. */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const conn = await getEbayConnection(userId);
  if (!conn) return null;

  const expiresAt = new Date(conn.token_expires_at).getTime();
  const bufferMs = 5 * 60 * 1000; // refresh 5 min before expiry

  if (Date.now() < expiresAt - bufferMs) {
    return conn.access_token;
  }

  // Refresh
  const fresh = await refreshEbayTokens(conn.refresh_token);
  await storeEbayConnection(userId, fresh, conn.ebay_user_id ?? undefined);
  return fresh.access_token;
}
