import type {
  PictureRevealGameStatus,
  PictureRevealSessionMode,
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

export interface PictureRevealImageDto {
  id: string;
  gameId: string;
  imagePath: string;
  originalImagePath: string | null;
  answer: string;
  rows: number;
  cols: number;
  specialTileCount: number;
  specialPattern: PictureRevealSpecialPattern;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
