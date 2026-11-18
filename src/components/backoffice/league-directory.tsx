"use client";

import Link from "next/link";
import { useState } from "react";
import { useSite } from "@/lib/site-context";
import { EnabledModule, ModulePage, panelRows, Status, usePanel } from "./module-ui";

const sports: Record<string, string> = {
  football: "Futebol", basketball: "Basquete", boxing: "Boxe", "mixed-martial-arts": "MMA", tennis: "Tênis",
  volleyball: "Vôlei", "american-football": "Futebol americano", baseball: "Beisebol", snooker: "Sinuca",
  handball: "Handebol", darts: "Dardos",
};

function Directory() {
  const { runtime } = useSite();
  const [sport, setSport] = useState("football");
  const sportId = runtime.sportIds[sport];
  const resource = usePanel(sportId ? "/api/leagues-default-grouped?sport_id=" + encodeURIComponent(sportId) : null);
  const groups = panelRows(resource.data);
  const days = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Sao_Paulo" });
  return <>
    <label>Esporte <select value={sport} onChange={(event) => setSport(event.target.value)}>
      {Object.entries(sports).filter(([id]) => runtime.sportIds[id]).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select></label>
    <h2>Calendário</h2>
    <ul>{Array.from({ length: 7 }, (_, day) => <li key={day}>
      <Link href={"/esportes/" + sport + "?dia=" + (day + 1)}>
        {days.format(new Date(Date.now() + day * 86_400_000))}
      </Link>
    </li>)}</ul>
    <Status error={resource.error} text={resource.loading ? "Carregando ligas…" : groups.length ? "" : "Nenhuma liga disponível."} />
    {groups.map((group) => <section key={String(group.key)}>
      <h2>{String(group.location)}</h2>
      <ul>{panelRows(group.leagues).map((league) => <li key={String(league.league_id)}>
        <Link href={"/esportes/" + sport + "?liga=" + encodeURIComponent(String(league.league_id))}>{String(league.league)}</Link>
      </li>)}</ul>
    </section>)}
  </>;
}

export function LeagueDirectory() {
  return <ModulePage title="Ligas e calendário"><EnabledModule module="bet"><Directory /></EnabledModule></ModulePage>;
}
