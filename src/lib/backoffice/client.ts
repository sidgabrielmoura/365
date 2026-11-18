"use client";
import { operations, type OperationId } from "./catalogue";
import { record } from "./types";

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string, public details?: unknown) { super(message); }
}
export function timezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
}
export async function siteFetch<T = unknown>(
  url: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const response = await fetch(url, {
    method: options.method || "GET", cache: "no-store", credentials: "same-origin",
    headers: { Accept: "application/json", "X-Timezone": timezone(),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });
  let result: unknown;
  try { result = response.status === 204 ? null : await response.json(); }
  catch { throw new ApiError("Serviço temporariamente indisponível.", response.status, "INVALID_RESPONSE"); }
  if (!response.ok) {
    const row = record(result);
    if (response.status === 401 && row.code !== "EDITOR_TOKEN_INVALID")
      window.dispatchEvent(new Event("backoffice:session-expired"));
    throw new ApiError(String(row.error || row.message || "Não foi possível concluir."),
      response.status, String(row.code || "BUSINESS_ERROR"), row.details);
  }
  return result as T;
}
export function backoffice<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; query?: URLSearchParams; signal?: AbortSignal } = {},
) {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes(".."))
    throw new ApiError("Operação inválida.", 400, "INVALID_PATH");
  return siteFetch<T>("/api/backoffice" + path + (options.query?.size ? "?" + options.query : ""), options);
}
export function callOperation<T = unknown>(
  id: OperationId,
  options: { params?: Record<string, string | number>; query?: URLSearchParams; body?: unknown; signal?: AbortSignal } = {},
) {
  const operation = operations.find((item) => item.id === id)!;
  const path = operation.path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = options.params?.[key];
    if (value === undefined) throw new ApiError("Identificador ausente.", 400, "MISSING_PARAMETER");
    return encodeURIComponent(String(value));
  });
  return backoffice<T>(path, { ...options, method: operation.method });
}
