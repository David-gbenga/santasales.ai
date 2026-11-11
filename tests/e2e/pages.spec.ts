import { expect, test } from "@playwright/test";

// Smoke tests safe to run against production: they read pages and call APIs
// with bad input only. Nothing is bought, generated or stored.

const PAGES = [
  { path: "/", heading: /Intentional words and songs/ },
  { path: "/shop", heading: /./ },
  { path: "/gallery", heading: /./ },
  { path: "/cards", heading: /A card for every occasion/ },
  { path: "/lyrics", heading: /A song written just for them/ },
  { path: "/terms", heading: "Terms of service" },
  { path: "/privacy", heading: "Privacy notice" },
  { path: "/refunds", heading: "Refunds" },
  { path: "/disclosure", heading: "Affiliate disclosure" },
  { path: "/admin/login", heading: "Admin sign in" },
];

for (const { path, heading } of PAGES) {
  test(`${path} loads with its heading`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  });
}

test("unknown pages show the friendly 404", async ({ page }) => {
  const response = await page.goto("/no-such-page-here");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/isn’t here/);
});

test("footer links reach every legal page", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("navigation", { name: "The small print" });
  for (const name of ["Terms", "Privacy", "Refunds", "Affiliate disclosure"]) {
    await expect(footer.getByRole("link", { name })).toHaveAttribute("href", /^\/(terms|privacy|refunds|disclosure)$/);
  }
});

test("a shop product page shows a price and a buy button", async ({ page }) => {
  await page.goto("/shop");
  const first = page.locator('a[href^="/shop/"]').first();
  test.skip((await first.count()) === 0, "no products listed");
  await first.click();
  await expect(page).toHaveURL(/\/shop\/[a-z0-9-]+$/);
  await expect(page.getByText(/£\d+\.\d{2}/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /buy/i })).toBeVisible();
});

test("gallery links open the other shop in a new tab", async ({ page }) => {
  await page.goto("/gallery");
  const links = page.locator('a[target="_blank"][href^="https://"]');
  test.skip((await links.count()) === 0, "no gallery items");
  await expect(links.first()).toHaveAttribute("rel", /noopener/);
});

test("card form filters designs by occasion and offers anonymous sending", async ({ page }) => {
  await page.goto("/cards");
  const occasion = page.getByLabel("What’s the card for?");
  await expect(page.getByLabel("Send anonymously")).toBeVisible();
  await occasion.selectOption("christmas");
  const christmas = await page.locator('input[name="design"]').count();
  await occasion.selectOption("valentines");
  const valentines = await page.locator('input[name="design"]').count();
  expect(christmas).toBeGreaterThan(0);
  expect(valentines).toBeGreaterThan(0);
});

test("song form shows a price for each length", async ({ page }) => {
  await page.goto("/lyrics");
  for (const price of ["£2.99", "£3.49", "£3.99"]) {
    await expect(page.getByText(price, { exact: false }).first()).toBeVisible();
  }
});

test("admin pages need a signed-in admin", async ({ page }) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("an expired sign-in link explains what happened", async ({ page }) => {
  await page.goto("/?error=access_denied&error_code=otp_expired");
  await expect(page).toHaveURL(/\/admin\/login\?error=link-expired/);
  await expect(page.getByText("That sign-in link has expired")).toBeVisible();
});
