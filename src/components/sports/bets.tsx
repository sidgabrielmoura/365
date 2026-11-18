"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSite } from "@/lib/site-context";
import { Workspace } from "./workspace";
import { MyBetCard, ticketIsLive } from "./my-bet-card";
import "./bets.css";
import { useResource } from "@/lib/backoffice/use-resource";
import type { DemoTicket } from "@/lib/demo-types";
import { useEffect } from "react";
export function Bets() {
  const { session, openModal, runtime } = useSite();
  const query = useSearchParams();
  const remote = runtime.mode === "backoffice";
  const remoteTickets = useResource<{ tickets: DemoTicket[]; lastPage: number }>(remote && session.user?.level === "online"
    ? "/api/resources/bets?page=" + (Math.max(1, Number(query.get("pagina")) || 1)) +
      (query.get("tab") === "settled" ? "" : "&type=opened") : null);
  const opened = useResource<{ quantity: number }>(remote && session.user?.level === "online"
    ? "/api/backoffice/api/online/quantity-opened-bets" : null);
  useEffect(() => {
    if (!remote) return;
    const updated = () => { remoteTickets.retry(); opened.retry(); };
    window.addEventListener("backoffice:bets-updated", updated);
    return () => window.removeEventListener("backoffice:bets-updated", updated);
  }, [remote, remoteTickets.retry, opened.retry]);
  const tabs = [
    { id: "open", label: "Em Aberto", empty: "pendentes" },
    { id: "live", label: "Ao-Vivo", empty: "Ao-Vivo" },
    { id: "settled", label: "Resolvidas", empty: "resolvidas" },
  ];
  const tab = tabs.find((item) => item.id === query.get("tab")) || tabs[0];
  const tickets = (remote ? remoteTickets.data?.tickets || [] : session.tickets).filter((ticket) =>
    tab.id === "settled"
      ? ticket.status !== "open"
      : ticket.status === "open" && (tab.id !== "live" || ticketIsLive(ticket)),
  );
  const pages = remote ? remoteTickets.data?.lastPage || 1 : Math.max(1, Math.ceil(tickets.length / 20));
  const requestedPage = Number(query.get("pagina"));
  const page = Math.min(
    pages,
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1,
  );
  const href = (pageNumber = 1) =>
    `/minhas-apostas${tab.id !== "open" || pageNumber > 1 ? `?${new URLSearchParams({ ...(tab.id !== "open" ? { tab: tab.id } : {}), ...(pageNumber > 1 ? { pagina: String(pageNumber) } : {}) })}` : ""}`;
  return (
    <Workspace sidebar={false} search={false}>
      <section className="my-bets" aria-label="Minhas Apostas">
        <h1 className="sr-only">Minhas Apostas</h1>
        <nav className="mb-tabs" aria-label="Filtrar minhas apostas">
          {tabs.map((item) => (
            <Link
              className={item.id === tab.id ? "active" : undefined}
              aria-current={item.id === tab.id ? "page" : undefined}
              aria-label={item.id === "open" && opened.data ? item.label + " (" + opened.data.quantity + ")" : undefined}
              key={item.id}
              href={
                item.id === "open"
                  ? "/minhas-apostas"
                  : `/minhas-apostas?tab=${item.id}`
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {!session.user ? (
          <div className="mb-empty mb-signin">
            <b>Entre na sua conta</b>
            <span>Faça login para ver suas apostas.</span>
            <button
              className="button button-accent"
              onClick={() => openModal({ kind: "login" })}
            >
              Login
            </button>
          </div>
        ) : tickets.length ? (
          <div className="mb-list">
            {(remote ? tickets : tickets.slice((page - 1) * 20, page * 20)).map((ticket) => (
              <MyBetCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div className="mb-empty">
            <b>{remote && (remoteTickets.error || remoteTickets.loading)
              ? remoteTickets.error || "Carregando apostas…"
              : "No momento, não existem apostas para serem exibidas"}</b>
            <span>{remote && remoteTickets.error ? "Atualize a página para tentar novamente."
              : remote && remoteTickets.loading ? "Consultando o histórico." : "As apostas " + tab.empty + " serão apresentadas aqui"}</span>
          </div>
        )}
        {pages > 1 && (
          <nav className="mb-pagination" aria-label="Páginas de apostas">
            {page > 1 && <Link href={href(page - 1)}>Anterior</Link>}
            <span>Página {page}</span>
            {page < pages && (
              <Link href={href(page + 1)}>Ver mais apostas</Link>
            )}
          </nav>
        )}
      </section>
    </Workspace>
  );
}
