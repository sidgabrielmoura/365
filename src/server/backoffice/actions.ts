import { flag, record, type DataRecord } from "@/lib/backoffice/types";
import type { DemoResponse, DemoSession } from "@/lib/demo-types";
import { BackofficeError, missingContract } from "./errors";
import { panelCall, type CallContext } from "./http";
import { publicRuntime } from "./runtime";
import { balanceData, depositData } from "./adapters";
import { bindings } from "./config";

type ActionResult = Omit<DemoResponse, "session"> & {
  sessionPatch?: Partial<DemoSession>;
};

export function positiveId(value: unknown) {
  const id = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0)
    throw new BackofficeError("Identificador inválido.", 422, "INVALID_ID");
  return id;
}

export function requiredText(value: unknown, label: string, min = 1, max = 255) {
  if (typeof value !== "string" || value.trim().length < min || value.length > max)
    throw new BackofficeError("Confira " + label + ".", 422, "MISSING_FIELD");
  return value;
}

export function validAmount(amount: unknown, minimum: unknown, maximum: unknown) {
  const min = Number(minimum), max = Number(maximum);
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0
    || !Number.isFinite(min) || !Number.isFinite(max) || amount < min || amount > max
    || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6)
    throw new BackofficeError("Confira o valor e os limites desta operação.", 422, "AMOUNT_OUT_OF_RANGE");
  return amount;
}

function checkOutcome(value: unknown, field: string) {
  const data = record(value);
  if (data[field] !== true)
    throw new BackofficeError(String(data.message || data.error || "O painel não confirmou a operação."), 422, "NOT_CONFIRMED");
  return data;
}

export function registrationInput(mode: unknown, input: DataRecord) {
  if (input.adult !== true) throw new BackofficeError("Confirme que você tem 18 anos ou mais.", 422);
  const password = requiredText(input.password, "a senha", 5, 20);
  const common = { password, password_confirmation: password,
    ...(input.partner ? { partner: requiredText(input.partner, "o código de indicação", 1, 100) } : {}),
    ...(input.affiliate ? { bta_code: requiredText(input.affiliate, "o código de afiliado", 1, 100) } : {}),
    ...(input.botToken ? { bot_token: requiredText(input.botToken, "a confirmação de segurança", 1, 6000) } : {}),
  };
  const name = input.name ? requiredText(input.name, "o nome", 3, 150).trim() : undefined;
  if (mode === "phone") {
    const phone = requiredText(input.phone, "o celular", 8, 25).replace(/\D/g, "");
    return { path: "/api/online/v2/register", username: phone, body: { ...common, phone, name, email: input.email } };
  }
  if (mode === "username") {
    const username = requiredText(input.username, "o usuário", 4, 150).trim().toLowerCase();
    if (!/^[a-z0-9_-]+$/.test(username)) throw new BackofficeError("Informe um usuário válido.", 422);
    return { path: "/api/online/v3/register", username, body: { ...common, name, username } };
  }
  if (mode !== "default" && mode != null) throw new BackofficeError("Cadastro indisponível.", 422);
  const email = requiredText(input.email, "o e-mail").trim();
  return { path: "/api/online/register", username: email, body: {
    ...common, full_name: name ?? requiredText(input.name, "o nome", 3, 150), email, document: requiredText(input.cpf, "o CPF", 11, 14),
    contact: requiredText(input.phone, "o celular", 8, 25),
  } };
}

