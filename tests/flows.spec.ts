import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readdirSync } from "node:fs";
import path from "node:path";
import snapshot from "../src/data/sports-events.json";

const sample = snapshot.find((event) => event.id === "66887172")!;
const market = sample.markets.find(
  (market) => market.name === "Resultado Final",
)!;
const pick = {
  eventId: sample.id,
  marketId: market.id,
  selectionId: market.options[0].id,
  odd: 99999,
};
async function post(
  api: APIRequestContext,
  data: Record<string, unknown>,
  status = 200,
) {
  const response = await api.post("/api/demo", { data });
  expect(response.status()).toBe(status);
  return response.json();
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("brasa-consent", "necessary"),
  );
});

test("saldo e bilhetes são validados no servidor e operações repetidas não duplicam créditos", async ({
  request,
}) => {
  await post(request, { action: "bet-place", picks: [pick], stake: 1 }, 400);
  const account = await post(request, { action: "demo" });
  expect(account.session.balance).toBe(0);
  await post(request, { action: "pix-create", amount: 4 }, 400);
  const operationId = randomUUID();
  const first = await post(request, {
    action: "pix-create",
    amount: 20,
    operationId,
  });
  const second = await post(request, {
    action: "pix-create",
    amount: 20,
    operationId,
  });
  expect(second.deposit.id).toBe(first.deposit.id);
  await post(request, { action: "pix-confirm", id: first.deposit.id });
  const confirmed = await post(request, {
    action: "pix-confirm",
    id: first.deposit.id,
  });
  expect(confirmed.session.balance).toBe(20);
  expect(confirmed.session.transactions).toHaveLength(1);
  const betId = randomUUID(),
    bet = await post(request, {
      action: "bet-place",
      picks: [pick],
      stake: 2,
      operationId: betId,
    });
  expect(bet.ticket.odds).toBe(market.options[0].odd);
  expect(bet.session.balance).toBe(18);
  const replay = await post(request, {
    action: "bet-place",
    picks: [pick],
    stake: 2,
    operationId: betId,
  });
  expect(replay.session.balance).toBe(18);
  expect(replay.session.tickets).toHaveLength(1);
  await post(
    request,
    { action: "bet-place", picks: [pick, pick], stake: 1 },
    400,
  );
  const cancel = await post(request, {
    action: "bet-cancel",
    id: bet.ticket.id,
  });
  expect(cancel.session.balance).toBe(20);
  const oldReplay = await post(request, {
    action: "bet-place",
    picks: [pick],
    stake: 2,
    operationId: betId,
  });
  expect(oldReplay.session.balance).toBe(20);
  expect(oldReplay.ticket.status).toBe("cancelled");
  await post(request, { action: "bet-cancel", id: bet.ticket.id }, 400);
  await post(
    request,
    { action: "pix-withdraw", amount: 21, key: "demo-ficticio" },
    400,
  );
  const withdrawn = await post(request, {
    action: "pix-withdraw",
    amount: 10,
    key: "demo-ficticio",
    keyType: "Aleatória",
    operationId: randomUUID(),
  });
  expect(withdrawn.session.balance).toBe(10);
  const cashoutBet = await post(request, {
    action: "bet-place",
    picks: [pick],
    stake: 2,
  });
  const cashed = await post(request, {
    action: "bet-cashout",
    id: cashoutBet.ticket.id,
  });
  expect(cashed.session.balance).toBe(9.6);
  await post(request, { action: "bet-cashout", id: cashoutBet.ticket.id }, 400);
  const crossOrigin = await request.post("/api/demo", {
    data: { action: "pix-confirm", id: first.deposit.id },
    headers: { Origin: "https://invalid.example" },
  });
  expect(crossOrigin.status()).toBe(403);
  await post(request, { action: "logout" });
  const guest = await request.get("/api/demo");
  expect((await guest.json()).session.user).toBeNull();
});

