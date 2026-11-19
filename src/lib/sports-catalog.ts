const sports = [
  ["basketball", "Basquete"],
  ["baseball", "Beisebol"],
  ["boxing", "Boxe"],
  ["darts", "Dardos"],
  ["winter-sports", "Esportes de Inverno"],
  ["gaelic-sports", "Esportes Gaélicos"],
  ["motorsports", "Esportes Motorizados"],
  ["virtual-sports", "Esportes Virtuais"],
  ["esports", "E-Sports"],
  ["formula-1", "Fórmula 1"],
  ["football", "Futebol"],
  ["american-football", "Futebol Americano"],
  ["aussie-rules", "Futebol Australiano"],
  ["futsal", "Futsal"],
  ["golf", "Golfe"],
  ["handball", "Handebol"],
  ["ice-hockey", "Hóquei no Gelo"],
  ["mixed-martial-arts", "MMA"],
  ["pelota", "Pelota"],
  ["water-polo", "Polo Aquático"],
  ["rugby-league", "Rugby League"],
  ["rugby", "Rugby Union"],
  ["snooker", "Snooker"],
  ["surfing", "Surfe"],
  ["tennis", "Tênis"],
  ["table-tennis", "Tênis de Mesa"],
  ["sailing", "Vela"],
  ["volleyball", "Voleibol"],
] as const;

const sportNames = new Map<string, string>(sports);

export function catalogSportName(id: string) {
  return sportNames.get(id);
}

const leagueShortcuts = [
  { id: "serie-a", name: "Série A", league: "Brasil - Série A" },
  { id: "champions-league", name: "UEFA Champions League", league: "Liga dos Campeões da UEFA" },
] as const;

const entries = [
  ...sports.map(([id, name]) => ({ id, name, kind: "sport" as const })),
  ...leagueShortcuts.map((league) => ({ ...league, kind: "league" as const })),
  { id: "lotto", name: "Loto", kind: "route", href: "/loterias" } as const,
];

export type SportMenuIconId = (typeof entries)[number]["id"] | "upcoming" | "casino";

const alphabet = new Intl.Collator("pt-BR", { ignorePunctuation: true });
export const sportsMenu = [...entries].sort((a, b) => alphabet.compare(a.name, b.name));
