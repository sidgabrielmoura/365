"use client";
import Link from "next/link";
import { useEffect, useEffectEvent, useState, type FormEvent } from "react";
import {
  Wallet,
  Mail,
  UserRound,
  Shield,
  ChartNoAxesCombined,
  Clock,
} from "lucide-react";
import { useSite } from "@/lib/site-context";
import {
  formatMoney,
  compactMoney,
  PIX_KEY_TYPES,
  type DemoDeposit,
} from "@/lib/demo-types";
import { Dialog } from "@/components/dialog";
import { AccountIcon } from "./account-icon";
import { AuthDialog, RecaptchaNote } from "./auth-dialog";
import { WalletResult, type WalletConfirmation } from "./wallet-result";
import { SearchDialog } from "@/components/sports/search-dialog";
import { EventStatsDialog } from "@/components/sports/event-stats-dialog";
import { eventById } from "@/lib/sports-data";
import { useResource } from "@/lib/backoffice/use-resource";
import { record } from "@/lib/backoffice/types";
import type { DemoTransaction } from "@/lib/demo-types";
import "./account.css";

const PIX_CHECK_INTERVAL_MS = 6_000;

function DemoNote() {
  const { runtime } = useSite();
  return <p className="demo-note">{runtime.mode === "demo" ? "Demonstração local. Use dados fictícios." : "Aguarde a confirmação do pagamento pelo banco."}</p>;
}
function AccountMenu() {
  const { session, runtime, closeModal, openModal, request, refresh, notify } =
      useSite(),
    [tab, setTab] = useState("conta");
  const tiles = [
    ["Banco", "/conta/banco", Wallet],
    ["Chat ao vivo", "/conta/chat", Mail],
    ["Minha Conta", session.user?.level === "cambista" ? "/cambista" : "/conta", UserRound],
    ["Controles de Aposta", "/conta/controles", Shield],
    ["Minha Atividade", "/conta/atividade", ChartNoAxesCombined],
    ["Histórico", runtime.mode === "backoffice" && session.user?.level === "online" ? "/conta/extratos" : "/conta/historico", Clock],
  ] as const;
  async function pref(key: string, value: boolean) {
    try {
      await request({
        action: "update-preferences",
        preferences: { [key]: value },
      });
    } catch (error) {
      notify((error as Error).message);
    }
  }
  return (
    <Dialog
      title="Minha conta"
      className="acc-menu account-menu-dialog"
      bare
      unwrapped
      onClose={closeModal}
    >
      <div className="acc-top">
        <div className="acc-who">
          <small>{session.user?.username}</small>
          <div className="acc-amount">
            <strong>
              {session.preferences.showBalance
                ? compactMoney(session.balance)
                : "••••"}
            </strong>
            <button
              className="acc-refresh"
              aria-label="Atualizar saldo"
              onClick={() => void refresh()}
            ></button>
          </div>
        </div>
        <div className="acc-pay">
          <button
            className="acc-out"
            onClick={() => openModal({ kind: "pix", tab: "withdraw" })}
          >
            Sacar
          </button>
          <button
            className="acc-in"
            onClick={() => openModal({ kind: "pix", tab: "deposit" })}
          >
            Depositar
          </button>
        </div>
      </div>
      <div className="acc-funds">
        <div>
          <small>Disponível</small>
          <b>{compactMoney(session.available)}</b>
        </div>
        <div>
          <small>Créditos de Aposta</small>
          <b>{compactMoney(session.betCredits)}</b>
        </div>
      </div>
      <nav className="acc-tabs" aria-label="Menu da conta">
        {[
          ["conta", "Conta"],
          ["alertas", "Alertas"],
          ["ofertas", "Minhas Ofertas"],
          ["prefs", "Preferências"],
        ].map(([id, label]) => (
          <button
            className={tab === id ? "on" : ""}
            key={id}
            onClick={() => setTab(id)}
            aria-current={tab === id ? "true" : undefined}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "conta" ? (
        <>
          <div className="acc-tiles">
            {tiles.map(([label, url, Icon], index) => (
              <Link
                className="acc-tile"
                href={url}
                key={url}
                onClick={closeModal}
              >
                <AccountIcon index={index} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <div className="acc-links">
            <Link href="/jogo-responsavel" onClick={closeModal}>
              Jogo Responsável
            </Link>
            <Link href="/ajuda" onClick={closeModal}>
              Ajuda
            </Link>
          </div>
          <div className="acc-links">
            <button
              className="acc-exit"
              onClick={async () => {
                await request({ action: "logout" });
                closeModal();
              }}
            >
              Sair
            </button>
          </div>
        </>
      ) : tab === "ofertas" ? (
        <p className="acc-offers">
          No momento, você não possui ofertas disponíveis.
        </p>
      ) : (
        <div className="acc-alerts">
          {(tab === "prefs"
            ? [["showBalance", "Mostrar Saldo"]]
            : [
                ["alertWins", "Apostas Vencedoras"],
                ["alertFree", "Apostas grátis"],
              ]
          ).map(([key, label]) => (
            <label className="acc-alert" key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(
                  session.preferences[key as keyof typeof session.preferences],
                )}
                onChange={(event) => void pref(key, event.target.checked)}
              />
            </label>
          ))}
          {tab === "prefs" && (
            <>
              <Link
                className="acc-alert"
                href="/conta/preferencias"
                onClick={closeModal}
              >
                Fuso Horário <span>GMT-3</span>
              </Link>
              <Link
                className="acc-alert"
                href="/conta/preferencias"
                onClick={closeModal}
              >
                Máximo de Inatividade
              </Link>
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}
function Pix() {
  const { session, modal, request, closeModal, runtime } = useSite();
  const remote = runtime.mode === "backoffice";
  const [tab, setTab] = useState(modal?.tab || "deposit"),
    [value, setValue] = useState(""),
    [promo, setPromo] = useState(false),
    [keyType, setKeyType] = useState("CPF"),
    [pixKey, setPixKey] = useState(""),
    [deposit, setDeposit] = useState<DemoDeposit | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<WalletConfirmation | null>(null);
  const depositing = tab === "deposit";
  const canReadWithdrawals = remote && !depositing && session.user?.level === "online";
  const eligibility = useResource<unknown>(canReadWithdrawals ? "/api/backoffice/api/online/can-withdraw" : null);
  const history = useResource<{ transactions: DemoTransaction[] }>(canReadWithdrawals ? "/api/resources/transactions?tab=withdrawals" : null);
  const rules = record(eligibility.data);
  const blocked = canReadWithdrawals && (eligibility.loading || Boolean(eligibility.error)
    || (eligibility.data !== undefined && rules.can_request !== "can-request"));
  const transactions = remote ? history.data?.transactions || [] : session.transactions;
  const progress = (label: string, value: unknown) => value != null && Number.isFinite(Number(value))
    ? label + " " + Number(value).toLocaleString("pt-BR") + "%" : "";
  const pixMode = depositing ? runtime.features.deposit : runtime.features.withdrawal;
  const canEditKey = !remote || Number(runtime.settings.can_edit_pix) === 1;
  const min = remote ? Number(runtime.settings[depositing ? "min_deposit_amount" : "min_withdrawal_amount"]) : depositing ? 5 : 10;
  const max = remote ? Number(runtime.settings[depositing ? "max_deposit_amount" : "max_withdrawal_amount"]) : depositing ? 2500 : session.available;
  const checkPayment = useEffectEvent((id: string) => request({ action: "pix-check", id }));
  useEffect(() => {
    if (!remote || !deposit) return;
    const expiresAt = Date.parse(deposit.expiresAt);
    let active = true;
    let checking = false;
    const check = async () => {
      if (!active || checking) return;
      checking = true;
      const expired = expiresAt <= Date.now();
      try {
        const response = await checkPayment(deposit.id);
        if (!active) return;
        const payment = record(response.data);
        if (payment.paid === true) {
          clearInterval(timer);
          setError("");
          setResult({ kind: "deposit", amount: typeof payment.amount === "number" ? payment.amount : deposit.amount });
          setDeposit(null);
          setValue("");
        } else if (expired) {
          clearInterval(timer);
          setDeposit(null);
          setError("O código Pix expirou. Gere um novo depósito.");
        }
      } catch (issue) {
        if (!active) return;
        if (expired) {
          clearInterval(timer);
          setDeposit(null);
        }
        setError((issue as Error).message);
      } finally {
        checking = false;
      }
    };
    const timer = setInterval(check, PIX_CHECK_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [deposit, remote]);
  const amount = Number(value.replace(",", ".")) || 0;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (remote && !pixMode) {
      setError("Consulte o suporte para realizar esta operação.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await request(
        tab === "deposit"
          ? { action: "pix-create", amount, operationId: crypto.randomUUID() }
          : {
              action: "pix-withdraw",
              amount,
              key: pixKey,
              keyType,
              operationId: crypto.randomUUID(),
            },
      );
      if (tab === "deposit") setDeposit(result.deposit || null);
      else {
        const response = result.data as { message?: string } | undefined;
        setResult({ kind: "withdrawal", amount, message: response?.message });
        setValue("");
        setPixKey("");
        if (remote) { eligibility.retry(); history.retry(); }
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function simulatePayment() {
    if (remote || !deposit || busy) return;
    setBusy(true);
    try {
      const confirmed = await request({ action: "pix-confirm", id: deposit.id });
      setResult({
        kind: "deposit",
        amount: confirmed.deposit?.amount ?? deposit.amount,
      });
      setDeposit(null);
      setValue("");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title="Pix" className="pix-dialog" bare onClose={closeModal}>
      <div className="bcpx-panel">
        <div className="bcpx-head">
          <h2>Pix</h2>
          <button className="bcpx-x" aria-label="Fechar" onClick={closeModal}>
            ×
          </button>
        </div>
        <div className="bcpx-bal">
          <small>Saldo</small>
          <b>{formatMoney(session.balance)}</b>
        </div>
        {!result && (
          <div className="bcpx-tabs" role="tablist" aria-label="Operação Pix">
            {[
              ["deposit", "Depositar"],
              ["withdraw", "Sacar"],
            ].map(([id, label]) => (
              <button
                role="tab"
                aria-selected={id === tab}
                className={id === tab ? "on" : ""}
                key={id}
                disabled={busy}
                onClick={() => {
                  if (id === tab) return;
                  setTab(id);
                  setError("");
                  setResult(null);
                  setDeposit(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="bcpx-body">
          {result ? (
            <WalletResult
              result={result}
              onClose={closeModal}
              onAgain={() => {
                setTab(result.kind === "deposit" ? "deposit" : "withdraw");
                setResult(null);
                setError("");
                setValue("");
                setDeposit(null);
              }}
            />
          ) : deposit ? (
            <div className="pix-generated">
              <h3>Pague com Pix</h3>
              <strong>{formatMoney(deposit.amount)}</strong>
              <p>Aguardando confirmação</p>
              <div
                className="demo-qr"
                role={remote ? "img" : undefined}
                aria-label={remote ? "QR Code Pix" : "Ilustração de código demonstrativo"}
                style={remote ? { background: deposit.qrCode && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(deposit.qrCode)
                  ? "white url(" + deposit.qrCode + ") center / contain no-repeat" : "white" } : undefined}
              >
                {remote ? "" : "DEMO"}
              </div>
              <code>{deposit.code}</code>
              <button
                className="bcpx-btn"
                onClick={() => navigator.clipboard.writeText(deposit.code)}
              >
                Copiar código
              </button>
              <DemoNote />
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {!remote && (
                <button
                  className="bcpx-btn simulate-pix"
                  disabled={busy}
                  onClick={simulatePayment}
                >
                  {busy ? "Confirmando…" : "Simular pagamento"}
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={submit}>
              {tab === "withdraw" && (
                <div className="bcpx-kv">
                  <span>Disponível para saque</span>
                  <b>{remote ? "Consulte o limite abaixo" : formatMoney(session.available)}</b>
                </div>
              )}
              <label className="bcpx-f">
                <span>
                  {tab === "deposit" ? "Valor do depósito" : "Valor do saque"}
                </span>
                <div className="bcpx-money">
                  <i>R$</i>
                  <input
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0,00"
                    aria-label={
                      tab === "deposit" ? "Valor do depósito" : "Valor do saque"
                    }
                    value={value}
                    onChange={(event) =>
                      /^\d{0,6}([,.]\d{0,2})?$/.test(event.target.value) &&
                      setValue(event.target.value)
                    }
                    required
                  />
                </div>
              </label>
              <div className="bcpx-chips">
                {tab === "deposit" ? (
                  [20, 50, 100, 200].map((amount) => (
                    <button
                      type="button"
                      key={amount}
                      onClick={() => setValue(String(amount))}
                    >
                      {amount}
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => { if (Number.isFinite(max)) setValue(String(max)); }}
                  >
                    Valor máximo: {Number.isFinite(max) ? formatMoney(max) : "—"}
                  </button>
                )}
              </div>
              {tab === "deposit" ? (
                <>
                  <button
                    className="bcpx-link"
                    type="button"
                    disabled={remote}
                    onClick={() => setPromo(!promo)}
                  >
                    Tenho um código promocional
                  </button>
                  {promo && (
                    <label className="bcpx-f">
                      <span>Código promocional</span>
                      <input
                        className="bcpx-in"
                        placeholder="Código promocional"
                      />
                    </label>
                  )}
                  <p className="bcpx-note">
                    {remote && !pixMode ? "Depósitos disponíveis pelo suporte." : "Mínimo " + formatMoney(min) + " · máximo " + formatMoney(max) + "."} O saldo é creditado
                    automaticamente assim que o Pix é confirmado.
                  </p>
                </>
              ) : (
                <>
                  <label className="bcpx-f">
                    <span>Receber o Pix na chave</span>
                  </label>
                  <div
                    className="pix-key-tabs"
                    role="tablist"
                    aria-label="Tipo da chave Pix"
                  >
                    {PIX_KEY_TYPES.map((type) => (
                      <button
                        role="tab"
                        aria-selected={type === keyType}
                        disabled={!canEditKey}
                        type="button"
                        className={type === keyType ? "on" : ""}
                        key={type}
                        onClick={() => {
                          setKeyType(type);
                          setPixKey("");
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <label className="bcpx-f">
                    <span>Chave Pix: {keyType}</span>
                    <input
                      className="bcpx-in"
                      aria-label={`Chave Pix: ${keyType}`}
                      placeholder={`Digite ${keyType === "E-mail" ? "o e-mail" : keyType === "Celular" ? "o celular" : keyType === "Aleatória" ? "a chave aleatória" : "o CPF"} da chave Pix`}
                      value={pixKey}
                      onChange={(event) => setPixKey(event.target.value)}
                      required={!remote}
                      disabled={!canEditKey}
                    />
                  </label>
                  <p className="bcpx-note">
                    {remote ? canEditKey ? "Preencha para alterar a chave cadastrada antes de sacar." : "Será usado o CPF da conta." : "Informe a chave Pix que deseja usar para receber o saque."}
                  </p>
                  <p className="bcpx-note">
                    {eligibility.error || (rules.can_request === "cant-request"
                      ? ["Regras de saque pendentes.", progress("Esportes", rules.progress_bets),
                        progress("Cassino", rules.progress_casino)].filter(Boolean).join(" · ")
                      : remote && (!pixMode || !Number.isFinite(min) || !Number.isFinite(max) || min > max)
                      ? "Saque indisponível com os limites atuais. Consulte o suporte."
                      : "Mínimo " + formatMoney(min) + " · máximo " + formatMoney(max) + ". Confira a chave antes de confirmar.")}
                  </p>
                </>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="bcpx-btn" type="submit" disabled={busy || (!depositing && blocked) || (remote && (!pixMode || !Number.isFinite(min) || !Number.isFinite(max) || min > max))}>
                {busy
                  ? "Aguarde…"
                  : tab === "deposit"
                    ? "Gerar Pix"
                    : "Solicitar saque"}
              </button>
              {tab === "deposit" ? (
                <RecaptchaNote />
              ) : (
                <>
                  <h4 className="withdrawals-title">ÚLTIMOS SAQUES</h4>
                  {transactions.filter(
                    (item) => item.kind === "withdrawal",
                  ).length ? (
                    transactions
                      .filter((item) => item.kind === "withdrawal")
                      .map((item) => (
                        <p key={item.id}>
                          {formatMoney(-item.amount)} ·{" "}
                          {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      ))
                  ) : (
                    <p className="bcpx-note">
                      {history.error || (history.loading ? "Carregando saques…" : "Você ainda não solicitou saques.")}
                    </p>
                  )}
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </Dialog>
  );
}
export function AccountSurfaces() {
  const { modal, session, closeModal } = useSite();
  if (!modal) return null;
  if (modal.kind === "event-stats") {
    const event = typeof modal.payload === "object" && modal.payload !== null
      ? modal.payload as NonNullable<ReturnType<typeof eventById>>
      : typeof modal.payload === "string" ? eventById(modal.payload) : undefined;
    return event ? <EventStatsDialog event={event} /> : null;
  }
  if (modal.kind === "search") return <SearchDialog />;
  if (["login", "register", "forgot"].includes(modal.kind))
    return (
      <AuthDialog
        key={modal.kind}
        register={modal.kind === "register"}
        forgot={modal.kind === "forgot"}
      />
    );
  if ((modal.kind === "account" || modal.kind === "pix") && !session.user)
    return <AuthDialog />;
  if (modal.kind === "account") return <AccountMenu />;
  if (modal.kind === "pix") return <Pix />;
  return (
    <Dialog title={modal.title || "Informações"} onClose={closeModal}>
      <h2>{modal.title || "Informações"}</h2>
      <p className="information-body">
        {typeof modal.payload === "string"
          ? modal.payload
          : "Esta opção está disponível na demonstração local."}
      </p>
      <button className="button button-accent full-width" onClick={closeModal}>
        Entendi
      </button>
    </Dialog>
  );
}
