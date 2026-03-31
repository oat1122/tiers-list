import { describe, expect, it } from "vitest";
import { UpdateTierItemSchema } from "@/lib/validations/tier-items.schema";

describe("UpdateTierItemSchema", () => {
  it("accepts an empty object without materializing defaults", () => {
    const result = UpdateTierItemSchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data).toEqual({});
  });

  it("keeps label-only updates partial", () => {
    const result = UpdateTierItemSchema.safeParse({ label: "Updated" });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ label: "Updated" });
  });
});
