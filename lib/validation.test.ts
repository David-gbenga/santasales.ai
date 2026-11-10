import { describe, expect, it } from "vitest";
import {
  cardInputSchema,
  checkoutMetadataSchema,
  checkoutRequestSchema,
  stripeSessionIdSchema,
} from "./validation";

const uuid = "28dea5a0-5949-4db1-a20f-acbe4f9dd055";

describe("checkoutRequestSchema", () => {
  it("accepts a product checkout", () => {
    expect(checkoutRequestSchema.safeParse({ kind: "product", productId: uuid }).success).toBe(
      true,
    );
  });

  it("ignores a client-sent price", () => {
    const parsed = checkoutRequestSchema.parse({
      kind: "product",
      productId: uuid,
      price_pence: 1,
    });
    expect(parsed).not.toHaveProperty("price_pence");
  });

  it("rejects bad ids and unknown kinds", () => {
    expect(
      checkoutRequestSchema.safeParse({ kind: "product", productId: "1 OR 1=1" }).success,
    ).toBe(false);
    expect(checkoutRequestSchema.safeParse({ kind: "free-stuff", productId: uuid }).success).toBe(
      false,
    );
    expect(checkoutRequestSchema.safeParse(null).success).toBe(false);
  });
});

describe("checkoutMetadataSchema", () => {
  it("requires a product id for product orders", () => {
    expect(checkoutMetadataSchema.safeParse({ kind: "product" }).success).toBe(false);
    expect(checkoutMetadataSchema.safeParse({ kind: "product", product_id: uuid }).success).toBe(
      true,
    );
  });
});

describe("stripeSessionIdSchema", () => {
  it("accepts Stripe session ids only", () => {
    expect(stripeSessionIdSchema.safeParse("cs_test_a1B2c3").success).toBe(true);
    expect(stripeSessionIdSchema.safeParse("cs_live_a1B2c3").success).toBe(true);
    expect(stripeSessionIdSchema.safeParse("pi_123").success).toBe(false);
    expect(stripeSessionIdSchema.safeParse("cs_test_<script>").success).toBe(false);
  });
});

describe("cardInputSchema", () => {
  const base = { recipientName: "Tom", senderName: "Mia", tone: "warm" };

  it("accepts a relationship with no description", () => {
    expect(cardInputSchema.safeParse({ ...base, relationship: "sibling" }).success).toBe(true);
  });

  it("accepts a description with no relationship", () => {
    const parsed = cardInputSchema.parse({
      ...base,
      relationship: "",
      details: "My brother moved to Canada this year.",
    });
    expect(parsed.relationship).toBeUndefined();
  });

  it("needs a relationship or a real description", () => {
    expect(cardInputSchema.safeParse({ ...base, relationship: "", details: "hi" }).success).toBe(
      false,
    );
  });

  it("caps the description at 500 characters and trims names", () => {
    expect(
      cardInputSchema.safeParse({ ...base, relationship: "friend", details: "x".repeat(501) })
        .success,
    ).toBe(false);
    expect(
      cardInputSchema.parse({ ...base, recipientName: "  Tom  ", relationship: "friend" })
        .recipientName,
    ).toBe("Tom");
  });
});
