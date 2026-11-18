"use client";

import { useState } from "react";
import { useSite } from "@/lib/site-context";
import { useResource } from "@/lib/backoffice/use-resource";
import { formatAccountDate, formatMoney, type DemoTransaction } from "@/lib/demo-types";
import { ModulePage, Status } from "./module-ui";

const tabs = { transactions: "Movimentações", deposits: "Depósitos", withdrawals: "Saques", "casino-plays": "Cassino" };

export function Statements() {
  const { session, runtime, openModal } = useSite();
  const [tab, setTab] = useState<keyof typeof tabs>("transactions");
  const [page, setPage] = useState(1);
  const enabled = runtime.mode === "backoffice" && session.user?.level === "online";
  const data = useResource<{ lastPage: number; transactions: DemoTransaction[] }>(enabled
    ? "/api/resources/transactions?" + new URLSearchParams({ tab, page: String(page) }) : null);
  const rows = data.data?.transactions ?? [];
  return <ModulePage title="Extratos">
    {!session.user ? <button className="button button-accent" onClick={() => openModal({ kind: "login" })}>Entrar</button>
      : !enabled ? <p>Área reservada a jogadores online.</p> : <>
      <nav aria-label="Tipos de extrato">
        {(Object.entries(tabs) as [keyof typeof tabs, string][]).map(([id, label]) => <button key={id}
          className="button" aria-pressed={tab === id} onClick={() => { setTab(id); setPage(1); }}>{label}</button>)}
      </nav>
      <Status error={data.error} text={data.loading ? "Carregando…" : rows.length ? "" : "Nenhum registro encontrado."} />
      <ul>{rows.map((row) => <li key={row.id}>{formatAccountDate(row.createdAt)} · {row.reference} · {formatMoney(row.amount)}</li>)}</ul>
      {page > 1 && <button className="button" disabled={data.loading} onClick={() => setPage(page - 1)}>Anterior</button>}
      {(data.data?.lastPage || 0) > page && <button className="button" onClick={() => setPage(page + 1)}>Próxima</button>}
    </>}
  </ModulePage>;
}
