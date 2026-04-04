import { describe, expect, it } from "vitest";
import {
  buildPictureRevealContentDefaults,
  countPictureRevealGamesByStatus,
  filterPictureRevealGames,
  normalizePictureRevealContentInput,
} from "@/app/dashboard/picture-reveal/_components/picture-reveal-admin.utils";
import type {
  PictureRevealGameContentDto,
  PictureRevealGameSummaryDto,
} from "@/types/picture-reveal-admin";

function createGame(
  overrides: Partial<PictureRevealGameSummaryDto> = {},
): PictureRevealGameSummaryDto {
  return {
    id: "game-1",
    userId: "user-1",
    title: "Anime Reveal",
    description: "Guess the hidden anime poster",
    status: "draft",
    mode: "single",
    startScore: 1000,
    openTilePenalty: 50,
    specialTilePenalty: 200,
    imageCount: 2,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

function createContent(): PictureRevealGameContentDto {
  return {
    id: "game-1",
    userId: "user-1",
    title: "Anime Reveal",
    description: "Guess the hidden anime poster",
    status: "draft",
    mode: "single",
    startScore: 1000,
    openTilePenalty: 50,
    specialTilePenalty: 200,
    imageWidth: 1600,
    imageHeight: 1600,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    deletedAt: null,
    images: [
      {
        id: "image-1",
        gameId: "game-1",
        imagePath: "/uploads/anime-1.png",
        rows: 4,
        cols: 6,
        specialTileCount: 1,
        specialPattern: "ring",
        sortOrder: 0,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
        deletedAt: null,
        choices: [
          {
            id: "choice-1",
            imageId: "image-1",
            label: "Naruto",
            isCorrect: 1,
            sortOrder: 0,
            createdAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
            deletedAt: null,
          },
          {
            id: "choice-2",
            imageId: "image-1",
            label: "Bleach",
            isCorrect: 0,
            sortOrder: 1,
            createdAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
            deletedAt: null,
          },
        ],
      },
    ],
  };
}

describe("picture-reveal-admin.utils", () => {
  it("filters games by keyword and status", () => {
    const games = [
      createGame(),
      createGame({
        id: "game-2",
        title: "Movie Reveal",
        description: "Guess the hidden film",
        status: "published",
      }),
      createGame({
        id: "game-3",
        title: "Sports Reveal",
        description: "Guess the player",
      }),
    ];

    expect(
      filterPictureRevealGames(games, "movie", "all").map((game) => game.id),
    ).toEqual(["game-2"]);
    expect(
      filterPictureRevealGames(games, "", "published").map((game) => game.id),
    ).toEqual(["game-2"]);
  });

  it("counts draft and published games", () => {
    const counts = countPictureRevealGamesByStatus([
      createGame(),
      createGame({ id: "game-2", status: "published" }),
      createGame({ id: "game-3", status: "published" }),
    ]);

    expect(counts).toEqual({
      total: 3,
      draft: 1,
      published: 2,
    });
  });

  it("builds defaults from content dto and normalizes sort order on submit", () => {
    const defaults = buildPictureRevealContentDefaults(createContent());

    expect(defaults.imageWidth).toBe(1600);
    expect(defaults.imageHeight).toBe(1600);
    expect(defaults.images[0]?.choices[0]?.label).toBe("Naruto");
    const normalized = normalizePictureRevealContentInput({
      imageWidth: "1920",
      imageHeight: "1920",
      images: [
        {
          ...defaults.images[0],
          rows: "5",
          cols: "7",
          specialTileCount: "2",
          choices: [
            {
              ...defaults.images[0]!.choices[0]!,
              label: "  Naruto  ",
              sortOrder: "4",
            },
            {
              ...defaults.images[0]!.choices[1]!,
              sortOrder: "9",
            },
          ],
          sortOrder: "8",
        },
      ],
    });

    expect(normalized.imageWidth).toBe(1920);
    expect(normalized.imageHeight).toBe(1920);
    expect(normalized.images[0]).toMatchObject({
      rows: 5,
      cols: 7,
      specialTileCount: 2,
      sortOrder: 0,
      choices: [
        { label: "Naruto", sortOrder: 0 },
        { sortOrder: 1 },
      ],
    });
  });
});
