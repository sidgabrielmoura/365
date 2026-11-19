"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import {
  casinoLobby,
  games,
  gamesInCategory,
  casinoImage,
  providerTitle,
  categories,
  type CasinoGame,
} from "@/lib/casino-data";
import { asset } from "@/lib/assets";
import { useSite } from "@/lib/site-context";
import { formatMoney } from "@/lib/demo-types";
import { Workspace, Pagination } from "@/components/sports/workspace";
import "./casino.css";
import { useCasinoSource } from "@/lib/backoffice/casino-source";
import { siteFetch } from "@/lib/backoffice/client";
const categoryIcons = [
  "Home_Active.svg",
  "Casino_Colour_Icon.svg",
  "New_Colour_Icon.svg",
  "Slots_Colour_Icon.svg",
  "Table_Cards_Colour_Icon.svg",
  "Cash_Arcade_Icon.svg",
  "Jackpots_Colour_Icon.svg",
  "All_Games_Coloured_Icon.svg",
];
function GameCard({ game }: { game: CasinoGame }) {
  const { openModal } = useSite();
  return (
    <article className="bcc-g" title={game.name}>
      <Link
        className="bcc-game-launch"
        href={`/cassino/jogo/${encodeURIComponent(game.id)}`}
        aria-label={`Abrir ${game.name}`}
      >
        <span className="bcc-g-img">
          <img src={casinoImage(game)} alt={game.name} loading="lazy" />
        </span>
        <span className="bcc-g-info">
          <b>{game.name}</b>
          <span>{providerTitle(game.provider)}</span>
        </span>
      </Link>
      <button
        className="bcc-i"
        aria-label={`Informações de ${game.name}`}
        onClick={() =>
          openModal({
            kind: "info",
            title: game.name,
            payload: `${providerTitle(game.provider)}. Explore o jogo demonstrativo nesta cópia local.`,
          })
        }
      >
        i
      </button>
    </article>
  );
}
function GameRow({
  title,
  list,
  href,
  style = "",
}: {
  title: string;
  list: CasinoGame[];
  href?: string;
  style?: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  return (
    <section className={`bcc-sec ${style}`}>
      <div className="bcc-head">
        <h2>
          {style === "bcc-top10" ? (
            <>
              <span className="bcc-os">Os</span>
              <b>Jogos em Destaque</b>
              <i>10</i>
            </>
          ) : (
            title
          )}
        </h2>
        {href && <Link href={href}>Ver mais</Link>}
      </div>
      <div className="bcc-row">
        <div className="bcc-trilho" ref={rail}>
          {list.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
        <div
          className={`casino-arrows ${list.length < 9 ? "casino-arrows-few" : ""}`}
        >
          <button
            aria-label={`Jogos anteriores de ${title}`}
            onClick={() =>
              rail.current?.scrollBy({ left: -650, behavior: "smooth" })
            }
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label={`Próximos jogos de ${title}`}
            onClick={() =>
              rail.current?.scrollBy({ left: 650, behavior: "smooth" })
            }
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
export function Casino({
  category = "inicio",
  provider = "",
}: {
  category?: string;
  provider?: string;
}) {
  const query = useSearchParams(),
    router = useRouter(),
    [search, setSearch] = useState(query.get("q") || "");
  const page = Math.max(1, Number(query.get("pagina")) || 1),
    path = categories.find((item) => item.id === category)?.path || "";
  const source = useCasinoSource(category, provider, page, search);
  const lobby = source.remote ? { sections: source.sections, providers: source.providers } : casinoLobby;
  let filtered = source.remote ? source.games : gamesInCategory(category);
  if (provider && !source.remote)
    filtered = filtered.filter((game) => game.provider === provider);
  if (search.trim() && !source.remote)
    filtered = filtered.filter((game) =>
      `${game.name} ${providerTitle(game.provider)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  const listing = category !== "inicio" || provider || search;
  return (
    <Workspace sidebar={false} search={false}>
      <div className="casino-page bcc">
        <div className="bcc-top">
          <form
            className="bcc-busca"
            onSubmit={(event) => {
              event.preventDefault();
              router.push(`/cassino/todos?q=${encodeURIComponent(search)}`);
            }}
          >
            <Search className="bcc-lupa" size={18} />
            <input
              type="search"
              aria-label="Buscar jogos"
              placeholder="Buscar"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>
          <nav className="bcc-cats" aria-label="Categorias do cassino">
            {categories.map((item, index) => (
              <Link
                className={`bcc-cat ${category === item.id ? "on" : ""}`}
                key={item.id}
                href={`/cassino${item.path ? `/${item.path}` : ""}`}
              >
                <img
                  src={asset(
                    `/releases/20261117234105344-1f7bfdfb6fde/assets/images/casino/${categoryIcons[index]}`,
                  )}
                  alt=""
                />
                <p>{item.name}</p>
              </Link>
            ))}
          </nav>
        </div>
        {listing ? (
          <section className="bcc-sec">
            <div className="bcc-head">
              <h1>
                {search
                  ? `Resultados para “${search}”`
                  : provider
                    ? providerTitle(provider)
                    : categories.find((item) => item.id === category)?.name}
              </h1>
              <span>{filtered.length} jogos na biblioteca local</span>
            </div>
            <div className="casino-local-grid">
              {(source.remote ? filtered : filtered.slice((page - 1) * 24, page * 24)).map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
            {!filtered.length && (
              <div className="empty-local">
                Nenhum jogo encontrado nesta categoria.
              </div>
            )}
            <Pagination
              total={source.remote ? source.total : filtered.length}
              page={page}
              perPage={24}
              href={(number) =>
                `${provider ? `/cassino/provedor/${encodeURIComponent(provider)}` : `/cassino/${path || "todos"}`}?pagina=${number}&q=${encodeURIComponent(search)}`
              }
            />
          </section>
        ) : (
          <>
            {lobby.sections.map((section, index) => (
              <div key={section.id}>
                <GameRow
                  title={section.title}
                  list={section.games as CasinoGame[]}
                  href={
                    index === 0
                      ? undefined
                      : section.provider
                        ? `/cassino/provedor/${encodeURIComponent(section.provider)}`
                        : `/cassino/${categories.find((item) => item.id === section.category)?.path || "todos"}`
                  }
                  style={
                    section.style === "featured"
                      ? "bcc-dest"
                      : section.style === "two-row"
                        ? "bcc-2l"
                        : section.style === "top10"
                          ? "bcc-top10"
                          : ""
                  }
                />
                {(source.remote ? index === Math.min(3, lobby.sections.length - 1) && lobby.providers.length > 0 : index === 3) && (
                  <section className="bcc-sec">
                    <div className="bcc-head">
                      <h2>Provedores Favoritos</h2>
                    </div>
                    <div className="casino-providers">
                      {lobby.providers.map((provider) => (
                        <Link
                          href={`/cassino/provedor/${encodeURIComponent(provider.name)}`}
                          key={provider.name}
                        >
                          <img
                            src={asset(provider.image)}
                            alt={provider.title}
                          />
                          <strong>{provider.title}</strong>
                          <small hidden={source.remote}>{"total" in provider ? String(provider.total) + " jogos" : ""}</small>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </Workspace>
  );
}
export function CasinoGameView({ game }: { game: CasinoGame }) {
  const { session, openModal, runtime } = useSite();
  const remote = runtime.mode === "backoffice";
  const playerId = session.user?.id;
  const launchRequest = useRef<AbortController | null>(null);
  const [embeddedGame, setEmbeddedGame] = useState<{
    url: string;
    gameId: string;
    playerId: string;
  } | null>(null);
  const [launching, setLaunching] = useState(false);
  const [credit, setCredit] = useState(1000),
    [spinning, setSpinning] = useState(false),
    [symbols, setSymbols] = useState([0, 1, 2]),
    [message, setMessage] = useState("");
  const gameUrl = remote && embeddedGame?.gameId === game.id && embeddedGame.playerId === playerId
    ? embeddedGame.url
    : undefined;

  useEffect(() => {
    setEmbeddedGame(null);
    return () => launchRequest.current?.abort();
  }, [game.id, playerId, remote]);

  async function launch() {
    if (!playerId) { openModal({ kind: "login" }); return; }
    if (launchRequest.current) return;
    const controller = new AbortController();
    launchRequest.current = controller;
    setMessage("");
    setLaunching(true);
    try {
      const { url } = await siteFetch<{ url: string }>("/api/resources/game-launch", {
        method: "POST",
        body: { reference: game.id, mobile: window.matchMedia("(pointer: coarse)").matches },
        signal: controller.signal,
      });
      if (!controller.signal.aborted) setEmbeddedGame({ url, gameId: game.id, playerId });
    } catch (error) {
      if (!controller.signal.aborted) setMessage((error as Error).message);
    } finally {
      launchRequest.current = null;
      setLaunching(false);
    }
  }
  useEffect(() => {
    if (!spinning) return;
    const interval = setInterval(
      () =>
        setSymbols([
          (Math.random() * 6) | 0,
          (Math.random() * 6) | 0,
          (Math.random() * 6) | 0,
        ]),
      90,
    );
    const timeout = setTimeout(() => {
      clearInterval(interval);
      const next = [
        (Math.random() * 6) | 0,
        (Math.random() * 6) | 0,
        (Math.random() * 6) | 0,
      ];
      setSymbols(next);
      const prize = next.every((item) => item === next[0])
        ? 100
        : next[0] === next[1]
          ? 20
          : 0;
      setCredit((current) => current + prize);
      setMessage(
        prize
          ? `Você ganhou ${formatMoney(prize)} em créditos fictícios.`
          : "O giro terminou. Tente novamente.",
      );
      setSpinning(false);
    }, 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [spinning]);
  return (
    <main id="main" className="casino-play">
      <header>
        <Link href="/cassino">‹ Cassino</Link>
        <span>
          <strong>{game.name}</strong>
          <small>{providerTitle(game.provider)}</small>
        </span>
        {session.user ? (
          <button onClick={() => openModal({ kind: "pix", tab: "deposit" })}>
            {formatMoney(session.balance)} ＋
          </button>
        ) : (
          <button onClick={() => openModal({ kind: "login" })}>Login</button>
        )}
      </header>
      <div
        className="casino-play-stage"
        style={{
          backgroundImage: `linear-gradient(#00150fb8,#111c),url(${casinoImage(game)})`,
        }}
      >
        {gameUrl ? (
          <iframe
            className="casino-game-frame"
            src={gameUrl}
            title={game.name}
            sandbox="allow-forms allow-same-origin allow-scripts allow-orientation-lock"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : <section className="casino-demo">
          <img
            className="casino-demo-cover"
            src={casinoImage(game)}
            alt={game.name}
          />
          <p className="casino-demo-label">{remote ? game.name : "Demonstração · créditos fictícios"}</p>
          <div className={`demo-reels ${spinning ? "spinning" : ""}`}>
            {symbols.map((item, index) => (
              <span key={index}>
                {["🍒", "🍋", "🍊", "🔔", "⭐", "💎"][item]}
              </span>
            ))}
          </div>
          <strong className="casino-demo-credit">{formatMoney(remote ? session.balance : credit)}</strong>
          <button
            className="button button-accent"
            disabled={launching || (!remote && (spinning || credit < 10))}
            onClick={() => {
              if (runtime.mode === "backoffice") {
                void launch();
                return;
              }
              setCredit((current) => current - 10);
              setMessage("");
              setSpinning(true);
            }}
          >
            {remote ? launching ? "Abrindo…" : "Jogar" : spinning ? "Girando…" : "Girar demonstração"}
          </button>
          <p role="status">
            {message || (remote ? "O jogo será exibido nesta tela." : "Valor por giro R$ 10,00 em créditos de demonstração.")}
          </p>
          {credit < 10 && (
            <button className="button" onClick={() => setCredit(1000)}>
              Reiniciar créditos
            </button>
          )}
        </section>}
      </div>
    </main>
  );
}
