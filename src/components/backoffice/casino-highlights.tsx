"use client";

import Link from "next/link";
import { EnabledModule, ModulePage, panelRows, Status, usePanel } from "./module-ui";

function Highlights() {
  const games = usePanel("/api/casino/games-content", "POST");
  const rows = panelRows(games.data);
  return <>
    <Status error={games.error} text={games.loading ? "Carregando jogos…" : rows.length ? "" : "Nenhum jogo em destaque."} />
    <ul>{rows.map((game) => <li key={String(game.reference)}>
      <Link href={"/cassino/jogo/" + encodeURIComponent(String(game.reference))}>{String(game.name)}</Link>
    </li>)}</ul>
  </>;
}
export function CasinoHighlights() {
  return <ModulePage title="Destaques do cassino"><EnabledModule module="casino"><Highlights /></EnabledModule></ModulePage>;
}
