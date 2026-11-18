"use client";

import { useEffect, useRef } from "react";
import { formatMoney } from "@/lib/demo-types";

export type WalletConfirmation = {
  kind: "deposit" | "withdrawal";
  amount: number;
  message?: string;
};

export function WalletResult({
  result,
  onClose,
  onAgain,
}: {
  result: WalletConfirmation;
  onClose: () => void;
  onAgain: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const paid = result.kind === "deposit";
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      className={`bcpx-result bcpx-result-${paid ? "success" : "pending"}`}
      data-wallet-result={result.kind}
      data-state={paid ? "paid" : "review"}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={-1}
      ref={ref}
    >
      <div className="bcpx-result-animation" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <i key={index} />
        ))}
        <div className="bcpx-result-icon">
          <svg
            viewBox="0 0 52 52"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {paid ? (
              <path className="bcpx-result-check" d="m16 26 7 7 14-16" />
            ) : (
              <>
                <circle cx="26" cy="26" r="12" />
                <path d="M26 18v9l6 3" />
              </>
            )}
          </svg>
        </div>
      </div>
      <h3>{paid ? "Depósito confirmado!" : "Saque solicitado!"}</h3>
      <strong className="bcpx-result-amount">
        {formatMoney(result.amount)}
      </strong>
      <p>
        {result.message || (paid
          ? "Seu pagamento foi confirmado e o saldo já está disponível na carteira."
          : "Recebemos seu pedido. Ele está em análise e você pode acompanhar a atualização por aqui.")}
      </p>
      <button type="button" className="bcpx-btn" onClick={onClose}>
        Entendi
      </button>
      <button type="button" className="bcpx-link" onClick={onAgain}>
        {paid ? "Fazer outro depósito" : "Voltar para saques"}
      </button>
    </section>
  );
}
