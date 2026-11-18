"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Share } from "lucide-react";
import { asset } from "@/lib/assets";
import {
  compactMoney,
  formatAccountDate,
  type DemoPick,
  type DemoTicket,
} from "@/lib/demo-types";
import { eventById, liveClock, pickEvent } from "@/lib/sports-data";
import { useSite } from "@/lib/site-context";
import { backoffice } from "@/lib/backoffice/client";
import { ticketFromPanel } from "@/lib/backoffice/public-adapters";
import { useCashout } from "@/lib/backoffice/cashout";

const statuses: Record<
  DemoTicket["status"],
  { label: string; color: string; symbol: string }
> = {
  open: { label: "Em Aberto", color: "pending", symbol: "" },
  won: { label: "Ganhou", color: "won", symbol: "✓" },
  lost: { label: "Perdida", color: "lost", symbol: "×" },
  void: { label: "Anulada", color: "void", symbol: "—" },
  cancelled: { label: "Cancelada", color: "void", symbol: "—" },
  cashout: { label: "Encerrada", color: "cashout", symbol: "✓" },
};

export const ticketIsLive = (ticket: DemoTicket) =>
  ticket.status === "open" &&
  (ticket.isLive || ticket.picks.some((pick) => pickEvent(pick)?.status === "live"));

function selectionsOf(ticket: DemoTicket) {
  return ticket.picks.flatMap((pick) =>
    pick.children?.length ? pick.children : [pick],
  );
}

function ticketType(ticket: DemoTicket) {
  if (ticket.typeLabel) return ticket.typeLabel;
  if (ticket.picks.length === 1 && ticket.picks[0].kind === "builder")
    return "Criar Aposta";
  const selections = selectionsOf(ticket);
  const count = selections.length;
  if (count < 2) return "Simples";
  if (selections.every((pick) => pick.eventId === selections[0].eventId))
    return "Criar Aposta";
  if (count === 2) return "Dupla";
  if (count === 3) return "Tripla";
  return `Múltipla de ${count}`;
}

function startLabel(value: string) {
  if (Number.isNaN(Date.parse(value))) return "";
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value.replace(".", "") || "";
  const capital = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);
  return `${capital(part("weekday"))} ${part("day")} ${capital(part("month"))} ${part("hour")}:${part("minute")}`;
}

function BetSelection({
  pick,
  ticket,
}: {
  pick: DemoPick;
  ticket: DemoTicket;
}) {
  const event = pickEvent(pick),
    settled = ticket.status !== "open",
    live = !settled && event?.status === "live";
  const status = statuses[pick.result || ticket.status];
  const fixture =
    !live && !settled ? (
      <div className="mb-game">
        <b>{pick.eventLabel}</b>
        {event && <span>{startLabel(event.start)}</span>}
      </div>
    ) : (
      <>
        <div className="mb-fixture">
          {[
            [
              event?.home || pick.eventLabel.split(" x ")[0],
              event?.homeLogo,
              event?.scores?.home,
            ],
            [
              event?.away || pick.eventLabel.split(" x ")[1],
              event?.awayLogo,
              event?.scores?.away,
            ],
          ].map(([name, logo, score], index) => (
            <div key={index}>
              {logo && (
                <img
                  className="team-logo"
                  src={asset(String(logo))}
                  alt=""
                  width={17}
                  height={17}
                />
              )}
              <span>{name}</span>
              {live && <b>{score ?? 0}</b>}
            </div>
          ))}
        </div>
        {live && event && <div className="mb-clock">{liveClock(event)}</div>}
      </>
    );
  return (
    <div className="mb-selection">
      <div className="mb-selection-row">
        <i
          className={`mb-result-icon ${status.color}${status.symbol === "×" ? " is-cross" : ""}`}
          aria-label={status.label}
        >
          {status.symbol}
        </i>
        <b>{pick.label}</b>
        <span>{pick.odd.toFixed(2)}</span>
        {live && <em className="mb-live">Ao-Vivo</em>}
        {pick.marketLabel === "Resultado Final" && event?.earlyPayout && (
          <div className="mb-pa">
            <span className="mb-pa-tag">Pagamento Antecipado</span>
          </div>
        )}
      </div>
      <div className="mb-market">{pick.marketLabel}</div>
      {!settled ? (
        <Link className="mb-event" href={`/evento/${pick.eventId}`}>
          {fixture}
        </Link>
      ) : (
        fixture
      )}
    </div>
  );
}

