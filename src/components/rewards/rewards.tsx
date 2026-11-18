"use client";
import Link from "next/link";
import { useState } from "react";
import { Gift } from "lucide-react";
import { useSite } from "@/lib/site-context";
import { Workspace } from "@/components/sports/workspace";
export function Rewards() {
  const { session, openModal } = useSite(),
    [tab, setTab] = useState("sports");
  return (
    <Workspace sidebar={false} search={false}>
      <section className="rewards-page">
        <Link className="reward-back" href="/" aria-label="Voltar ao início">
          ‹
        </Link>
        <h1>
          <Gift size={23} strokeWidth={1} />
          Recompensas
        </h1>
        <div className="reward-overview">
          <article className="reward-active">
            <b>0</b>
            <span>Recompensas Ativas</span>
          </article>
          <article>
            <span>Créditos de Aposta</span>
            <strong>R$0,00</strong>
          </article>
          <article>
            <span>Recompensas do Cassino</span>
            <strong>R$0,00</strong>
          </article>
        </div>
        <div className="reward-empty">
          <Gift size={35} />
          <h2>
            {session.user
              ? "Você ainda não tem recompensas ativas"
              : "Suas recompensas aparecem aqui"}
          </h2>
          <p>
            {session.user
              ? "As recompensas disponíveis para sua conta serão exibidas nesta página."
              : "Entre na sua conta para consultar suas recompensas disponíveis."}
          </p>
          {!session.user && (
            <button
              className="button button-accent"
              onClick={() => openModal({ kind: "login" })}
            >
              Entrar
            </button>
          )}
        </div>
        <div className="rewards-promotions">
          <h2>
            <b>0</b> Promoções
          </h2>
          <div
            className="reward-tabs"
            role="tablist"
            aria-label="Tipo de promoção"
          >
            {[
              ["sports", "Esportes"],
              ["casino", "Cassino"],
            ].map(([id, label]) => (
              <button
                role="tab"
                aria-selected={id === tab}
                key={id}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <p role="tabpanel">
            No momento não há nenhuma oferta personalizada disponível para você.
            Volte em breve.
          </p>
        </div>
      </section>
    </Workspace>
  );
}
