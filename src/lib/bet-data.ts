import boosts from "@/data/boosts.json";
import { eventById, findSelection } from "./sports-data";
import type { DemoPick, DemoPickInput } from "./demo-types";

export const boostedOffers = boosts.aumentadas;
export function builderPick(
  eventId: string,
  legs: DemoPickInput[],
): DemoPick | undefined {
  const event = eventById(eventId);
  if (!event || legs.length < 1 || legs.length > 13) return;
  const children = legs.map((leg) =>
    findSelection({
      eventId,
      marketId: leg.marketId,
      selectionId: leg.selectionId,
    }),
  );
  if (children.some((pick) => !pick)) return;
  const valid = children.filter((pick): pick is DemoPick => Boolean(pick));
  if (new Set(valid.map((pick) => pick.marketId)).size !== valid.length) return;
  // A local demonstration quote; provider correlation and settlement are external services.
  const product = valid.reduce((total, pick) => total * pick.odd, 1);
  const odd =
    Math.round(Math.pow(product, valid.length === 1 ? 1 : 0.85) * 100) / 100;
  return {
    eventId,
    marketId: "builder",
    selectionId: "builder",
    key: `builder|${eventId}|${valid
      .map((pick) => pick.key)
      .sort()
      .join("~")}`,
    eventLabel: `${event.home} x ${event.away}`,
    marketLabel: "Criar Aposta",
    label: `Criar Aposta (${valid.length})`,
    kind: "builder",
    odd,
    children: valid,
    legs: valid.map(({ eventId, marketId, selectionId }) => ({
      eventId,
      marketId,
      selectionId,
    })),
  };
}
export function boostPick(id: string): DemoPick | undefined {
  const offer = boostedOffers.find((offer) => offer.id === id),
    event = offer && eventById(offer.fi);
  if (!offer || !event || offer.esgotada) return;
  const children = offer.pernas.flatMap((leg) => {
    const market = event.markets.find(
      (market) =>
        market.name === leg.mercado &&
        market.options.some((option) => option.name === leg.pick),
    );
    const option = market?.options.find((option) => option.name === leg.pick);
    const pick =
      market &&
      option &&
      findSelection({
        eventId: event.id,
        marketId: market.id,
        selectionId: option.id,
      });
    return pick ? [pick] : [];
  });
  return {
    eventId: event.id,
    marketId: "boost",
    selectionId: id,
    boostId: id,
    key: `boost|${id}`,
    eventLabel: `${event.home} x ${event.away}`,
    marketLabel: offer.mercado,
    label: offer.titulo,
    odd: offer.oddAumentada,
    kind: "boost",
    children,
  };
}
export function canonicalPick(input: DemoPickInput): DemoPick | undefined {
  if (!input || typeof input !== "object") return;
  if (input.boostId) {
    const pick = boostPick(input.boostId);
    return pick?.eventId === input.eventId ? pick : undefined;
  }
  if (input.marketId === "builder")
    return Array.isArray(input.legs)
      ? builderPick(input.eventId, input.legs)
      : undefined;
  return findSelection(input);
}
