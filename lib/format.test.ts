import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats pence as pounds", () => {
    expect(formatPrice(250)).toBe("£2.50");
    expect(formatPrice(400, "gbp")).toBe("£4.00");
    expect(formatPrice(1)).toBe("£0.01");
  });

  it("handles other currencies", () => {
    expect(formatPrice(1000, "eur")).toBe("€10.00");
  });
});
