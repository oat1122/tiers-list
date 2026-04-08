import { afterEach, describe, expect, it, vi } from "vitest";
import {
  awardLeaderboardPoints,
  buildHostRounds,
  createTileStates,
  normalizeWinnerName,
} from "@/app/picture-reveal/[id]/_components/picture-reveal-play-client.utils";
import type { PublicPictureRevealGameDetail } from "@/types/picture-reveal-public";

function createGame(
  overrides: Partial<PublicPictureRevealGameDetail> = {},
): PublicPictureRevealGameDetail {
  return {
    id: "game-1",
    title: "Guess the Animal",
    description: "Host-run picture reveal",
    mode: "marathon",
    startScore: 1000,
    openTilePenalty: 50,
    specialTilePenalty: 200,
    imageWidth: 1080,
    imageHeight: 1080,
    updatedAt: "2026-04-04T12:00:00.000Z",
    imageCount: 2,
    images: [
      {
        id: "image-1",
        imagePath: "/uploads/cat.webp",
        answer: "Cat",
        rows: 2,
        cols: 2,
        totalTiles: 4,
        specialTileCount: 1,
        specialPattern: "plus",
      },
      {
        id: "image-2",
        imagePath: "/uploads/dog.webp",
        answer: "Dog",
        rows: 3,
        cols: 3,
        totalTiles: 9,
        specialTileCount: 2,
        specialPattern: "ring",
      },
    ],
    ...overrides,
  };
}

describe("picture reveal play client utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds host rounds from the playable images", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const rounds = buildHostRounds(createGame());

    expect(rounds).toHaveLength(2);
    expect(rounds.map((round) => round.image.id)).toEqual(["image-2", "image-1"]);
    expect(rounds[0]).toMatchObject({
      roundIndex: 0,
      currentScore: 1000,
      answerRevealed: false,
      isCompleted: false,
      awardedTo: null,
      awardedScore: 0,
    });
    expect(rounds[0]?.specialTileNumbers).toEqual([2, 3]);
    expect(rounds[1]?.specialTileNumbers).toEqual([2]);
  });

  it("creates tile state objects from opened tile numbers", () => {
    expect(createTileStates(4, [2, 4])).toEqual([
      { number: 1, isOpened: false },
      { number: 2, isOpened: true },
      { number: 3, isOpened: false },
      { number: 4, isOpened: true },
    ]);
  });

  it("normalizes winner names before storing them", () => {
    expect(normalizeWinnerName("  Alice   Bob  ")).toBe("Alice Bob");
  });

  it("awards and sorts leaderboard scores by normalized names", () => {
    const firstAward = awardLeaderboardPoints([], "  Alice  ", 700);
    const updated = awardLeaderboardPoints(firstAward, "alice", 100);
    const withSecondPlayer = awardLeaderboardPoints(updated, "Bob", 900);

    expect(withSecondPlayer).toEqual([
      {
        key: "bob",
        name: "Bob",
        score: 900,
      },
      {
        key: "alice",
        name: "alice",
        score: 800,
      },
    ]);
  });
});