test("cadastro, depósito fictício, aposta, cancelamento e login persistem após recarregar", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const email = `qa-flow-${randomUUID()}@demo.local`,
    password = "ContaFicticia2026!";
  await page.goto("/");
  await page.getByRole("button", { name: "Registre-se", exact: true }).click();
  const registration = page.getByRole("dialog", {
    name: "Registre-se",
    exact: true,
  });
  await registration
    .getByRole("textbox", { name: "Nome completo", exact: true })
    .fill("Visitante de Teste");
  await registration
    .getByRole("textbox", { name: "Endereço de e-mail", exact: true })
    .fill(email);
  await registration.getByLabel("Senha", { exact: true }).fill(password);
  await registration.getByRole("checkbox").check();
  await registration
    .getByRole("button", { name: "Registre-se", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Minha conta", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Saldo e depósito", exact: true })
    .click();
  const pix = page.getByRole("dialog", { name: "Pix", exact: true });
  await pix.getByRole("button", { name: "20", exact: true }).click();
  await pix.getByRole("button", { name: "Gerar Pix", exact: true }).click();
  await expect(pix.getByText("DEMO", { exact: true })).toBeVisible();
  await pix
    .getByRole("button", { name: "Simular pagamento", exact: true })
    .click();
  await pix.getByRole("button", { name: "Entendi", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saldo e depósito", exact: true }),
  ).toContainText("20,00");
  await page.locator('[data-event="66887172"] .odd').first().click();
  const slip = page.getByRole("complementary", {
    name: "Bilhete de apostas",
    exact: true,
  });
  await slip
    .getByRole("textbox", { name: "Valor da aposta", exact: true })
    .fill("2");
  await slip.getByRole("button", { name: /Fazer aposta/ }).click();
  await expect(page.locator("#toast")).toHaveText("Bilhete registrado.");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(slip).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Saldo e depósito", exact: true }),
  ).toContainText("18,00");
  const betsReady = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/demo" &&
      response.request().method() === "GET" &&
      response.ok(),
  );
  await page.goto("/minhas-apostas");
  await betsReady;
  await page.locator(".mb-head").first().click();
  await page
    .getByRole("button", { name: "Cancelar aposta", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Saldo e depósito", exact: true }),
  ).toContainText("20,00");
  await page.getByRole("link", { name: "Resolvidas", exact: true }).click();
  await expect(page.locator(".mb-card")).toContainText("Cancelada");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Minha conta", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await page.getByRole("button", { name: "Minha conta", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Minha conta", exact: true })
    .getByRole("button", { name: "Sair", exact: true })
    .click();
  await page
    .locator(".account-actions")
    .getByRole("button", { name: "Login", exact: true })
    .click();
  const login = page.getByRole("dialog", { name: "Login", exact: true });
  await login
    .getByRole("textbox", { name: "Usuário ou endereço de e-mail" })
    .fill(email);
  await login.getByLabel("Senha", { exact: true }).fill(password);
  await login.getByRole("button", { name: "Login", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saldo e depósito", exact: true }),
  ).toContainText("20,00");
});

test("Criar Aposta agrupa seleções do mesmo jogo e permite remover uma perna", async ({
  page,
}) => {
  await page.goto("/evento/66887172");
  await page.getByRole("button", { name: "Criar Aposta", exact: true }).click();
  await page
    .locator(".market-group")
    .filter({
      has: page.locator("summary>span", { hasText: /^Resultado Final/ }),
    })
    .first()
    .getByRole("button", { name: /Coritiba —/ })
    .click();
  const both = page
    .locator(".market-group")
    .filter({
      has: page.locator("summary>span", {
        hasText: /^Ambas as Equipes Marcam$/,
      }),
    })
    .first();
  await both.locator("summary").click();
  await both.getByRole("button", { name: /Sim —/ }).click();
  const builder = page.locator(".betslip .slip-builder");
  await expect(builder.locator(".slip-builder-selection")).toHaveCount(2);
  await builder
    .getByRole("button", { name: "Remover Sim", exact: true })
    .click();
  await expect(builder.locator(".slip-builder-selection")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".demo-slip-reopen")).toBeVisible();
  await page.locator(".demo-slip-reopen button").click();
  await expect(page.locator(".betslip .slip-builder-selection")).toHaveCount(1);
});

