import { describe, expect, it } from "vitest";
import {
  createImageQueue,
  getPatternRevealTileNumbers,
} from "@/lib/picture-reveal-gameplay";

describe("createImageQueue", () => {
  it("avoids repeating the last image in single mode when alternatives exist", () => {
    const queue = createImageQueue(
      [
        { id: "image-1", choices: [] },
        { id: "image-2", choices: [] },
      ] as never,
      "single",
      "image-1",
    );

    expect(queue).toEqual(["image-2"]);
  });

  it("keeps every image in marathon mode", () => {
    const queue = createImageQueue(
      [
        { id: "image-1", choices: [] },
        { id: "image-2", choices: [] },
        { id: "image-3", choices: [] },
      ] as never,
      "marathon",
      null,
    );

    expect(queue).toHaveLength(3);
    expect(new Set(queue)).toEqual(new Set(["image-1", "image-2", "image-3"]));
  });
});

describe("getPatternRevealTileNumbers", () => {
  it("reveals orthogonal neighbors for plus patterns", () => {
    const numbers = getPatternRevealTileNumbers(6, {
      id: "image-1",
      imagePath: "/uploads/picture-reveal/cat.webp",
      rows: 4,
      cols: 4,
      totalTiles: 16,
      specialTileCount: 1,
      specialPattern: "plus",
    });

    expect(numbers).toEqual([2, 5, 7, 10]);
  });

  it("clips ring patterns at the board edge", () => {
    const numbers = getPatternRevealTileNumbers(1, {
      id: "image-1",
      imagePath: "/uploads/picture-reveal/cat.webp",
      rows: 4,
      cols: 4,
      totalTiles: 16,
      specialTileCount: 1,
      specialPattern: "ring",
    });

    expect(numbers).toEqual([2, 5, 6]);
  });
});
