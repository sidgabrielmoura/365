import { operations } from "@/lib/backoffice/catalogue";
import { record, type Tenant } from "@/lib/backoffice/types";
import { backendOrigin } from "./tenant";
import { BackofficeError } from "./errors";
import { upstreamTimeout } from "./config";
import type { PanelSession } from "./session";

export type CallContext = { tenant: Tenant; session: PanelSession | null; timezone?: string };
export function matchOperation(method: string, path: string) {
  if (!path.startsWith("/") || path.includes("..") || /[%\\?#\u0000-\u0020]/.test(path))
    throw new BackofficeError("Operação inválida.", 400, "INVALID_PATH");
  const operation = operations.find((item) => item.method === method &&
    new RegExp("^" + item.path.split("/").map((part) =>
      /^\{[^}]+\}$/.test(part) ? "[A-Za-z0-9_:@+.,=-]+" : part.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&")
    ).join("/") + "$").test(path));
  if (!operation) throw new BackofficeError("Operação não documentada.", 404, "UNKNOWN_OPERATION");
  return operation;
}
export function authorizeOperation(context: CallContext, operation: ReturnType<typeof matchOperation>) {
  if ("module" in operation && !context.tenant.modules.includes(operation.module))
    throw new BackofficeError("Recurso indisponível neste site.", 403, "MODULE_DISABLED");
  const session = context.session;
  if (operation.path.startsWith("/api/online/") && !context.tenant.modules.includes("online"))
    throw new BackofficeError("Recurso indisponível neste site.", 403, "MODULE_DISABLED");
  if (operation.auth !== "public" && operation.auth !== "editor" && !session)
    throw new BackofficeError("Entre na sua conta para continuar.", 401, "UNAUTHENTICATED");
  if (session?.level === "cambista" &&
    (operation.path.startsWith("/api/online/") || operation.auth === "online"))
    throw new BackofficeError("Operação exclusiva do jogador online.", 403, "ROLE_FORBIDDEN");
  if (operation.auth === "seller" && session?.level !== "cambista")
    throw new BackofficeError("Operação exclusiva do cambista.", 403, "ROLE_FORBIDDEN");
}
export function withoutSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutSecrets);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).filter(([key]) =>
      !/(^|_)(token|jwt|password|salt|secret)(_|$)/i.test(key))
      .map(([key, child]) => [key, withoutSecrets(child)]));
  return value;
}

/** No retries and no cache: repeating a financial POST can duplicate operations. */
export async function panelCall(
  context: CallContext,
  method: string,
  path: string,
  options: { body?: unknown; query?: URLSearchParams; signal?: AbortSignal } = {},
): Promise<{ data: unknown; status: number }> {
  const operation = matchOperation(method, path);
  authorizeOperation(context, operation);
  const url = new URL(path, backendOrigin(context.tenant));
  if (options.query) url.search = options.query.toString();
  const headers: Record<string, string> = {
    Accept: "application/json", "Accept-Language": "pt-BR",
    "Client-version": process.env.BACKOFFICE_CLIENT_VERSION || "brasa-web/1.0.0",
    "X-Timezone": context.timezone || "America/Sao_Paulo",
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (context.session && ((operation.auth !== "public" && operation.auth !== "editor")
    || (path.startsWith("/api/shared-ticket/") && context.session.level === "online")))
    headers.Authorization = "Bearer " + context.session.token;
  try {
    const response = await fetch(url, {
      method, headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store", redirect: "error",
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(upstreamTimeout())])
        : AbortSignal.timeout(upstreamTimeout()),
    });
    const text = await response.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : null; }
    catch {
      if (path === "/api/regulamento" && response.ok) data = { html: text };
      else throw new BackofficeError("Resposta inválida do serviço.", 502, "INVALID_RESPONSE");
    }
    if (!response.ok) {
      const error = record(data);
      throw new BackofficeError(
        typeof error.error === "string" ? error.error
          : typeof error.message === "string" ? error.message : "Não foi possível concluir a operação.",
        response.status, response.status === 401
          ? operation.auth === "editor" ? "EDITOR_TOKEN_INVALID" : "SESSION_EXPIRED"
          : "BUSINESS_ERROR",
        withoutSecrets(data),
      );
    }
    return { data, status: response.status };
  } catch (error) {
    if (error instanceof BackofficeError) throw error;
    throw new BackofficeError(
      method === "GET" ? "Serviço temporariamente indisponível. Tente novamente."
        : "Não foi possível confirmar a operação. Consulte o histórico antes de tentar novamente.",
      502, "UPSTREAM_UNAVAILABLE",
    );
  }
}
