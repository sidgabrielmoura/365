import { test, expect } from "@playwright/test";

test("confirmação do Pix mostra o valor pago e permite começar outro depósito", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("brasa-consent", "necessary"),
  );
  const account = await page.request.post("/api/demo", {
    data: { action: "demo" },
  });
  expect(account.ok()).toBeTruthy();
  await page.goto("/", { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Saldo e depósito", exact: true })
    .click();
  const pix = page.getByRole("dialog", { name: "Pix", exact: true });

  async function deposit(amount: number) {
    await pix
      .getByRole("textbox", { name: "Valor do depósito", exact: true })
      .fill(String(amount));
    await pix.getByRole("button", { name: "Gerar Pix", exact: true }).click();
    await expect(pix.getByText("DEMO", { exact: true })).toBeVisible();
    await pix
      .getByRole("button", { name: "Simular pagamento", exact: true })
      .click();
    await expect(
      pix.getByRole("heading", { name: "Depósito confirmado!", exact: true }),
    ).toBeVisible();
  }

  await deposit(10);
  const result = pix.locator('[data-wallet-result="deposit"]');
  await expect(result).toBeFocused();
  await expect(pix.locator(".bcpx-tabs")).toHaveCount(0);
  await expect(result.locator(".bcpx-result-amount")).toContainText("10,00");
  await expect(
    result.getByText(
      "Seu pagamento foi confirmado e o saldo já está disponível na carteira.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(pix.locator(".bcpx-bal")).toContainText("10,00");
  await expect(result.locator(".bcpx-result-check")).toHaveCSS(
    "animation-name",
    "bcpx-result-draw",
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(result.locator(".bcpx-result-check")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(result.locator(".bcpx-result-check")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await result
    .getByRole("button", { name: "Fazer outro depósito", exact: true })
    .click();
  await expect(
    pix.getByRole("tab", { name: "Depositar", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    pix.getByRole("textbox", { name: "Valor do depósito", exact: true }),
  ).toHaveValue("");

  await deposit(20);
  await expect(result.locator(".bcpx-result-amount")).toContainText("20,00");
  await expect(pix.locator(".bcpx-bal")).toContainText("30,00");
  await result.getByRole("button", { name: "Entendi", exact: true }).click();
  await expect(pix).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Saldo e depósito", exact: true }),
  ).toContainText("30,00");
});
