export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type DataRecord = Record<string, unknown>;
export type UserLevel = "online" | "cambista";
export type IntegrationMode = "demo" | "backoffice";

export type Tenant = {
  site_id: string;
  front_url: string;
  base_url: string;
  complete_name: string;
  status: "actived" | "disabled";
  modules: string[];
  logo_url?: string;
  isotype_url?: string;
  custom_theme: Record<string, string>;
  gtags?: string;
  meta_id?: string;
};

export type SiteParameters = {
  generated?: string;
  settings: DataRecord;
  theme: Record<string, string>;
  medias: { carousel?: DataRecord[] };
};

export type TenantBranding = {
  name: string;
  logo?: string;
  icon?: string;
  appIcon?: string;
  theme: Record<string, string>;
};

/** Public configuration only. No Redis connection strings, JWTs or editor secrets. */
export type SiteRuntime = {
  mode: IntegrationMode;
  tenant: Omit<Tenant, "base_url" | "gtags" | "meta_id"> | null;
  settings: DataRecord;
  carousel: DataRecord[];
  branding?: TenantBranding;
  sportIds: Record<string, string>;
  currency: "BRL" | "USD";
  registrationEndpoint?: string;
  features: {
    register: boolean;
    password: boolean;
    bet: boolean;
    builder: boolean;
    cashout: boolean;
    casinoLaunch: boolean;
    search: boolean;
    deposit: boolean;
    withdrawal: boolean;
  };
  live: { url: string; path: string; enabled: boolean };
  cashout: { channels: string[]; event?: string; keepAliveMs: number };
};

/**
 * Bindings for fields omitted from the supplied catalogue. Templates refer to
 * values from the UI, e.g. { "amount": "$stake", "hunches": "$picks" }.
 * A missing binding fails closed; no financial payload is guessed.
 */
export type OperationBinding = {
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: DataRecord;
  response?: string;
};

export type BackofficeBindings = {
  version: 1;
  sportIds?: Record<string, string>;
  fields?: Record<string, string>;
  operations?: Record<string, OperationBinding>;
  registration?: Record<string, string>;
  statusMap?: Record<string, string>;
  moneyUnit?: "decimal" | "minor";
  live?: { url?: string; path?: string; marginMode?: "backend"; };
  cashout?: { channels?: string[]; event?: string; keepAliveMs?: number };
};

export const DEMO_RUNTIME: SiteRuntime = {
  mode: "demo",
  tenant: null,
  settings: {},
  carousel: [],
  sportIds: {},
  currency: "BRL",
  features: {
    register: true, password: true, bet: true, builder: true,
    cashout: true, casinoLaunch: true, search: true, deposit: true, withdrawal: true,
  },
  live: { url: "", path: "/socket.io", enabled: false },
  cashout: { channels: [], keepAliveMs: 30000 },
};

export function record(value: unknown): DataRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as DataRecord : {};
}
export function field(value: unknown, path: string): unknown {
  if (!path) return value;
  return path.split(".").reduce<unknown>((current, key) =>
    current != null && typeof current === "object"
      ? (current as DataRecord)[key] : undefined, value);
}
export function flag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true" || value === "Sim";
}
export function moduleEnabled(runtime: SiteRuntime, module: string) {
  return runtime.mode === "demo" || Boolean(runtime.tenant?.modules.includes(module));
}
