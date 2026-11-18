import { test } from "node:test";
import assert from "node:assert/strict";
import { operations } from "../../src/lib/backoffice/catalogue";
import { normalizeHost, backendOrigin } from "../../src/server/backoffice/tenant";
import { authorizeOperation, matchOperation, panelCall, withoutSecrets } from "../../src/server/backoffice/http";
import { openSession, sealSession } from "../../src/server/backoffice/session";
import { fillTemplate, money } from "../../src/server/backoffice/adapters";
import { NextRequest } from "next/server";
import { assertSameOrigin } from "../../src/server/backoffice/request";
import type { Tenant } from "../../src/lib/backoffice/types";
import type { CallContext } from "../../src/server/backoffice/http";
import { action, registrationInput, sportsbookBody } from "../../src/server/backoffice/actions";
const tenant: Tenant = {
  site_id: "test", front_url: "a.test", base_url: "painel.a.test", complete_name: "Teste",
  status: "actived", custom_theme: {}, modules: ["bet", "casino", "online", "traditional", "loto", "scratchcard", "bet-builder", "cashout"],
};
const session = {
  token: "secret-upstream-jwt", level: "online" as const, tenantId: tenant.site_id, audience: tenant.base_url,
  userId: "123", expires: Date.now() + 60000,
};
const context: CallContext = { tenant, session, timezone: "America/Sao_Paulo" };

