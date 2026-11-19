"use client";

import Link from "next/link";
import { useState } from "react";
import { useSite } from "@/lib/site-context";
import { useLeagueGroups } from "@/lib/backoffice/sports-source";
import { sportsLeagueHref } from "@/lib/backoffice/sports-leagues";
import { EnabledModule, ModulePage, Status } from "./module-ui";

const sports: Record<string, string> = {
  football: "Futebol", basketball: "Basquete", boxing: "Boxe", "mixed-martial-arts": "MMA", tennis: "Tênis",
  volleyball: "Vôlei", esports: "E-sports", "american-football": "Futebol americano",
  baseball: "Beisebol", snooker: "Sinuca", futsal: "Futsal", handball: "Handebol", darts: "Dardos",
};

function Directory() {
  const { runtime } = useSite();
  const [sport, setSport] = useState("football");
  const { groups, loading, error } = useLeagueGroups(sport);
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
    <Status error={error} text={loading ? "Carregando ligas…" : groups.length ? "" : "Nenhuma liga disponível."} />
    {groups.map((group) => <section key={String(group.key)}>
      <h2>{String(group.location)}</h2>
      <ul>{group.leagues.map((league) => <li key={league.id}>
        <Link href={sportsLeagueHref(sport, league.id)}>{league.name}</Link>
      </li>)}</ul>
    </section>)}
  </>;
}

export function LeagueDirectory() {
  return <ModulePage title="Ligas e calendário"><EnabledModule module="bet"><Directory /></EnabledModule></ModulePage>;
}
