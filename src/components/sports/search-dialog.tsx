"use client";
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { events, eventTime } from "@/lib/sports-data";
import { asset } from "@/lib/assets";
import { useSite } from "@/lib/site-context";
import { useSearchSource } from "@/lib/backoffice/search-source";
import { useLeagueGroups } from "@/lib/backoffice/sports-source";
import { searchLeagueGroups, sportsLeagueHref } from "@/lib/backoffice/sports-leagues";
export function SearchDialog() {
  const { closeModal } = useSite(),
    [query, setQuery] = useState("");
  const source = useSearchSource(query);
  const term = query.trim();
  const directory = useLeagueGroups("football", source.remote && term.length >= 3);
  const list =
    term.length > 1
      ? source.remote ? source.events : events
          .filter((event) =>
            `${event.home} ${event.away} ${event.league}`
              .toLowerCase()
              .includes(term.toLowerCase()),
          )
          .slice(0, 30)
      : [];
  const results = [
    ...list.map((event) => ({
      key: "event:" + event.id, href: `/evento/${event.id}`, icon: event.homeLogo,
      title: `${event.home} x ${event.away}`, subtitle: `${event.league} · ${eventTime(event.start)}`,
    })),
    ...searchLeagueGroups(term, directory.groups).map((league) => ({
      key: "league:" + league.id, href: sportsLeagueHref("football", league.id), icon: league.icon,
      title: league.name, subtitle: league.location,
    })),
  ];
  return (
    <Dialog
      title="Pesquisar jogos"
      className="demo-search-dialog"
      onClose={closeModal}
    >
      <h2>Pesquisar</h2>
      <label className="demo-search-input">
        <Search size={18} />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Times, competições ou esportes"
          aria-label="Times, competições ou esportes"
        />
      </label>
      <div className="demo-search-results">
        {results.map((result) => (
          <Link
            className="search-panel-item"
            key={result.key}
            href={result.href}
            onClick={closeModal}
          >
            <img
              src={asset(result.icon || "1-5801621400.svg")}
              className="search-panel-icon"
              alt=""
            />
            <div>
              <div className="search-panel-main">
                {result.title}
              </div>
              <div className="search-panel-sub">
                {result.subtitle}
              </div>
            </div>
          </Link>
        ))}
        {!results.length && (
          <p className="search-panel-empty" role="status">
            {term.length < (source.remote ? 3 : 2)
              ? source.remote ? "Digite pelo menos 3 caracteres." : "Digite pelo menos 2 letras."
              : source.error || directory.error || (source.loading || directory.loading ? "Buscando jogos…" : "Nenhum jogo encontrado.")}
          </p>
        )}
      </div>
    </Dialog>
  );
}
