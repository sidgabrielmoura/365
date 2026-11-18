import { field, record } from "@/lib/backoffice/types";
import { bindings } from "./config";
import { emptySession, balanceData, payload, userData, valueAt } from "./adapters";
import { panelCall, type CallContext } from "./http";
import { BackofficeError } from "./errors";
import { tokenExpires, type PanelSession } from "./session";

export async function authenticatePanel(context: CallContext, input: unknown) {
  const body = record(input);
  if (typeof body.username !== "string" || typeof body.password !== "string"
    || !body.username.trim() || !body.password || body.username.length > 200 || body.password.length > 256)
    throw new BackofficeError("Informe usuário e senha.", 422, "INVALID_CREDENTIALS");
  const { data } = await panelCall({ ...context, session: null }, "POST", "/bet/login", {
    body: { username: body.username.trim(), password: body.password },
  });
  const config = await bindings();
  const root = record(payload(data));
  const token = root.token;
  if (typeof token !== "string" || !token || token.length > 2400)
    throw new BackofficeError("Sessão inválida recebida do painel.", 502, "INVALID_RESPONSE");
  const rawUser = record(root.user);
  const level = field(rawUser, config.fields?.userLevel || "nivel");
  const candidate: PanelSession = {
    token, level: level as PanelSession["level"],
    tenantId: context.tenant.site_id, audience: context.tenant.base_url,
    userId: String(valueAt(rawUser, config, "userId", "id") || ""),
    expires: tokenExpires(token),
  };
  const tenantMatches = rawUser.site_id === undefined || String(rawUser.site_id) === context.tenant.site_id;
  if ((level !== "online" && level !== "cambista") || !tenantMatches) {
    // The logout operation only needs an authenticated token; this temporary
    // context is never persisted or returned to the browser.
    await panelCall({ ...context, session: { ...candidate, level: "online" } }, "POST", "/api/auth-logout", { body: {} }).catch(() => {});
    throw new BackofficeError("Esta conta não pode entrar neste site.", 403, "ROLE_FORBIDDEN");
  }
  if (candidate.expires <= Date.now() || !candidate.userId)
    throw new BackofficeError("Sessão inválida recebida do painel.", 502, "INVALID_RESPONSE");
  return { session: candidate, user: { ...userData({ user: rawUser }, config), level } };
}
export async function playerSession(context: CallContext) {
  const session = emptySession();
  if (!context.session) return session;
  const contract = await bindings();
  let data: unknown;
  if (context.session.level === "online") {
    try { data = (await panelCall(context, "POST", "/api/v3/online/auth", { body: {} })).data; }
    catch (error) {
      if (!(error instanceof BackofficeError) || error.status !== 403) throw error;
      data = (await panelCall(context, "POST", "/api/auth", { body: {} })).data;
    }
  } else data = (await panelCall(context, "POST", "/api/auth", { body: {} })).data;
  session.user = { ...userData(data, contract), level: context.session.level };
  const raw = record(payload(data));
  const profile = { ...raw, ...record(raw.user) };
  if (session.user.id !== context.session.userId)
    throw new BackofficeError("Entre novamente para atualizar sua sessão.", 401, "SESSION_EXPIRED");
  const actualLevel = field(profile, contract.fields?.userLevel || "nivel");
  if ((actualLevel !== undefined && actualLevel !== context.session.level)
    || (profile.site_id !== undefined && String(profile.site_id) !== context.tenant.site_id))
    throw new BackofficeError("O nível da sua sessão foi alterado. Entre novamente.", 401, "SESSION_EXPIRED");
  session.profile = {
    phone: typeof profile.contato === "string" ? profile.contato : undefined,
    address: typeof profile.endereco === "string" ? { street: profile.endereco } : undefined,
  };
  if (context.session.level === "online") {
    Object.assign(session, balanceData((await panelCall(context, "GET", "/api/online/account/balance")).data, contract));
  }
  return session;
}
