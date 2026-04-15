import type { PublicSoundGuessGameDetail } from "@/types/sound-guess-public";

export interface SoundGuessLeaderboardEntry {
  key: string;
  name: string;
  score: number;
}

export interface SoundGuessHostRound {
  id: string;
  roundIndex: number;
  sound: PublicSoundGuessGameDetail["sounds"][number];
  answerRevealed: boolean;
  isCompleted: boolean;
  awardedTo: string | null;
}

/**
 * Shuffles a copy of the provided items using Math.random.
 *
 * @param items - Items to shuffle without mutating the original array.
 * @returns New array with randomized item order.
 */
function shuffleItems<T>(items: T[]) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const currentItem = shuffledItems[index];
    const swapItem = shuffledItems[swapIndex];

    if (currentItem === undefined || swapItem === undefined) {
      continue;
    }

    shuffledItems[index] = swapItem;
    shuffledItems[swapIndex] = currentItem;
  }

  return shuffledItems;
}

/**
 * Creates a randomized host-run sound queue.
 *
 * @param game - Public sound guess detail rendered by the server page.
 * @returns Host rounds with one playable sound per round.
 */
export function buildSoundGuessHostRounds(
  game: PublicSoundGuessGameDetail,
): SoundGuessHostRound[] {
  const sortedSounds = [...game.sounds].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  return shuffleItems(sortedSounds).map((sound, roundIndex) => ({
    id: `${sound.id}-${roundIndex}`,
    roundIndex,
    sound,
    answerRevealed: false,
    isCompleted: false,
    awardedTo: null,
  }));
}

/**
 * Normalizes winner input so duplicate leaderboard names collapse consistently.
 *
 * @param value - Raw winner name typed by the host.
 * @returns Trimmed name with internal whitespace collapsed.
 */
export function normalizeWinnerName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Sorts leaderboard entries by score and then display name.
 *
 * @param entries - Leaderboard entries to sort.
 * @returns New leaderboard array sorted for display.
 */
export function sortLeaderboard(entries: SoundGuessLeaderboardEntry[]) {
  return [...entries].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.name.localeCompare(right.name, "th-TH");
  });
}

/**
 * Adds one point to a winner in the live leaderboard.
 *
 * @param entries - Existing leaderboard entries.
 * @param rawName - Winner name typed by the host.
 * @returns Sorted leaderboard with the winner inserted or incremented.
 */
export function awardSoundGuessPoint(
  entries: SoundGuessLeaderboardEntry[],
  rawName: string,
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
        score: 1,
      },
    ]);
  }

  return sortLeaderboard(
    entries.map((entry) =>
      entry.key === key
        ? {
            ...entry,
            name,
            score: entry.score + 1,
          }
        : entry,
    ),
  );
}
