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

function options(value: unknown) {
  return Array.isArray(value) ? value.map(record) : [];
}
function PaymentFields() {
  return <>
    <label>Tipo da chave Pix <select name="pix_type" defaultValue="none">
      <option value="none">Sem chave</option><option value="document">CPF ou CNPJ</option>
      <option value="phone">Telefone</option><option value="email">E-mail</option>
      <option value="random">Aleatória</option>
    </select></label>
    <Value label="Chave Pix" name="pix_key" required={false} />
    <Value label="E-mail para contato" name="pix_email" type="email" />
    <Value label="Telefone para contato" name="pix_phone" type="tel" />
  </>;
}
function pixDetails(fields: Record<string, string>) {
  return { type: fields.pix_type, key: fields.pix_key || undefined, email: fields.pix_email, phone: fields.pix_phone };
}
function useRegister(path: string, product: "traditional" | "loto") {
  const { session, refresh, notify } = useSite();
  const action = usePanelAction();
  const [items, setItems] = useState<DataRecord[]>([]);
  const [localError, setLocalError] = useState("");
  async function register(fields: Record<string, string>, pix: boolean) {
    if (!items.length) { setLocalError("Adicione pelo menos um palpite."); return; }
    setLocalError("");
    const result = await action.execute(path, "POST", {
      [product === "traditional" ? "pule" : "hunches"]: items,
      ...(fields.client_name ? { client_name: fields.client_name } : {}),
      ...(fields.gift_number ? { gift_number: fields.gift_number } : {}),
      ...(pix ? { pix_details: pixDetails(fields) } : {}),
      ...(product === "traditional" && fields.use_pix === "on"
        ? { use_pix: true, user_document: fields.user_document.replace(/\D/g, "") } : {}),
    });
    if (!result) return;
    setItems([]);
    if (session.user && result.ticket_id != null && !result.check_payment) {
      notify("Bilhete registrado.");
      void refresh().catch(() => {});
    }
  }
  return { ...action, items, setItems, localError, setLocalError, register };
}

function TraditionalForm() {
  const { session } = useSite();
  const level = session.user?.level;
  const [date, setDate] = useState("");
  const [selection, setSelection] = useState("");
  const [modality, setModality] = useState("");
  const query = new URLSearchParams({ grouped: "1", ...(date ? { date } : {}) });
  const list = usePanel("/api/traditional/" + (level ? "auth/" : "") + "v3/lotteries?" + query);
  const settings = usePanel(level === "cambista" ? "/api/seller/traditional/settings" : "/api/traditional/settings",
    level === "cambista" ? "GET" : "POST");
  const extractions = options(record(list.data).lotteries);
  const extraction = extractions.find((item) => item.lottery + "/" + item.extraction_time === selection);
  const lottery = typeof extraction?.lottery === "string" ? extraction.lottery : "";
  const modes = usePanel(lottery ? (level
    ? "/api/traditional/auth/v3/modalities?lottery=" + encodeURIComponent(lottery)
    : "/api/traditional/v3/modalities") : null, level ? "GET" : "POST", level ? undefined : { lottery });
  const selectedMode = options(modes.data).find((item) => item.id === modality);
  const awards = options(selectedMode?.awards_group);
  const flags = record(settings.data);
  const pix = !level && flags.pre_ticket_option === "pix";
  const [sellerPix, setSellerPix] = useState(false);
  const allowSellerPix = level === "cambista" && flags.pay_pix === true;
  const requireSellerPix = allowSellerPix && flags.pay_default === false;
  const path = level === "online" ? "/api/online/traditional/register-ticket" : level === "cambista"
    ? "/api/seller-tradicional/register-bet" : "/api/traditional/pre-ticket";
  const action = useRegister(path, "traditional");
  function add(event: FormEvent<HTMLFormElement>) {
    const fields = formValues(event);
    const count = fields.hunches.split("-").length;
    const award = awards.find((item) => item.ref === fields.award);
    const amount = Number(fields.amount);
    if (!extraction || !selectedMode || !award || !Number.isFinite(amount) || amount <= 0) {
      action.setLocalError("Confira a extração, modalidade e valor.");
      return;
    }
    action.setLocalError("");
    action.setItems([...action.items, {
      id: crypto.randomUUID(), lottery, hour: extraction.extraction_time, ...(date ? { date } : {}),
      modality, award: fields.award, hunches: fields.hunches.trim(), pule_amount: amount,
      unit_amount: amount / (Math.max(1, Number(award.weight) || 1) * count),
    }]);
  }
  return <>
    <Status error={list.error || modes.error || settings.error || action.error || action.localError} />
    <form onSubmit={add}>
      <label>Data <input type="date" value={date} onChange={(event) => {
        setDate(event.target.value); setSelection(""); setModality("");
      }} /></label>
      <label>Extração <select value={selection} required onChange={(event) => {
        setSelection(event.target.value); setModality("");
      }}>
        <option value="">Escolha uma extração</option>{extractions.map((item) => {
          const key = item.lottery + "/" + item.extraction_time;
          return <option key={key} value={key}>{String(item.label)}</option>;
        })}
      </select></label>
      <label>Modalidade <select value={modality} required onChange={(event) => setModality(event.target.value)}>
        <option value="">Escolha a modalidade</option>
        {options(modes.data).map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}
      </select></label>
      <label>Colocação <select name="award" required>
        {awards.map((item) => <option key={String(item.ref)} value={String(item.ref)}>{String(item.label)}</option>)}
      </select></label>
      <Value label={"Palpites" + (selectedMode?.regex_sample ? " (" + selectedMode.regex_sample + ")" : "")} name="hunches" />
      <Value label="Valor total do item" name="amount" type="number" />
      <button className="button" disabled={!extraction || !selectedMode}>Adicionar palpite</button>
    </form>
    <form onSubmit={(event) => void action.register(formValues(event), pix)}>
      <SelectionList items={action.items} remove={(id) => action.setItems(action.items.filter((item) => item.id !== id))} />
      {level !== "online" && <Value label="Nome do apostador" name="client_name" />}
      {allowSellerPix && <label><input name="use_pix" type="checkbox" checked={requireSellerPix || sellerPix}
        onChange={(event) => setSellerPix(event.target.checked)} /> Receber por Pix</label>}
      {allowSellerPix && (requireSellerPix || sellerPix) && <Value label="CPF do cliente" name="user_document" />}
      {(level === "cambista" || flag(flags.gift_number_enabled)) && <Value label="Número da sorte" name="gift_number" required={false} />}
      {pix && <PaymentFields />}
      <button className="button button-accent" disabled={action.busy || !action.items.length ||
        (!level && flags.pre_ticket_option === "only_logged") || (level !== "cambista" && flags.bet_enabled === false)}>
        {level ? "Registrar pule" : "Gerar pré-bilhete"}
      </button>
    </form>
    <Result data={action.result} product="traditional" />
    {level === "online" && <details><summary>Histórico do Tradicional</summary>
      <TicketList path="/api/online/traditional/bets" product="traditional" />
    </details>}
  </>;
}

