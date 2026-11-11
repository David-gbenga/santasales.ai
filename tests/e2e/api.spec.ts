import { expect, test } from "@playwright/test";

// API guards, safe against production: every request here is refused, so
// nothing is charged, generated or stored.

const RANDOM_ID = "00000000-0000-4000-8000-000000000000";

test.describe("API routes refuse bad or unauthorised requests", () => {
  test("checkout rejects unknown items and client prices", async ({ request }) => {
    const bad = await request.post("/api/checkout", { data: { kind: "product", productId: "nope" } });
    expect(bad.status()).toBe(400);
    expect(await bad.json()).toHaveProperty("error");

    const oldPayFirst = await request.post("/api/checkout", { data: { kind: "lyrics", input: {} } });
    expect(oldPayFirst.status()).toBe(400);
  });

  test("previews validate their input", async ({ request }) => {
    const res = await request.post("/api/preview", { data: { kind: "card", input: {} } });
    expect(res.status()).toBe(400);
  });

  test("generation needs a real generation", async ({ request }) => {
    for (const path of ["/api/generate/card", "/api/generate/lyrics"]) {
      const res = await request.post(path, { data: { action: "generate", generationId: RANDOM_ID } });
      expect([404, 400]).toContain(res.status());
    }
  });

  test("downloads need a paid order", async ({ request }) => {
    const res = await request.get(`/api/download/${RANDOM_ID}`);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("cron and admin endpoints need their secret or an admin", async ({ request }) => {
    expect((await request.get("/api/admin/summary")).status()).toBe(401);
    expect((await request.post("/api/admin/summary")).status()).toBe(401);
    expect((await request.get("/api/cron/retention")).status()).toBe(401);
    const wrong = await request.get("/api/cron/retention", {
      headers: { authorization: "Bearer wrong-secret-value-123456" },
    });
    expect(wrong.status()).toBe(401);
  });

  test("the webhook refuses unsigned events", async ({ request }) => {
    const res = await request.post("/api/stripe/webhook", {
      data: { type: "checkout.session.completed" },
      headers: { "stripe-signature": "t=1,v1=bad" },
    });
    expect(res.status()).toBe(400);
  });

  test("tracking accepts only known events", async ({ request }) => {
    const res = await request.post("/api/track", { data: { type: "steal_data", path: "/" } });
    expect(res.status()).toBe(400);
  });
});
