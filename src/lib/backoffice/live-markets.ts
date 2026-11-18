import { flag, record, type DataRecord } from "./types";
import type { SportsEvent, SportsMarket, SportsOption } from "@/lib/sports-data";

const sports: Record<string, string> = {
  "1": "football", "2": "basketball", "3": "boxing", "4": "mixed-martial-arts", "5": "tennis",
  "6": "volleyball", "7": "esports", "8": "american-football", "9": "baseball",
  "10": "snooker", "11": "futsal", "12": "handball", "13": "darts",
};

function ids(value: unknown) {
  return new Set(Array.isArray(value) ? value.map(String) : []);
}

function liveRules(value: unknown) {
  const raw = record(value);
  return {
    blockedEvents: ids(raw.live_block_events),
    blockedLeagues: ids(raw.live_block_leagues),
    allowedLeagues: ids(raw.live_only_leagues),
    blockedMarkets: ids(raw.live_block_markets),
    margins: new Map((Array.isArray(raw.live_markets) ? raw.live_markets.map(record) : [])
      .map((item) => [String(item.reference), Number(item.percentage)])),
    margin: Number(raw.live_percent ?? 0) + Number(raw.live_user ?? 0),
    cap: Number(raw.live_lock_above) || Infinity,
    minimum: Number(raw.live_block_below ?? 0),
  };
}

type LiveRules = ReturnType<typeof liveRules>;

function eventFromFeed(row: DataRecord, league: DataRecord, rules: LiveRules): SportsEvent | undefined {
  const id = String(row.match_id ?? "");
  const leagueIds = [row.league_id, league.league_id, league.league_identifier, league.league_hash].map(String);
  if (!id || typeof row.home !== "string" || typeof row.away !== "string" ||
      rules.blockedEvents.has(id) || rules.blockedEvents.has(String(row.event_id)) ||
      leagueIds.some((key) => rules.blockedLeagues.has(key)) ||
      (rules.allowedLeagues.size && !leagueIds.some((key) => rules.allowedLeagues.has(key)))) return;

  return {
    id, home: row.home, away: row.away, sport: sports[String(row.sport_id ?? league.sport_id)] || "football",
    league: [league.location, league.league].filter(Boolean).join(" - "), leagueId: String(league.league_id ?? ""),
    homeLogo: String(row.flag_home ?? ""), awayLogo: String(row.flag_away ?? ""),
    start: String(row.date ?? ""), status: "live",
    scores: { home: parseInt(String(row.home_scores ?? row.home_score), 10) || 0,
      away: parseInt(String(row.away_scores ?? row.away_score), 10) || 0 },
    clock: String(row.time_display ?? "Ao vivo").replace(/^(\d+)$/, "$1'"),
    markets: [],
  };
}

function marketFromFeed(raw: DataRecord, code: string, event: SportsEvent, rules: LiveRules): SportsMarket | undefined {
  if (!Array.isArray(raw.odds) || !raw.odds.length) return;
  const marketId = String(raw.mk_id ?? record(raw.odds[0]).mk_id ?? code);
  const options: SportsOption[] = [];
  const seen = new Set<string>();

  for (const value of raw.odds) {
    const odd = record(value);
    const id = String(odd.od_id ?? odd.id_od ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const basePrice = Number(odd.cotacao ?? odd.price);
    const reference = String(odd.mk_id ?? marketId);
    const margin = rules.margin + (rules.margins.get(reference) ?? 0);
    const adjusted = Math.min(basePrice * (1 + margin / 100), rules.cap);
    const price = Math.round(adjusted * 100) / 100;
    const enabled = !flag(odd.suspended) && !rules.blockedMarkets.has(reference) &&
      basePrice > 0 && Number.isFinite(price) && price > 1 && adjusted >= rules.minimum;
    const name = odd.odd === "Casa" ? event.home : odd.odd === "Fora" ? event.away : String(odd.odd ?? "");
    options.push({ id, name, odd: enabled ? price : null, enabled,
      marketCode: Number(reference) || undefined, optionCode: Number(odd.op_id) || undefined });
  }

  if (!options.length) return;
  return { id: marketId, internal: code, name: code === "fulltime_result" ? "Resultado Final" : String(raw.market ?? raw.name ?? code),
    category: "main", options };
}

export function liveEventsFromPanel(value: unknown, settings: unknown): SportsEvent[] {
  if (!Array.isArray(value)) throw new Error("Grade ao vivo indisponível.");
  const rules = liveRules(settings);
  return value.flatMap((group) => {
    const league = record(group);
    if (!Array.isArray(league.match)) return [];
    return league.match.flatMap((match) => {
      const row = record(match);
      const event = eventFromFeed(row, league, rules);
      if (!event) return [];
      const market = marketFromFeed(record(row.mercado_principal), "fulltime_result", event, rules);
      if (market) event.markets.push(market);
      return [event];
    });
  });
}

export function liveEventFromPanel(value: unknown, settings: unknown): SportsEvent | undefined {
  const row = record(value);
  const rules = liveRules(settings);
  const event = eventFromFeed(row, row, rules);
  if (!event) return;
  event.markets = Object.entries(record(row.markets)).flatMap(([key, value]) => {
    const raw = record(value);
    const market = marketFromFeed(raw, String(raw.market_code ?? key), event, rules);
    return market ? [market] : [];
  });
  return event;
}
