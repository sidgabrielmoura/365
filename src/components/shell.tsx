"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  UserRound,
  Plus,
  Search,
  House,
  Radio,
  ReceiptText,
  Dices,
  Download,
  X,
} from "lucide-react";
import { useSite } from "@/lib/site-context";
import { compactMoney } from "@/lib/demo-types";
import { ORIGINAL_BRAND, ORIGINAL_LOGO } from "@/lib/backoffice/branding";
import { AccountSurfaces } from "./account/account-surfaces";
import { SportsBetSlip } from "./sports/bet-slip";

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { session, openModal, picks, runtime } = useSite();
  const branding = runtime.branding;
  const name = branding?.name ?? ORIGINAL_BRAND;
  const appIcon = branding?.appIcon;
  const logo = branding ? branding.logo ?? branding.icon : ORIGINAL_LOGO;
  const [failedLogo, setFailedLogo] = useState<string>();
  const showLogo = logo && failedLogo !== logo;
  const [install, setInstall] = useState(true),
    [consent, setConsent] = useState(false);
  const header = useRef<HTMLElement>(null);
  const view = path.startsWith("/cassino")
    ? "casino"
    : path.startsWith("/conta")
      ? "me"
      : path.startsWith("/evento")
        ? "event"
        : path.startsWith("/ao-vivo")
          ? "live"
          : path.startsWith("/minhas-apostas")
            ? "bets"
            : path.startsWith("/recompensas")
              ? "rewards"
              : "home";
  const game = path.startsWith("/cassino/jogo/");
  useEffect(() => {
    document.body.className = `app-shell is-${view}${session.user ? " is-authenticated" : ""}${install ? " has-install-strip" : ""}`;
    const element = header.current;
    if (element)
      document.documentElement.style.setProperty(
        "--acc-top",
        `${element.getBoundingClientRect().bottom}px`,
      );
  }, [view, session.user, install]);
  useEffect(() => {
    setInstall(localStorage.getItem("brasa-install-dismissed") !== "1");
    setConsent(!localStorage.getItem("brasa-consent"));
  }, []);
  useEffect(() => {
    if (path !== "/" || runtime.mode !== "backoffice") return;
    const query = new URLSearchParams(window.location.search);
    const hash = query.get("hash");
    if (hash && /^[A-Z0-9]{12}$/.test(hash)) {
      router.replace("/apostas/destaques/" + hash);
      return;
    }
    if (query.get("cadastro") === "1" && runtime.features.register && !session.user) {
      query.delete("cadastro");
      window.history.replaceState(null, "", "/" + (query.size ? "?" + query : ""));
      openModal({ kind: "register" });
    }
  }, [path, router, runtime.mode, runtime.features.register, session.user]);
  return (
    <div className={`brasa-app ${game ? "game-shell" : ""}`}>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      {!game && (
        <>
          {install && (
            <div className="install-strip">
              <div className="install-inner">
                <span className="install-logo" data-tenant-icon={appIcon ? "" : undefined}
                  style={appIcon ? { "--tenant-app-icon": "url(" + JSON.stringify(appIcon) + ")" } as CSSProperties : undefined}>
                  {branding ? name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase() : "brasa"}
                  <br />
                  <b>{branding ? "" : "bet"}</b>
                </span>
                <div>
                  <strong>App {name}</strong>
                  <span>
                    Instale grátis: mais rápido, em tela cheia, sem loja.
                  </span>
                </div>
                <Link href="/app" className="install-cta">
                  Instalar
                </Link>
                <button
                  aria-label="Fechar anúncio do aplicativo"
                  onClick={() => {
                    setInstall(false);
                    localStorage.setItem("brasa-install-dismissed", "1");
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          <div className="responsible-bar">
            <Link href="/jogo-responsavel">
              <span className="responsible-symbol" aria-hidden="true" />
              Jogo Responsável
            </Link>
          </div>
          <header className="header" ref={header}>
            <div className="header-inner">
              <Link href="/" className="brand" aria-label={name + " — início"}>
                <img
                  src={showLogo ? logo : undefined}
                  hidden={!showLogo}
                  width={202}
                  height={38}
                  alt={name}
                  data-tenant-logo={branding ? "" : undefined}
                  onError={branding && logo ? () => setFailedLogo(logo) : undefined}
                />
                {!showLogo && name}
              </Link>
              <nav className="primary-nav" aria-label="Navegação principal">
                <Link
                  className={
                    view === "home" || view === "event" ? "active" : ""
                  }
                  href="/"
                >
                  Todos os Esportes
                </Link>
                <Link
                  className={view === "live" ? "active" : ""}
                  href="/ao-vivo"
                >
                  Ao-Vivo
                </Link>
                {session.user && (
                  <Link
                    className={view === "bets" ? "active" : ""}
                    href="/minhas-apostas"
                  >
                    Minhas Apostas
                  </Link>
                )}
                <Link
                  className={view === "casino" ? "active" : ""}
                  href="/cassino"
                >
                  Cassino
                </Link>
              </nav>
              <button
                className="header-search"
                aria-label="Pesquisar jogos"
                onClick={() => openModal({ kind: "search" })}
              >
                <Search size={20} />
              </button>
              <Link className="rewards-link" href="/recompensas">
                Recompensas
              </Link>
              <div className="account-actions">
                {session.user ? (
                  <>
                    <button
                      className="acc-balance"
                      aria-label="Saldo e depósito"
                      onClick={() => openModal({ kind: "pix", tab: "deposit" })}
                    >
                      <span>
                        {session.preferences.showBalance
                          ? compactMoney(session.balance)
                          : "••••"}
                      </span>
                      <i aria-hidden="true" />
                    </button>
                    <button
                      className="account-avatar"
                      aria-label="Minha conta"
                      aria-haspopup="dialog"
                      onClick={() => openModal({ kind: "account" })}
                    >
                      <span className="hrm-fd hrm-33">
                        <UserRound size={17} />
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="button button-outline registration-trigger"
                      onClick={() => openModal({ kind: "register" })}
                    >
                      Registre-se
                    </button>
                    <button
                      className="button button-outline"
                      onClick={() => openModal({ kind: "login" })}
                    >
                      Login
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>
        </>
      )}
      {children}
      {!game && (
        <nav className="mobile-nav" aria-label="Navegação móvel">
          {[
            ["/", "Início", House],
            ["/esportes/football", "Esportes", Search],
            ["/ao-vivo", "Ao-Vivo", Radio],
            [
              "/minhas-apostas",
              `Apostas${picks.length ? ` ${picks.length}` : ""}`,
              ReceiptText,
            ],
            ["/cassino", "Cassino", Dices],
          ].map(([url, label, Icon]) => (
            <Link
              key={String(url)}
              href={String(url)}
              className={path === url ? "active" : ""}
            >
              {typeof Icon !== "string" && <Icon size={21} />}
              <span>{String(label)}</span>
            </Link>
          ))}
        </nav>
      )}
      <SportsBetSlip />
      <AccountSurfaces />
      {consent && (
        <section
          className="marketing-consent"
          aria-label="Cookies e permissões"
        >
          <strong>Cookies e permissões</strong>
          <p>
            Usamos armazenamento local para manter seu acesso e suas escolhas
            nesta demonstração.
          </p>
          <div className="marketing-consent-actions">
            <button
              onClick={() => {
                localStorage.setItem("brasa-consent", "necessary");
                setConsent(false);
              }}
            >
              Somente necessários
            </button>
            <button
              onClick={() => {
                localStorage.setItem("brasa-consent", "accepted");
                setConsent(false);
              }}
            >
              Aceitar tudo
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export function Footer() {
  const { openModal, runtime } = useSite();
  const name = runtime.branding?.name ?? ORIGINAL_BRAND;
  return (
    <footer className="footer" id="site-footer">
      <Link className="transmission-note" href="/ajuda">
        Informação e Atrasos na Transmissão
      </Link>
      <div className="footer-columns">
        <section>
          <h2>Ajuda</h2>
          {["Depósitos", "Saques", "FAQ " + name, "Contate-nos"].map(
            (item) => (
              <button
                key={item}
                onClick={() =>
                  item === "Depósitos" || item === "Saques"
                    ? openModal({
                        kind: "pix",
                        tab: item === "Saques" ? "withdraw" : "deposit",
                      })
                    : openModal({
                        kind: "info",
                        title: item,
                        payload:
                          "Atendimento e operações disponíveis nesta cópia local de demonstração.",
                      })
                }
              >
                {item}
              </button>
            ),
          )}
          <Link href="/termos">Termos e Condições</Link>
          <Link href="/jogo-responsavel">Jogo Responsável</Link>
          <Link href="/privacidade">Política de Privacidade</Link>
        </section>
        <section>
          <h2>Esportes</h2>
          {[
            ["football", "Futebol"],
            ["basketball", "Basquete"],
            ["tennis", "Tênis"],
          ].map(([id, label]) => (
            <Link key={id} href={`/esportes/${id}`}>
              {label}
            </Link>
          ))}
          <Link href="/ao-vivo">Ao-Vivo</Link>
          <Link href="/cassino">Cassino</Link>
        </section>
        <section>
          <h2>Configurações</h2>
          <Link href="/conta/preferencias">Preferências</Link>
          <h2>Promoções</h2>
          <Link href="/recompensas">Recompensas disponíveis</Link>
          <h2>Aplicativo</h2>
          <Link href="/app">Instalar o app {name}</Link>
        </section>
      </div>
      <div className="footer-responsible">
        <span className="age-badge">18+</span>
        <p>
          Jogue com responsabilidade. Aposta não é investimento.
          <br />
          {runtime.branding ? "Acesso destinado a maiores de 18 anos." : "Demonstração local com créditos fictícios."}
        </p>
      </div>
      <p className="footer-copyright">
        {runtime.branding ? "© " + new Date().getFullYear() + " " + name : "© 2026 BrasaBet. Reprodução local da interface."}
      </p>
    </footer>
  );
}
