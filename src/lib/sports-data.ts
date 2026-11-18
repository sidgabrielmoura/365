import snapshot from "@/data/sports-events.json";
import home from "@/data/sports-home.json";
import navigation from "@/data/sports-navigation.json";
import live from "@/data/sports-live.json";
import tabSnapshots from "@/data/home-tabs.json";
import type { DemoPick, DemoPickInput } from "./demo-types";
export type SportsOption = {
  id: string;
  name: string;
  odd: number | null;
  line?: number | null;
  side?: string;
  originalOdd?: number;
  enabled?: boolean;
  marketCode?: number;
  optionCode?: number;
};
export type SportsMarket = {
  id: string;
  name: string;
  category: string;
  group?: string;
  options: SportsOption[];
  internal?: string;
};
export type SportsEvent = {
  id: string;
  sport: string;
  league: string;
  leagueId: string;
  home: string;
  away: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  start: string;
  status: string;
  scores?: { home: number; away: number };
  markets: SportsMarket[];
  earlyPayout?: { goals: number };
  clock?:
    | string
    | {
        playedSeconds: number;
        minute: number;
        running: boolean;
        statusDetail: string;
      };
  period?: string;
};
export const events = snapshot as unknown as SportsEvent[];
export const homeEvents = home.sections[0].events as unknown as SportsEvent[];
export const homeTabs = tabSnapshots as unknown as Record<
  string,
  { sections: { title: string; events: SportsEvent[] }[] }
>;
export const liveEvents = live.events as unknown as SportsEvent[];
export const sportsNavigation = navigation;
export const eventById = (id: string) =>
  events.find((event) => event.id === id);
export function pickEvent(pick: DemoPick): SportsEvent | undefined {
  return pick.fixture ? {
    id: pick.eventId, sport: "football", league: "", leagueId: "", markets: [], ...pick.fixture,
  } : eventById(pick.eventId);
}
export const resultMarket = (event: SportsEvent) =>
  event.markets.find((market) => market.name === "Resultado Final") ||
  event.markets[0];
export function findSelection(input: DemoPickInput): DemoPick | undefined {
  const event = eventById(input.eventId);
  return event ? selectionForEvent(event, input) : undefined;
}
export function selectionForEvent(event: SportsEvent, input: DemoPickInput): DemoPick | undefined {
  const market = event.markets.find((item) => item.id === input.marketId);
  const option = market?.options.find((item) => item.id === input.selectionId);
  return market && option ? selectionForMarket(event, market, option) : undefined;
}
export function selectionForMarket(event: SportsEvent, market: SportsMarket, option: SportsOption): DemoPick | undefined {
  if (option.enabled === false || option.odd == null || !Number.isFinite(option.odd) || option.odd <= 1)
    return;
  return {
    eventId: event.id,
    marketId: market.id,
    selectionId: option.id,
    key: [event.id, market.id, option.id].join("|"),
    eventLabel: `${event.home} x ${event.away}`,
    marketLabel: market.name,
    label: option.name,
    odd: option.odd,
    originalOdd: option.originalOdd,
    enabled: option.enabled,
    betType: event.status === "live" ? "live" : "prematch",
    marketCode: option.marketCode,
    optionCode: option.optionCode,
  };
}
export function eventTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function liveClock(event: SportsEvent) {
  if (typeof event.clock === "string") return event.clock;
  if (!event.clock) return "Ao vivo";
  return `${Math.floor(event.clock.playedSeconds / 60)}:${String(event.clock.playedSeconds % 60).padStart(2, "0")}`;
}
