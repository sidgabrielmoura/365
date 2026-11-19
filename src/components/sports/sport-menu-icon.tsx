import type { SportMenuIconId } from "@/lib/sports-catalog";

export function SportMenuIcon({ id }: { id: SportMenuIconId }) {
  return (
    <img
      className="sport-menu-icon"
      src={`/assets/sports-menu/${id}.svg`}
      width={26}
      height={26}
      alt=""
    />
  );
}
