"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useSite } from "@/lib/site-context";
import { formatMoney } from "@/lib/demo-types";
import { record, type DataRecord } from "@/lib/backoffice/types";
import { useFeaturedEvents } from "@/lib/backoffice/sports-source";
import { MatchCard, Odd } from "@/components/sports/workspace";
import { EnabledModule, formValues, ModulePage, panelRows, Status, usePanel } from "./module-ui";

const quote = (ticket: DataRecord) => Number(ticket.boost_cotation) || Number(ticket.ticket_cotation);

function FeaturedLists() {
  const boosted = useFeaturedEvents("boosted-events");
  const featured = useFeaturedEvents("events");
  const tips = usePanel("/api/featured-tickets", "POST");
  const winners = usePanel("/api/v1/winners");
  return <>
    <h2>Jogos em destaque</h2>
    <Status error={featured.error} text={!featured.loading && !featured.events.length ? "Nenhum jogo em destaque." : undefined} />
    {featured.events.map((event) => <MatchCard event={event} key={event.id} />)}
    <h2>Superodds</h2>
    <Status error={boosted.error} text={!boosted.loading && !boosted.events.length ? "Nenhuma cotação turbinada." : undefined} />
    {boosted.events.map((event) => <section className="event-market" key={event.id}>
      <Link href={"/evento/" + event.id}>{event.home} × {event.away}</Link>
      {event.markets.flatMap((market) => market.options.map((option) => <div key={option.id}>
        {market.name} {option.originalOdd != null && <s>{option.originalOdd.toFixed(2)}</s>}
        <Odd event={event} market={market} option={option} />
      </div>))}
    </section>)}
    <h2>Dicas do dia</h2>
    <Status error={tips.error} text={!tips.loading && !panelRows(tips.data).length ? "Nenhuma dica disponível." : undefined} />
    <ul>{panelRows(tips.data).map((item) => <li key={String(item.hash)}>
      <Link href={"/apostas/destaques/" + encodeURIComponent(String(item.hash))}>{String(item.title)}</Link>{" "}
      · {quote(item).toFixed(2)} {item.sold_out === true ? "· Esgotada" : ""}
    </li>)}</ul>
    <h2>Resultados das últimas 24 horas</h2>
    <Status error={winners.error} text={!winners.loading && !panelRows(winners.data).length ? "Nenhum resultado em destaque." : undefined} />
    <ul>{panelRows(winners.data).map((item, index) => <li key={index}>
      {String(item.sport_type)} · {String(item.total_palpites)} palpites · {formatMoney(Number(item.retorno))}
    </li>)}</ul>
  </>;
}

function Tip({ hash }: { hash: string }) {
  const { session, request, openModal, notify } = useSite();
  const resource = usePanel("/api/featured-tickets/" + hash, "POST");
  const ticket = record(resource.data);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<number>();
  const fixed = Number(ticket.bet_amount);
  async function submit(event: FormEvent<HTMLFormElement>) {
    const { amount } = formValues(event);
    if (busy || receipt) return;
    if (!session.user) { openModal({ kind: "login" }); return; }
    setError(""); setBusy(true);
    try {
      const result = await request({ action: "featured-bet", hash, stake: Number(amount), quotation: quote(ticket) });
      const id = Number(record(result.data).ticketId);
      if (id > 0) {
        setReceipt(id);
        notify("Bilhete registrado.");
      }
    } catch (issue) {
      setError((issue as Error).message);
      resource.retry();
    } finally { setBusy(false); }
  }
  return <>
    <Link href="/apostas/destaques">Ver todos os destaques</Link>
    <Status error={resource.error || error} text={resource.loading ? "Carregando dica…" : undefined} />
    {ticket.hash != null && <>
      <h2>{String(ticket.title)}</h2>
      <p>{String(ticket.description ?? "")} · Cotação {quote(ticket).toFixed(2)}</p>
      <ul>{panelRows(ticket.hunches).map((item, index) => <li key={index}>
        {String(item.home)} × {String(item.away)} · {Array.isArray(item.selections)
          ? item.selections.map((selection) => String(record(selection).option)).join(" + ") : String(item.option)}
      </li>)}</ul>
      {ticket.sold_out === true ? <p>Oferta esgotada.</p> : receipt ? <Link href={"/ticket/bet/" + receipt}>Ver comprovante</Link>
        : session.user?.level !== "cambista" && <form onSubmit={(event) => void submit(event)}>
          <label className="me-field">Valor <input key={String(fixed)} name="amount" type="number" min="0.01" step="0.01"
            required defaultValue={fixed > 0 ? fixed : undefined} readOnly={fixed > 0} /></label>
          <button className="button button-accent" disabled={busy}>Registrar aposta</button>
        </form>}
    </>}
  </>;
}

export function Featured({ hash }: { hash?: string }) {
  return <ModulePage title="Destaques"><EnabledModule module="bet">
    {hash ? <Tip key={hash} hash={hash} /> : <FeaturedLists />}
  </EnabledModule></ModulePage>;
}
