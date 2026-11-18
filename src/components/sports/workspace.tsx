"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  ChartNoAxesColumn,
} from "lucide-react";
import railData from "@/data/sports-rail.json";
import {
  events,
  homeEvents,
  homeTabs,
  liveEvents,
  sportsNavigation,
  eventTime,
  resultMarket,
  findSelection,
  selectionForMarket,
  type SportsEvent,
  type SportsMarket,
  type SportsOption,
} from "@/lib/sports-data";
import { asset } from "@/lib/assets";
import { useSite } from "@/lib/site-context";
import { Footer } from "@/components/shell";
import "./sports.css";
import "./odds-movement.css";
import { useOddMovement } from "./use-odd-movement";
import { useSportsSource, useFeaturedLeagues, useFeaturedEvents } from "@/lib/backoffice/sports-source";
import { tenantBanners } from "./tenant-banners";
import { useSearchSource } from "@/lib/backoffice/search-source";

const numericSports: Record<string, string> = {
  "1": "football",
  "18": "basketball",
  "13": "tennis",
  "12": "american-football",
  "16": "baseball",
  "91": "volleyball",
  "162": "mixed-martial-arts",
  "92": "table-tennis",
  "9": "boxing",
  "15": "darts",
};
export function referenceHref(url: string) {
  if (url.includes("CASINO")) return "/cassino";
  if (url.includes("NX")) return "/proximos";
  const sport = numericSports[url.split("/")[2]] || "football";
  const league = url.split("/l/")[1];
  return `/esportes/${sport}${league ? `?liga=${encodeURIComponent(decodeURIComponent(league))}` : ""}`;
}
export function Sidebar() {
  const { runtime } = useSite();
  const remoteLeagues = useFeaturedLeagues();
  const featured = runtime.mode === "backoffice" ? remoteLeagues : sportsNavigation.emAlta;
  const alphabetical = [...sportsNavigation.sports]
    .filter(
      (sport) =>
        !["alpine-skiing", "cross-country", "bandy"].includes(sport.id),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return (
    <aside className="sidebar" aria-label="Esportes e competições">
      <p className="sidebar-title">Em Alta</p>
      <nav className="featured-navigation" aria-label="Competições em destaque">
        {featured.map((league) => (
          <Link
            key={league.slug}
            href={`/esportes/${league.sport}?liga=${encodeURIComponent(league.name)}`}
          >
            <img
              src={asset(
                league.name === "NBA"
                  ? "zlogo_nba_official-bc5752967c.svg"
                  : "zClass_26_Soccer-72908a6a41.svg",
              )}
              alt=""
            />
            <span>{league.name}</span>
          </Link>
        ))}
      </nav>
      <p className="sidebar-title">A-Z</p>
      <nav className="sports-navigation" aria-label="Lista de esportes">
        <Link className="sport-link" href="/proximos">
          <img src={asset("NextToStart-ba9fb01ee0.svg")} alt="" />
          Próximo a Começar
        </Link>
        {alphabetical.map((sport) => (
          <Link
            className="sport-link"
            key={sport.id}
            href={`/esportes/${sport.id}`}
          >
            <img src={asset(sport.icon)} alt="" />
            <span>{sport.name}</span>
          </Link>
        ))}
        <Link className="sport-link" href="/cassino">
          <img src={asset("zClass_26_Casino-8d32c62bc4.svg")} alt="" />
          Cassino
        </Link>
      </nav>
      <Link className="sidebar-footer" href="/ajuda">
        Ajuda e informações
        <br />
        Jogue com responsabilidade. 18+
      </Link>
    </aside>
  );
}
export function Workspace({
  children,
  sidebar = true,
  search = true,
  searchLabel = "Pesquisar",
}: {
  children: ReactNode;
  sidebar?: boolean;
  search?: boolean;
  searchLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const searchSource = useSearchSource(query);
  const results =
    query.trim().length > 1
      ? (searchSource.remote ? searchSource.events : events)
          .filter((event) =>
            `${event.home} ${event.away} ${event.league}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
          )
          .slice(0, 20)
      : [];
  return (
    <div className={`layout ${!sidebar ? "wide-workspace" : ""}`}>
      {sidebar && <Sidebar />}
      <div className="content-column">
        {search && (
          <form
            className="global-search-field"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <Search size={20} strokeWidth={1} />
            <input
              type="search"
              placeholder={searchLabel}
              aria-label={searchLabel}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>
        )}
        <main id="main" tabIndex={-1}>
          {query.trim().length > 1 ? (
            <section className="search-local">
              <div className="section-heading">
                <h1>Resultados para “{query}”</h1>
                <button onClick={() => setQuery("")}>Limpar</button>
              </div>
              {results.length ? (
                results.map((event) => (
                  <MatchCard key={event.id} event={event} />
                ))
              ) : (
                <p className="empty-local">Nenhum jogo encontrado.</p>
              )}
            </section>
          ) : (
            children
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
export function SportsRail() {
  return (
    <nav className="sports-rail" aria-label="Esportes populares">
      {railData.map((item) => (
        <Link href={referenceHref(item.url)} key={item.name}>
          <img src={asset(item.icon)} alt="" />
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}
export function Promotions() {
  const rail = useRef<HTMLDivElement>(null),
    { openModal, runtime, session } = useSite();
  const banners = runtime.branding && tenantBanners(runtime.carousel, Boolean(session.user), (kind) => openModal({ kind }));
  if (banners?.length === 0) return null;
  return (
    <section className="promotion-carousel" aria-label={"Destaques de " + (runtime.branding?.name ?? "BrasaBet")}>
      <div className="promotion-rail" ref={rail}>
        {banners ?? <>
        <Link className="promotion-card" href="/esportes/football?antecipado=1">
          <img
            src={asset(
              "/releases/20261117234105344-1f7bfdfb6fde/assets/reference/banner-early.webp",
            )}
            alt="Pagamento Antecipado"
            width={1360}
            height={600}
          />
        </Link>
        <button
          className="promotion-card"
          onClick={() =>
            openModal({
              kind: "info",
              title: "Encerrar Aposta",
              payload:
                "Consulte o bilhete em Minhas Apostas para encerrar antecipadamente uma aposta de demonstração. O valor disponível aparece no próprio bilhete.",
            })
          }
        >
          <img
            src={asset(
              "/releases/20261117234105344-1f7bfdfb6fde/assets/reference/banner-cashout.webp",
            )}
            alt="Encerrar Aposta"
            width={1360}
            height={600}
          />
        </button>
        <button
          className="promotion-card"
          onClick={() =>
            openModal({
              kind: "info",
              title: "Acumulada Aumentada",
              payload:
                "Em breve. As promoções disponíveis para sua conta serão exibidas em Recompensas.",
            })
          }
        >
          <img
            src={asset(
              "/releases/20261117234105344-1f7bfdfb6fde/assets/reference/banner-boost.webp",
            )}
            alt="Acumulada Aumentada"
            width={1360}
            height={600}
          />
          <span className="promotion-status">Em breve</span>
        </button>
        <Link className="promotion-card promotion-card-casino" href="/cassino">
          <img
            src={asset(
              "/releases/20261117234105344-1f7bfdfb6fde/assets/reference/banner-casino-new.webp",
            )}
            alt=""
          />
          <span className="promotion-casino-copy">
            <span>Casino</span>
            <strong>
              ESTÁ NA HORA
              <br />
              DE JOGAR!
            </strong>
            <small>3000+ SLOTS DISPONÍVEIS</small>
          </span>
        </Link>
        </>}
      </div>
      <button
        className="promotion-arrow prev"
        hidden={banners?.length === 1}
        aria-label="Cards anteriores"
        onClick={() =>
          rail.current?.scrollBy({ left: -350, behavior: "smooth" })
        }
      >
        ‹
      </button>
      <button
        className="promotion-arrow next"
        hidden={banners?.length === 1}
        aria-label="Próximos cards"
        onClick={() =>
          rail.current?.scrollBy({ left: 350, behavior: "smooth" })
        }
      >
        ›
      </button>
    </section>
  );
}
export function Odd({
  event,
  market,
  option,
  compact = false,
  builder = false,
}: {
  event: SportsEvent;
  market: SportsMarket;
  option: SportsOption;
  compact?: boolean;
  builder?: boolean;
}) {
  const { picks, togglePick, toggleBuilderPick } = useSite();
  const pick = selectionForMarket(event, market, option);
  const movement = useOddMovement(event.status === "live" ? pick?.key ?? null : null, pick?.odd ?? null);
  const selected = picks.some(
    (item) =>
      item.key === pick?.key ||
      item.children?.some((child) => child.key === pick?.key),
  );
  return (
    <button
      className={`odd ${selected ? "selected" : ""} ${compact ? "compact-odd" : ""}`}
      aria-label={`${option.name} — ${option.odd?.toFixed(2) || "indisponível"}`}
      aria-description={movement === "up" ? "Cotação subiu" : movement === "down" ? "Cotação desceu" : undefined}
      data-odd-movement={movement}
      aria-pressed={selected}
      disabled={!pick}
      onClick={() =>
        pick && (builder ? toggleBuilderPick(pick) : togglePick(pick))
      }
    >
      <span>{option.name}</span>
      <strong>{option.odd?.toFixed(2) || <LockKeyhole size={14} />}</strong>
    </button>
  );
}
export function MatchCard({
  event,
  live = false,
}: {
  event: SportsEvent;
  live?: boolean;
}) {
  const market = resultMarket(event),
    { openModal } = useSite();
  return (
    <article
      className={`event-row reference-event ${live ? "live-card" : ""}`}
      data-event={event.id}
    >
      <div className="event-body">
        <Link className="event-open" href={`/evento/${event.id}`}>
          <div className="teams">
            {[
              [event.home, event.homeLogo, event.scores?.home],
              [event.away, event.awayLogo, event.scores?.away],
            ].map(([name, logo, score], i) => (
              <div className="team" key={i}>
                {logo && (
                  <img
                    className="team-logo"
                    src={asset(String(logo))}
                    width={15}
                    height={17}
                    alt=""
                  />
                )}
                <span>{String(name)}</span>
                {live && <b className="live-score">{score ?? 0}</b>}
              </div>
            ))}
          </div>
        </Link>
        <div
          className={`odds-grid ${market?.options.length === 2 ? "two-way" : ""}`}
          aria-label={market?.name}
        >
          {market?.options.slice(0, 3).map((option) => (
            <Odd
              key={option.id}
              event={event}
              market={market}
              option={option}
            />
          ))}
        </div>
      </div>
      <footer className="match-meta">
        <span className="match-league">{event.league}</span>
        <div className="match-details">
          <time dateTime={event.start}>
            {live ? `${event.clock || "Ao vivo"}` : eventTime(event.start)}
          </time>
          <Link
            className="market-count"
            href={`/evento/${event.id}`}
            aria-label={`Ver mercados de ${event.home} e ${event.away}`}
          >
            +
          </Link>
          <button
            className="event-stats"
            onClick={() =>
              openModal({
                kind: "event-stats",
                payload: event,
              })
            }
          >
            Estat.
            <ChartNoAxesColumn size={14} />
          </button>
        </div>
      </footer>
    </article>
  );
}
const tabs = [
  ["day", "Jogos do Dia"],
  ["international", "Futebol Internacional"],
  ["football", "Futebol"],
  ["nba", "NBA"],
  ["nfl", "NFL"],
  ["tennis", "Tênis"],
  ["serie-b", "Série B"],
];
export function Home() {
  const params = useSearchParams(),
    tab = params.get("tab") || "day";
  const source = useSportsSource(tab === "nba" ? "basketball" : tab === "tennis" ? "tennis" : tab === "nfl" ? "american-football" : "football");
  const featured = useFeaturedEvents("events", tab === "day");
  const featuredIds = new Set(featured.events.map((event) => event.id));
  const todaysEvents = [...featured.events, ...source.events.filter((event) => !featuredIds.has(event.id))];
  const list = source.remote ? tab === "day" ? todaysEvents : source.events :
    tab === "day"
      ? homeEvents
      : homeTabs[tab]?.sections.flatMap((section) => section.events) || [];
  return (
    <Workspace>
      <SportsRail />
      <Promotions />
      <nav className="home-tabs" aria-label="Jogos em destaque">
        {tabs.map(([id, label]) => (
          <Link
            key={id}
            href={id === "day" ? "/" : `/?tab=${id}`}
            className={tab === id ? "active" : ""}
          >
            {label}
          </Link>
        ))}
      </nav>
      <section className="competition reference-competition">
        <div className="competition-title">
          <h2>
            <img src={asset("1-5801621400.svg")} alt="" />
            {tab === "day"
              ? "Principais Jogos do Dia"
              : tabs.find((item) => item[0] === tab)?.[1]}
          </h2>
          <Link href="/esportes/football">Ver Mais</Link>
        </div>
        <div className="competition-heading">
          <span>{source.remote ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date()) : "Qua 18 Nov"}</span>
          <div className="column-labels">
            <span>1</span>
            <span>X</span>
            <span>2</span>
          </div>
        </div>
        {list.length ? (
          list.map((event) => <MatchCard key={event.id} event={event} />)
        ) : (
          <div className="empty-local">
            {source.remote ? source.error || featured.error || (source.loading || featured.loading ? "Carregando jogos…" : "Nenhum jogo disponível nesta categoria.") : "Não há jogos desta categoria na captura disponível."}
          </div>
        )}
      </section>
    </Workspace>
  );
}
export function SportsList({
  sport,
  upcoming = false,
}: {
  sport: string;
  upcoming?: boolean;
}) {
  const query = useSearchParams(),
    router = useRouter(),
    league = query.get("liga") || "",
    page = Math.max(1, Number(query.get("pagina")) || 1);
  const name = upcoming
    ? "Próximo a Começar"
    : sportsNavigation.sports.find((item) => item.id === sport)?.name || sport;
  const featuredLeagues = useFeaturedLeagues();
  const remoteLeagueId = featuredLeagues.find((item) => item.name === league)?.leagueId;
  const day = query.get("dia");
  const segment = day && /^[1-7]$/.test(day) ? "10000" + day : upcoming ? "100008" : "100001";
  const source = useSportsSource(sport, remoteLeagueId || (league && /^\d+$/.test(league) ? league : segment));
  const sourceEvents = source.remote ? source.events : events;
  const filtered = sourceEvents.filter(
    (event) =>
      (upcoming || event.sport === sport) &&
      (!league || event.league === league || event.leagueId === league || (source.remote && event.league.endsWith(" - " + league))) &&
      event.status !== "live",
  );
  const leagues = [
    ...new Set(
      sourceEvents
        .filter((event) => event.sport === sport)
        .map((event) => event.league),
    ),
  ];
  return (
    <Workspace>
      <SportsRail />
      <div className="section-heading">
        <h1>{name}</h1>
        <span>{filtered.length} jogos capturados</span>
      </div>
      {leagues.length > 0 && (
        <form className="sports-filter">
          <label htmlFor="league-filter">Competição</label>
          <select
            id="league-filter"
            value={league}
            onChange={(event) => {
              router.push(
                `/esportes/${sport}?liga=${encodeURIComponent(event.target.value)}`,
              );
            }}
          >
            <option value="">Todas as competições</option>
            {leagues.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </form>
      )}
      {filtered.slice((page - 1) * 12, page * 12).map((event) => (
        <MatchCard key={event.id} event={event} />
      ))}
      {!filtered.length && (
        <div className="empty-local">
          <h2>Nenhuma partida disponível</h2>
          <p>Escolha outra competição ou confira os jogos do dia.</p>
          <Link href="/" className="button button-outline">
            Jogos do Dia
          </Link>
        </div>
      )}
      <Pagination
        total={filtered.length}
        page={page}
        perPage={12}
        href={(number) =>
          `${upcoming ? "/proximos" : `/esportes/${sport}`}?pagina=${number}&liga=${encodeURIComponent(league)}`
        }
      />
    </Workspace>
  );
}
export function Pagination({
  total,
  page,
  perPage,
  href,
}: {
  total: number;
  page: number;
  perPage: number;
  href: (page: number) => string;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages < 2) return null;
  return (
    <nav className="page-nav" aria-label="Paginação">
      {page > 1 && (
        <Link href={href(page - 1)} aria-label="Página anterior">
          <ChevronLeft size={15} />
        </Link>
      )}
      {Array.from({ length: pages }, (_, i) => i + 1)
        .filter(
          (number) =>
            number === 1 || number === pages || Math.abs(number - page) < 3,
        )
        .map((number) => (
          <Link
            className={number === page ? "active" : ""}
            aria-current={number === page ? "page" : undefined}
            href={href(number)}
            key={number}
          >
            {number}
          </Link>
        ))}
      {page < pages && (
        <Link href={href(page + 1)} aria-label="Próxima página">
          <ChevronRight size={15} />
        </Link>
      )}
    </nav>
  );
}
