// Read-only validation. Only login/logout mutate sessions; no bets, charges,
// withdrawals, cashouts, registrations or profile changes are issued.
const fs = require("node:fs");
const assert = require("node:assert/strict");
if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
const origin = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const checks = [];
let cookie = "";
async function read(name, path, method = "GET", body) {
  const response = await fetch(origin + path, {
    method, headers: { Accept: "application/json", Origin: origin,
      ...(cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const value = await response.json();
  checks.push({ name, status: response.status, cache: response.headers.get("cache-control") });
  assert.equal(response.status, 200, name + ": " + String(value.error || "HTTP " + response.status));
  assert.match(response.headers.get("cache-control") || "", /no-store/);
  if (name === "login") {
    assert.ok(!JSON.stringify(value).match(/"(token|password|refresh_token)"\s*:\s*"/));
    assert.match(response.headers.get("set-cookie") || "", /HttpOnly/i);
    cookie = response.headers.get("set-cookie").split(";")[0];
  }
  return value;
}
(async () => {
  const config = await read("environment", "/api/environment");
  assert.equal(config.runtime.mode, "backoffice");
  assert.equal(Boolean(config.runtime.branding), process.env.BACKOFFICE_BRANDING !== "clone");
  await read("grade", "/api/backoffice/api/v3/app/grid-events/100001/1");
  await read("cassino", "/api/backoffice/api/casino/available-games?page=1&per_page=2");
  await read("regulamento sanitizado", "/api/resources/regulation");
  if (process.env.BACKOFFICE_TEST_USERNAME && process.env.BACKOFFICE_TEST_PASSWORD) {
    await read("login", "/api/actions", "POST", {
      action: "login", email: process.env.BACKOFFICE_TEST_USERNAME, password: process.env.BACKOFFICE_TEST_PASSWORD,
    });
    const session = await read("sessão e saldo", "/api/session");
    assert.equal(session.session.user.level, "online");
    const history = await read("histórico", "/api/resources/bets?page=1");
    if (history.tickets[0]) await read("comprovante", "/api/backoffice/api/tickets/bet/" + history.tickets[0].id, "POST", {});
    await read("extrato", "/api/resources/transactions");
    for (const [label, tab] of [["depósitos", "deposits"], ["saques", "withdrawals"], ["jogadas", "casino-plays"]])
      await read("extrato de " + label, "/api/resources/transactions?tab=" + tab);
    await read("contador de apostas", "/api/backoffice/api/online/quantity-opened-bets");
    await read("logout", "/api/actions", "POST", { action: "logout" });
  }
  fs.mkdirSync("evidence/local", { recursive: true });
  fs.writeFileSync("evidence/local/backoffice-readonly.json", JSON.stringify({ passed: true, checks }, null, 2));
  console.log(JSON.stringify({ passed: true, checks }, null, 2));
})().catch((error) => {
  console.error("Validação interrompida: " + error.message);
  process.exitCode = 1;
});
