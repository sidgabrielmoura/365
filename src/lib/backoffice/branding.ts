import { record, type SiteParameters, type Tenant, type TenantBranding } from "./types";

export const ORIGINAL_BRAND = "BrasaBet";
export const ORIGINAL_ICON = "/assets/images/favicon-32x32-47dbc38fbf.png";
export const ORIGINAL_LOGO = "/assets/images/brasabet-logo-6e195a6f51.png";

export function publicHttpsUrl(value: unknown) {
  const url = typeof value === "string" ? URL.parse(value) : null;
  return url?.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
}

export function themeColors(value: unknown) {
  return Object.fromEntries(Object.entries(record(value)).filter((item): item is [string, string] =>
    /^[a-z][a-z0-9_-]{0,60}$/i.test(item[0]) && typeof item[1] === "string" && isColor(item[1])));
}

function isColor(value: string) {
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return true;
  const match = /^(rgb|rgba)\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i.exec(value);
  return Boolean(match && match.slice(2, 5).every((component) => Number(component) <= 255) &&
    (match[1].length === 4) === (match[5] !== undefined));
}

export function brandingFromTenant(tenant: Tenant, config: SiteParameters): TenantBranding {
  const name = tenant.complete_name === tenant.site_id && typeof config.settings.complete_name === "string"
    ? config.settings.complete_name.trim() || tenant.complete_name : tenant.complete_name;
  const icon = publicHttpsUrl(tenant.isotype_url);
  return {
    name, logo: publicHttpsUrl(tenant.logo_url), icon, appIcon: publicHttpsUrl(config.settings.native_app_logo) ?? icon,
    theme: { ...tenant.custom_theme, ...config.theme },
  };
}

export function themeProperties(theme: Record<string, string>) {
  const props: Record<string, string> = {};
  const safe = themeColors(theme);
  if (safe.brand) props["--tenant-brand"] = safe.brand;
  for (const mode of ["light", "dark"]) {
    for (const role of ["bg", "surface", "surface_2", "surface_3", "surface_4", "text", "muted", "line", "price", "live"]) {
      const color = safe[mode + "_" + role] ?? (role === "bg" ? safe.background_color : role === "text" ? safe.text_color : undefined);
      if (color) props["--tenant-" + mode + "-" + role.replace("_", "-")] = color;
    }
  }
  return props;
}
