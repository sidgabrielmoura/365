"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Star, ChartNoAxesColumn, Goal } from "lucide-react";
import navigation from "@/data/live-navigation.json";
import capturedStats from "@/data/live-statistics.json";
import { asset } from "@/lib/assets";
import { useSite } from "@/lib/site-context";
import {
  liveEvents,
  resultMarket,
  liveClock,
  type SportsEvent,
} from "@/lib/sports-data";
import { Workspace, Odd } from "./workspace";
import "./live.css";
import { useLiveEvent, useLiveGrid } from "@/lib/backoffice/live";
import { record } from "@/lib/backoffice/types";

const ids: Record<string, string> = {
  "1": "football",
  "18": "basketball",
  "13": "tennis",
  "91": "volleyball",
  "92": "table-tennis",
  "78": "handball",
  "14": "snooker",
  FAV: "favorites",
  POP: "popular",
  STR: "streaming",
  curling: "curling",
};
const names: Record<string, string> = {
  football: "Futebol",
  basketball: "Basquete",
  tennis: "Tênis",
  volleyball: "Vôlei",
  "table-tennis": "Tênis de mesa",
  handball: "Handebol",
  snooker: "Sinuca",
  curling: "Curling",
};
function Favorite({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className={`live-favorite ${active ? "active" : ""}`}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      <Star size={18} />
    </button>
  );
}

