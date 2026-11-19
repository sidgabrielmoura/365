import Link from "next/link";
import { ChevronRight, RefreshCw } from "lucide-react";
import type { ComponentType } from "react";
import { sportsLeagueHref } from "@/lib/backoffice/sports-leagues";
import type { useLeagueSearch } from "@/lib/backoffice/search-source";
import { resultMarket, type SportsEvent } from "@/lib/sports-data";
import { SportMenuIcon } from "./sport-menu-icon";
import "./league-schedule.css";

type LeagueMatches = ReturnType<typeof useLeagueSearch>["leagues"];
const timeZone = "America/Sao_Paulo";
const dateKey = new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeZone });
const dateLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "short", timeZone });

export function LeagueSearchResults({ leagues, onSelect }: { leagues: LeagueMatches; onSelect: () => void }) {
  if (!leagues.length) return null;
  return (
    <section className="league-search-results" aria-label="Competições encontradas">
      <h2>Competições</h2>
      <ul>
        {leagues.map((league) => (
          <li key={league.id}>
            <Link href={sportsLeagueHref("football", league.id)} onClick={onSelect}>
              <SportMenuIcon id="football" />
              <span>
                <strong>{league.name}</strong>
                {league.location && <small>{league.location}</small>}
              </span>
              <ChevronRight size={17} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function gamesByDay(events: SportsEvent[]) {
  const groups = new Map<string, { label: string; games: SportsEvent[] }>();
  for (const event of events) {
    const date = new Date(event.start);
    const dated = Number.isFinite(date.getTime());
    const key = dated ? dateKey.format(date) : "";
    const group = groups.get(key);
    if (group) group.games.push(event);
    else groups.set(key, { label: dated ? dateLabel.format(date).replace(".", "") : "Data a confirmar", games: [event] });
  }
  return [...groups];
}

export function LeagueSchedule({
  name, games, loading, error, onRefresh, MatchCard,
}: {
  name: string;
  games: SportsEvent[];
  loading: boolean;
  error: string;
  onRefresh?: () => void;
  MatchCard: ComponentType<{ event: SportsEvent }>;
}) {
  return (
    <section className="league-schedule" aria-label="Calendário da competição">
      <header className="league-schedule-header">
        <div>
          <p>Calendário da competição</p>
          <h1>{name}</h1>
        </div>
        {onRefresh && (
          <button type="button" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
            {loading ? "Atualizando…" : "Atualizar jogos"}
          </button>
        )}
      </header>
      {error && games.length > 0 && <p className="league-schedule-message" role="status">{error}</p>}
      <div className="league-schedule-days" aria-busy={loading}>
        {gamesByDay(games).map(([key, { label, games }]) => {
          const twoWay = games.every((event) => resultMarket(event)?.options.length === 2);
          return (
            <section className="league-schedule-day" key={key}>
              <header className="league-day-heading">
                <h2>{key ? <time dateTime={key}>{label}</time> : label}</h2>
                <div className="league-day-outcomes" aria-hidden="true">
                  <span>Casa</span>
                  {!twoWay && <span>Empate</span>}
                  <span>Fora</span>
                </div>
              </header>
              {games.map((event) => <MatchCard key={event.id} event={event} />)}
            </section>
          );
        })}
      </div>
    </section>
  );
}
