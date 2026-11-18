import { test, expect } from "@playwright/test";
import liveSnapshot from "../src/data/sports-live.json";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("brasa-consent", "necessary"),
  );
});

test("Estat. abre o modal original e Ver mercados leva à partida correspondente", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.locator('[data-event="66887172"] .event-stats');
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Coritiba × Santos",
    exact: true,
  });
  await expect(
    dialog.getByRole("heading", { name: "Coritiba × Santos" }),
  ).toBeVisible();
  await expect(
    dialog.getByText(
      "Estatísticas detalhadas ainda não disponíveis para este jogo.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Entendi", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole("link", { name: "Ver mercados", exact: true }).click();
  await expect(page).toHaveURL(/\/evento\/66887172$/);
  await expect(page.locator(".match-header")).toContainText("Coritiba");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("estatísticas ao vivo mostram o placar e o mesmo modal cabe no celular", async ({
  page,
}) => {
  const sessionReady = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/demo" &&
      response.request().method() === "GET" &&
      response.ok(),
  );
  await page.goto("/ao-vivo");
  await sessionReady;
  const event = liveSnapshot.events.find(
    (event) => event.sport === "football",
  )!;
  await page.locator(".live-row .live-stats").first().click();
  const dialog = page.getByRole("dialog", {
    name: `${event.home} × ${event.away}`,
    exact: true,
  });
  await expect(dialog.locator(".statistics-score")).toHaveText(
    `${event.scores!.home} – ${event.scores!.away}`,
  );
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('[data-event="66887172"] .event-stats').click();
  const mobileDialog = page.getByRole("dialog", {
    name: "Coritiba × Santos",
    exact: true,
  });
  await expect(
    mobileDialog.getByRole("link", { name: "Ver mercados" }),
  ).toBeVisible();
  const box = await mobileDialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await mobileDialog
    .getByRole("button", { name: "Fechar", exact: true })
    .click();
  await expect(mobileDialog).toHaveCount(0);
});
