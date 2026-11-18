import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/demo-types";
import { record } from "@/lib/backoffice/types";
import { ModulePage } from "@/components/backoffice/module-ui";
import { integrationMode } from "@/server/backoffice/config";
import { pageContext } from "@/server/backoffice/page-context";
import { panelCall } from "@/server/backoffice/http";
import { BackofficeError } from "@/server/backoffice/errors";

export default async function Page({ params }: { params: Promise<{ product: string; id: string }> }) {
  const { product, id } = await params;
  const bet = product === "bet";
  const loto = product === "loto";
  const traditional = product === "tradicional" || product === "traditional";
  if (integrationMode() !== "backoffice" || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) ||
      !(bet || loto || traditional)) notFound();

  const context = await pageContext();
  let ticket;
  try {
    const result = await panelCall({ ...context, session: null }, "POST", bet ? "/api/tickets/bet/" + id
      : loto ? "/api/tickets/loto" : "/api/tickets/traditional", bet ? {} : { body: { identifier: Number(id) } });
    ticket = record(result.data);
  } catch (error) {
    if (error instanceof BackofficeError && (error.status === 404 || error.status === 403)) notFound();
    return <ModulePage title="Comprovante"><p role="alert">Comprovante temporariamente indisponível.</p></ModulePage>;
  }
  if (!ticket.id) notFound();
  const hunches = Array.isArray(ticket.hunches) ? ticket.hunches.map(record) : [];
  return <ModulePage title="Comprovante">
    <p>{String(ticket.cupom ?? ticket.coupon ?? ticket.id)} · {String(ticket.status_label ?? ticket.status ?? "")}</p>
    <p>{String(ticket.human_created_at ?? ticket.created_at ?? "")}</p>
    <dl>
      <dt>Valor apostado</dt><dd>{formatMoney(Number(ticket.bet_amount_value ?? ticket.bet_amount))}</dd>
      <dt>Prêmio ou retorno</dt><dd>{formatMoney(Number(ticket.possible_return_value ?? ticket.award_amount))}</dd>
    </dl>
    <h2>Palpites</h2>
    <ul>{hunches.map((item, index) => {
      const selections = item.hunches ?? item.selections;
      const label = bet ? [item.home, item.away].filter(Boolean).join(" × ") : String(item.lottery ?? item.loto_label ?? item.label ?? "");
      const summary = Array.isArray(selections) ? selections.map((selection) => typeof selection === "object"
        ? [record(selection).market, record(selection).option, record(selection).price].filter(Boolean).join(" · ")
        : String(selection)).join(", ") : [item.market, item.option, item.price].filter(Boolean).join(" · ");
      return <li key={String(item.id ?? index)}><strong>{label}</strong><p>{summary}</p></li>;
    })}</ul>
  </ModulePage>;
}
