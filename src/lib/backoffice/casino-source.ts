"use client";
import { useSite } from "@/lib/site-context";
import { useResource } from "./use-resource";
import { casinoFromPanel, publicRows } from "./public-adapters";
import { record } from "./types";
import { casinoLobby, type CasinoGame } from "@/lib/casino-data";
export function useCasinoSource(category: string, provider: string, page: number, search: string) {
  const { runtime } = useSite();
  const remote = runtime.mode === "backoffice";
  const listing = category !== "inicio" || Boolean(provider) || Boolean(search);
  const validQuery = !search || search.trim().length >= 3;
  const query = new URLSearchParams({ page: String(page), per_page: "24" });
  if (provider) query.append("providers[]", provider);
  if (search) query.set("filter_q", search);
  const categoryIds = record(runtime.settings.casino_category_ids);
  const fallback: Record<string, string> = { aovivo: "live-casino", slots: "slots", crash: "crash-games" };
  const mappedCategory = categoryIds[category] ?? fallback[category];
  if (typeof mappedCategory === "string") query.append("categories[]", mappedCategory);
  const supported = ["inicio", "todos"].includes(category) || Boolean(mappedCategory) || Boolean(provider) || Boolean(search);
  const resource = useResource<unknown>(remote && supported && validQuery
    ? "/api/backoffice/api/casino/" + (listing ? "available-games?" + query : "home-categories") : null);
  const providerResource = useResource<unknown>(remote && !listing ? "/api/backoffice/api/casino/providers?type=all" : null);
  let games: CasinoGame[] = [], total = 0;
  let sections = casinoLobby.sections;
  let providers: Omit<(typeof casinoLobby.providers)[number], "total">[] = [];
  let parseError = "";
  if (remote) {
    sections = [];
    try {
      if (resource.data !== undefined) {
        if (listing) {
          games = publicRows(resource.data).map(casinoFromPanel);
          total = Number(record(resource.data).total || games.length);
        } else {
          const categories = publicRows(resource.data).map(record);
          const listedProviders = categories.flatMap((item) => item.type === "providers" && Array.isArray(item.providers)
            ? item.providers.map(record) : []);
          const availableNames = Array.isArray(providerResource.data) ? providerResource.data.filter((name): name is string => typeof name === "string") : [];
          providers = listedProviders.map((item) => ({
            name: availableNames.find((name) => name === item.name || name === item.internal_name) ?? String(item.name),
            title: String(item.name), image: typeof item.logo === "string" ? item.logo : "",
          }));
          sections = categories.filter((row) => Array.isArray(row.games)).map((row, index) => {
            const list = publicRows(row.games).map(casinoFromPanel);
            return { ...casinoLobby.sections[index % casinoLobby.sections.length],
              id: String(index), provider: "", category: "", title: String(row.name ?? row.group_label), games: list };
          }) as typeof sections;
        }
      }
    } catch (error) { games = []; sections = []; parseError = (error as Error).message; }
  }
  return { remote, games, total, sections, providers: remote ? providers : casinoLobby.providers,
    loading: resource.loading, error: resource.error || parseError ||
      (remote && !supported ? "Categoria indisponível no catálogo." : remote && !validQuery ? "Digite pelo menos 3 caracteres." : "") };
}
