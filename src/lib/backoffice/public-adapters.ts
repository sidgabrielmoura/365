import { record, type DataRecord } from "./types";
import type { SportsEvent, SportsMarket, SportsOption } from "@/lib/sports-data";
import type { CasinoGame } from "@/lib/casino-data";
import type { DemoPick, DemoTicket } from "@/lib/demo-types";

// These fields were verified against public responses of the tenant provided
// by the user. Authenticated/financial schemas are bound separately.
export function publicRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(record(value).data)) return record(value).data as unknown[];
  throw new Error("Não foi possível carregar esta lista.");
}
function option(row: DataRecord, id: string, home: string, away: string): SportsOption {
  const price = Number(row.cotation ?? row.price);
  const enabled = row.enabled !== false && row.suspended !== true && Number.isFinite(price) && price > 1;
  const rawName = String(row.label ?? row.option ?? "");
  const boost = record(row.boost);
  return {
    id, name: rawName === "Casa" ? home : rawName === "Fora" ? away : rawName,
    odd: enabled ? price : null, enabled,
    marketCode: Number(row.mk_id) || undefined, optionCode: Number(row.op_id) || undefined,
    originalOdd: boost.original_cotation !== undefined ? Number(boost.original_cotation) : undefined,
  };
}
function uniqueOptions(values: unknown[], home: string, away: string): SportsOption[] {
  const options = new Map<string, SportsOption>();
  for (const value of values) {
    const row = record(value);
    if (typeof row.id !== "string" && typeof row.id !== "number") continue;
    const id = String(row.id);
    if (id.trim() && !options.has(id)) options.set(id, option(row, id, home, away));
  }
  return [...options.values()];
}
const panelSports = new Map([
  ["futebol", "football"], ["soccer", "football"], ["football", "football"],
  ["basquete", "basketball"], ["basketball", "basketball"],
  ["boxe", "boxing"], ["boxing", "boxing"], ["mma", "mixed-martial-arts"],
  ["tenis", "tennis"], ["tennis", "tennis"], ["volei", "volleyball"], ["volleyball", "volleyball"],
  ["futebol americano", "american-football"], ["american football", "american-football"],
  ["beisebol", "baseball"], ["baseball", "baseball"],
  ["sinuca", "snooker"], ["snooker", "snooker"], ["futsal", "futsal"],
  ["e-sports", "esports"], ["esports", "esports"],
  ["handebol", "handball"], ["handball", "handball"], ["dardos", "darts"], ["darts", "darts"],
]);

