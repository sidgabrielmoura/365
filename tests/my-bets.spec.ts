import { test, expect, type APIRequestContext } from "@playwright/test";
import events from "../src/data/sports-events.json";

async function post(api: APIRequestContext, data: Record<string, unknown>) {
  const response = await api.post("/api/demo", { data });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

function pickFor(live = false) {
  const event = live
    ? events.find(
        (event) =>
          event.status === "live" &&
          event.markets.some(
            (market) =>
              market.name === "Resultado Final" &&
              market.options.some((option) => option.odd && option.odd > 1),
          ),
      )!
    : events.find((event) => event.id === "66887172")!;
  const market = event.markets.find(
    (market) => market.name === "Resultado Final",
  )!;
  const option = market.options.find((option) => option.odd && option.odd > 1)!;
  return { eventId: event.id, marketId: market.id, selectionId: option.id };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("brasa-consent", "necessary"),
  );
  await post(page.request, { action: "demo" });
});

test("Minhas Apostas segue o estado vazio original e preserva a aba ao recarregar", async ({
  page,
}) => {
  await page.goto("/minhas-apostas");
  const tabs = page.getByRole("navigation", { name: "Filtrar minhas apostas" });
  await expect(tabs.getByRole("link")).toHaveText([
    "Em Aberto",
    "Ao-Vivo",
    "Resolvidas",
  ]);
  await expect(
    tabs.getByRole("link", { name: "Em Aberto", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".mb-empty b")).toHaveText(
    "No momento, não existem apostas para serem exibidas",
  );
  await expect(page.locator(".mb-empty span")).toHaveText(
    "As apostas pendentes serão apresentadas aqui",
  );
  await expect(page.locator("#site-footer")).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Minhas Apostas", exact: true }),
  ).toHaveClass("sr-only");

  await tabs.getByRole("link", { name: "Ao-Vivo", exact: true }).click();
  await expect(page.locator(".mb-empty span")).toHaveText(
    "As apostas Ao-Vivo serão apresentadas aqui",
  );
  await tabs.getByRole("link", { name: "Resolvidas", exact: true }).click();
  await expect(page).toHaveURL(/\/minhas-apostas\?tab=settled$/);
  await page.reload();
  await expect(
    tabs.getByRole("link", { name: "Resolvidas", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".mb-empty span")).toHaveText(
    "As apostas resolvidas serão apresentadas aqui",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("cards recolhem, expandem, filtram apostas ao vivo e exibem cashout resolvido", async ({
  page,
}) => {
  const { deposit } = await post(page.request, {
    action: "pix-create",
    amount: 20,
  });
  await post(page.request, { action: "pix-confirm", id: deposit.id });
  await post(page.request, {
    action: "bet-place",
    picks: [pickFor()],
    stake: 2,
  });
  const { ticket: liveTicket } = await post(page.request, {
    action: "bet-place",
    picks: [pickFor(true)],
    stake: 2,
  });
  await page.goto("/minhas-apostas");
  await expect(page.locator(".mb-card")).toHaveCount(2);
  const scheduled = page
    .locator(".mb-item")
    .filter({ has: page.locator(".mb-summary", { hasText: "Coritiba" }) });
  const card = scheduled.locator(".mb-card");
  await expect(card).not.toHaveAttribute("open", "");
  await expect(card.locator(".mb-body")).toBeHidden();
  await card.locator(".mb-head").click();
  await expect(card.locator(".mb-body")).toBeVisible();
  await expect(
    card.getByRole("button", { name: "Compartilhar", exact: true }),
  ).toBeVisible();
  await expect(card.locator(".mb-totals")).toContainText("Retornos");

  const tabs = page.getByRole("navigation", { name: "Filtrar minhas apostas" });
  await tabs.getByRole("link", { name: "Ao-Vivo", exact: true }).click();
  await expect(page.locator(".mb-card")).toHaveCount(1);
  await expect(page.locator(".mb-card")).toHaveAttribute(
    "data-bet-id",
    liveTicket.id,
  );
  await page.locator(".mb-co").click();
  await expect(page.locator(".mb-co")).toContainText("Confirmar Encerramento");
  await page.locator(".mb-co").click();
  await expect(page.locator(".mb-empty")).toBeVisible();
  await tabs.getByRole("link", { name: "Resolvidas", exact: true }).click();
  await expect(page.locator(".mb-pill")).toHaveText("Encerrada");
  await page.locator(".mb-head").click();
  await expect(page.locator(".mb-result")).toContainText("R$1,60");
  await expect(page.locator(".mb-card")).toHaveCSS(
    "border-top-color",
    "rgb(255, 223, 27)",
  );
  await expect(page.locator(".mb-pill")).toHaveCSS(
    "background-color",
    "rgb(255, 223, 27)",
  );
  await expect(page.locator(".mb-result")).toHaveCSS(
    "background-color",
    "rgb(255, 223, 27)",
  );
  await expect(page.locator(".mb-fixture .team-logo")).toHaveCount(2);
  await expect(page.locator(".mb-totals")).toContainText("Retorno Total");
  await expect(page.locator(".mb-result")).toContainText("Aposta Encerrada");
  await expect(
    page.getByRole("button", { name: "Saldo e depósito", exact: true }),
  ).toContainText("17,60");
});
