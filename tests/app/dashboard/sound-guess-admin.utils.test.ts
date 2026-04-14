import { describe, expect, it } from "vitest";
import {
  buildSoundGuessContentDefaults,
  buildSoundGuessCreatePayload,
  buildSoundGuessSettingsPayload,
  countSoundGuessGamesByStatus,
  extractSoundGuessApiError,
  filterSoundGuessGames,
  normalizeSoundGuessContentForSubmit,
} from "@/app/dashboard/sound-guess/_components/sound-guess-admin.utils";
import type {
  SoundGuessGameContentDto,
  SoundGuessGameSummaryDto,
} from "@/types/sound-guess-admin";

function createGame(
  overrides: Partial<SoundGuessGameSummaryDto> = {},
): SoundGuessGameSummaryDto {
  return {
    id: "game-1",
    userId: "user-1",
    title: "Animal Sounds",
    description: "Guess the sound",
    coverImagePath: null,
    status: "draft",
    imageWidth: 1600,
    imageHeight: 900,
    soundCount: 2,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

function createContent(): SoundGuessGameContentDto {
  return {
    id: "game-1",
    userId: "user-1",
    title: "Animal Sounds",
    description: "Guess the sound",
    coverImagePath: "/uploads/sound-guess/covers/cover.webp",
    status: "draft",
    imageWidth: 1600,
    imageHeight: 900,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    deletedAt: null,
    sounds: [
      {
        id: "sound-1",
        gameId: "game-1",
        audioPath: "/uploads/sound-guess/audio/cat.mp3",
        imagePath: "/uploads/sound-guess/sound-images/cat.webp",
        answer: "Cat",
        audioStartMs: 1000,
        audioEndMs: 3000,
        sortOrder: 4,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
        deletedAt: null,
      },
    ],
  };
}

describe("sound-guess-admin.utils", () => {
  it("filters games by keyword and status", () => {
    const games = [
      createGame(),
      createGame({
        id: "game-2",
        title: "Movie SFX",
        description: "Guess the film sound",
        status: "published",
      }),
      createGame({
        id: "game-3",
        title: "Music Quiz",
        description: "Opening notes",
      }),
    ];

    expect(filterSoundGuessGames(games, "movie", "all").map((game) => game.id))
      .toEqual(["game-2"]);
    expect(
      filterSoundGuessGames(games, "", "published").map((game) => game.id),
    ).toEqual(["game-2"]);
  });

  it("counts draft and published games", () => {
    const counts = countSoundGuessGamesByStatus([
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

  it("builds normalized create and settings payloads", () => {
    expect(
      buildSoundGuessCreatePayload({
        title: "  Animal Sounds  ",
        description: "  Guess it  ",
      }),
    ).toEqual({
      title: "Animal Sounds",
      description: "Guess it",
      status: "draft",
    });

    expect(
      buildSoundGuessSettingsPayload({
        title: "  Updated  ",
        description: "  New copy  ",
        status: "published",
      }),
    ).toEqual({
      title: "Updated",
      description: "New copy",
      status: "published",
    });
  });

  it("builds content defaults and normalizes sort order on submit", () => {
    const defaults = buildSoundGuessContentDefaults(createContent());

    expect(defaults.coverImagePath).toBe("/uploads/sound-guess/covers/cover.webp");
    expect(defaults.imageWidth).toBe(1600);
    expect(defaults.imageHeight).toBe(900);
    expect(defaults.sounds[0]?.answer).toBe("Cat");
    expect(defaults.sounds[0]?.imagePath).toBe(
      "/uploads/sound-guess/sound-images/cat.webp",
    );
    expect(defaults.sounds[0]?.audioStartMs).toBe(1000);
    expect(defaults.sounds[0]?.audioEndMs).toBe(3000);
    expect(defaults.sounds[0]?.sortOrder).toBe(0);

    const normalized = normalizeSoundGuessContentForSubmit({
      coverImagePath: defaults.coverImagePath,
      coverTempUploadPath: null,
      imageWidth: defaults.imageWidth,
      imageHeight: defaults.imageHeight,
      sounds: [
        {
          id: "sound-2",
          audioPath: "/uploads/sound-guess/audio/dog.mp3",
          imagePath: null,
          answer: "  Dog  ",
          audioStartMs: 0,
          audioEndMs: null,
          sortOrder: 9,
        },
        {
          tempAudioPath: "/uploads/sound-guess/audio/temp/cat.mp3",
          tempImagePath: "/uploads/sound-guess/sound-images/temp/cat.webp",
          answer: "  Cat  ",
          audioStartMs: 500,
          audioEndMs: 1500,
          sortOrder: 4,
        },
      ],
    });

    expect(normalized.sounds).toEqual([
      expect.objectContaining({ answer: "Dog", sortOrder: 0 }),
      expect.objectContaining({
        answer: "Cat",
        tempImagePath: "/uploads/sound-guess/sound-images/temp/cat.webp",
        audioStartMs: 500,
        audioEndMs: 1500,
        sortOrder: 1,
      }),
    ]);
  });

  it("extracts string and flattened zod API errors", () => {
    expect(extractSoundGuessApiError({ error: "Forbidden" })).toBe(
      "Forbidden",
    );
    expect(
      extractSoundGuessApiError({
        error: {
          formErrors: [],
          fieldErrors: { title: ["Title is required"] },
        },
      }),
    ).toBe("Title is required");
  });
});
