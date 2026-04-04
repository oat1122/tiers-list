import type {
  PictureRevealGameStatus,
  PictureRevealSessionMode,
  PictureRevealSessionStatus,
  PictureRevealSpecialPattern,
} from "./picture-reveal";

export interface PictureRevealGameSummaryDto {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: PictureRevealGameStatus;
  mode: PictureRevealSessionMode;
  startScore: number;
  openTilePenalty: number;
  specialTilePenalty: number;
  imageWidth: number;
  imageHeight: number;
  imageCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PictureRevealImageChoiceDto {
  id: string;
  imageId: string;
  label: string;
  isCorrect: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PictureRevealImageDto {
  id: string;
  gameId: string;
  imagePath: string;
  originalImagePath: string | null;
  rows: number;
  cols: number;
  specialTileCount: number;
  specialPattern: PictureRevealSpecialPattern;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  choices: PictureRevealImageChoiceDto[];
}

export interface PictureRevealGameContentDto {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: PictureRevealGameStatus;
  mode: PictureRevealSessionMode;
  startScore: number;
  openTilePenalty: number;
  specialTilePenalty: number;
  imageWidth: number;
  imageHeight: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  images: PictureRevealImageDto[];
}

export interface PictureRevealSessionHistoryDto {
  id: string;
  gameId: string;
  title: string;
  mode: PictureRevealSessionMode;
  status: PictureRevealSessionStatus;
  currentScore: number;
  finalScore: number | null;
  roundCount: number;
  correctRounds: number;
  wrongRounds: number;
  createdAt: string;
  completedAt: string | null;
}
