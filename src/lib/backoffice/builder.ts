import type { DemoPick } from "@/lib/demo-types";
import type { UserLevel } from "./types";

function decode(value: unknown, key: number): unknown {
  if (Array.isArray(value)) return value.map((item) => decode(item, key));
  return typeof value === "number" ? value ^ key : value;
}

export function builderSelection(value: unknown, level: UserLevel | undefined, eventId: string, legs: DemoPick[]) {
  if (!Array.isArray(value) || value.length !== 8 || !Array.isArray(value[2])) return;
  const [key, ...blocked] = value[2];
  if (!Number.isInteger(key)) return;
  const decoded = value.map((item, index) => decode(index === 2 ? blocked : item, key)) as number[][][];
  const profile = decoded[level === "cambista" ? 0 : 1];
  if (!Array.isArray(profile) || !Array.isArray(profile[0]) || profile[0][0] !== 1) return;
  if (!legs.length || legs.length > profile[0][1] || legs.some((leg) => leg.eventId !== eventId || leg.betType === "live"
    || !Number.isFinite(leg.marketCode) || !Number.isFinite(leg.optionCode)
    || (decoded[2] as unknown[]).includes(leg.marketCode))) return;
  const codes = legs.map((leg) => leg.optionCode!);
  const exclusives = decoded[6] as unknown[];
  if (legs.some((leg) => legs.some((other) => other !== leg && leg.marketCode === other.marketCode
    && !(exclusives.includes(leg.optionCode) && exclusives.includes(other.optionCode))))) return;
  const contradiction = decoded[4].some((group) => Array.isArray(group) && group.length > 1 && group.every((item) => codes.includes(item)));
  const conflict = decoded[3].some((group) => Array.isArray(group) && group.filter((set) =>
    (Array.isArray(set) ? set : [set]).some((item) => codes.includes(item))).length > 1);
  const strict = decoded[5].some((group) => Array.isArray(group) && codes.includes(group[0])
    && codes.some((code) => code !== group[0] && !group.slice(1).includes(code)));
  if (contradiction || conflict || strict) return;
  const selections = legs.map((leg) => ({ ...leg, odd: leg.originalOdd ?? leg.odd }));
  // Show a provisional combined price. The panel applies the latest price
  // rules at registration and asks for reconfirmation when a price changes.
  const price = selections.reduce((total, leg) => total * leg.odd, 1);
  const cap = profile[0][2] / 1000;
  if (!Number.isFinite(price) || price <= 0) return;
  return {
    ...selections[0], eventId, key: "builder:" + eventId, kind: "builder" as const,
    marketLabel: "Criar Aposta", label: selections.map((leg) => leg.label).join(" + "),
    odd: Math.round(Math.min(price, cap > 0 ? cap : price) * 100) / 100,
    children: selections, legs: selections, originalOdd: undefined,
  };
}
