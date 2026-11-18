"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useSite } from "@/lib/site-context";
import { formatMoney } from "@/lib/demo-types";
import { flag, record, type DataRecord } from "@/lib/backoffice/types";
import {
  EnabledModule, formValues, ModulePage, panelRows, Result, Status, TicketList,
  usePanel, usePanelAction, Value,
} from "./module-ui";

function Summaries() {
  const balance = usePanel("/api/seller/current-balances");
  const cashier = usePanel("/api/seller/cashier");
  const totals = record(balance.data);
  const cash = record(cashier.data);
  const currency = (n: unknown) => n == null ? "—" : formatMoney(Number(n));
  return <>
    <Status error={balance.error || cashier.error} />
    <h2>Saldo para vender</h2>
    <dl>
      <dt>Simples</dt><dd>{currency(totals.current_balance_simple)}</dd>
      <dt>Múltiplas</dt><dd>{currency(totals.current_balance_multiple)}</dd>
      <dt>Tradicional</dt><dd>{currency(totals.current_balance_jb)}</dd>
      <dt>Loterias</dt><dd>{currency(totals.current_balance_loto)}</dd>
    </dl>
    <h2>Caixa do período</h2>
    <dl>
      <dt>Entradas</dt><dd>{currency(cash.entries)}</dd>
      <dt>Saídas</dt><dd>{currency(cash.outputs)}</dd>
      <dt>Comissão</dt><dd>{currency(cash.commission)}</dd>
      <dt>Total</dt><dd>{currency(cash.total)}</dd>
    </dl>
  </>;
}

function Clients() {
  const clients = usePanel("/api/seller/clients");
  const action = usePanelAction();
  return <>
    <form onSubmit={async (event) => {
      const form = event.currentTarget;
      const { nome } = formValues(event);
      if (await action.execute("/api/seller/clients", "POST", { nome })) {
        form.reset(); clients.retry();
      }
    }}>
      <Value label="Nome do cliente" name="nome" />
      <button className="button" disabled={action.busy}>Cadastrar cliente</button>
    </form>
    <Status error={clients.error || action.error} text={action.result ? "Alteração salva." : undefined} />
    <ul>{panelRows(clients.data).map((client) => <li key={String(client.id)}>
      {String(client.nome)} <button className="button" disabled={action.busy} type="button" onClick={async () => {
        if (window.confirm("Remover " + String(client.nome) + "?") &&
          await action.execute("/api/seller/clients/" + encodeURIComponent(String(client.id)), "DELETE"))
          clients.retry();
      }}>Remover</button>
    </li>)}</ul>
  </>;
}

function Report() {
  const action = usePanelAction();
  return <>
    <form onSubmit={(event) => void action.execute("/api/seller/get-report", "POST", formValues(event))}>
      <Value label="De" name="from" type="date" /><Value label="Até" name="to" type="date" />
      <label>Produto <select name="option">
        <option value="bets">Aposta esportiva</option><option value="traditional">Tradicional</option><option value="loto">Loterias</option>
      </select></label>
      <Value label="Cliente" name="client" required={false} />
      <button className="button" disabled={action.busy}>Consultar relatório</button>
    </form>
    <Status error={action.error} />
    {action.result && <dl>
      <dt>Bilhetes</dt><dd>{String(action.result.quantity)}</dd>
      <dt>Entradas</dt><dd>{formatMoney(Number(action.result.entries))}</dd>
      <dt>Saídas</dt><dd>{formatMoney(Number(action.result.outputs))}</dd>
      <dt>Comissão</dt><dd>{formatMoney(Number(action.result.comission))}</dd>
      <dt>Total</dt><dd>{formatMoney(Number(action.result.total))}</dd>
    </dl>}
  </>;
}