export function sportsbookBody(input: DataRecord, settings: DataRecord) {
  const picks = Array.isArray(input.picks) ? input.picks.map(record) : [];
  const hunches = picks.flatMap((pick) => {
    const builder = pick.kind === "builder";
    const legs = builder && Array.isArray(pick.children) ? pick.children.map(record) : [pick];
    if (!legs.length) throw new BackofficeError("Seleções inválidas.", 422);
    return legs.map((leg) => {
      const event_id = positiveId(leg.eventId);
      const odd_id = requiredText(leg.selectionId, "a seleção", 1, 100);
      const type = leg.betType === "live" ? "live" : "prematch";
      if (type === "live" && leg.enabled === false)
        throw new BackofficeError("Uma cotação ao vivo está indisponível.", 422);
      const price = Number(builder ? leg.originalOdd ?? leg.odd : leg.odd);
      if (!Number.isFinite(price) || price <= 0 || (builder && type === "live"))
        throw new BackofficeError("Cotação indisponível.", 422);
      return { id: requiredText(leg.key, "a seleção", 1, 200), event_id, odd_id, price,
        bet_amount: 0, type, mode: builder ? "builder" : "default" };
    });
  });
  if (!picks.length || new Set(hunches.map((leg) => leg.id)).size !== hunches.length)
    throw new BackofficeError("Confira as seleções.", 422);
  const live = hunches.some((leg) => leg.type === "live");
  const prefix = live ? "live" : "prematch";
  if (!flag(settings[prefix + "_active_bet"] ?? settings.bet_enabled))
    throw new BackofficeError("Apostas indisponíveis no momento.", 422, "BET_DISABLED");
  if (live && hunches.some((leg) => leg.type === "prematch") && !flag(settings.allow_merged_bet))
    throw new BackofficeError("O bilhete precisa ter apenas seleções ao vivo ou pré-jogo.", 422);
  const min = Number(settings[prefix + "_min_quantity"]);
  const max = Number(settings[prefix + "_max_quantity"]);
  if ((Number.isFinite(min) && picks.length < min) || (Number.isFinite(max) && picks.length > max))
    throw new BackofficeError("Confira a quantidade de seleções do bilhete.", 422);
  return { bet_mode: "multiple", multiple_amount: validAmount(input.stake,
    settings[prefix + "_min_value"] ?? settings.min_bet_amount,
    settings[prefix + "_max_value"] ?? settings.max_bet_amount), hunches,
    ...(hunches.some((leg) => leg.mode === "builder") ? { builder: "latest" } : {}),
  };
}

async function updateBalance(context: CallContext, result: ActionResult) {
  try {
    const { data } = await panelCall(context, "GET", "/api/online/account/balance");
    result.sessionPatch = balanceData(data, await bindings());
  } catch {
    // An acknowledged write remains successful if the follow-up read fails.
  }
  return result;
}

