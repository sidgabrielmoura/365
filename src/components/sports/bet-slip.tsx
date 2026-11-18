"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { useSite } from "@/lib/site-context";
import { formatMoney } from "@/lib/demo-types";
import { flag } from "@/lib/backoffice/types";
import { useLiveSlipPrices } from "@/lib/backoffice/live";
import "./bet-slip.css";
export function SportsBetSlip() {
  const {
    picks,
    removePick,
    clearPicks,
    session,
    openModal,
    placeBet,
    slipOpen,
    setSlipOpen,
    runtime,
  } = useSite();
  useLiveSlipPrices();
  const [stake, setStake] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const path = usePathname(),
    value = Number(stake.replace(",", ".")) || 0;
  const router = useRouter();
  const live = picks.some((pick) => pick.betType === "live");
  const suspended = runtime.mode === "backoffice" && picks.some((pick) => pick.betType === "live" && pick.enabled === false);
  const limits = live ? "live" : "prematch";
  const priceCap = runtime.mode === "backoffice" ? Number(runtime.settings[limits + "_max_quotation"]) : 0;
  const awardCap = runtime.mode === "backoffice" ? Number(runtime.settings[limits + "_maximum_award"]) : 0;
  const product = picks.reduce((total, pick) => total * pick.odd, 1);
  const odd = Math.round((priceCap > 0 ? Math.min(product, priceCap) : product) * 100) / 100;
  const potential = awardCap > 0 ? Math.min(value * odd, awardCap) : value * odd;
  if (!picks.length || path.startsWith("/cassino/jogo")) return null;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || suspended) return;
    setError("");
    const checkout = runtime.mode === "backoffice" && (session.user?.level === "cambista" ||
      (!live && !session.user && !flag(runtime.settings.only_online_bet) && runtime.settings.pin_mode !== "only_logged"));
    if (checkout) {
      setSlipOpen(false);
      router.push("/pre-bilhete?valor=" + value);
      return;
    }
    if (!session.user) {
      openModal({ kind: "login" });
      return;
    }
    const min = runtime.mode === "backoffice" ? Number(runtime.settings[live ? "live_min_value" : "min_bet_amount"]) : 1;
    const max = runtime.mode === "backoffice" ? Number(runtime.settings[live ? "live_max_value" : "max_bet_amount"]) : 50000;
    if (value < min || value > max) {
      setError("Confira os limites: " + formatMoney(min) + " a " + formatMoney(max) + ".");
      return;
    }
    setBusy(true);
    try {
      await placeBet(value);
      setStake("");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {slipOpen ? (
        <>
          <button
            className="slip-backdrop"
            aria-label="Minimizar bilhete"
            onClick={() => setSlipOpen(false)}
          />
          <aside
            className="betslip mobile-open"
            aria-label="Bilhete de apostas"
          >
            <div id="slip-content">
              {picks.length > 1 && (
                <header className="demo-slip-heading">
                  <strong>Múltipla ({picks.length})</strong>
                  <b>{odd.toFixed(2)}</b>
                  <button onClick={clearPicks}>Remover todas</button>
                </header>
              )}
              {picks.map((pick) =>
                pick.kind === "builder" ? (
                  <section className="slip-builder" key={pick.key}>
                    <button
                      className="slip-icon slip-close"
                      aria-label={`Remover ${pick.label}`}
                      onClick={() => removePick(pick.key)}
                    />
                    <header>
                      CRIAR APOSTA <b>{runtime.mode === "backoffice" ? "≈ " : ""}{pick.odd.toFixed(2)}</b>
                    </header>
                    <Link
                      className="slip-builder-event"
                      href={`/evento/${pick.eventId}`}
                    >
                      {pick.eventLabel}
                    </Link>
                    {pick.children?.map((child) => (
                      <div className="slip-builder-selection" key={child.key}>
                        <button
                          className="slip-icon slip-close"
                          aria-label={`Remover ${child.label}`}
                          onClick={() => removePick(child.key)}
                        />
                        <div>
                          <div className="slip-selection-title">
                            <strong>{child.label}</strong>
                          </div>
                          <small className="slip-selection-market">
                            {child.marketLabel}
                          </small>
                        </div>
                      </div>
                    ))}
                  </section>
                ) : (
                  <div
                    className={`slip-selection ${pick.kind === "boost" ? "slip-boost" : ""}`}
                    key={pick.key}
                  >
                    <button
                      className="slip-icon slip-close"
                      aria-label={`Remover ${pick.label}`}
                      onClick={() => removePick(pick.key)}
                    />
                    <div className="slip-selection-info">
                      <div className="slip-selection-title">
                        <strong>{pick.label}</strong>
                        <b>{runtime.mode === "backoffice" && pick.betType === "live" && pick.enabled === false ? "Indisponível" : pick.odd.toFixed(2)}</b>
                      </div>
                      <small className="slip-selection-market">
                        {pick.marketLabel}
                      </small>
                      <Link
                        className="slip-selection-fixture"
                          href={(runtime.mode === "backoffice" && pick.betType === "live" ? "/ao-vivo/jogo/" : "/evento/") + pick.eventId}
                      >
                        {pick.eventLabel}
                      </Link>
                      {pick.betType !== "live" && pick.marketLabel === "Resultado Final" && (
                        <span className="slip-selection-badge slip-selection-badge-pa">
                          Pagamento Antecipado
                        </span>
                      )}
                      {pick.kind === "boost" && (
                        <span className="slip-selection-badge slip-selection-badge-boost">
                          Aposta Aumentada
                        </span>
                      )}
                    </div>
                  </div>
                ),
              )}
              <form className="slip-form" onSubmit={submit}>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <div className="slip-actions">
                  <label className="slip-stake">
                    <input
                      className="slip-stake-input"
                      inputMode="decimal"
                      aria-label="Valor da aposta"
                      placeholder="Aposta"
                      value={stake}
                      onChange={(event) =>
                        /^\d{0,5}([,.]\d{0,2})?$/.test(event.target.value) &&
                        setStake(event.target.value)
                      }
                    />
                  </label>
                  <button className="slip-place" disabled={busy || suspended} type="submit">
                    <span>{busy ? "Confirmando…" : "Fazer aposta"}</span>
                    <small>
                      {value && !suspended
                        ? `Retorno ${runtime.mode === "backoffice" ? "até " + formatMoney(potential) : formatMoney(Math.min(potential, 1000000))}`
                        : ""}
                    </small>
                  </button>
                </div>
              </form>
              <button
                className="demo-slip-minimize"
                onClick={() => setSlipOpen(false)}
                aria-label="Minimizar bilhete"
              >
                ⌄
              </button>
            </div>
          </aside>
        </>
      ) : (
        <section className="demo-slip-reopen">
          <button onClick={() => setSlipOpen(true)} aria-expanded="false">
            <b>{picks.length}</b> Bilhete de apostas <ChevronUp size={17} />
          </button>
          <span>{formatMoney(session.balance)}</span>
        </section>
      )}
    </>
  );
}
