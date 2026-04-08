import {
  createImageQueue,
  pickUniqueTileNumbers,
} from "@/lib/picture-reveal-gameplay";
import type { PublicPictureRevealGameDetail } from "@/types/picture-reveal-public";

export interface PictureRevealTileState {
  number: number;
  isOpened: boolean;
}

export interface PictureRevealLeaderboardEntry {
  key: string;
  name: string;
  score: number;
}

export interface PictureRevealHostRound {
  id: string;
  roundIndex: number;
  image: PublicPictureRevealGameDetail["images"][number];
  specialTileNumbers: number[];
  openedTileNumbers: number[];
  currentScore: number;
  answerRevealed: boolean;
  isCompleted: boolean;
  awardedTo: string | null;
  awardedScore: number;
}

export function buildHostRounds(
  game: PublicPictureRevealGameDetail,
): PictureRevealHostRound[] {
  const imagesById = new Map(game.images.map((image) => [image.id, image]));
  const queue = createImageQueue(game.images, game.mode, null);

  return queue.map((imageId, roundIndex) => {
    const image = imagesById.get(imageId);

    if (!image) {
      throw new Error(`Missing image ${imageId} in picture reveal game.`);
    }

    return {
      id: `${image.id}-${roundIndex}`,
      roundIndex,
      image,
      specialTileNumbers: pickUniqueTileNumbers(
        image.totalTiles,
        image.specialTileCount,
      ),
      openedTileNumbers: [],
      currentScore: game.startScore,
      answerRevealed: false,
      isCompleted: false,
      awardedTo: null,
      awardedScore: 0,
    };
  });
}

export function createTileStates(
  totalTiles: number,
  openedTileNumbers: number[],
): PictureRevealTileState[] {
  const opened = new Set(openedTileNumbers);

  return Array.from({ length: totalTiles }, (_value, index) => ({
    number: index + 1,
    isOpened: opened.has(index + 1),
  }));
}

export function normalizeWinnerName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function awardLeaderboardPoints(
  entries: PictureRevealLeaderboardEntry[],
  rawName: string,
  points: number,
) {
  const name = normalizeWinnerName(rawName);

  if (!name) {
    return entries;
  }

  const key = name.toLocaleLowerCase("th-TH");
  const existing = entries.find((entry) => entry.key === key);

  if (!existing) {
    return sortLeaderboard([
      ...entries,
      {
        key,
        name,
        score: points,
      },
    ]);
  }

  return sortLeaderboard(
    entries.map((entry) =>
      entry.key === key
        ? {
            ...entry,
            name,
            score: entry.score + points,
          }
        : entry,
    ),
  );
}

export function sortLeaderboard(entries: PictureRevealLeaderboardEntry[]) {
  return [...entries].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.name.localeCompare(right.name, "th-TH");
  });
}