export function eventFromPanel(value: unknown, sport?: string, league?: { name: string; id: string }): SportsEvent {
  const row = record(value);
  if (row.id == null || typeof row.home !== "string" || typeof row.away !== "string")
    throw new Error("Não foi possível carregar os dados do jogo.");
  const odds = Array.isArray(row.odds) ? row.odds : [];
  const groups = new Map<string, unknown[]>();
  for (const item of odds) {
    const odd = record(item);
    const key = String(odd.mk_id ?? odd.market ?? "");
    groups.set(key, [...(groups.get(key) || []), item]);
  }
  const markets: SportsMarket[] = [...groups.entries()].flatMap(([id, list]) => {
    const options = uniqueOptions(list, row.home as string, row.away as string);
    if (!options.length) return [];
    const name = String(record(list[0]).market);
    return [{ id, name: /vencedor do encontro/i.test(name) ? "Resultado Final" : name, category: "main", options }];
  });
  const rawDate = String(row.datetime_iso || "");
  const validDate = !Number.isNaN(Date.parse(rawDate));
  const sportLabel = String(row.sport ?? "").trim().normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return {
    id: String(row.id), sport: sport || panelSports.get(sportLabel) || "football",
    league: league?.name || [row.location, row.league].filter(Boolean).join(" - "),
    leagueId: String(row.league_id || league?.id || ""),
    home: row.home, away: row.away, homeLogo: String(row.home_img || row.home_flag || ""),
    awayLogo: String(row.away_img || row.away_flag || ""),
    start: validDate ? rawDate : "", status: row.status === "live" ? "live" : "prematch", markets,
    earlyPayout: row.early_payout === true ? { goals: 2 } : undefined,
  };
}
export function gridFromPanel(value: unknown, sport = "football") {
  let league: { name: string; id: string } | undefined;
  return publicRows(value).flatMap((item) => {
    const row = record(item);
    if (row.type === "league") {
      league = { name: String(row.league ?? ""), id: String(row.league_id ?? "") };
      return [];
    }
    return [eventFromPanel(item, sport, league)];
  });
}
export function searchEventsFromPanel(value: unknown) {
  const logo = (value: unknown) => typeof value === "string" && /^[a-z0-9_.-]+$/i.test(value) && value !== "no-flag.png"
    ? "https://d1wdv02om1ylps.cloudfront.net/flags/medium/" + value : "";
  return publicRows(value).map((item) => {
    const row = record(item);
    return eventFromPanel({ ...row, home_img: logo(row.home_img), away_img: logo(row.away_img),
      datetime_iso: typeof row.date === "string" ? row.date.replace(" ", "T") + "-03:00" : "" });
  });
}
export function marketsFromPanel(value: unknown, event: SportsEvent, category: string) {
  const root = record(value);
  if (!Array.isArray(root.markets)) throw new Error("Mercados indisponíveis.");
  const markets = root.markets.flatMap((item) => {
    const row = record(item);
    const main = Array.isArray(row.odds) ? row.odds : [];
    const children = Array.isArray(row.items) ? row.items.flatMap((child) => {
      const group = record(child);
      return Array.isArray(group.odds) ? group.odds : [];
    }) : [];
    // The items list groups the same odds for display. Keep the primary record
    // for each ID and include any odds that appear only in a group.
    const all = [...main, ...children];
    const options = uniqueOptions(all, event.home, event.away);
    if (!options.length) return [];
    const id = String(row.internal || record(all[0]).mk_id || row.market);
    return [{
      id, internal: String(row.internal || ""),
      name: String(row.market || ""), category,
      options,
    } satisfies SportsMarket];
  });
  const categories = Array.isArray(root.categories) ? root.categories.map((item) => ({
    id: String(record(item).id), name: String(record(item).name),
  })) : [];
  return { markets, categories };
}
export function casinoFromPanel(value: unknown): CasinoGame {
  const row = record(value);
  if (!row.reference || !row.name) throw new Error("Jogo indisponível.");
  return {
    id: String(row.reference), code: String(row.reference), name: String(row.name),
    provider: String(row.provider || ""), image: String(row.media || ""),
    available: true,
  };
}
export function ticketFromPanel(value: unknown): DemoTicket {
  const row = record(value);
  const statuses: Record<string, DemoTicket["status"]> = {
    Ganhou: "won", Perdeu: "lost", Aberto: "open", Andamento: "open", "Em andamento": "open",
    Cancelado: "cancelled", Devolvido: "void", Encerrado: "cashout",
    open: "open", won: "won", lost: "lost", void: "void", cancelled: "cancelled", cashout: "cashout",
  };
  const hunches = Array.isArray(row.hunches) ? row.hunches : [];
  const cashedOut = row.status === "Ganhou" && hunches.some((item) => record(item).status === "Encerrado");
  const status = cashedOut ? "cashout" : statuses[String(row.status)];
  const stake = Number(row.bet_amount_value ?? row.valor_apostado);
  const potential = Number(row.possible_return_value ?? row.retorno_possivel);
  const odds = typeof row.cotacao === "string" && row.cotacao.includes(",")
    ? Number(row.cotacao.replaceAll(".", "").replace(",", ".")) : Number(row.cotacao);
  if (!status || row.id == null || !Number.isFinite(stake) || !Number.isFinite(potential) || !Number.isFinite(odds))
    throw new Error("Não foi possível carregar este bilhete.");
  const picks = hunches.map((item, index): DemoPick => {
    const leg = record(item);
    const parent: DemoPick = {
      eventId: String(leg.event_id), marketId: String(leg.market), selectionId: String(leg.id),
      key: String(row.id) + "|" + (leg.id ?? index), eventLabel: leg.home + " x " + leg.away,
      marketLabel: String(leg.market ?? ""), label: String(leg.option ?? ""), odd: Number(leg.price),
      enabled: false, result: statuses[String(leg.status)],
      fixture: { home: String(leg.home), away: String(leg.away),
        homeLogo: String(leg.home_flag || ""), awayLogo: String(leg.away_flag || ""),
        start: String(leg.datetime_iso || ""), status: leg.tipo === "aovivo" ? "live" : "prematch" },
    };
    return leg.bet_mode === "builder" && Array.isArray(leg.selections) ? {
      ...parent, kind: "builder", marketLabel: "Criar Aposta", label: "Criar Aposta",
      children: leg.selections.map((selection, position) => {
        const child = record(selection);
        return { ...parent, key: parent.key + "|" + (child.id ?? position), selectionId: String(child.id ?? position),
          marketLabel: String(child.market), label: String(child.option), odd: Number(child.price),
          result: statuses[String(child.status)] };
      }),
    } : parent;
  });
  const award = row.real_award_amount_value ?? row.real_award_amount;
  return {
    id: String(row.id), picks, status, stake, odds, potential,
    createdAt: String(row.created_at_iso || row.created_at || ""),
    returnAmount: status === "cashout" ? potential : status === "won" && award != null && Number.isFinite(Number(award))
      ? Number(award) + (Number(row.bonus_award_amount_value ?? row.bonus_award_amount) || 0)
      : status === "lost" ? 0 : undefined,
    isLive: /ao.?vivo/i.test(String(row.classe ?? "")) || picks.some((pick) => pick.fixture?.status === "live"),
    canCancel: false, detailsLoaded: Array.isArray(row.hunches), typeLabel: String(row.tipo || ""),
  };
}
