export const pictureRevealGameStatuses = ["draft", "published"] as const;
export type PictureRevealGameStatus =
  (typeof pictureRevealGameStatuses)[number];

export const pictureRevealSessionModes = ["single", "marathon"] as const;
export type PictureRevealSessionMode =
  (typeof pictureRevealSessionModes)[number];

export const pictureRevealSpecialPatterns = [
  "plus",
  "diagonal",
  "ring",
  "wide-plus",
] as const;
export type PictureRevealSpecialPattern =
  (typeof pictureRevealSpecialPatterns)[number];

export interface PictureRevealImageSnapshot {
  id: string;
  imagePath: string;
  answer: string;
  rows: number;
  cols: number;
  totalTiles: number;
  specialTileCount: number;
  specialPattern: PictureRevealSpecialPattern;
}

export interface PictureRevealGameSnapshot {
  title: string;
  description: string | null;
  status: PictureRevealGameStatus;
  mode: PictureRevealSessionMode;
  startScore: number;
  openTilePenalty: number;
  specialTilePenalty: number;
}
