import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Tenant, UserLevel } from "@/lib/backoffice/types";
import { BackofficeError } from "./errors";

export const SESSION_COOKIE = "brasa_backoffice";
export type PanelSession = {
  token: string;
  level: UserLevel;
  tenantId: string;
  audience: string;
  userId: string;
  expires: number;
};
function key() {
  const value = process.env.BACKOFFICE_SESSION_SECRET || "";
  if (value.length < 32)
    throw new BackofficeError("Sessão do site não configurada.", 503, "CONFIGURATION");
  return createHash("sha256").update(value).digest();
}
export function sealSession(session: PanelSession) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const bytes = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), bytes].map((item) => item.toString("base64url")).join(".");
}
export function openSession(cookie: string | undefined, tenant: Tenant): PanelSession | null {
  if (!cookie) return null;
  try {
    const parts = cookie.split(".");
    if (parts.length !== 3) return null;
    const [iv, tag, bytes] = parts.map((item) => Buffer.from(item, "base64url"));
    const cipher = createDecipheriv("aes-256-gcm", key(), iv);
    cipher.setAuthTag(tag);
    const result = JSON.parse(Buffer.concat([cipher.update(bytes), cipher.final()]).toString("utf8")) as PanelSession;
    if (result.tenantId !== tenant.site_id || result.audience !== tenant.base_url
      || result.expires <= Date.now() || !result.token
      || !["online", "cambista"].includes(result.level)) return null;
    return result;
  } catch (error) {
    if (error instanceof BackofficeError) throw error;
    return null;
  }
}
export function tokenExpires(token: string) {
  const maximum = Date.now() + 86400000; // Local session never outlives its JWT.
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return typeof payload.exp === "number" ? Math.min(payload.exp * 1000, maximum) : maximum;
  } catch { return maximum; }
}
