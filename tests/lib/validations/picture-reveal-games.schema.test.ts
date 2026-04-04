import { describe, expect, it } from "vitest";
import {
  CreatePictureRevealGameSchema,
  SavePictureRevealGameContentSchema,
} from "@/lib/validations/picture-reveal-games.schema";

describe("CreatePictureRevealGameSchema", () => {
  it("applies default draft game settings", () => {
    const result = CreatePictureRevealGameSchema.safeParse({
      title: "Animals",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      title: "Animals",
      status: "draft",
      mode: "single",
      startScore: 1000,
      openTilePenalty: 50,
      specialTilePenalty: 200,
    });
  });
});

describe("SavePictureRevealGameContentSchema", () => {
  it("accepts a valid image config with exactly one correct choice", () => {
    const result = SavePictureRevealGameContentSchema.safeParse({
      imageWidth: 1600,
      imageHeight: 1600,
      images: [
        {
          tempImagePath: "/uploads/picture-reveal/temp/cat.webp",
          rows: 4,
          cols: 4,
          specialTileCount: 2,
          specialPattern: "plus",
          choices: [
            { label: "Cat", isCorrect: 1 },
            { label: "Dog", isCorrect: 0 },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.images[0].choices).toHaveLength(2);
  });

  it("rejects content without a single correct answer", () => {
    const result = SavePictureRevealGameContentSchema.safeParse({
      imageWidth: 1600,
      imageHeight: 900,
      images: [
        {
          imagePath: "/uploads/picture-reveal/cat.webp",
          rows: 4,
          cols: 4,
          specialTileCount: 2,
          specialPattern: "plus",
          choices: [
            { label: "Cat", isCorrect: 1 },
            { label: "Dog", isCorrect: 1 },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("คำตอบ");
  });

  it("rejects special tile counts that fill the whole board", () => {
    const result = SavePictureRevealGameContentSchema.safeParse({
      imageWidth: 1600,
      imageHeight: 900,
      images: [
        {
          imagePath: "/uploads/picture-reveal/cat.webp",
          rows: 2,
          cols: 2,
          specialTileCount: 4,
          specialPattern: "ring",
          choices: [
            { label: "Cat", isCorrect: 1 },
            { label: "Dog", isCorrect: 0 },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("special tiles");
  });

  it("rejects image sizes outside the allowed bounds", () => {
    const result = SavePictureRevealGameContentSchema.safeParse({
      imageWidth: 80,
      imageHeight: 900,
      images: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("100 px");
  });
});
