import { expect, test } from "@playwright/test";

// Full customer journeys (PRD J1, J3, J4). These call Claude and Stripe and
// leave a pending order and unpaid previews behind (the daily retention job
// removes previews after 30 days), so they only run when asked:
//
//   E2E_JOURNEYS=1 pnpm test:e2e journeys
//
// Use Stripe test mode. Each run uses 2 of the visitor's 5 daily previews.

test.skip(!process.env.E2E_JOURNEYS, "set E2E_JOURNEYS=1 to run the paid-API journeys");
test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

test("J1: buying a shop product opens Stripe Checkout", async ({ page }) => {
  await page.goto("/shop");
  await page.locator('a[href^="/shop/"]').first().click();
  await page.getByRole("button", { name: /buy/i }).click();
  await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 20_000 });
});

test("J3: a card preview shows the whole card, watermarked, with Pay", async ({ page }) => {
  await page.goto("/cards");
  await page.getByLabel("What’s the card for?").selectOption("birthday");
  await page.getByLabel("Their name").fill("Sam");
  await page.getByLabel("Your name").fill("Alex");
  await page.getByLabel("Describe the card in your own words").fill("Sam turns 40 and loves cycling.");
  await page.getByRole("button", { name: "Write my card (free preview)" }).click();
  await expect(page).toHaveURL(/\/cards\/[0-9a-f-]{36}$/);
  await expect(page.getByText("This is a free preview.")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("button", { name: /^Pay £/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Download/ })).toHaveCount(0);
});

test("J4: a song preview shows the lyrics and a sung sample", async ({ page }) => {
  await page.goto("/lyrics");
  await page.getByLabel("What’s the song for?").selectOption("birthday");
  await page.getByLabel("Who’s the song for?").fill("Sam");
  await page.getByLabel("Your name").fill("Alex");
  await page.getByLabel("Describe the song in your own words").fill("Sam turns 40 and loves cycling.");
  await page.getByRole("button", { name: "Write my song (free preview)" }).click();
  await expect(page).toHaveURL(/\/lyrics\/[0-9a-f-]{36}$/);
  await expect(page.getByText("This is a free preview.")).toBeVisible({ timeout: 60_000 });
  await expect(page.locator("audio")).toBeVisible({ timeout: 90_000 });
});
