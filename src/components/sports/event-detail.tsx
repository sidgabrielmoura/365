"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { asset } from "@/lib/assets";
import {
  eventTime,
  selectionForEvent,
  type SportsEvent,
  type SportsMarket,
} from "@/lib/sports-data";
import { boostedOffers, boostPick } from "@/lib/bet-data";
import { useSite } from "@/lib/site-context";
import { useResource } from "@/lib/backoffice/use-resource";
import { marketsFromPanel } from "@/lib/backoffice/public-adapters";
import { Workspace, Odd } from "./workspace";
import "./event.css";

const tabs = [
  "Popular",
  "Criar Aposta",
  "Aposta Aumentada",
  "Marcadores",
  "Resultado",
  "Gols",
  "1º Tempo/2º Tempo",
  "Odds Asiáticas",
  "Principais",
  "Jogadores",
  "Chutes",
  "Escanteios",
  "Cartões",
  "Todos",
];
const builderEligible = (market: SportsMarket) =>
  /resultado final$|dupla chance|gols|ambas|handicap|escanteios|cartões|marcar/i.test(
    market.name,
  );
function belongs(market: SportsMarket, category: string) {
  if (category === "Popular" || category === "Todos") return true;
  if (category === "Criar Aposta") return builderEligible(market);
  if (category === "Resultado")
    return /resultado|chance|empate|placar/i.test(market.name);
  if (category === "1º Tempo/2º Tempo")
    return /tempo/i.test(market.name + market.group);
  if (category === "Odds Asiáticas") return /asiát|handicap/i.test(market.name);
  return (
    market.category === category ||
    market.group === category ||
    market.name.toLowerCase().includes(category.toLowerCase())
  );
}
function MarketGroup({
  event,
  market,
  builder,
  expanded,
  onBuilder,
}: {
  event: SportsEvent;
  market: SportsMarket;
  builder: boolean;
  expanded: boolean;
  onBuilder: () => void;
}) {
  return (
    <details className="market-group" open={expanded}>
      <summary>
        <span>
          {market.name}
          {market.name === "Resultado Final" && event.earlyPayout && (
            <em className="market-offer">Pagamento Antecipado</em>
          )}
        </span>
        {event.status !== "live" && builderEligible(market) && (
          <button
            className="market-builder"
            title="Criar Aposta"
            aria-label={`Criar aposta com ${market.name}`}
            onClick={(click) => {
              click.preventDefault();
              onBuilder();
            }}
          >
            CA
          </button>
        )}
      </summary>
      <div
        className={`market-options ${market.options.length === 3 ? "three-way" : ""} ${market.name === "Dupla Chance" ? "double-chance" : ""}`}
      >
        {market.options.map((option) => (
          <Odd
            key={option.id}
            event={event}
            market={market}
            option={option}
            builder={builder}
          />
        ))}
      </div>
    </details>
  );
}
function BoostedMarkets({ event }: { event: SportsEvent }) {
  const { picks, togglePick, runtime } = useSite();
  const remote = runtime.mode === "backoffice";
  const panelOffers = event.markets.flatMap((market) => market.options.flatMap((option) => {
    if (option.odd == null || !option.originalOdd || option.odd <= option.originalOdd) return [];
    return [{ id: option.id, titulo: option.name, mercado: market.name, pernas: [],
      oddOriginal: option.originalOdd, oddAumentada: option.odd,
      pick: selectionForEvent(event, { eventId: event.id, marketId: market.id, selectionId: option.id }) }];
  }));
  const offers = remote ? panelOffers : boostedOffers.filter((offer) => offer.fi === event.id);
  if (!offers.length) return null;
  return (
    <details className="market-group boost-pod" open>
      <summary>
        <span className="boost-title">
          APOSTA <b>AUMENTADA</b>
          <i className="boost-chev boost-chev-big" aria-hidden="true" />
        </span>
      </summary>
      <div className="boost-body">
        <div className="boost-grid">
          {offers.map((offer) => {
            const pick = "pick" in offer ? offer.pick : boostPick(offer.id),
              selected = picks.some((item) => item.key === pick?.key);
            return (
              <button
                key={offer.id}
                className={`boost-card ${offer.pernas.length > 1 ? "boost-card-builder" : ""} ${selected ? "selected" : ""}`}
                aria-pressed={selected}
                disabled={!pick}
                onClick={() => pick && togglePick(pick)}
              >
                <span className="boost-text">
                  <span className="boost-name">{offer.titulo}</span>
                  {offer.pernas.length > 1 ? (
                    <span className="boost-legs">
                      {offer.pernas.map((leg, index) => (
                        <span className="boost-leg" key={index}>
                          <i aria-hidden="true" />
                          <span>
                            {leg.mercado}: {leg.pick}
                          </span>
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="boost-market">{offer.mercado}</span>
                  )}
                </span>
                <span className="boost-odd">
                  <span className="boost-price">
                    <small>De</small>
                    <s>{offer.oddOriginal.toFixed(2)}</s>
                  </span>
                  <i className="boost-chev" aria-hidden="true" />
                  <span className="boost-price">
                    <small>Por</small>
                    <b>{offer.oddAumentada.toFixed(2)}</b>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}

export function EventDetail({ event }: { event: SportsEvent }) {
  const [category, setCategory] = useState("Popular"),
    rail = useRef<HTMLElement>(null);
  const { runtime, session } = useSite();
  const categories: Record<string, string> = { "Principais": "main", Gols: "goals", Jogadores: "players",
    "Escanteios": "corners", "Cartões": "cards", "1º Tempo/2º Tempo": "half_full_time" };
  const panelCategory = categories[category];
  const resource = useResource<unknown>(runtime.mode === "backoffice" && event.status !== "live" && panelCategory
    ? "/api/backoffice/api/v3/" + (session.user ? "user" : "app") + "/event-odds/" +
      encodeURIComponent(event.id) + "?category=" + panelCategory : null);
  const builder = category === "Criar Aposta";
  const ordered = [...event.markets].sort((a, b) => {
    const order = (m: SportsMarket) =>
      m.name === "Resultado Final" ? 0 : m.name === "Dupla Chance" ? 1 : 2;
    return order(a) - order(b);
  });
  let list = ordered.filter((market) => belongs(market, category));
  if (resource.data !== undefined && panelCategory) {
    try { list = marketsFromPanel(resource.data, event, category).markets; } catch { /* Render the initial markets. */ }
  }
  const date = Number.isNaN(Date.parse(event.start)) ? [] : new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date(event.start));
  const month = (
    date.find((part) => part.type === "month")?.value || ""
  ).replace(".", "");
  const label = date.length ? `${date.find((part) => part.type === "day")?.value} ${month.charAt(0).toUpperCase() + month.slice(1)} ${eventTime(event.start)}` : "Ao vivo";
  const form = (
    event as SportsEvent & { form?: { home: string[]; away: string[] } }
  ).form;
  return (
    <Workspace search={false}>
      <section className="match-header">
        <Link
          className="event-back"
          href={`/esportes/${event.sport}?liga=${encodeURIComponent(event.league)}`}
          aria-label="Voltar"
        >
          <span>
            <ArrowLeft size={23} />
          </span>
        </Link>
        <div className="match-heading">
          <p className="match-meta-heading">
            <Link
              href={`/esportes/${event.sport}?liga=${encodeURIComponent(event.league)}`}
            >
              {event.league}
            </Link>
            <span>•</span>
            <time dateTime={event.start}>{label}</time>
          </p>
          <h1>
            {[
              [event.home, event.homeLogo, form?.home],
              [event.away, event.awayLogo, form?.away],
            ].map(([name, logo, results], index) => (
              <span className="event-team-fragment" key={index}>
                {index === 1 && (
                  <span className="match-versus">
                    {event.status === "live"
                      ? `${event.scores?.home ?? 0} - ${event.scores?.away ?? 0}`
                      : "x"}
                  </span>
                )}
                <span className="match-team">
                  {logo && (
                    <img
                      className="team-logo"
                      src={asset(String(logo))}
                      alt=""
                      width={30}
                      height={30}
                    />
                  )}
                  <b>{String(name)}</b>
                  {Array.isArray(results) && (
                    <span
                      className="match-form"
                      aria-label="Últimos resultados"
                    >
                      {results.map((result, index) => (
                        <i
                          className={`form-${result.toLowerCase()}`}
                          key={index}
                        />
                      ))}
                    </span>
                  )}
                </span>
              </span>
            ))}
          </h1>
        </div>
        <Link
          className="match-markets-jump"
          aria-label="Jogos da competição"
          href={`/esportes/${event.sport}?liga=${encodeURIComponent(event.league)}`}
        />
      </section>
      <div className="market-tabs-bar">
        <button
          className="market-tabs-arrow event-visible-arrow"
          aria-label="Categorias anteriores"
          onClick={() =>
            rail.current?.scrollBy({ left: -300, behavior: "smooth" })
          }
        >
          <ChevronLeft size={18} />
        </button>
        <nav
          className="market-tabs"
          ref={rail}
          aria-label="Categorias de mercados"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              className={category === tab ? "active" : ""}
              disabled={event.status === "live" && tab === "Criar Aposta"}
              onClick={() => setCategory(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <button
          className="market-tabs-arrow event-visible-arrow"
          aria-label="Próximas categorias"
          onClick={() =>
            rail.current?.scrollBy({ left: 300, behavior: "smooth" })
          }
        >
          <ChevronRight size={18} />
        </button>
      </div>
      {builder && (
        <div className="builder-notice">
          <b>CA</b>
          <span>Combine 2 ou mais seleções deste jogo em uma só aposta.</span>
        </div>
      )}
      <div className="event-markets-list">
        {category === "Aposta Aumentada" ? (
          <BoostedMarkets event={event} />
        ) : (
          list.map((market, index) => (
            <div key={market.id}>
              <MarketGroup
                event={event}
                market={market}
                builder={builder}
                expanded={
                  builder
                    ? index === 0
                    : category === "Popular"
                      ? index < 2
                      : index < 3
                }
                onBuilder={() => setCategory("Criar Aposta")}
              />
              {category === "Popular" && index === 1 && (
                <BoostedMarkets event={event} />
              )}
            </div>
          ))
        )}
        {category !== "Aposta Aumentada" && !list.length && (
          <div className="market-empty">
            Nenhum mercado disponível nesta categoria.
          </div>
        )}
      </div>
    </Workspace>
  );
}
