import {
  ChevronsRight, Clover, createLucideIcon, Dices,
  Flag, Gamepad2, Gauge, Hand, HandFist, LandPlot, Medal, MonitorPlay,
  Sailboat, Snowflake, Swords, Target, Ticket,
  Trophy, Volleyball, Waves, type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { SportMenuIconId } from "@/lib/sports-catalog";

const Basketball = createLucideIcon("Basketball", [
  ["circle", { cx: "12", cy: "12", r: "9", key: "rim" }],
  ["path", { d: "M3 12h18M12 3v18M6 5.3a8 8 0 0 1 0 13.4M18 5.3a8 8 0 0 0 0 13.4", key: "seams" }],
]);
const Baseball = createLucideIcon("Baseball", [
  ["circle", { cx: "12", cy: "12", r: "9", key: "rim" }],
  ["path", { d: "M7 5c4 4 4 10 0 14m10-14c-4 4-4 10 0 14M6 9l2 1m-2 5 2-1m10-5-2 1m2 5-2-1", key: "stitches" }],
]);
const Football = createLucideIcon("Football", [
  ["circle", { cx: "12", cy: "12", r: "9", key: "rim" }],
  ["path", { d: "m12 8 4 3-1.5 4.5h-5L8 11l4-3Zm0 0V3m4 8 4.6-1.5m-6.1 6 3 3.5m-8-3.5-3 3.5M8 11 3.4 9.5", key: "panels" }],
]);
const Futsal = createLucideIcon("Futsal", [
  ["rect", { x: "2.5", y: "6", width: "19", height: "12", rx: "2", key: "court" }],
  ["circle", { cx: "12", cy: "12", r: "3", key: "circle" }],
  ["path", { d: "M12 6v3m0 6v3M3 9h2v6H3m18-6h-2v6h2", key: "lines" }],
]);
const Puck = createLucideIcon("Puck", [
  ["ellipse", { cx: "12", cy: "9", rx: "8", ry: "3.5", key: "face" }],
  ["path", { d: "M4 9v6c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5V9", key: "edge" }],
]);
const OvalBall = createLucideIcon("OvalBall", [
  ["path", { d: "M4 20C1 10 10 1 20 4c3 10-6 19-16 16Z", key: "rim" }],
  ["path", { d: "m8 16 8-8m-7 4 3 3m-1-5 3 3m-1-5 3 3", key: "stitches" }],
]);
const Tennis = createLucideIcon("Tennis", [
  ["circle", { cx: "12", cy: "12", r: "9", key: "rim" }],
  ["path", { d: "M8 4c1 5 7 11 12 12M4 8c5 1 11 7 12 12", key: "seams" }],
]);
const Paddle = createLucideIcon("Paddle", [
  ["path", { d: "m6 14-3 5 2 2 5-3m-4-4L4 11c1-4 5-8 9-8 4 1 7 4 8 8-1 4-5 8-9 9l-2-2", key: "paddle" }],
  ["path", { d: "m6 14 4 4", key: "grip" }],
]);
const Snooker = createLucideIcon("Snooker", [
  ["path", { d: "M12 3 3 20h18L12 3Z", key: "rack" }],
  ["path", { d: "M12 10h.01m-2 4h.01m4 0h.01m-6 3h.01m4 0h.01m4 0h.01", key: "balls" }],
]);
const Surf = createLucideIcon("Surf", [
  ["path", { d: "M3 16c3-1 5-4 9-5 3-.8 6-.7 9 0-3 2-7 4-11 4m-7 4c3 0 3-2 6-2s3 2 6 2 3-2 6-2", key: "board-and-wave" }],
]);

const icons = {
  upcoming: [ChevronsRight, "#60ebc5"],
  basketball: [Basketball, "#ffad76"],
  baseball: [Baseball, "#ffe4c5"],
  boxing: [HandFist, "#ff919b"],
  darts: [Target, "#ff9292"],
  "winter-sports": [Snowflake, "#9ddcff"],
  "gaelic-sports": [Clover, "#9de6a2"],
  motorsports: [Gauge, "#c3bfd9"],
  "virtual-sports": [MonitorPlay, "#82e0bb"],
  esports: [Gamepad2, "#a8aafe"],
  "formula-1": [Flag, "#ff9d8c"],
  football: [Football, "#caefd0"],
  "american-football": [OvalBall, "#efae78"],
  "aussie-rules": [OvalBall, "#ffc785"],
  futsal: [Futsal, "#fbe492"],
  golf: [LandPlot, "#a9eab8"],
  handball: [Hand, "#ffc99d"],
  "ice-hockey": [Puck, "#a0d5ff"],
  lotto: [Ticket, "#e9a6de"],
  "mixed-martial-arts": [Swords, "#ffab9f"],
  pelota: [Paddle, "#ebbe87"],
  "water-polo": [Waves, "#8fdef2"],
  "rugby-league": [OvalBall, "#9ed8ab"],
  rugby: [OvalBall, "#a7c4ff"],
  "serie-a": [Trophy, "#f7de83"],
  snooker: [Snooker, "#f5a6ae"],
  surfing: [Surf, "#95dfe5"],
  tennis: [Tennis, "#d5ec9c"],
  "table-tennis": [Paddle, "#e7b6fa"],
  "champions-league": [Medal, "#b5c9fd"],
  sailing: [Sailboat, "#a0d2ff"],
  volleyball: [Volleyball, "#fbe2a0"],
  casino: [Dices, "#e7c4ff"],
} satisfies Record<SportMenuIconId, [LucideIcon, string]>;

export function SportMenuIcon({ id }: { id: SportMenuIconId }) {
  const [Icon, color] = icons[id];
  return (
    <span aria-hidden="true" className="sport-menu-icon" style={{ "--sport-icon-color": color } as CSSProperties}>
      <Icon size={16} strokeWidth={1.8} focusable="false" />
    </span>
  );
}
