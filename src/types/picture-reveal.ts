export const pictureRevealGameStatuses = ["draft", "published"] as const;
export type PictureRevealGameStatus =
  (typeof pictureRevealGameStatuses)[number];

export const pictureRevealSessionModes = ["single", "marathon"] as const;
export type PictureRevealSessionMode =
  (typeof pictureRevealSessionModes)[number];

export const pictureRevealSessionStatuses = ["active", "completed"] as const;
export type PictureRevealSessionStatus =
  (typeof pictureRevealSessionStatuses)[number];

export const pictureRevealRoundOutcomes = [
  "pending",
  "correct",
  "wrong",
] as const;
export type PictureRevealRoundOutcome =
  (typeof pictureRevealRoundOutcomes)[number];

export const pictureRevealSpecialPatterns = [
  "plus",
  "diagonal",
  "ring",
  "wide-plus",
] as const;
export type PictureRevealSpecialPattern =
  (typeof pictureRevealSpecialPatterns)[number];

export interface PictureRevealChoiceSnapshot {
  id: string;
  label: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface PictureRevealImageSnapshot {
  id: string;
  imagePath: string;
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

export interface PictureRevealTileState {
  number: number;
  isOpened: boolean;
}

export interface PictureRevealChoiceOption {
  id: string;
  label: string;
}

export interface PictureRevealRoundView {
  id: string;
  roundIndex: number;
  outcome: PictureRevealRoundOutcome;
  imagePath: string;
  rows: number;
  cols: number;
  tiles: PictureRevealTileState[];
  choices: PictureRevealChoiceOption[];
  openedTileNumbers: number[];
  guessedChoiceId: string | null;
  correctChoiceId: string | null;
  roundScore: number | null;
}

export interface PictureRevealSessionView {
  id: string;
  gameId: string;
  mode: PictureRevealSessionMode;
  status: PictureRevealSessionStatus;
  currentScore: number;
  finalScore: number | null;
  roundCount: number;
  currentRound: PictureRevealRoundView | null;
  completedRounds: PictureRevealRoundView[];
}
