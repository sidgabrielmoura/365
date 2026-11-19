import { publicRows } from "./public-adapters";
import { record } from "./types";

export function sportsLeagueHref(sport: string, league?: string) {
  return `/esportes/${sport}${league ? `?liga=${encodeURIComponent(league)}` : ""}`;
}

export function isLeagueId(value: string) {
  return /^[1-9]\d*$/.test(value) && !/^10000[1-8]$/.test(value);
}

export function panelLeagues(data: unknown, location = "") {
  return publicRows(data).flatMap((item) => {
    const row = record(item);
    const id = String(row.league_id ?? "");
    if (!isLeagueId(id) || typeof row.league !== "string" || !row.league.trim()) return [];
    return [{ id, name: row.league, location: String(row.location || location) }];
  });
}

export function panelLeagueGroups(data: unknown) {
  return publicRows(data).map((item) => {
    const row = record(item);
    const location = String(row.location ?? "");
    return { key: String(row.key ?? location), location, icon: String(row.icon ?? ""),
      leagues: panelLeagues(row.leagues, location) };
  });
}

function normalize(name: string) {
  return name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();
}

// The fixed shortcuts and older links can use the former operator's labels.
const legacyNames: Record<string, string> = {
  "brasil serie a": "brasil brasileirao serie a",
  "brasil serie b": "brasil brasileirao serie b",
  "liga dos campeoes da uefa": "uefa champions league",
  "liga conferencia da uefa": "uefa conference league",
};

export function leagueIdForName(name: string, leagues: ReturnType<typeof panelLeagues>) {
  const normalized = normalize(name);
  const matches = (label: string) => new Set(leagues.filter((league) =>
    normalize(league.name) === label || normalize(league.location + " " + league.name) === label,
  ).map((league) => league.id));
  const exact = matches(normalized);
  const alias = legacyNames[normalized];
  const matchingIds = !exact.size && alias ? matches(alias) : exact;
  return matchingIds.size === 1 ? [...matchingIds][0] : undefined;
}

export function searchLeagueGroups(query: string, groups: ReturnType<typeof panelLeagueGroups>) {
  const term = normalize(query);
  if (term.length < 3) return [];
  const seen = new Set<string>();
  return groups.flatMap((group) => group.leagues.flatMap((league) => {
    const name = normalize(league.location + " " + league.name);
    if (seen.has(league.id) || (!name.includes(term) && name !== legacyNames[term])) return [];
    seen.add(league.id);
    return [{ ...league, icon: group.icon }];
  }));
}