export async function action(context: CallContext, input: DataRecord): Promise<ActionResult> {
  if (!context.session) throw new BackofficeError("Entre na sua conta para continuar.", 401, "UNAUTHENTICATED");
  const call = async (method: string, path: string, body?: unknown) =>
    (await panelCall(context, method, path, { body })).data;
  switch (input.action) {
    case "update-password": {
      const password = requiredText(input.next, "a nova senha", 6, 50);
      if (password !== input.confirm) throw new BackofficeError("As senhas devem coincidir.", 422);
      const seller = context.session.level === "cambista";
      const current = requiredText(input.current, "a senha atual");
      const data = await call("PUT", seller ? "/api/seller/change-password" : "/api/online/change-pasword",
        seller ? { current_pass: current, new_pass: password, confirm_pass: password }
          : { current_password: current, password, password_confirmation: password });
      if (!seller) checkOutcome(data, "status");
      return { data };
    }
    case "update-contact": {
      const phone = requiredText(input.phone, "o telefone", 10, 25);
      checkOutcome(await call("PUT", "/api/online/informations", { phone }), "status");
      return { sessionPatch: { profile: { phone } } };
    }
    case "update-address": {
      const address = typeof input.address === "string" ? input.address : Object.values(record(input.address))
        .filter((item) => typeof item === "string" && item.trim()).join(", ");
      const text = requiredText(address, "o endereço (10 a 45 caracteres)", 10, 45);
      checkOutcome(await call("PUT", "/api/online/informations", { address: text }), "status");
      return { sessionPatch: { profile: { address: { street: text } } } };
    }
    case "pix-create": {
      const { settings } = await publicRuntime(context.tenant, context);
      if (settings.charge_mode !== "pix") throw new BackofficeError("Entre em contato com o suporte para depositar.", 422, "SUPPORT_REQUIRED");
      const amount = validAmount(input.amount, settings.min_deposit_amount, settings.max_deposit_amount);
      const config = await bindings();
      const data = await call("POST", "/api/online/deposits", { amount });
      const deposit = depositData(data, amount, config);
      const minutes = Number(settings.pix_auto_expiration);
      if (!deposit.expiresAt && Number.isFinite(minutes) && minutes > 0)
        deposit.expiresAt = new Date(Date.now() + minutes * 60000).toISOString();
      return { deposit };
    }
    case "pix-check": {
      try {
        const data = record(await call("POST", "/api/check-payment", { key: positiveId(input.id) }));
        const paid = data.type === "add_balance" && data.status === true;
        const result = { data: { paid, amount: paid ? Number(data.px_value) : undefined } };
        return paid ? updateBalance(context, result) : result;
      } catch (error) {
        if (error instanceof BackofficeError && error.status === 400 && record(error.details).status === false)
          return { data: { paid: false } };
        throw error;
      }
    }
    case "can-withdraw":
      return { data: await call("GET", "/api/online/can-withdraw") };
    case "pix-withdraw": {
      const { settings } = await publicRuntime(context.tenant, context);
      if (settings.withdrawal_mode !== "pix") throw new BackofficeError("Entre em contato com o suporte para sacar.", 422, "SUPPORT_REQUIRED");
      const amount = validAmount(input.amount, settings.min_withdrawal_amount, settings.max_withdrawal_amount);
      const eligibility = record(await call("GET", "/api/online/can-withdraw"));
      if (eligibility.can_request !== "can-request")
        throw new BackofficeError("O saque depende da conclusão das regras da conta.", 422, "WITHDRAWAL_BLOCKED", eligibility);
      if (flag(settings.can_edit_pix) && input.key) {
        const types = { CPF: "document", "E-mail": "email", Celular: "phone", Aleatória: "random" } as const;
        const pix_type = types[String(input.keyType) as keyof typeof types];
        if (!pix_type) throw new BackofficeError("Selecione o tipo da chave Pix.", 422);
        await call("PUT", "/api/online/withdrawal-data", { pix_type, pix_key: requiredText(input.key, "a chave Pix") });
      }
      return updateBalance(context, { data: await call("POST", "/api/online/withdrawals", { amount, type: "pix" }) });
    }
    case "bet-place": {
      const { settings } = await publicRuntime(context.tenant, context);
      const body = sportsbookBody(input, settings);
      const data = record(await call("POST", "/api/online/register-bet", body));
      return updateBalance(context, { data: { ticketId: positiveId(data.ticket_id) } });
    }
    case "featured-bet": {
      const hash = requiredText(input.hash, "o código da dica", 12, 12);
      if (!/^[A-Z0-9]{12}$/.test(hash)) throw new BackofficeError("Dica inválida.", 422);
      const { settings } = await publicRuntime(context.tenant, context);
      if (!flag(settings.prematch_active_bet ?? settings.bet_enabled))
        throw new BackofficeError("Apostas indisponíveis no momento.", 422);
      const featured = record(await call("POST", "/api/featured-tickets/" + hash));
      const quotation = Number(featured.boost_cotation) || Number(featured.ticket_cotation);
      if (featured.sold_out === true || quotation !== Number(input.quotation))
        throw new BackofficeError("A dica mudou. Confira a cotação atual e confirme novamente.", 409, "PRICE_CHANGED");
      const fixed = Number(featured.bet_amount);
      const stake = fixed > 0 ? validAmount(input.stake, fixed, fixed)
        : validAmount(input.stake, settings.prematch_min_value, settings.prematch_max_value);
      const selections = Array.isArray(featured.hunches) ? featured.hunches.map(record) : [];
      const hunches = selections.flatMap((selection, index) => {
        const grouped = selection.bet_mode === "builder" && Array.isArray(selection.selections);
        const legs = grouped ? (selection.selections as unknown[]).map(record) : [selection];
        return legs.map((leg, position) => ({
          id: "featured-" + index + "-" + position, event_id: positiveId(selection.event_id),
          odd_id: positiveId(leg.odd_id), price: Number(leg.price), bet_amount: 0,
          type: "prematch", mode: grouped ? "builder" : "default",
        }));
      });
      if (!hunches.length || hunches.some((leg) => !Number.isFinite(leg.price) || leg.price <= 0))
        throw new BackofficeError("A dica está indisponível.", 422);
      const data = record(await call("POST", "/api/online/register-bet",
        { bet_mode: "multiple", multiple_amount: stake, featured_ticket_id: hash, hunches,
          ...(hunches.some((leg) => leg.mode === "builder") ? { builder: "latest" } : {}) }));
      return updateBalance(context, { data: { ticketId: positiveId(data.ticket_id) } });
    }
    case "bet-cashout": {
      const offer = record(input.offer);
      const cashout_amount = Number(offer.cashout_value);
      if (!Number.isFinite(cashout_amount) || cashout_amount <= 0)
        throw new BackofficeError("A oferta de cashout está indisponível.", 422);
      const data = checkOutcome(await call("POST", "/api/online/cashout/confirm", {
        ticket_id: positiveId(input.id), cashout_amount,
      }), "success");
      return updateBalance(context, { data });
    }
    case "seller-cancel":
      return { data: await call("GET", "/api/cancela-bilhete/" + positiveId(input.id)) };
    case "referral": {
      const [data, rules] = await Promise.all([
        call("POST", "/api/online/refer-win-code"), call("GET", "/api/refer-and-win-rules"),
      ]);
      return { data: { code: record(data).code, rules } };
    }
    default:
      return missingContract(String(input.action));
  }
}