export function StatisticsPanel({ event, live }: { event: SportsEvent; live: ReturnType<typeof useLiveEvent> }) {
  const { runtime } = useSite();
  const remote = runtime.mode === "backoffice";
  const href = (remote ? "/ao-vivo/jogo/" : "/evento/") + event.id;
  const stats = (side: string, key: string) => record(live.stats[side])[key] ?? "—";
  const [tab, setTab] = useState("Estat."),
    [more, setMore] = useState(false);
  const available = !remote && capturedStats.event === event.id;
  const wheels = available
    ? capturedStats.wheels
    : [
        { label: "Ataques", home: 0, away: 0 },
        { label: "Ataques Perigosos", home: 0, away: 0 },
        { label: "% de Posse", home: 50, away: 50 },
      ];
  return (
    <aside className="live-overview">
      <div className="local-live-panel">
        <header>
          <Link href={href}>{event.home}</Link>
          <strong>
            {event.scores?.home ?? 0} &nbsp;{event.scores?.away ?? 0}
          </strong>
          <Link href={href}>{event.away}</Link>
        </header>
        <nav aria-label="Estatísticas da partida">
          {["Estat.", "Est. Jogador", "Cronologia", "Escalação", "Tabela"].map(
            (label) => (
              <button
                className={tab === label ? "active" : ""}
                key={label}
                onClick={() => setTab(label)}
              >
                {label}
              </button>
            ),
          )}
        </nav>
        {tab === "Estat." ? (
          <div className="local-live-statistics">
            <div className="local-stat-wheels">
              {wheels.map((stat, index) => (
                <section key={stat.label}>
                  <small>{stat.label}</small>
                  <div>
                    <b>{remote ? "—" : stat.home}</b>
                    <span
                      className="local-stat-ring"
                      style={{
                        background: `conic-gradient(#0c7662 0 ${(100 * stat.away) / (stat.home + stat.away || 1)}%,#c40010 0)`,
                      }}
                    >
                      <i>{["›", "»", "% "][index]}</i>
                    </span>
                    <b>{remote ? "—" : stat.away}</b>
                  </div>
                </section>
              ))}
            </div>
            <div className="local-shots">
              <span>
                ⚑ &nbsp; ▪ &nbsp; ▪<b>{remote ? ["escanteios", "cartoes_amarelos", "cartoes_vermelhos"].map((key) => stats("home", key)).join("　") : available ? "6　0　0" : "0　0　0"}</b>
              </span>
              <section>
                <small>Finalizações / Chutes ao Gol</small>
                <div>
                  <b>{remote ? "—" : available ? "10/6" : "0/0"}</b>
                  <i />
                  <b>{remote ? "—" : available ? "6/4" : "0/0"}</b>
                </div>
              </section>
              <span>
                ▪ &nbsp; ▪ &nbsp; ⚑<b>{remote ? ["cartoes_vermelhos", "cartoes_amarelos", "escanteios"].map((key) => stats("away", key)).join("　") : available ? "0　1　3" : "0　0　0"}</b>
              </span>
            </div>
            {[
              "Faltas",
              "Impedimentos",
              "Pênaltis",
              "Substituições",
              ...(more ? ["Escanteios", "Defesas"] : []),
            ].map((label, index) => (
              <section className="local-stat-line" key={label}>
                <small>{label}</small>
                <div>
                  <b>{remote ? String(stats("home", ["faltas", "impedimentos", "penaltes", "substituicoes", "escanteios", "defesas"][index])) : available && index === 3 ? 4 : 0}</b>
                  <i />
                  <b>{remote ? String(stats("away", ["faltas", "impedimentos", "penaltes", "substituicoes", "escanteios", "defesas"][index])) : available && index === 3 ? 4 : 0}</b>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="local-live-details">
            <h3>{tab}</h3>
            <p>
              {tab === "Cronologia"
                ? remote && Array.isArray(live.timeline)
                  ? live.timeline.map((entry) => record(entry)).slice(-8).map((entry) =>
                    [entry.minute != null ? String(entry.minute) + "'" : "", entry.description].filter(Boolean).join(" ")).join(" · ") ||
                      liveClock(event)
                  : `${liveClock(event)} · ${typeof event.clock === "object" ? event.clock.statusDetail : "Ao vivo"}`
                : remote ? "Nenhum dado disponível para esta seção." : "Não há informações adicionais disponíveis nesta captura."}
            </p>
            <Link href={href}>Ver mercados da partida</Link>
          </div>
        )}
        <footer>
          <button onClick={() => setMore(!more)}>
            {more ? "Mostrar Menos" : "Mostrar Mais"}⌄
          </button>
        </footer>
      </div>
    </aside>
  );
}

export function Live() {
  const { openModal, runtime } = useSite();
  const remoteLive = useLiveGrid();
  const sourceEvents = runtime.mode === "backoffice" ? remoteLive.events : liveEvents;
  const query = useSearchParams(),
    sport = query.get("esporte") || "football";
  const [favorites, setFavorites] = useState<string[]>([]),
    [selected, setSelected] = useState(""),
    [marketTab, setMarketTab] = useState("winner");
  useEffect(() => {
    try {
      setFavorites(
        JSON.parse(localStorage.getItem("brasa-live-favorites") || "[]"),
      );
    } catch {}
  }, []);
  function toggleFavorite(id: string) {
    setFavorites((old) => {
      const next = old.includes(id)
        ? old.filter((item) => item !== id)
        : [...old, id];
      localStorage.setItem("brasa-live-favorites", JSON.stringify(next));
      return next;
    });
  }
  const list = sourceEvents.filter((event) =>
    sport === "favorites"
      ? favorites.includes(event.id)
      : ["popular", "streaming"].includes(sport) || event.sport === sport,
  );
  const chosen = list.find((event) => event.id === selected) || list[0];
  const detail = useLiveEvent(runtime.mode === "backoffice" ? chosen?.id : undefined, remoteLive.settings);
  function marketFor(event: SportsEvent) {
    return marketTab === "next"
      ? event.markets.find((market) => /próximo|a marcar o/i.test(market.name))
      : marketTab === "totals"
        ? event.markets.find((market) =>
            /mais\/menos|total|gols/i.test(market.name),
          )
        : resultMarket(event);
  }
  return (
    <Workspace sidebar={false} searchLabel="Pesquisar Ao-vivo">
      <div className="event-list-content">
        <div className="live-board">
          <div className="live-table">
            <nav className="live-navigation" aria-label="Esportes ao vivo">
              {navigation.map((item) => {
                const id = ids[item.url.split("/").at(-1) || ""] || "football";
                return (
                  <Link
                    key={id}
                    className={sport === id ? "active" : ""}
                    href={
                      id === "football" ? "/ao-vivo" : `/ao-vivo?esporte=${id}`
                    }
                    onClick={() => {
                      setSelected("");
                      setMarketTab("winner");
                    }}
                  >
                    {item.icon ? (
                      <img src={asset(item.icon)} alt="" />
                    ) : (
                      <span className="live-nav-symbol">
                        {id === "favorites" ? "★" : "♨"}
                      </span>
                    )}
                    {item.label.trim().replace(/^[★♨]/, "")}
                  </Link>
                );
              })}
            </nav>
            <h1 className="sr-only">{runtime.mode === "backoffice" ? "Ao-Vivo (" + remoteLive.count + ")" : "Ao-Vivo"}</h1>
            {[...new Set(list.map((event) => event.sport))].map((sportId) => (
              <section
                className={`live-sport live-sport-${sportId}`}
                key={sportId}
              >
                <h2>
                  <img
                    src={asset(
                      navigation.find(
                        (item) =>
                          ids[item.url.split("/").at(-1) || ""] === sportId,
                      )?.icon || "1-5801621400.svg",
                    )}
                    alt=""
                  />
                  {names[sportId] || sportId}
                </h2>
                <nav
                  className="live-market-tabs"
                  aria-label={`Mercados de ${names[sportId] || sportId}`}
                >
                  {[
                    ["winner", "Resultado Final"],
                    [
                      "next",
                      sportId === "football" ? "Próximo Gol" : "Handicap",
                    ],
                    [
                      "totals",
                      sportId === "football"
                        ? "Partida - Gols"
                        : "Total de Pontos",
                    ],
                  ].map(([id, label]) => (
                    <button
                      className={marketTab === id ? "active" : ""}
                      key={id}
                      onClick={() => setMarketTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
                {Object.entries(
                  Object.groupBy(
                    list.filter((event) => event.sport === sportId),
                    (event) => event.league,
                  ),
                ).map(([league, rows]) => (
                  <section className="live-competition" key={league}>
                    <header className="live-competition-heading">
                      <div className="live-league-title">
                        <Favorite
                          active={Boolean(
                            rows?.every((row) => favorites.includes(row.id)),
                          )}
                          label={`Favoritar liga ${league}`}
                          onClick={() => {
                            for (const row of rows || [])
                              if (!favorites.includes(row.id))
                                toggleFavorite(row.id);
                          }}
                        />
                        <span>{league}</span>
                      </div>
                      <div
                        className={`live-column-labels ${rows?.[0] && resultMarket(rows[0])?.options.length === 2 ? "live-column-labels-two" : ""}`}
                      >
                        <span>1</span>
                        {rows?.[0] &&
                          resultMarket(rows[0])?.options.length !== 2 && (
                            <span>X</span>
                          )}
                        <span>2</span>
                      </div>
                      <span className="live-media-space" />
                    </header>
                    {rows?.map((event) => {
                      const marketEvent = marketTab !== "winner" && detail.event?.id === event.id ? detail.event : event;
                      const market = marketFor(marketEvent);
                      return (
                        <article className="live-row" key={event.id}>
                          <div className="live-row-body">
                            <Link
                              className="live-teams"
                              href={(runtime.mode === "backoffice" ? "/ao-vivo/jogo/" : "/evento/") + event.id}
                            >
                              {[
                                [
                                  event.home,
                                  event.homeLogo,
                                  event.scores?.home,
                                ],
                                [
                                  event.away,
                                  event.awayLogo,
                                  event.scores?.away,
                                ],
                              ].map(([name, logo, score], index) => (
                                <div key={index}>
                                  {logo && (
                                    <img
                                      className="team-logo"
                                      src={asset(String(logo))}
                                      alt=""
                                      width={15}
                                      height={17}
                                    />
                                  )}
                                  <span>{name}</span>
                                  <b>{score ?? 0}</b>
                                </div>
                              ))}
                            </Link>
                            <div
                              className={`live-prices ${market?.options.length === 2 ? "local-live-two" : ""} ${marketTab === "totals" ? "live-prices-totals" : ""}`}
                            >
                              {market ? (
                                market.options
                                  .slice(0, 3)
                                  .map((option) => (
                                    <Odd
                                      key={option.id}
                                      event={marketEvent}
                                      market={market}
                                      option={option}
                                    />
                                  ))
                              ) : (
                                <span className="live-price-unavailable">
                                  —
                                </span>
                              )}
                            </div>
                            <button
                              className={`live-match-link ${chosen?.id === event.id ? "active" : ""}`}
                              aria-label={`Estatísticas de ${event.home} e ${event.away}`}
                              aria-pressed={chosen?.id === event.id}
                              onClick={() => setSelected(event.id)}
                            >
                              <Goal size={22} />
                            </button>
                          </div>
                          <footer>
                            <Favorite
                              active={favorites.includes(event.id)}
                              label={`Favoritar ${event.home} e ${event.away}`}
                              onClick={() => toggleFavorite(event.id)}
                            />
                            <time className="match-clock">
                              {liveClock(event)}
                            </time>
                            <button
                              className="live-stats"
                              aria-label={`Ver estatísticas de ${event.home}`}
                              onClick={() =>
                                openModal({
                                  kind: "event-stats",
                                  payload: runtime.mode === "backoffice" ? event : event.id,
                                })
                              }
                            >
                              <ChartNoAxesColumn size={12} />
                            </button>
                            <small>
                              {typeof event.clock === "object"
                                ? event.clock.statusDetail
                                : event.period || "Ao vivo"}
                            </small>
                          </footer>
                        </article>
                      );
                    })}
                  </section>
                ))}
              </section>
            ))}
            {!list.length && (
              <div className="empty-local">
                {remoteLive.error || (remoteLive.loading ? "Carregando partidas ao vivo…" : sport === "favorites"
                  ? "Adicione jogos aos favoritos usando a estrela ao lado de cada partida."
                  : runtime.mode === "backoffice" ? "Não há partidas desta modalidade ao vivo." : "Não há partidas desta modalidade nesta captura.")}
              </div>
            )}
          </div>
          {chosen && <StatisticsPanel event={chosen} live={detail} />}
        </div>
      </div>
    </Workspace>
  );
}