function Pin() {
  const [product, setProduct] = useState<"bet" | "traditional" | "loto">("bet");
  const [coupon, setCoupon] = useState("");
  const [ticket, setTicket] = useState<DataRecord>();
  const lookup = usePanelAction();
  const submit = usePanelAction();
  async function load(event: FormEvent<HTMLFormElement>) {
    const { pin } = formValues(event);
    setTicket(undefined);
    setCoupon(pin);
    const path = product === "bet" ? "/api/seller/get-pre-ticket/" + encodeURIComponent(pin)
      : product === "traditional" ? "/api/seller/traditional/get-pin" : "/api/tickets/loto";
    setTicket(await lookup.execute(path, "POST", product === "bet" ? undefined : { coupon: pin }));
  }
  async function validate(event: FormEvent<HTMLFormElement>) {
    const { client_name } = formValues(event);
    if (!ticket) return;
    if (product === "bet") {
      const legs = Array.isArray(ticket.hunches) ? ticket.hunches.map(record) : [];
      await submit.execute("/api/seller/register-bet", "POST", {
        bet_mode: "multiple", client: client_name, multiple_amount: Number(ticket.bet_amount),
        pin_reference: Number(ticket.pin), hunches: legs.map((leg, index) => ({
          ...leg, id: String(index + 1), price: Number(leg.price), bet_amount: Number(leg.bet_amount || 0),
        })),
      });
    } else if (product === "traditional") {
      await submit.execute("/api/seller/traditional/validate-pin", "POST", { coupon, client_name });
    } else {
      await submit.execute("/api/seller/loto/validate-pin", "POST",
        { coupon, client_name, bet_amount: Number(ticket.bet_amount) });
    }
  }
  return <>
    <form onSubmit={(event) => void load(event)}>
      <label>Produto <select value={product} onChange={(event) => {
        setProduct(event.target.value as typeof product); setTicket(undefined);
      }}>
        <option value="bet">Esportes</option><option value="traditional">Tradicional</option><option value="loto">Loterias</option>
      </select></label>
      <Value label="PIN" name="pin" />
      <button className="button" disabled={lookup.busy}>Buscar pré-bilhete</button>
    </form>
    <Status error={lookup.error || submit.error} />
    {ticket && !submit.result && <form onSubmit={(event) => void validate(event)}>
      <p>PIN {coupon} · Valor {formatMoney(Number(ticket.bet_amount))}</p>
      <Value label="Nome do cliente" name="client_name" />
      <button className="button button-accent" disabled={submit.busy}>Validar pré-bilhete</button>
    </form>}
    <Result data={submit.result} product={product} />
  </>;
}

function SellerBets() {
  const [query, setQuery] = useState("paginate=1");
  return <>
    <form onSubmit={(event) => setQuery(new URLSearchParams({ ...formValues(event), paginate: "1" }).toString())}>
      <label>Situação <select name="status">{["Todos", "Aberto", "Ganhou", "Perdeu", "Cancelado", "Devolvido"].map((item) =>
        <option key={item}>{item}</option>)}</select></label>
      <Value label="Cliente" name="cliente" required={false} /><Value label="Dia" name="dia" type="date" required={false} />
      <button className="button">Filtrar</button>
    </form>
    <TicketList key={query} path={"/api/bilhetes?" + query} product="bet" allowCancel />
  </>;
}

export function SellerPage() {
  const { session, openModal, runtime } = useSite();
  const [area, setArea] = useState("summary");
  const sections = [
    ["summary", "Saldos e caixa"], ["bets", "Bilhetes"], ["clients", "Clientes"],
    ["report", "Relatório"], ["pin", "Validar PIN"], ["traditional", "Tradicional"], ["loto", "Loterias"],
  ];
  return <ModulePage title="Área do cambista">
    {!session.user ? <button className="button button-accent" onClick={() => openModal({ kind: "login" })}>Entrar</button>
      : session.user.level !== "cambista" || runtime.mode !== "backoffice" ? <p>Área reservada a cambistas.</p> : <>
      <nav aria-label="Área do cambista">{sections.map(([id, label]) =>
        <button className="button" key={id} aria-pressed={id === area} onClick={() => setArea(id)}>{label}</button>)}</nav>
      {area === "summary" && <Summaries />}
      {area === "bets" && <SellerBets />}
      {area === "clients" && <Clients />}
      {area === "report" && <Report />}
      {area === "pin" && <Pin />}
      {area === "traditional" && <TicketList path="/api/traditional/tickets" product="traditional" />}
      {area === "loto" && <TicketList path="/api/lottery/tickets" product="loto" />}
      <p><Link href="/esportes/football">Selecionar jogos</Link>{" · "}<Link href="/conta/senha">Trocar senha</Link></p>
    </>}
  </ModulePage>;
}