function SelectionList({ items, remove }: { items: DataRecord[]; remove: (id: unknown) => void }) {
  return <ul>{items.map((item) => <li key={String(item.id)}>
    {String(item.modality || item.loto_id)} · {String(item.hunches || item.selections)} · {formatMoney(Number(item.pule_amount ?? item.bet_amount))}
    <button className="button" type="button" onClick={() => remove(item.id)}>Remover</button>
  </li>)}</ul>;
}

function LotteryForm({ two500 }: { two500: boolean }) {
  const { session } = useSite();
  const level = session.user?.level;
  const [lottery, setLottery] = useState(two500 ? "2p500" : "");
  const [contest, setContest] = useState("");
  const [numbers, setNumbers] = useState("");
  const prefix = level ? "/api/" + (level === "online" ? "online" : "seller") + "/loto" : "/api/loto";
  const catalog = usePanel(two500 ? null : prefix + (level ? "/lotteries" : "/availables-loto"));
  const settings = usePanel(prefix + "/settings");
  const lotteryQuery = "?lottery_id=" + encodeURIComponent(lottery);
  const details = usePanel(lottery && lottery !== "2p500" ? (level
    ? prefix + "/details" + lotteryQuery : prefix + "/" + encodeURIComponent(lottery) + "/details") : null);
  const isTwo = lottery === "2p500";
  const special = isTwo && !!level;
  const randomContests = usePanel(isTwo && !level ? "/api/loto/2p500/contests" : null, "POST");
  const contestPath = !lottery ? null : special ? (level === "cambista" ? "/api/seller/loto/2p500-contests" : "/api/loto/2p500/contests")
    : level ? prefix + "/contests" + lotteryQuery : prefix + "/" + encodeURIComponent(lottery) + "/contests";
  const contests = usePanel(contestPath, special && level === "online" ? "POST" : "GET");
  const selected = panelRows(contests.data).find((item) => String(item.contest ?? item.id) === contest);
  const randomContest = special ? selected : panelRows(randomContests.data).find((item) =>
    String(item.id) === contest.split("#")[0] && String(item.date).replaceAll("-", "") === contest.split("#")[1]);
  const flags = record(settings.data);
  const rules = record(details.data);
  const pix = !level && flags.pre_ticket_option === "pix";
  const path = level === "online" ? "/api/online/loto/register-bet" : level === "cambista"
    ? "/api/seller/loto/register-bet" : "/api/loto/register-pre-bet";
  const action = useRegister(path, "loto");
  const random = usePanelAction();
  function add(event: FormEvent<HTMLFormElement>) {
    const fields = formValues(event);
    const selections = numbers.split(/[ ,;-]+/).map((item) => item.trim()).filter(Boolean);
    const amount = Number(special ? selected?.bet_amount : fields.amount);
    const size = ({ milhar: 4, centena: 3, dezena: 2 } as Record<string, number>)[String(selected?.size)] || (isTwo ? 4 : 2);
    const lengths = special ? [Number(selected?.length)] : isTwo ? [Number(randomContest?.length ?? flags.twop500_thousand_length)].filter(Number.isFinite)
      : Array.isArray(rules.selections) ? rules.selections.map(Number) : [];
    const invalidNumber = (number: string) => !/^\d+$/.test(number) || number.length !== size ||
      (!isTwo && (Number(number) < Number(rules.init) || Number(number) > Number(rules.end)));
    if (!selected || !selections.length || (lengths.length > 0 && !lengths.includes(selections.length)) ||
      selections.some(invalidNumber) || new Set(selections).size !== selections.length ||
      !Number.isFinite(amount) || amount <= 0) {
      action.setLocalError("Confira concurso, números e valor.");
      return;
    }
    action.setItems([...action.items, { id: crypto.randomUUID(), loto_id: lottery,
      selections, bet_amount: amount, contest }]);
    action.setLocalError(""); setNumbers("");
  }
  return <>
    <Status error={catalog.error || settings.error || contests.error || details.error || action.error || action.localError || random.error} />
    {!two500 && <label>Loteria <select value={lottery} onChange={(event) => {
      setLottery(event.target.value); setContest(""); setNumbers("");
    }}>
      <option value="">Escolha a loteria</option>
      {panelRows(catalog.data).map((item) => <option value={String(item.id)} key={String(item.id)}>{String(item.name)}</option>)}
    </select></label>}
    <form onSubmit={add}>
      <label>Concurso <select value={contest} required onChange={(event) => setContest(event.target.value)}>
        <option value="">Escolha o concurso</option>
        {panelRows(contests.data).map((item) => <option key={String(item.contest ?? item.id)} value={String(item.contest ?? item.id)}>
          {String(item.label ?? item.contest)} · {String(item.formatted_date ?? "")}
        </option>)}
      </select></label>
      <label className="me-field">Números <input value={numbers} required onChange={(event) => setNumbers(event.target.value)} /></label>
      {isTwo && randomContest?.id != null && <button className="button" type="button" disabled={random.busy} onClick={async () => {
        const data = await random.execute("/api/loto/2p500/random-hunch", "POST", { contest: Number(randomContest.id) });
        if (typeof data?.hunch === "string" && data.hunch !== "0000") { setNumbers(data.hunch); action.setLocalError(""); }
        else if (data) action.setLocalError("Nenhum número disponível para a Surpresinha.");
      }}>Surpresinha</button>}
      {!special ? <Value label="Valor do palpite" name="amount" type="number" />
        : selected && <p>Valor do concurso {formatMoney(Number(selected.bet_amount))}</p>}
      <button className="button" disabled={!selected}>Adicionar palpite</button>
    </form>
    <form onSubmit={(event) => void action.register(formValues(event), pix)}>
      <SelectionList items={action.items} remove={(id) => action.setItems(action.items.filter((item) => item.id !== id))} />
      {level !== "online" && <Value label="Nome do apostador" name="client_name" />}
      {pix && <PaymentFields />}
      <button className="button button-accent" disabled={action.busy || !action.items.length || flags.bet_enabled === false ||
        (!level && flags.pre_ticket_option === "only_logged")}>
        {level ? "Registrar bilhete" : "Gerar pré-bilhete"}
      </button>
    </form>
    <Result data={action.result} product="loto" />
    {level === "online" && <details><summary>Histórico de loterias</summary>
      <TicketList path="/api/online/loto/bets" product="loto" />
    </details>}
  </>;
}

export function LotteryPage({ type }: { type: "traditional" | "loto" | "2p500" }) {
  const title = type === "traditional" ? "Tradicional" : type === "2p500" ? "2 Para 500" : "Loterias";
  return <ModulePage title={title}><EnabledModule module={type}>
    <nav aria-label="Modalidades"><Link href="/tradicional">Tradicional</Link>{" · "}
      <Link href="/loterias">Loterias</Link>{" · "}<Link href="/2para500">2 Para 500</Link></nav>
    {type === "traditional" ? <TraditionalForm /> : <LotteryForm two500={type === "2p500"} />}
  </EnabledModule></ModulePage>;
}
