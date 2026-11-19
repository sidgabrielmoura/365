import Redis from "ioredis";
import { readJsonFile, upstreamTimeout } from "./config";
import { BackofficeError } from "./errors";
import { record, type Tenant, type SiteParameters } from "@/lib/backoffice/types";
import { themeColors } from "@/lib/backoffice/branding";

let connection: Redis | undefined;
let cached: { values: Record<string, Tenant>; until: number } | undefined;
let pending: Promise<Record<string, Tenant>> | undefined;

export function normalizeHost(input: string) {
  try {
    const url = new URL(input.includes("://") ? input : "https://" + input);
    return url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch { return ""; }
}

export function backendOrigin(tenant: Tenant) {
  const host = tenant.base_url;
  if (!host || /[\/\\@?#\s%]/.test(host) || host.includes("://"))
    throw new BackofficeError("Endereço do painel inválido.", 503, "CONFIGURATION");
  const origin = new URL("https://" + host);
  if (origin.hostname === "localhost" || origin.hostname.endsWith(".localhost"))
    throw new BackofficeError("Endereço do painel inválido.", 503, "CONFIGURATION");
  return origin.origin;
}

function parseTenant(id: string, value: unknown): Tenant {
  const row = record(value);
  const theme = record(row.custom_theme);
  const tenant: Tenant = {
    site_id: String(row.site_id || id),
    front_url: String(row.front_url || ""),
    base_url: String(row.base_url || ""),
    complete_name: String(row.complete_name || id),
    status: row.status === "disabled" ? "disabled" : "actived",
    modules: Array.isArray(row.modules) ? row.modules.filter((v): v is string => typeof v === "string") : [],
    logo_url: typeof row.logo_url === "string" ? row.logo_url : undefined,
    isotype_url: typeof row.isotype_url === "string" ? row.isotype_url : undefined,
    custom_theme: Object.fromEntries(Object.entries(theme).filter((entry): entry is [string, string] =>
      typeof entry[1] === "string" && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(entry[1]))),
  };
  if (!/^[a-z0-9_-]+$/i.test(tenant.site_id) || !normalizeHost(tenant.front_url))
    throw new BackofficeError("Configuração de tenant inválida.", 503, "CONFIGURATION");
  backendOrigin(tenant);
  return tenant;
}

async function loadSites() {
  const localFile = process.env.BACKOFFICE_TENANTS_FILE;
  const inline = process.env.BACKOFFICE_TENANTS_JSON?.trim();
  let data: unknown;
  if (localFile) data = await readJsonFile(localFile);
  else if (inline) {
    try { data = JSON.parse(inline); }
    catch {
      throw new BackofficeError("JSON de bancas inválido.", 503, "INVALID_TENANTS_JSON");
    }
    if (!Object.keys(record(data)).length)
      throw new BackofficeError("Configure pelo menos uma banca no JSON.", 503, "INVALID_TENANTS_JSON");
  }
  else {
    if (!process.env.REDIS_HOST)
      throw new BackofficeError("Configure BACKOFFICE_TENANTS_JSON ou REDIS_HOST.", 503, "TENANTS_NOT_CONFIGURED");
    if (!connection) {
      connection = new Redis(process.env.REDIS_HOST, {
        db: Number(process.env.REDIS_DB || 1),
        connectTimeout: 5000, commandTimeout: 5000,
        maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: true,
        retryStrategy: () => null,
      });
      connection.on("error", () => {}); // Do not log Redis URLs/credentials.
    }
    if (connection.status === "wait" || connection.status === "end")
      await connection.connect();
    const raw = await connection.get("sites");
    if (!raw) throw new BackofficeError("Lista de sites indisponível.", 503, "TENANTS_UNAVAILABLE");
    data = JSON.parse(raw);
  }
  return Object.fromEntries(Object.entries(record(data)).map(([id, row]) => [id, parseTenant(id, row)]));
}
async function sites() {
  if (cached && cached.until > Date.now()) return cached.values;
  if (!pending) pending = loadSites().then((values) => {
    cached = { values, until: Date.now() + 60000 };
    return values;
  }).catch((error) => {
    if (cached) { cached.until = Date.now() + 5000; return cached.values; }
    throw error instanceof BackofficeError ? error
      : new BackofficeError("Lista de sites indisponível.", 503, "TENANTS_UNAVAILABLE");
  }).finally(() => { pending = undefined; });
  return pending;
}

export async function resolveTenant(host: string): Promise<Tenant> {
  const override = process.env.DEV_HOST_OVERRIDE;
  if (override && process.env.NODE_ENV === "production")
    throw new BackofficeError("Override de desenvolvimento não pode ser usado em produção.", 503, "CONFIGURATION");
  const normalized = normalizeHost(override || host);
  if (!normalized) throw new BackofficeError("Site não encontrado.", 404, "TENANT_NOT_FOUND");
  const tenants = await sites();
  let tenant = Object.values(tenants).find((item) => normalizeHost(item.front_url) === normalized);
  if (!tenant) {
    const alias = /^([a-z0-9_-]+)\.oficial2\.com$/i.exec(normalized);
    if (alias && tenants[alias[1]])
      tenant = { ...tenants[alias[1]], base_url: "painel-" + alias[1] + ".oficial2.com" };
  }
  if (!tenant) throw new BackofficeError("Site não encontrado.", 404, "TENANT_NOT_FOUND");
  if (tenant.status === "disabled")
    throw new BackofficeError("Site indisponível.", 503, "TENANT_DISABLED");
  return tenant;
}

export async function siteParameters(tenant: Tenant): Promise<SiteParameters> {
  let value: unknown;
  if (process.env.BACKOFFICE_PARAMETERS_FILE)
    value = await readJsonFile(process.env.BACKOFFICE_PARAMETERS_FILE);
  else {
    const url = new URL("https://cdn.assetsfabrica.bet/content/parameters/" + tenant.site_id + ".json");
    url.searchParams.set("v", String(Date.now()));
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(url, {
            cache: "no-store", redirect: "error",
            signal: AbortSignal.timeout(upstreamTimeout()),
          });
          if (response.status === 403 || response.status === 404)
            throw new BackofficeError("Site indisponível.", 503, "PARAMETERS_UNAVAILABLE");
          if (!response.ok) throw new Error("Parameters unavailable");
          value = await response.json();
          break;
        } catch (issue) {
          if (issue instanceof BackofficeError || attempt === 1) throw issue;
        }
      }
    } catch { throw new BackofficeError("Site indisponível.", 503, "PARAMETERS_UNAVAILABLE"); }
  }
  const row = record(value);
  if (!row.settings || typeof row.settings !== "object")
    throw new BackofficeError("Parâmetros do site inválidos.", 503, "PARAMETERS_UNAVAILABLE");
  const settings = record(row.settings);
  if (settings.site_id != null && settings.site_id !== tenant.site_id)
    throw new BackofficeError("Parâmetros de outra banca.", 503, "PARAMETERS_UNAVAILABLE");
  return {
    generated: typeof row.generated === "string" ? row.generated : undefined,
    settings,
    theme: themeColors(row.theme),
    medias: { carousel: Array.isArray(record(row.medias).carousel) ? record(row.medias).carousel as Record<string, unknown>[] : [] },
  };
}