test("cassino possui busca, categorias, paginação e jogo demonstrativo", async ({
  page,
}) => {
  await page.goto("/cassino/todos");
  await expect(page.locator(".casino-local-grid .bcc-g")).toHaveCount(24);
  await expect(
    page.locator(".casino-local-grid .bcc-game-launch").first(),
  ).toBeVisible();
  const first = await page
    .locator(".casino-local-grid .bcc-g")
    .first()
    .getAttribute("title");
  await page.getByRole("link", { name: "Próxima página", exact: true }).click();
  await expect(page).toHaveURL(/pagina=2/);
  await expect(
    page.locator(".casino-local-grid .bcc-g").first(),
  ).not.toHaveAttribute("title", first!);
  await page.getByRole("link", { name: "Novidades", exact: true }).click();
  await expect(page.locator(".casino-local-grid .bcc-g")).toHaveCount(8);
  await page
    .getByRole("searchbox", { name: "Buscar jogos", exact: true })
    .fill("Fortune Dragon");
  await page
    .getByRole("searchbox", { name: "Buscar jogos", exact: true })
    .press("Enter");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("Fortune Dragon");
  await page
    .getByRole("link", { name: "Abrir Fortune Dragon", exact: true })
    .first()
    .click();
  await expect(page.locator(".casino-play")).toBeVisible();
  await page
    .getByRole("button", { name: "Girar demonstração", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Girar demonstração", exact: true }),
  ).toBeEnabled();
  await page.getByRole("link", { name: "‹ Cassino", exact: true }).click();
  await expect(page).toHaveURL(/\/cassino$/);
});

test("layout móvel, busca esportiva e favoritos ao vivo funcionam", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByRole("searchbox", { name: "Pesquisar", exact: true })
    .fill("Coritiba");
  await expect(
    page.locator(".search-local .reference-event").first(),
  ).toBeVisible();
  await page.goto("/ao-vivo");
  await page.locator(".live-row .live-favorite").first().click();
  await page.getByRole("link", { name: /Favoritos/ }).click();
  await expect(page.locator(".live-row")).toHaveCount(1);
});

test("todas as páginas físicas e parâmetros conhecidos respondem sem erro", async ({
  request,
}) => {
  function visit(dir: string, relative = ""): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
      item.isDirectory()
        ? visit(path.join(dir, item.name), relative + "/" + item.name)
        : item.name === "page.tsx"
          ? [relative || "/"]
          : [],
    );
  }
  const routes = visit(path.join(process.cwd(), "src/app")).filter(
    (route) => !route.includes("["),
  );
  routes.push(
    "/evento/66887172",
    "/cassino/provedor/PGSOFT",
    "/cassino/jogo/PGSOFT%3A126",
    "/esportes/football?pagina=2",
    "/cassino/todos?pagina=2",
  );
  for (const route of routes) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    const body = await response.text();
    expect(body, route).toContain("BrasaBet");
  }
});

test("alterações da conta exigem senha e revogam sessões antigas", async ({
  request,
  playwright,
}) => {
  const email = `qa-security-${randomUUID()}@demo.local`,
    password = "SenhaFicticia2026!",
    next = "OutraSenhaFicticia2026!";
  await post(request, {
    action: "register",
    name: "Pessoa de Teste",
    email,
    password,
  });
  const other = await playwright.request.newContext({
    baseURL: String(test.info().project.use.baseURL),
  });
  await post(other, { action: "login", email, password });
  await post(
    request,
    { action: "update-password", current: "errada", next, confirm: next },
    400,
  );
  await post(request, {
    action: "update-password",
    current: password,
    next,
    confirm: next,
  });
  expect((await (await other.get("/api/demo")).json()).session.user).toBeNull();
  await post(other, { action: "login", email, password }, 400);
  await post(other, { action: "login", email, password: next });
  const address = await post(request, {
    action: "update-address",
    address: {
      postalCode: "00000-000",
      street: "Rua de Demonstração",
      number: "10",
      district: "Centro",
      city: "Cidade Exemplo",
      state: "CE",
    },
  });
  expect(address.session.profile.address.city).toBe("Cidade Exemplo");
  const updatedEmail = `qa-updated-${randomUUID()}@demo.local`;
  await post(
    request,
    { action: "update-contact", email: updatedEmail, password: "errada" },
    400,
  );
  await post(request, {
    action: "update-contact",
    email: updatedEmail,
    password: next,
    phone: "(00) 00000-0000",
  });
  await post(other, { action: "logout" });
  await post(other, { action: "login", email: updatedEmail, password: next });
  await other.dispose();
});

test("páginas da conta salvam endereço e preferências pelo formulário", async ({
  page,
}) => {
  await page.request.post("/api/demo", { data: { action: "demo" } });
  await page.goto("/conta/endereco");
  for (const [name, value] of [
    ["CEP", "00000-000"],
    ["Rua", "Rua Exemplo"],
    ["Número", "10"],
    ["Bairro", "Centro"],
    ["Cidade", "Cidade Fictícia"],
  ])
    await page.getByRole("textbox", { name, exact: true }).fill(value);
  await page
    .getByRole("combobox", { name: "Estado", exact: true })
    .selectOption("CE");
  await page
    .getByRole("button", { name: "Salvar endereço", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Alterações salvas.");
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Cidade", exact: true }),
  ).toHaveValue("Cidade Fictícia");
  await page
    .locator(".me-nav")
    .getByRole("link", { name: "Preferências", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Máximo de Inatividade", exact: true })
    .selectOption("15");
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Máximo de Inatividade", exact: true }),
  ).toHaveValue("15");
});
