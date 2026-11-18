import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  EMPTY_SESSION,
  DEFAULT_PREFERENCES,
  type DemoSession,
  type DemoResponse,
  type DemoTicket,
} from "./demo-types";
import { canonicalPick } from "./bet-data";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password: string;
  salt: string;
  state: string;
  created: string;
};
let database: DatabaseSync | undefined;
function db() {
  if (!database) {
    mkdirSync(path.join(process.cwd(), ".local"), { recursive: true });
    database = new DatabaseSync(path.join(process.cwd(), ".local/demo.sqlite"));
    database.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT,email TEXT UNIQUE,password TEXT,salt TEXT,state TEXT,created TEXT);
      CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT,expires INTEGER);
      CREATE TABLE IF NOT EXISTS operations(id TEXT,user_id TEXT,response TEXT,PRIMARY KEY(id,user_id));`);
  }
  return database;
}
function userFor(token: string | undefined) {
  if (!token) return undefined;
  return db()
    .prepare(
      "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
    )
    .get(token, Date.now()) as UserRow | undefined;
}
function sessionFor(user: UserRow | undefined): DemoSession {
  if (!user) return structuredClone(EMPTY_SESSION);
  const state = JSON.parse(user.state) as DemoSession;
  return {
    ...state,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.email.split("@")[0],
      createdAt: user.created,
    },
    available: state.balance,
  };
}
export const readSession = (token: string | undefined) =>
  sessionFor(userFor(token));
export function authenticate(action: string, input: Record<string, unknown>) {
  const demo = action === "demo";
  const email = demo
    ? `visitante-${randomUUID().slice(0, 8)}@demo.local`
    : String(input.email || input.identifier || "")
        .trim()
        .toLowerCase();
  const password = demo
    ? randomBytes(24).toString("hex")
    : String(input.password || "");
  let user = db().prepare("SELECT * FROM users WHERE email=?").get(email) as
    UserRow | undefined;
  if (action === "register" || demo) {
    const name = demo ? "Visitante BrasaBet" : String(input.name || "").trim();
    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 6
    )
      throw new Error(
        "Confira seu nome, e-mail e senha de pelo menos 6 caracteres.",
      );
    if (user) throw new Error("Este e-mail já possui uma conta local.");
    const salt = randomBytes(16).toString("hex"),
      id = randomUUID(),
      created = new Date().toISOString();
    db()
      .prepare("INSERT INTO users VALUES(?,?,?,?,?,?,?)")
      .run(
        id,
        name,
        email,
        scryptSync(password, salt, 64).toString("hex"),
        salt,
        JSON.stringify({
          ...EMPTY_SESSION,
          preferences: { ...DEFAULT_PREFERENCES },
        }),
        created,
      );
    user = db().prepare("SELECT * FROM users WHERE id=?").get(id) as UserRow;
  } else if (
    !user ||
    !timingSafeEqual(
      scryptSync(password, user.salt, 64),
      Buffer.from(user.password, "hex"),
    )
  )
    throw new Error("E-mail ou senha da conta local incorretos.");
  const token = randomBytes(32).toString("hex");
  db()
    .prepare("INSERT INTO sessions VALUES(?,?,?)")
    .run(token, user.id, Date.now() + 86400000 * 7);
  return { token, session: sessionFor(user) };
}
function amount(raw: unknown, min = 1, max = 50000) {
  const value = Number(raw);
  if (
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    Math.abs(value * 100 - Math.round(value * 100)) > 0.00001
  )
    throw new Error(`Informe um valor entre R$ ${min} e R$ ${max}.`);
  return Math.round(value * 100) / 100;
}
export function mutate(
  token: string | undefined,
  input: Record<string, unknown>,
): DemoResponse {
  const user = userFor(token),
    store = db();
  if (!user) throw new Error("Entre na sua conta local para continuar.");
  const action = String(input.action);
  if (action === "logout") {
    store.prepare("DELETE FROM sessions WHERE token=?").run(token!);
    return { session: structuredClone(EMPTY_SESSION) };
  }
  store.exec("BEGIN IMMEDIATE");
  try {
    const operation =
      typeof input.operationId === "string"
        ? input.operationId.slice(0, 100)
        : null;
    if (operation) {
      const old = store
        .prepare("SELECT response FROM operations WHERE id=? AND user_id=?")
        .get(operation, user.id) as { response: string } | undefined;
      if (old) {
        const response = JSON.parse(old.response) as DemoResponse;
        response.session = readSession(token);
        if (response.ticket)
          response.ticket =
            response.session.tickets.find(
              (ticket) => ticket.id === response.ticket!.id,
            ) || response.ticket;
        if (response.deposit)
          response.deposit =
            response.session.pendingDeposits.find(
              (deposit) => deposit.id === response.deposit!.id,
            ) || response.deposit;
        store.exec("COMMIT");
        return response;
      }
    }
    const current = store
      .prepare("SELECT * FROM users WHERE id=?")
      .get(user.id) as UserRow;
    const session = sessionFor(current);
    let ticket: DemoTicket | undefined, deposit;
    function ledger(
      kind: DemoSession["transactions"][number]["kind"],
      delta: number,
      reference: string,
    ) {
      const balance =
        Math.round(session.balance * 100) + Math.round(delta * 100);
      if (balance < 0) throw new Error("Saldo de demonstração insuficiente.");
      session.balance = session.available = balance / 100;
      session.transactions.unshift({
        id: randomUUID(),
        kind,
        amount: delta,
        reference,
        createdAt: new Date().toISOString(),
      });
    }
    switch (action) {
      case "pix-create": {
        const value = amount(
          input.amount,
          5,
          Math.min(2500, session.preferences.depositLimit),
        );
        const id = "PIX-DEMO-" + randomBytes(4).toString("hex").toUpperCase();
        deposit = {
          id,
          amount: value,
          code: `DEMONSTRACAO-SEM-COBRANCA:${id}`,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
          state: "pending" as const,
        };
        session.pendingDeposits.unshift(deposit);
        break;
      }
      case "pix-confirm": {
        deposit = session.pendingDeposits.find((item) => item.id === input.id);
        if (!deposit) throw new Error("Depósito não encontrado.");
        if (deposit.state !== "paid") {
          if (Date.parse(deposit.expiresAt) < Date.now())
            throw new Error(
              "Este código expirou. Gere outro depósito demonstrativo.",
            );
          ledger("deposit", deposit.amount, deposit.id);
          deposit.state = "paid";
        }
        break;
      }
      case "pix-withdraw": {
        const value = amount(input.amount, 10, session.balance);
        if (String(input.key || "").length < 5)
          throw new Error("Confira a chave Pix.");
        ledger(
          "withdrawal",
          -value,
          "SAQUE-DEMO-" + randomBytes(4).toString("hex"),
        );
        break;
      }
      case "bet-place": {
        const value = amount(input.stake);
        if (
          !Array.isArray(input.picks) ||
          input.picks.length < 1 ||
          input.picks.length > 30
        )
          throw new Error("Selecione de 1 a 30 palpites.");
        const picks = input.picks.map((pick) => canonicalPick(pick));
        if (picks.some((pick) => !pick))
          throw new Error("Um dos mercados está indisponível.");
        const valid = picks.filter((pick) => pick !== undefined);
        if (new Set(valid.map((pick) => pick.eventId)).size !== valid.length)
          throw new Error(
            "Escolha apenas um palpite por jogo para a múltipla.",
          );
        const odds =
          Math.round(valid.reduce((all, pick) => all * pick.odd, 1) * 100) /
          100;
        ticket = {
          id: "DEMO-" + randomBytes(4).toString("hex").toUpperCase(),
          picks: valid,
          stake: value,
          odds,
          potential: Math.min(1000000, Math.round(value * odds * 100) / 100),
          createdAt: new Date().toISOString(),
          status: "open",
        };
        ledger("bet", -value, ticket.id);
        session.tickets.unshift(ticket);
        break;
      }
      case "bet-cancel":
      case "bet-cashout": {
        ticket = session.tickets.find((item) => item.id === input.id);
        if (!ticket || ticket.status !== "open")
          throw new Error(
            "Esta aposta já foi encerrada ou não foi encontrada.",
          );
        ticket.status = action === "bet-cancel" ? "cancelled" : "cashout";
        ticket.returnAmount =
          Math.round(ticket.stake * (action === "bet-cancel" ? 100 : 80)) / 100;
        ledger(
          action === "bet-cancel" ? "refund" : "cashout",
          ticket.returnAmount,
          ticket.id,
        );
        break;
      }
      case "update-preferences": {
        const values = input.preferences as Record<string, unknown>;
        for (const key of ["showBalance", "alertWins", "alertFree"] as const)
          if (typeof values?.[key] === "boolean")
            session.preferences[key] = values[key];
        if (values?.depositLimit !== undefined)
          session.preferences.depositLimit = amount(
            values.depositLimit,
            5,
            2500,
          );
        if (
          ["auto", "America/Sao_Paulo", "America/Manaus", "UTC"].includes(
            String(values?.timeZone),
          )
        )
          session.preferences.timeZone = String(values.timeZone);
        if ([0, 5, 15, 30, 60, 120].includes(Number(values?.inactivity)))
          session.preferences.inactivity = Number(values.inactivity);
        break;
      }
      case "update-contact": {
        if (
          !timingSafeEqual(
            scryptSync(String(input.password || ""), current.salt, 64),
            Buffer.from(current.password, "hex"),
          )
        )
          throw new Error("Confira a senha atual da conta local.");
        const email = String(input.email || current.email)
          .trim()
          .toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          throw new Error("Informe um e-mail válido.");
        const existing = store
          .prepare("SELECT id FROM users WHERE email=? AND id<>?")
          .get(email, user.id);
        if (existing) throw new Error("Este e-mail já possui uma conta local.");
        store
          .prepare("UPDATE users SET email=? WHERE id=?")
          .run(email, user.id);
        session.user!.email = email;
        session.user!.username = email.split("@")[0];
        if (input.phone !== undefined)
          session.profile = {
            ...session.profile,
            phone: String(input.phone).slice(0, 30),
          };
        break;
      }
      case "update-password": {
        if (
          !timingSafeEqual(
            scryptSync(String(input.current || ""), current.salt, 64),
            Buffer.from(current.password, "hex"),
          )
        )
          throw new Error("Confira a senha atual da conta local.");
        const next = String(input.next || "");
        if (next.length < 6 || next.length > 30 || next !== input.confirm)
          throw new Error(
            "Informe a mesma nova senha de 6 a 30 caracteres nos dois campos.",
          );
        const salt = randomBytes(16).toString("hex");
        store
          .prepare("UPDATE users SET password=?,salt=? WHERE id=?")
          .run(scryptSync(next, salt, 64).toString("hex"), salt, user.id);
        store
          .prepare("DELETE FROM sessions WHERE user_id=? AND token<>?")
          .run(user.id, token!);
        break;
      }
      case "revoke-sessions":
        store
          .prepare("DELETE FROM sessions WHERE user_id=? AND token<>?")
          .run(user.id, token!);
        break;
      case "update-address": {
        const address = input.address as Record<string, unknown>;
        session.profile = {
          ...session.profile,
          address: Object.fromEntries(
            [
              "postalCode",
              "street",
              "number",
              "complement",
              "district",
              "city",
              "state",
              "country",
            ].map((key) => [
              key,
              String(address?.[key] || "")
                .trim()
                .slice(0, 150),
            ]),
          ),
        };
        break;
      }
      case "update-profile": {
        const name = String(input.name || "").trim();
        if (name.length < 2) throw new Error("Informe seu nome.");
        store.prepare("UPDATE users SET name=? WHERE id=?").run(name, user.id);
        session.user!.name = name;
        break;
      }
      default:
        throw new Error("Operação indisponível.");
    }
    const response: DemoResponse = { session, ticket, deposit };
    store
      .prepare("UPDATE users SET state=? WHERE id=?")
      .run(JSON.stringify(session), user.id);
    if (operation)
      store
        .prepare("INSERT INTO operations VALUES(?,?,?)")
        .run(operation, user.id, JSON.stringify(response));
    store.exec("COMMIT");
    return response;
  } catch (error) {
    store.exec("ROLLBACK");
    throw error;
  }
}
