import Link from "next/link";
import { publicHttpsUrl } from "@/lib/backoffice/branding";
import { record, type DataRecord } from "@/lib/backoffice/types";

export function tenantBanners(
  items: DataRecord[],
  loggedIn: boolean,
  openAccount: (kind: "login" | "register") => void,
) {
  return items.flatMap((item, index) => {
    const banner = record(item);
    const media = publicHttpsUrl(banner.media);
    if (!media || (banner.display === "only_guest" && loggedIn) || (banner.display === "only_logged" && !loggedIn))
      return [];
    const title = typeof banner.title === "string" && banner.title.trim() ? banner.title.trim() : "Destaque";
    const image = <img src={media} alt={title} width={1360} height={600} />;
    if (banner.action === "login" || banner.action === "register") {
      const action = banner.action;
      if (!loggedIn) return [<button key={index} className="promotion-card" onClick={() => openAccount(action)}>{image}</button>];
    }
    if (banner.action === "open_casino_game" && typeof banner.game_ref === "string" &&
      /^[a-z0-9_:-]+$/i.test(banner.game_ref)) {
      return [<Link className="promotion-card" key={index} href={"/cassino/jogo/" + encodeURIComponent(banner.game_ref)}>{image}</Link>];
    }
    const url = banner.action === "external" ? publicHttpsUrl(banner.url) : undefined;
    if (url) return [<a className="promotion-card" key={index} href={url} target="_blank" rel="noopener noreferrer">{image}</a>];
    return [<div className="promotion-card" key={index}>{image}</div>];
  });
}
