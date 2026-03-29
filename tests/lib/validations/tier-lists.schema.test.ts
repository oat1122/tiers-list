import { describe, expect, it } from "vitest";
import {
  CreateTierListSchema,
  UpdateTierListSchema,
} from "@/lib/validations/tier-lists.schema";

describe("CreateTierListSchema", () => {
  it("accepts a valid payload and applies defaults", () => {
    const result = CreateTierListSchema.safeParse({
      title: "My Tier List",
      description: "A ranked list",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      title: "My Tier List",
      description: "A ranked list",
      isPublic: 0,
      isTemplate: 0,
    });
  });

  it("coerces numeric flags from strings", () => {
    const result = CreateTierListSchema.safeParse({
      title: "My Tier List",
      isPublic: "1",
      isTemplate: "0",
    });

    expect(result.success).toBe(true);
    expect(result.data?.isPublic).toBe(1);
    expect(result.data?.isTemplate).toBe(0);
  });

  it("rejects an empty title", () => {
    const result = CreateTierListSchema.safeParse({
      title: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.title).toBeTruthy();
  });
});

describe("UpdateTierListSchema", () => {
  it("accepts an empty object for partial updates", () => {
    const result = UpdateTierListSchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      isPublic: 0,
      isTemplate: 0,
    });
  });
});

