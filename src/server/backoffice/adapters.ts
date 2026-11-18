import { EMPTY_SESSION, formatMoney, type DemoDeposit, type DemoPick, type DemoSession, type DemoTicket, type DemoTransaction } from "@/lib/demo-types";
import { field, record, type BackofficeBindings, type DataRecord } from "@/lib/backoffice/types";
import { BackofficeError } from "./errors";
import { ticketFromPanel } from "@/lib/backoffice/public-adapters";

export function valueAt(data: unknown, bindings: BackofficeBindings, name: string, fallback: string) {
  return field(data, bindings.fields?.[name] ?? fallback);
}
export function money(value: unknown, bindings: BackofficeBindings) {
  if ((typeof value !== "number" && typeof value !== "string") || value === "" || !Number.isFinite(Number(value)))
    throw new BackofficeError("Valor financeiro inválido recebido do serviço.", 502, "INVALID_RESPONSE");
  return Number(value) / (bindings.moneyUnit === "minor" ? 100 : 1);
}
export function payload(data: unknown) {
  const row = record(data);
  return row.data !== undefined ? row.data : data;
}
export function rows(data: unknown): unknown[] {
  const value = payload(data);
  if (Array.isArray(value)) return value;
  const list = record(value).data;
  if (Array.isArray(list)) return list;
  throw new BackofficeError("Lista inválida recebida do serviço.", 502, "INVALID_RESPONSE");
}
export function userData(data: unknown, bindings: BackofficeBindings): NonNullable<DemoSession["user"]> {
  const root = payload(data);
  const user = record(valueAt(root, bindings, "user", "user") ?? root);
  const id = valueAt(user, bindings, "userId", "id");
  if (id === undefined || id === null)
    throw new BackofficeError("Perfil inválido recebido do serviço.", 502, "INVALID_RESPONSE");
  return {
    id: String(id), name: String(valueAt(user, bindings, "userName", "name") || ""),
    email: String(valueAt(user, bindings, "userEmail", "email") || ""),
    username: String(valueAt(user, bindings, "userUsername", "username") || ""),
    createdAt: String(valueAt(user, bindings, "userCreatedAt", "created_at") || ""),
  };
}
export function balanceData(data: unknown, bindings: BackofficeBindings) {
  const root = payload(data);
  const balance = money(typeof root === "number" || typeof root === "string"
    ? root : valueAt(root, bindings, "balance", "balance"), bindings);
  const available = valueAt(root, bindings, "available", "withdrawable_balance");
  const credits = valueAt(root, bindings, "betCredits", "bonus");
  return {
    balance, available: available === undefined ? 0 : money(available, bindings),
    betCredits: credits === undefined ? 0 : money(credits, bindings),
  };
}
export function pickData(value: unknown, bindings: BackofficeBindings): DemoPick {
  const row = record(value);
  const eventId = String(valueAt(row, bindings, "pickEventId", "event_id") || "");
  const marketId = String(valueAt(row, bindings, "pickMarketId", "market_id") || "");
  const selectionId = String(valueAt(row, bindings, "pickSelectionId", "option_id") || "");
  const odd = Number(valueAt(row, bindings, "pickOdd", "cotation"));
  if (!eventId || !marketId || !selectionId || !Number.isFinite(odd) || odd <= 0)
    throw new BackofficeError("Seleção inválida recebida do serviço.", 502, "INVALID_RESPONSE");
  return {
    eventId, marketId, selectionId, key: [eventId, marketId, selectionId].join("|"),
    eventLabel: String(valueAt(row, bindings, "pickEventLabel", "event_label") || ""),
    marketLabel: String(valueAt(row, bindings, "pickMarketLabel", "market") || ""),
    label: String(valueAt(row, bindings, "pickLabel", "option") || ""), odd,
  };
}
export function ticketData(value: unknown, bindings: BackofficeBindings): DemoTicket {
  const row = record(value);
  if (row.valor_apostado !== undefined) return ticketFromPanel(value);
  const picks = valueAt(row, bindings, "ticketPicks", "hunches");
  const id = valueAt(row, bindings, "ticketId", "id");
  const rawStatus = String(valueAt(row, bindings, "ticketStatus", "status") || "");
  const status = bindings.statusMap?.[rawStatus] || rawStatus;
  if (id == null || !Array.isArray(picks) || !["open", "won", "lost", "void", "cancelled", "cashout"].includes(status))
    throw new BackofficeError("Contrato do bilhete não reconhecido.", 502, "INVALID_RESPONSE");
  const result: DemoTicket = {
    id: String(id), picks: picks.map((item) => pickData(item, bindings)),
    stake: money(valueAt(row, bindings, "ticketStake", "amount"), bindings),
    odds: Number(valueAt(row, bindings, "ticketOdds", "cotation")),
    potential: money(valueAt(row, bindings, "ticketPotential", "potential_return"), bindings),
    createdAt: String(valueAt(row, bindings, "ticketCreatedAt", "created_at") || ""),
    status: status as DemoTicket["status"], canCancel: false,
  };
  const returned = valueAt(row, bindings, "ticketReturn", "return_amount");
  if (returned !== undefined && returned !== null) result.returnAmount = money(returned, bindings);
  return result;
}
export function depositData(value: unknown, amount: number, bindings: BackofficeBindings): DemoDeposit {
  const root = payload(value);
  const id = valueAt(root, bindings, "depositId", "id");
  const code = valueAt(root, bindings, "depositCode", "copy_past");
  if (id == null || typeof code !== "string" || !code)
    throw new BackofficeError("Cobrança recebida sem identificação ou código Pix.", 502, "INVALID_RESPONSE");
  return {
    id: String(id), amount, code,
    createdAt: String(valueAt(root, bindings, "depositCreatedAt", "created_at") || ""),
    expiresAt: String(valueAt(root, bindings, "depositExpiresAt", "expires_at") || ""),
    qrCode: String(valueAt(root, bindings, "depositQr", "qr_code") || ""), state: "pending",
  };
}
export function transactionData(value: unknown, bindings: BackofficeBindings, tab = "transactions"): DemoTransaction {
  const row = record(value);
  if (tab === "deposits" || tab === "withdrawals") {
    const deposit = tab === "deposits";
    const states: Record<string, string> = {
      pending: "Pendente", await_confirm: "Aguardando confirmação", paid: "Pago", approved: "Aprovado",
      refused: "Recusado", cancelled: "Cancelado", expired: "Expirado",
    };
    return {
      id: String(row.id), kind: deposit ? "deposit" : "withdrawal",
      amount: money(row.amount, bindings) * (deposit ? 1 : -1),
      createdAt: String(row.paid_at ?? row.created_at ?? ""),
      reference: [states[String(row.status)] ?? "Situação indisponível",
        typeof row.admin_feedback === "string" ? row.admin_feedback : ""].filter(Boolean).join(" · "),
    };
  }
  if (tab === "casino-plays") {
    const stake = money(row.bet_amount, bindings), prize = money(row.win_amount, bindings);
    return { id: String(row.id), kind: "bet", amount: prize - stake, createdAt: String(row.played ?? ""),
      reference: [row.game, row.with_real === true ? "Saldo real" : row.mode, "Apostado " + formatMoney(stake),
        "Prêmio " + formatMoney(prize)].filter(Boolean).join(" · ") };
  }
  if (typeof row.operation === "string" && (row.option === "input" || row.option === "output")) {
    const signed = Math.abs(money(row.amount, bindings)) * (row.option === "output" ? -1 : 1);
    const name = String(row.operation);
    const kind = /deposit/i.test(name) ? "deposit" : /withdraw/i.test(name) ? "withdrawal"
      : /cashout/i.test(name) ? "cashout" : /refund|cancel/i.test(name) ? "refund" : "bet";
    return { id: String(row.id), kind, amount: signed, reference: String(row.note || row.operation),
      createdAt: String(row.created_at || "") };
  }
  const kind = String(valueAt(row, bindings, "transactionKind", "type") || "");
  if (!["deposit", "withdrawal", "bet", "refund", "cashout"].includes(kind))
    throw new BackofficeError("Tipo de movimentação não reconhecido.", 502, "INVALID_RESPONSE");
  return {
    id: String(row.id), kind: kind as DemoTransaction["kind"],
    amount: money(valueAt(row, bindings, "transactionAmount", "amount"), bindings),
    reference: String(row.reference || ""),
    createdAt: String(valueAt(row, bindings, "transactionCreatedAt", "created_at") || ""),
  };
}
export function emptySession(): DemoSession { return structuredClone(EMPTY_SESSION); }
export function fillTemplate(template: unknown, input: DataRecord): unknown {
  if (typeof template === "string" && template.startsWith("$")) {
    const value = field(input, template.slice(1));
    if (value === undefined)
      throw new BackofficeError("Confira os dados informados.", 422, "MISSING_FIELD");
    return value;
  }
  if (Array.isArray(template)) return template.map((item) => fillTemplate(item, input));
  if (template && typeof template === "object")
    return Object.fromEntries(Object.entries(template).map(([key, value]) => [key, fillTemplate(value, input)]));
  return template;
}