test("documented operations resolve to the exact method/path", () => {
  assert.equal(operations.length, 110);
  for (const operation of operations) {
    const concrete = operation.path.replace(/\{[^}]+\}/g, "123");
    assert.equal(matchOperation(operation.method, concrete).id, operation.id);
  }
});
test("rejects arbitrary hosts, traversal, encoded separators and legacy endpoints", () => {
  for (const path of ["//example.test/api/auth", "/api/../auth", "/api/%2e%2e/auth", "/api/auth?url=https://other.test",
    "/api/\\auth", "/seller/traditional/modality/1"]) {
    assert.throws(() => matchOperation("GET", path));
  }
  assert.throws(() => matchOperation("DELETE", "/bet/login"));
  assert.throws(() => backendOrigin({ ...tenant, base_url: "attacker.test/path" }));
  assert.throws(() => backendOrigin({ ...tenant, base_url: "a.test@attacker.test" }));
});
test("seller cannot call any online operation before upstream access", () => {
  for (const operation of operations.filter((operation) => operation.path.startsWith("/api/online/"))) {
    assert.throws(() => authorizeOperation({ ...context, session: { ...session, level: "cambista" } }, operation));
  }
  assert.throws(() => authorizeOperation(context, matchOperation("GET", "/api/bilhetes")));
});
test("authentication and module checks fail closed", () => {
  assert.throws(() => authorizeOperation({ ...context, session: null }, matchOperation("GET", "/api/online/account/balance")));
  assert.throws(() => authorizeOperation({ ...context, tenant: { ...tenant, modules: [] } }, matchOperation("POST", "/api/online/register-bet")));
});
test("encrypted session is opaque, tenant-bound, expiring and tamper-resistant", () => {
  process.env.BACKOFFICE_SESSION_SECRET = "unit-tests-only-secret-with-at-least-32-characters";
  const sealed = sealSession(session);
  assert.ok(!sealed.includes(session.token));
  assert.deepEqual(openSession(sealed, tenant), session);
  assert.equal(openSession(sealed, { ...tenant, site_id: "other" }), null);
  assert.equal(openSession(sealed, { ...tenant, base_url: "other.test" }), null);
  assert.equal(openSession(sealSession({ ...session, expires: 1 }), tenant), null);
  assert.equal(openSession("changed." + sealed, tenant), null);
});
test("responses cannot expose login, refresh or provider session tokens", () => {
  assert.deepEqual(withoutSecrets({ token: "jwt", nested: { refresh_token: "refresh", spr_session_token: "provider", name: "Player" } }),
    { nested: { name: "Player" } });
});
test("all mutations require a same-origin request", () => {
  assert.throws(() => assertSameOrigin(new NextRequest("https://a.test/api/actions", { method: "POST" })));
  assert.throws(() => assertSameOrigin(new NextRequest("https://a.test/api/actions", { method: "POST", headers: { Origin: "https://other.test" } })));
  assert.doesNotThrow(() => assertSameOrigin(new NextRequest("https://a.test/api/actions", { method: "POST", headers: { Origin: "https://a.test" } })));
});
test("verified method differences are explicit; account writes are not used as reads", () => {
  assert.equal(matchOperation("PUT", "/api/online/informations").mutation, true);
  assert.equal(matchOperation("PUT", "/api/online/withdrawal-data").mutation, true);
  assert.equal(matchOperation("GET", "/api/online/can-withdraw").mutation, false);
});
test("templates preserve configured snake_case and reject missing fields", () => {
  assert.deepEqual(fillTemplate({ new_password: "$next", current_password: "$current" }, { next: "new", current: "old" }),
    { new_password: "new", current_password: "old" });
  assert.throws(() => fillTemplate({ amount: "$amount" }, {}));
  assert.equal(money("125.50", { version: 1 }), 125.5);
  assert.throws(() => money("invalid", { version: 1 }));
});
test("BFF forwards cookie-owned Bearer, does not cache, follows no redirects and never retries a POST", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(String(url), "https://painel.a.test/api/online/deposits");
    assert.equal(options?.cache, "no-store");
    assert.equal(options?.redirect, "error");
    assert.equal((options?.headers as Record<string, string>).Authorization, "Bearer " + session.token);
    assert.deepEqual(JSON.parse(String(options?.body)), { amount: 10 });
    return new Response(JSON.stringify({ error: "Limite excedido." }), { status: 422 });
  };
  try {
    await assert.rejects(panelCall(context, "POST", "/api/online/deposits", { body: { amount: 10 } }),
      { message: "Limite excedido.", status: 422 });
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});
test("host normalization follows the tenant resolution rules", () => {
  assert.equal(normalizeHost("https://www.A.TEST:443/path"), "a.test");
  assert.equal(normalizeHost("a.test:3000"), "a.test");
});
test("registration selects the documented fields and route for each tenant mode", () => {
  const input = {
    adult: true, name: "Pessoa de Teste", email: "teste@example.test", password: "example-pass",
    phone: "(11) 90000-0000", cpf: "000.000.000-00", username: "TESTE-NOME", partner: "CODE",
  };
  const standard = registrationInput("default", input);
  assert.equal(standard.path, "/api/online/register");
  assert.deepEqual(standard.body, {
    full_name: input.name, email: input.email, document: input.cpf, contact: input.phone,
    password: input.password, password_confirmation: input.password, partner: "CODE",
  });
  assert.equal(registrationInput("phone", input).username, "11900000000");
  assert.equal(registrationInput("username", input).username, "teste-nome");
  assert.throws(() => registrationInput("default", { ...input, adult: false }));
});
test("the sportsbook uses original builder odds and live limits in a mixed ticket", () => {
  const early = { eventId: "101", selectionId: "700", key: "a", odd: 2.9, originalOdd: 2.6, betType: "prematch" };
  const live = { eventId: "202", selectionId: "900", key: "b", odd: 1.7, betType: "live" };
  const settings = { prematch_active_bet: 1, live_active_bet: 1, allow_merged_bet: 1, live_min_value: 5, live_max_value: 80 };
  const picks = [{ kind: "builder", children: [early] }, live];
  assert.deepEqual(sportsbookBody({ picks, stake: 12.5 }, settings), {
    bet_mode: "multiple", multiple_amount: 12.5, builder: "latest",
    hunches: [
      { id: "a", event_id: 101, odd_id: "700", price: 2.6, bet_amount: 0, type: "prematch", mode: "builder" },
      { id: "b", event_id: 202, odd_id: "900", price: 1.7, bet_amount: 0, type: "live", mode: "default" },
    ],
  });
  assert.throws(() => sportsbookBody({ picks, stake: 2 }, settings), { code: "AMOUNT_OUT_OF_RANGE" });
  assert.throws(() => sportsbookBody({ picks, stake: 10 }, { ...settings, allow_merged_bet: 0 }));
});
test("deposit polling treats HTTP 400 as pending and refreshes balance only after confirmation", async () => {
  const fetch = globalThis.fetch;
  let checks = 0;
  let balances = 0;
  globalThis.fetch = async (url, options) => {
    const path = new URL(String(url)).pathname;
    if (path === "/api/check-payment") {
      assert.equal(options?.method, "POST");
      assert.deepEqual(JSON.parse(String(options?.body)), { key: 42 });
      return ++checks === 1 ? Response.json({ status: false }, { status: 400 })
        : Response.json({ status: true, type: "add_balance", px_value: "10.00" });
    }
    assert.equal(path, "/api/online/account/balance");
    balances++;
    return Response.json({ balance: "10.00", bonus: "0.00" });
  };
  try {
    assert.deepEqual((await action(context, { action: "pix-check", id: "42" })).data, { paid: false });
    assert.equal(balances, 0);
    const result = await action(context, { action: "pix-check", id: 42 });
    assert.deepEqual(result.data, { paid: true, amount: 10 });
    assert.equal(result.sessionPatch?.balance, 10);
    assert.equal(balances, 1);
  } finally { globalThis.fetch = fetch; }
});
test("withdrawal verifies limits and eligibility before changing the key and requesting Pix", async () => {
  const fetch = globalThis.fetch;
  const parametersFile = process.env.BACKOFFICE_PARAMETERS_FILE;
  delete process.env.BACKOFFICE_PARAMETERS_FILE;
  const mutations: Array<{ path: string; body: unknown }> = [];
  let eligible = false;
  globalThis.fetch = async (url, options) => {
    const path = new URL(String(url)).pathname;
    if (path.startsWith("/content/parameters/")) return Response.json({ settings: {} });
    if (path === "/api/online/config") return Response.json({
      withdrawal_mode: "pix", min_withdrawal_amount: 10, max_withdrawal_amount: 100, can_edit_pix: 1,
    });
    if (path === "/api/online/can-withdraw")
      return Response.json({ can_request: eligible ? "can-request" : "cant-request" });
    if (path === "/api/online/account/balance") return Response.json({ balance: 5, bonus: 0 });
    mutations.push({ path, body: JSON.parse(String(options?.body)) });
    return Response.json(path.endsWith("/withdrawal-data") ? { status: true } : { message: "Saque recebido." });
  };
  try {
    const input = { action: "pix-withdraw", amount: 12, key: "example@test.test", keyType: "E-mail" };
    await assert.rejects(action(context, { ...input, amount: 5 }), { code: "AMOUNT_OUT_OF_RANGE" });
    await assert.rejects(action(context, input), { code: "WITHDRAWAL_BLOCKED" });
    assert.deepEqual(mutations, []);
    eligible = true;
    assert.equal((await action(context, input)).sessionPatch?.balance, 5);
    assert.deepEqual(mutations, [
      { path: "/api/online/withdrawal-data", body: { pix_type: "email", pix_key: "example@test.test" } },
      { path: "/api/online/withdrawals", body: { amount: 12, type: "pix" } },
    ]);
  } finally {
    globalThis.fetch = fetch;
    if (parametersFile !== undefined) process.env.BACKOFFICE_PARAMETERS_FILE = parametersFile;
  }
});
test("demonstration-only mutations never reach the panel", async () => {
  const file = process.env.BACKOFFICE_CONTRACTS_FILE;
  const original = globalThis.fetch;
  let calls = 0;
  delete process.env.BACKOFFICE_CONTRACTS_FILE;
  globalThis.fetch = async () => { calls++; throw new Error("Network not allowed in this test"); };
  try {
    await assert.rejects(action(context, { action: "pix-confirm" }), { code: "CONTRACT_REQUIRED" });
    await assert.rejects(action(context, { action: "bet-cancel", id: 1 }), { code: "CONTRACT_REQUIRED" });
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
    if (file === undefined) delete process.env.BACKOFFICE_CONTRACTS_FILE;
    else process.env.BACKOFFICE_CONTRACTS_FILE = file;
  }
});
