import type {
  PictureRevealImageSnapshot,
  PictureRevealSpecialPattern,
} from "@/types/picture-reveal";

export interface PictureRevealQueueCandidate {
  id: string;
}

const FIRST_TILE_NUMBER = 1;

/**
 * Returns a shuffled copy of the provided items without mutating caller state.
 *
 * @param items - Ordered items that should be randomized for gameplay.
 * @returns A new array containing the same items in random order.
 */
export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

/**
 * Builds the image id queue for a host run.
 *
 * @param images - Candidate images available to the picture reveal game.
 * @param mode - Game mode that decides whether one image or every image is queued.
 * @param lastPlayedImageId - Previously played image id, avoided in single mode when possible.
 * @returns Ordered image ids for the next run.
 */
export function createImageQueue<T extends PictureRevealQueueCandidate>(
  images: T[],
  mode: string,
  lastPlayedImageId: string | null,
): string[] {
  if (mode === "single") {
    const candidates =
      lastPlayedImageId && images.length > 1
        ? images.filter((image) => image.id !== lastPlayedImageId)
        : images;

    return [shuffleArray(candidates)[0].id];
  }

  return shuffleArray(images.map((image) => image.id));
}

/**
 * Resolves relative row and column offsets for a special tile pattern.
 *
 * @param pattern - Special tile pattern configured for the image.
 * @returns Coordinate offsets that should open around the selected tile.
 */
function getPatternOffsets(pattern: PictureRevealSpecialPattern) {
  switch (pattern) {
    case "plus":
      return [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const;
    case "diagonal":
      return [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ] as const;
    case "ring":
      return [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ] as const;
    case "wide-plus":
      return [
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 2],
      ] as const;
    default:
      return [] as const;
  }
}

/**
 * Converts a one-based tile number into a zero-based grid coordinate.
 *
 * @param tileNumber - One-based tile number selected by the host.
 * @param cols - Number of columns in the image grid.
 * @returns Zero-based row and column for the tile.
 */
function toGridPosition(tileNumber: number, cols: number) {
  const zeroBased = tileNumber - FIRST_TILE_NUMBER;
  return {
    row: Math.floor(zeroBased / cols),
    col: zeroBased % cols,
  };
}

/**
 * Converts a zero-based grid coordinate into the public one-based tile number.
 *
 * @param row - Zero-based row in the image grid.
 * @param col - Zero-based column in the image grid.
 * @param cols - Number of columns in the image grid.
 * @returns One-based tile number used by the host UI.
 */
function toTileNumber(row: number, col: number, cols: number) {
  return row * cols + col + FIRST_TILE_NUMBER;
}

/**
 * Finds the extra tiles opened when a special tile is selected.
 *
 * @param tileNumber - One-based tile number selected by the host.
 * @param imageSnapshot - Image grid and special pattern configuration.
 * @returns Sorted one-based tile numbers that should be auto-opened.
 */
export function getPatternRevealTileNumbers(
  tileNumber: number,
  imageSnapshot: PictureRevealImageSnapshot,
): number[] {
  const origin = toGridPosition(tileNumber, imageSnapshot.cols);
  const offsets = getPatternOffsets(imageSnapshot.specialPattern);
  const numbers = new Set<number>();

  for (const [rowOffset, colOffset] of offsets) {
    const nextRow = origin.row + rowOffset;
    const nextCol = origin.col + colOffset;

    if (
      nextRow < 0 ||
      nextCol < 0 ||
      nextRow >= imageSnapshot.rows ||
      nextCol >= imageSnapshot.cols
    ) {
      continue;
    }

    numbers.add(toTileNumber(nextRow, nextCol, imageSnapshot.cols));
  }

  return [...numbers].sort((left, right) => left - right);
}

/**
 * Picks unique one-based tile numbers for special tile placement.
 *
 * @param totalTiles - Total number of tiles in the image grid.
 * @param count - Number of unique special tiles to select.
 * @returns Sorted unique tile numbers for deterministic rendering.
 */
export function pickUniqueTileNumbers(
  totalTiles: number,
  count: number,
): number[] {
  return shuffleArray(
    Array.from(
      { length: totalTiles },
      (_value, index) => index + FIRST_TILE_NUMBER,
    ),
  )
    .slice(0, count)
    .sort((left, right) => left - right);
}
