import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "./tenant";
import { openSession, sealSession, SESSION_COOKIE, type PanelSession } from "./session";
import type { CallContext } from "./http";
import { BackofficeError } from "./errors";
import { integrationMode } from "./config";

export function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Vary", "Cookie, Host");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
export function json(value: unknown, status = 200) {
  return noStore(NextResponse.json(value, { status }));
}
export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  // Next's internal origin may use localhost even for a request to 127.0.0.1.
  // Bind CSRF to the actual request Host, including its port.
  let expected = "";
  try { expected = host ? new URL(request.nextUrl.protocol + "//" + host).origin : request.nextUrl.origin; } catch {}
  if (!origin || origin !== expected || request.headers.get("sec-fetch-site") === "cross-site")
    throw new BackofficeError("Origem inválida.", 403, "INVALID_ORIGIN");
}
export async function requestContext(request: NextRequest): Promise<CallContext> {
  if (integrationMode() !== "backoffice")
    throw new BackofficeError("Integração do backoffice não está ativa.", 503, "INTEGRATION_DISABLED");
  const tenant = await resolveTenant(request.headers.get("host") || "");
  let timezone = request.headers.get("x-timezone") || "America/Sao_Paulo";
  try { new Intl.DateTimeFormat("pt-BR", { timeZone: timezone }); }
  catch { timezone = "America/Sao_Paulo"; }
  return { tenant, timezone, session: openSession(request.cookies.get(SESSION_COOKIE)?.value, tenant) };
}
export function withSession(response: NextResponse, session: PanelSession, request: NextRequest) {
  response.cookies.set(SESSION_COOKIE, sealSession(session), {
    httpOnly: true, secure: request.nextUrl.protocol === "https:",
    sameSite: "lax", path: "/", maxAge: Math.max(0, Math.floor((session.expires - Date.now()) / 1000)),
  });
  return response;
}
export function expireSession(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
export function errorResponse(error: unknown) {
  const issue = error instanceof BackofficeError ? error
    : new BackofficeError("Não foi possível concluir a operação.", 500, "INTERNAL_ERROR");
  const response = json({
    error: issue.message, code: issue.code,
    ...(["BUSINESS_ERROR", "PRICE_CHANGED"].includes(issue.code) ? { details: issue.details } : {}),
  }, issue.status);
  return issue.status === 401 && issue.code !== "EDITOR_TOKEN_INVALID" ? expireSession(response) : response;
}
export async function jsonBody(request: NextRequest) {
  if (!(request.headers.get("content-type") || "").includes("application/json"))
    throw new BackofficeError("Envie dados em JSON.", 415, "INVALID_BODY");
  const text = await request.text();
  if (Buffer.byteLength(text) > 128000)
    throw new BackofficeError("Dados excedem o limite.", 413, "INVALID_BODY");
  try { return text ? JSON.parse(text) as unknown : {}; }
  catch { throw new BackofficeError("JSON inválido.", 400, "INVALID_BODY"); }
}
