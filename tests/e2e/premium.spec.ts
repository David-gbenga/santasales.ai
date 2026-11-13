import { expect, test } from "@playwright/test";

// GiftPost Premium smoke tests, safe against production: they only read
// pages and submit forms with invalid input. No account is created, no
// email is sent and nothing is bought. The full flows (sign-up, Stripe
// test-mode subscription, renewal, failure, cancellation, allowance) are
// covered by the scripted test-mode runs described in docs/SUBSCRIPTIONS.md.

const PAGES = [
  { path: "/premium", heading: "GiftPost Premium" },
  { path: "/signup", heading: "Create an account" },
  { path: "/login", heading: "Sign in" },
  { path: "/forgot-password", heading: "Reset your password" },
];

for (const { path, heading } of PAGES) {
  test(`${path} loads with its heading`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  });
}

test("Premium shows price, renewal and allowance before sign-up", async ({ page }) => {
  await page.goto("/premium");
  const main = page.locator("main");
  await expect(main).toContainText("£25.00");
  await expect(main).toContainText("every 30 days");
  await expect(main).toContainText("Renews automatically until you cancel.");
  await expect(main).toContainText("15 personal songs");
  await expect(main).toContainText("30 personal cards");
  await expect(main).toContainText("10 voice greetings");
  await expect(page.getByRole("link", { name: "Create an account to subscribe" })).toHaveAttribute("href", "/signup");
  await expect(page.getByRole("link", { name: "Premium terms" })).toHaveAttribute("href", "/terms#premium");
});

test("terms explain the membership, renewal and cancelling", async ({ page }) => {
  await page.goto("/terms#premium");
  // The id sits on the heading; check the section around it.
  const section = page.locator("section", { has: page.locator("#premium") });
  await expect(section).toContainText("renews automatically every 30 days");
  await expect(section).toContainText("Cancelling.");
  await expect(section).toContainText("14-day right to cancel");
});

test("My account sends signed-out visitors to sign in", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
});

test("guest checkout copy still needs no account", async ({ page }) => {
  await page.goto("/cards");
  await expect(page.getByRole("button", { name: "Write my card (free preview)" })).toBeVisible();
});

test("sign-in form refuses a wrong password without revealing accounts", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email address").fill("nobody-here@example.com");
  await page.getByLabel("Password").fill("not-the-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("That email and password don't match an account.");
  await expect(page.getByLabel("Email address")).toHaveValue("nobody-here@example.com");
});

test("sign-up form rejects a short password on the server", async ({ page }) => {
  await page.goto("/signup");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Your name").fill("Smoke Test");
  await page.getByLabel("Email address").fill("smoke-test@example.com");
  await page.getByLabel("Password").fill("short");
  await page.locator("input[name=password]").evaluate((el) => el.removeAttribute("minlength"));
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("Use at least 10 characters");
});

test("sign-in ignores off-site redirect targets", async ({ page }) => {
  await page.goto("/login?next=https://evil.example");
  await expect(page.locator("input[name=next]")).toHaveValue("/account");
});