export function SportsCheckout({ stake }: { stake: number }) {
  const { runtime, session, picks, refresh, correctPicks, clearPicks, notify } = useSite();
  const action = usePanelAction();
  const [payWithPix, setPayWithPix] = useState(false);
  const [betMode, setBetMode] = useState("multiple");
  const [submitted, setSubmitted] = useState(false);
  const configuredMode = runtime.settings.bet_register_mode;
  const mode = configuredMode === "single" ? "single" : configuredMode === "both" ? betMode : "multiple";
  const seller = session.user?.level === "cambista";
  const needsLogin = !seller && (!!session.user || flag(runtime.settings.only_online_bet));
  const unavailable = picks.some((pick) => pick.betType === "live" && (!seller || pick.enabled === false));
  const visitorPix = !seller && (runtime.settings.pin_mode === "only_pix" ||
    (runtime.settings.pin_mode === "both" && payWithPix));
  const blockedVisitor = !seller && runtime.settings.pin_mode === "only_logged";
  async function submit(event: FormEvent<HTMLFormElement>) {
    const fields = formValues(event);
    if (unavailable) return;
    const hunches = picks.flatMap((pick) => {
      const builder = pick.kind === "builder";
      return (builder ? pick.children || [] : [pick]).map((leg) => ({
        id: leg.key, event_id: Number(leg.eventId), odd_id: leg.selectionId,
        price: builder ? leg.originalOdd ?? leg.odd : leg.odd, bet_amount: mode === "single" ? Number(fields[leg.key]) : 0,
        type: leg.betType || "prematch", mode: builder ? "builder" : "default",
      }));
    });
    const data = await action.execute(seller ? "/api/seller/register-bet" : "/api/register-pre-bet", "POST", {
      bet_mode: mode, client: fields.client, ...(mode === "multiple" ? { multiple_amount: Number(fields.amount) } : {}), hunches,
      ...(picks.some((pick) => pick.kind === "builder") ? { builder: "latest" } : {}),
      ...(seller && payWithPix ? { use_pix: true, user_document: fields.document.replace(/\D/g, "") } : {}),
      ...(visitorPix ? { pix_details: { type: fields.key_type, key: fields.key || undefined, email: fields.email, phone: fields.phone } } : {}),
    }, (details) => correctPicks(details) ? "A cotação mudou. Confira os valores e confirme novamente." : undefined);
    if (data) {
      setSubmitted(true);
      clearPicks();
      if (seller && !data.check_payment) {
        notify("Bilhete registrado.");
        void refresh().catch(() => {});
      }
    }
  }
  const hasBuilder = picks.some((pick) => pick.kind === "builder");
  return <ModulePage title={seller ? "Registrar bilhete" : "Pré-bilhete"}><EnabledModule module="bet">
    {submitted ? <><Result data={action.result} product="bet" seller={seller} />
      <Link href="/esportes/football">Selecionar outros jogos</Link></>
      : needsLogin || blockedVisitor ? <p>Esta operação está disponível pelo bilhete da conta.</p>
      : !picks.length ? <p>Selecione jogos para continuar.</p> : <>
      <ul>{picks.map((pick) => <li key={pick.key}>{pick.eventLabel} · {pick.label} · {
        pick.betType === "live" && pick.enabled === false ? "Indisponível" : pick.odd.toFixed(2)}</li>)}</ul>
      {unavailable && <p>{seller ? "Uma cotação ao vivo está indisponível." : "Pré-bilhetes de visitantes aceitam apenas jogos pré-jogo."}</p>}
      <form onSubmit={(event) => void submit(event)}>
        <Value label="Nome do apostador" name="client" />
        {configuredMode === "both" && <label>Tipo do bilhete <select value={betMode} onChange={(event) => setBetMode(event.target.value)}>
          <option value="multiple">Múltipla</option><option value="single" disabled={hasBuilder}>Simples</option>
        </select></label>}
        {mode === "multiple" ? <label className="me-field">Valor do bilhete <input name="amount" type="number" min="0.01" step="0.01"
          required defaultValue={stake > 0 ? stake : undefined} /></label>
          : picks.map((pick) => <Value key={pick.key} name={pick.key} label={"Valor para " + pick.label} type="number" />)}
        {mode === "single" && hasBuilder && <p>O Criar Aposta exige um bilhete múltiplo.</p>}
        {seller && <label><input type="checkbox" checked={payWithPix} onChange={(event) => setPayWithPix(event.target.checked)} /> Receber por Pix</label>}
        {!seller && runtime.settings.pin_mode === "both" && <label>
          <input type="checkbox" checked={payWithPix} onChange={(event) => setPayWithPix(event.target.checked)} /> Pagar por Pix
        </label>}
        {seller && payWithPix && <Value label="CPF do cliente" name="document" />}
        {visitorPix && <>
          <label>Tipo da chave <select name="key_type"><option value="none">Sem chave</option><option value="document">CPF</option>
            <option value="phone">Telefone</option><option value="email">E-mail</option><option value="random">Aleatória</option></select></label>
          <Value label="Chave Pix" name="key" required={false} /><Value label="E-mail" name="email" type="email" />
          <Value label="Telefone" name="phone" type="tel" />
        </>}
        <button className="button button-accent" disabled={action.busy || unavailable || (mode === "single" && hasBuilder)}>{seller ? "Registrar bilhete" : "Gerar pré-bilhete"}</button>
      </form>
      <Status error={action.error} />
    </>}
  </EnabledModule></ModulePage>;
}
