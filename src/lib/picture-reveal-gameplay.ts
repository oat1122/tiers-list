import type {
  PictureRevealImageSnapshot,
  PictureRevealSpecialPattern,
} from "@/types/picture-reveal";

export interface PictureRevealQueueCandidate {
  id: string;
}

export function shuffleArray<T>(items: T[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

export function createImageQueue<T extends PictureRevealQueueCandidate>(
  images: T[],
  mode: string,
  lastPlayedImageId: string | null,
) {
  if (mode === "single") {
    const candidates =
      lastPlayedImageId && images.length > 1
        ? images.filter((image) => image.id !== lastPlayedImageId)
        : images;

    return [shuffleArray(candidates)[0].id];
  }

  return shuffleArray(images.map((image) => image.id));
}

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

function toGridPosition(tileNumber: number, cols: number) {
  const zeroBased = tileNumber - 1;
  return {
    row: Math.floor(zeroBased / cols),
    col: zeroBased % cols,
  };
}

function toTileNumber(row: number, col: number, cols: number) {
  return row * cols + col + 1;
}

export function getPatternRevealTileNumbers(
  tileNumber: number,
  imageSnapshot: PictureRevealImageSnapshot,
) {
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

export function pickUniqueTileNumbers(totalTiles: number, count: number) {
  return shuffleArray(
    Array.from({ length: totalTiles }, (_value, index) => index + 1),
  )
    .slice(0, count)
    .sort((left, right) => left - right);
}
