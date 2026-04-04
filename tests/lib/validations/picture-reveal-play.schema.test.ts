import { describe, expect, it } from "vitest";
import {
  GuessPictureRevealChoiceSchema,
  OpenPictureRevealTileSchema,
  PictureRevealSessionListQuerySchema,
} from "@/lib/validations/picture-reveal-play.schema";

describe("OpenPictureRevealTileSchema", () => {
  it("coerces tile numbers from strings", () => {
    const result = OpenPictureRevealTileSchema.safeParse({ tileNumber: "7" });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ tileNumber: 7 });
  });
});

describe("GuessPictureRevealChoiceSchema", () => {
  it("rejects empty choice ids", () => {
    const result = GuessPictureRevealChoiceSchema.safeParse({ choiceId: "" });

    expect(result.success).toBe(false);
  });
});

describe("PictureRevealSessionListQuerySchema", () => {
  it("applies the default limit", () => {
    const result = PictureRevealSessionListQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ limit: 20 });
  });
});
