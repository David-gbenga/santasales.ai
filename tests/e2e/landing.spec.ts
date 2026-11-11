import { expect, test } from "@playwright/test";

test("landing page shows headline and CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Make a card" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Write a song" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse the shop" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "See the gallery" }).first()).toBeVisible();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("shows the static fallback and no 3D canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('img[src="/hero-fallback.svg"]')).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});

test("CTAs are reachable by keyboard", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard check runs on desktop");
  await page.goto("/");
  const reached = new Set<string>();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const name = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    reached.add(name);
  }
  expect(reached).toContain("Make a card");
  expect(reached).toContain("Browse the shop");
});
