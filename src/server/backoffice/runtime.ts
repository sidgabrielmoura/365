import { bindings } from "./config";
import { siteParameters } from "./tenant";
import { flag, record, type SiteRuntime, type Tenant, type UserLevel } from "@/lib/backoffice/types";
import { panelCall, type CallContext } from "./http";
import { brandingFromTenant } from "@/lib/backoffice/branding";

const sportIds = {
  football: "1", basketball: "2", boxing: "3", "mixed-martial-arts": "4", tennis: "5", volleyball: "6",
  esports: "7", "american-football": "8", baseball: "9", snooker: "10", futsal: "11", handball: "12", darts: "13",
};

export async function publicRuntime(tenant: Tenant, context?: CallContext): Promise<SiteRuntime> {
  const [parameters, contract] = await Promise.all([siteParameters(tenant), bindings()]);
  let settings = { ...parameters.settings };
  if (context?.session?.level === "online") {
    const { data } = await panelCall(context, "GET", "/api/online/config");
    settings = { ...settings, ...record(record(data).data ?? data) };
  }
  settings = {
    ...settings,
    min_bet_amount: settings.min_bet_amount ?? settings.prematch_min_value,
    max_bet_amount: settings.max_bet_amount ?? settings.prematch_max_value,
    min_hunches: settings.min_hunches ?? settings.prematch_min_quantity,
    max_hunches: settings.max_hunches ?? settings.prematch_max_quantity,
    bet_enabled: settings.bet_enabled ?? flag(settings.prematch_active_bet),
  };
  const { base_url: _backend, gtags: _analytics, meta_id: _pixel, ...publicTenant } = tenant;
  const mode = String(settings.register_mode || "default");
  const registrationEndpoint = { default: "/api/online/register",
    phone: "/api/online/v2/register", username: "/api/online/v3/register" }[mode];
  const online = tenant.modules.includes("online");
  return {
    mode: "backoffice", tenant: publicTenant, settings,
    ...(process.env.BACKOFFICE_BRANDING !== "clone" ? { branding: brandingFromTenant(tenant, parameters) } : {}),
    carousel: parameters.medias.carousel || [],
    currency: tenant.site_id === "xgamesportsite" ? "USD" : "BRL",
    sportIds: { ...sportIds, ...contract.sportIds },
    registrationEndpoint,
    features: {
      register: online && flag(settings.online_can_register) && Boolean(registrationEndpoint),
      password: true,
      bet: online && tenant.modules.includes("bet"),
      builder: tenant.modules.includes("bet-builder"),
      cashout: online && tenant.modules.includes("cashout"),
      casinoLaunch: online && tenant.modules.includes("casino"),
      search: tenant.modules.includes("bet"),
      deposit: online && settings.charge_mode === "pix",
      withdrawal: online && settings.withdrawal_mode === "pix",
    },
    live: {
      url: contract.live?.url || "wss://ws.fabrica.bet/live",
      path: contract.live?.path || "/socket.io",
      enabled: flag(settings.display_live ?? true),
    },
    cashout: {
      channels: contract.cashout?.channels || [], event: contract.cashout?.event,
      keepAliveMs: Math.max(5000, contract.cashout?.keepAliveMs || 30000),
    },
  };
}
export function sessionLevel(value: unknown, fieldName = "level"): UserLevel | null {
  const candidate = record(value)[fieldName];
  return candidate === "online" || candidate === "cambista" ? candidate : null;
}