export function MyBetCard({ ticket: incomingTicket }: { ticket: DemoTicket }) {
  const { request, notify, runtime } = useSite();
  const [ticket, setTicket] = useState(incomingTicket);
  const [expanded, setExpanded] = useState(false);
  const [cashoutRevision, setCashoutRevision] = useState(0);
  const liveOffer = useCashout(ticket.id, expanded && ticket.status === "open", cashoutRevision);
  useEffect(() => {
    setTicket(incomingTicket);
    if (runtime.mode !== "backoffice" || incomingTicket.detailsLoaded) return;
    const controller = new AbortController();
    void backoffice("/api/tickets/bet/" + incomingTicket.id, { method: "POST", body: {}, signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setTicket(ticketFromPanel(data)); })
      .catch(() => {});
    return () => controller.abort();
  }, [incomingTicket]);
  useEffect(() => {
    if (runtime.mode === "backoffice") setTicket((old) => ({ ...old, cashoutOffer: liveOffer }));
  }, [liveOffer, runtime.mode]);
  const [busy, setBusy] = useState(false),
    [confirmCashout, setConfirmCashout] = useState(false),
    [error, setError] = useState("");
  const settled = ticket.status !== "open",
    live = ticketIsLive(ticket),
    status = statuses[ticket.status];
  const selections = selectionsOf(ticket),
    boosted = ticket.picks.find((pick) => pick.kind === "boost");
  const returned =
    ticket.returnAmount ??
    (ticket.status === "won"
      ? ticket.potential
      : ["cancelled", "void"].includes(ticket.status)
        ? ticket.stake
        : 0);
  const cashout = runtime.mode === "backoffice" ? ticket.cashoutOffer?.amount || 0 : Math.round(ticket.stake * 80) / 100;
  async function settle(action: "bet-cancel" | "bet-cashout") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await request({ action, id: ticket.id, offer: ticket.cashoutOffer?.payload });
      const updated = result.ticket || result.session.tickets.find((item) => item.id === ticket.id);
      if (updated) setTicket(updated);
      else if (runtime.mode === "backoffice" && action === "bet-cashout") {
        const amount = Number((result.data as { cashout_value?: unknown })?.cashout_value);
        setTicket((previous) => ({ ...previous, status: "cashout",
          returnAmount: Number.isFinite(amount) ? amount : undefined }));
        window.dispatchEvent(new Event("backoffice:bets-updated"));
      }
      notify("Bilhete encerrado. Confira o saldo atualizado.");
    } catch (error) {
      setError((error as Error).message);
      if (runtime.mode === "backoffice" && action === "bet-cashout")
        setCashoutRevision((previous) => previous + 1);
    } finally {
      setBusy(false);
      setConfirmCashout(false);
    }
  }
  async function share() {
    const url = runtime.mode === "backoffice" ? window.location.origin + "/ticket/bet/" + encodeURIComponent(ticket.id) : undefined;
    const text = [
      (runtime.branding?.name ?? "BrasaBet") + " — Comprovante de aposta",
      ...selections.map(
        (pick) =>
          `${pick.eventLabel}\n${pick.marketLabel}: ${pick.label} (${pick.odd.toFixed(2)})`,
      ),
      `Aposta: ${compactMoney(ticket.stake)}`,
      `${settled ? "Retorno obtido" : "Retorno potencial"}: ${compactMoney(settled ? returned : ticket.potential)}`,
      `Situação: ${status.label}`,
      `Bilhete: ${ticket.id}`,
      `Registrada em: ${formatAccountDate(ticket.createdAt)}`,
      url,
    ].filter(Boolean).join("\n");
    try {
      if (navigator.share)
        await navigator.share({ title: "Comprovante de aposta", text });
      else {
        await navigator.clipboard.writeText(text);
        notify("Comprovante copiado para compartilhar.");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        setError(
          "Não foi possível compartilhar o comprovante neste navegador.",
        );
    }
  }
  return (
    <div className="mb-item">
      <details
        className={`mb-card ${settled ? "resolved" : "pending"} ${status.color}`}
        data-bet-id={ticket.id}
        onToggle={(event) => {
          setExpanded(event.currentTarget.open);
          if (!event.currentTarget.open) setConfirmCashout(false);
        }}
      >
        <summary
          className="mb-head"
          title={`Bilhete ${ticket.id} · ${formatAccountDate(ticket.createdAt)}`}
        >
          <span className="mb-stake">{compactMoney(ticket.stake)}</span>
          <span className="mb-type">{ticketType(ticket)}</span>
          {boosted && <span className="mb-aum">Aposta Aumentada</span>}
          {settled ? (
            <span className={`mb-pill ${status.color}`}>{status.label}</span>
          ) : live ? (
            <em className="mb-live-badge">
              <i />
              Ao vivo
            </em>
          ) : null}
          <span className="mb-summary">
            {selections.map((pick) => pick.label).join(", ")}
          </span>
        </summary>
        <div className="mb-body">
          {boosted && (
            <div className="mb-aum-line">
              <span className="mb-aum">Super Aumentada</span>
              <span>{boosted.label}</span>
              <b>{boosted.odd.toFixed(2)}</b>
            </div>
          )}
          <div className="mb-actions">
            <button type="button" onClick={() => void share()}>
              <Share size={14} />
              Compartilhar
            </button>
          </div>
          {selections.map((pick, index) => (
            <BetSelection
              key={`${pick.key}|${index}`}
              pick={pick}
              ticket={ticket}
            />
          ))}
          <div className="mb-totals">
            <div>
              <small>Aposta</small>
              <b>{compactMoney(ticket.stake)}</b>
            </div>
            <div>
              <small>{settled ? "Retorno Total" : "Retornos"}</small>
              <b>{compactMoney(settled ? returned : ticket.potential)}</b>
            </div>
          </div>
          {settled ? (
            <div className={`mb-result ${status.color}`}>
              <b>{compactMoney(returned)}</b>
              <span>
                {ticket.status === "cashout"
                  ? "Aposta Encerrada"
                  : "Retorno Obtido"}
              </span>
            </div>
          ) : (
            <button
              type="button"
              className="mb-local-cancel"
              disabled={busy || (runtime.mode === "backoffice" && !ticket.canCancel)}
              onClick={() => void settle("bet-cancel")}
            >
              Cancelar aposta
            </button>
          )}
        </div>
      </details>
      {!settled && (
        <div className="mb-cashout">
          <button
            type="button"
            className={`mb-co ${busy ? "busy" : confirmCashout ? "confirm" : ""}`}
            disabled={busy || (runtime.mode === "backoffice" && !ticket.cashoutOffer)}
            onClick={() =>
              confirmCashout
                ? void settle("bet-cashout")
                : setConfirmCashout(true)
            }
          >
            {busy
              ? "Encerrando…"
              : confirmCashout
                ? "Confirmar Encerramento"
                : "Encerrar Aposta"}
            {!busy && <b>{compactMoney(cashout)}</b>}
          </button>
        </div>
      )}
      {error && (
        <p className="mb-notice" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
