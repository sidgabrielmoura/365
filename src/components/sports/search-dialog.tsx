"use client";
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { events, eventTime } from "@/lib/sports-data";
import { asset } from "@/lib/assets";
import { useSite } from "@/lib/site-context";
import { useSearchSource } from "@/lib/backoffice/search-source";
export function SearchDialog() {
  const { closeModal } = useSite(),
    [query, setQuery] = useState("");
  const source = useSearchSource(query);
  const list =
    query.trim().length > 1
      ? source.remote ? source.events : events
          .filter((event) =>
            `${event.home} ${event.away} ${event.league}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
          )
          .slice(0, 30)
      : [];
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
        {list.map((event) => (
          <Link
            className="search-panel-item"
            key={event.id}
            href={`/evento/${event.id}`}
            onClick={closeModal}
          >
            <img
              src={asset(event.homeLogo || "1-5801621400.svg")}
              className="search-panel-icon"
              alt=""
            />
            <div>
              <div className="search-panel-main">
                {event.home} x {event.away}
              </div>
              <div className="search-panel-sub">
                {event.league} · {eventTime(event.start)}
              </div>
            </div>
          </Link>
        ))}
        {!list.length && (
          <p className="search-panel-empty">
            {query.trim().length < (source.remote ? 3 : 2)
              ? source.remote ? "Digite pelo menos 3 caracteres." : "Digite pelo menos 2 letras."
              : source.remote ? source.error || (source.loading ? "Buscando jogos…" : "Nenhum jogo encontrado.") : "Nenhum jogo encontrado."}
          </p>
        )}
      </div>
    </Dialog>
  );
}
