import lobby from "@/data/casino-lobby.json";
import catalogue from "@/data/casino-games.json";
import membership from "@/data/casino-membership.json";
import manifest from "@/data/sports-assets.json";
export type CasinoGame = {
  id: string;
  code: string;
  name: string;
  provider: string;
  image: string;
  available: boolean;
};
export const casinoLobby = lobby;
export const games = catalogue as CasinoGame[];
const categoryIds = membership as Record<string, string[]>;
export function gamesInCategory(category: string) {
  if (category === "inicio" || category === "todos") return games;
  if (category === "slots") {
    const excluded = new Set([
      ...(categoryIds.aovivo || []),
      ...(categoryIds.mesa || []),
      ...(categoryIds.crash || []),
    ]);
    return games.filter((game) => !excluded.has(game.id));
  }
  const ids = new Set(categoryIds[category] || []);
  return games.filter((game) => ids.has(game.id));
}
export const casinoImage = (game: CasinoGame) =>
  (manifest as Record<string, string>)[game.image] ||
  (game.image.startsWith("https://cdn.assetsfabrica.bet/") ? game.image : undefined) ||
  `/api/casino/image/${encodeURIComponent(game.id)}`;
export function decodeCasinoParam(id: string) {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}
export const casinoGameById = (id: string) =>
  games.find((game) => game.id === decodeCasinoParam(id));
export const providerTitle = (id: string) =>
  lobby.providers.find((provider) => provider.name === id)?.title ||
  (
    {
      PGSOFT: "PG Soft",
      PRAGMATIC: "Pragmatic Play",
      SPRIBE: "Spribe",
      EVOLUTION: "Evolution",
      HABANERO: "Habanero",
      BOOONGO: "Booongo",
      PLAYSON: "Playson",
      NETENT: "NetEnt",
      REDTIGER: "Red Tiger",
    } as Record<string, string>
  )[id] ||
  id;
export const categories = [
  { id: "inicio", name: "Início", path: "" },
  { id: "aovivo", name: "Ao Vivo", path: "ao-vivo" },
  { id: "novidades", name: "Novidades", path: "novidades" },
  { id: "slots", name: "Slots", path: "slots" },
  { id: "mesa", name: "Mesa e Cartas", path: "mesa-e-cartas" },
  { id: "crash", name: "Arcade", path: "arcade" },
  { id: "jackpots", name: "Jackpots", path: "jackpots" },
  { id: "todos", name: "Todos", path: "todos" },
];
