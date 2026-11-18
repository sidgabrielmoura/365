"use client";

import Link from "next/link";
import { useSite } from "@/lib/site-context";
import { record } from "@/lib/backoffice/types";
import { formatMoney } from "@/lib/demo-types";
import { EnabledModule, ModulePage, panelRows, Status, usePanel, usePanelAction } from "./module-ui";

function Cards() {
  const resource = usePanel("/api/scratch-cards/list");
  const cards = panelRows(resource.data);
  return <>
    <Status error={resource.error} text={resource.loading ? "Carregando…" : cards.length ? "" : "Nenhuma raspadinha disponível."} />
    <ul>{cards.map((card) => <li key={String(card.id)}>
      <Link href={"/raspadinhas/" + encodeURIComponent(String(card.slug ?? card.id))}>
        {String(card.name)} · {formatMoney(Number(card.bet_amount))}
      </Link>
    </li>)}</ul>
  </>;
}

function Scratchcard({ id }: { id: string }) {
  const resource = usePanel("/api/scratch-cards/" + encodeURIComponent(id) + "/details");
  const { session, openModal, refresh } = useSite();
  const action = usePanelAction();
  const card = record(resource.data);
  const scratchId = Number(card.id);
  const price = Number(card.bet_amount);
  const grid = Array.isArray(action.result?.grid) ? action.result.grid.map(record) : [];
  const prize = record(action.result?.prize);
  async function play(paid: boolean) {
    if (!Number.isSafeInteger(scratchId) || scratchId <= 0) return;
    if (paid) {
      if (!session.user) { openModal({ kind: "login" }); return; }
      if (session.user.level !== "online" || !window.confirm("Comprar por " + formatMoney(price) + "?")) return;
    }
    const result = await action.execute(paid ? "/api/online/scratch-cards/buy" : "/api/scratch-cards/free-buy",
      "POST", { scratch_id: scratchId });
    if (paid && result) void refresh().catch(() => {});
  }
  return <>
    <Link href="/raspadinhas">Todas as raspadinhas</Link>
    <Status error={resource.error || action.error} text={resource.loading ? "Carregando…" : undefined} />
    {scratchId > 0 && <>
      <h2>{String(card.name)}</h2>
      <p>{String(card.description ?? "")}</p>
      <ul>{Object.values(record(card.prizes)).map((prize, index) =>
        <li key={index}>{String(record(prize).name)}</li>)}</ul>
      <button type="button" className="button" disabled={action.busy} onClick={() => void play(false)}>Jogar grátis</button>{" "}
      <button type="button" className="button button-accent"
        disabled={action.busy || session.user?.level === "cambista" || !Number.isFinite(price)}
        onClick={() => void play(true)}>Comprar por {formatMoney(price)}</button>
      {grid.length === 9 && <section aria-live="polite">
        <h3>Resultado</h3>
        <table><tbody>{[0, 3, 6].map((start) => <tr key={start}>
          {grid.slice(start, start + 3).map((item, index) => <td key={index}>{String(item.name)}</td>)}
        </tr>)}</tbody></table>
        <p>{prize.name ? "Prêmio: " + String(prize.name) : "Sem prêmio nesta rodada."}</p>
      </section>}
    </>}
  </>;
}

export function Scratchcards({ id }: { id?: string }) {
  return <ModulePage title="Raspadinhas"><EnabledModule module="scratchcard">
    {id ? <Scratchcard key={id} id={id} /> : <Cards />}
  </EnabledModule></ModulePage>;
}
