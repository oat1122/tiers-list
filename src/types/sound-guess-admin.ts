import type { SoundGuessGameStatus } from "./sound-guess";

export interface SoundGuessGameSummaryDto {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverImagePath: string | null;
  status: SoundGuessGameStatus;
  imageWidth: number;
  imageHeight: number;
  soundCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SoundGuessSoundDto {
  id: string;
  gameId: string;
  audioPath: string;
  imagePath: string | null;
  answer: string;
  audioStartMs: number;
  audioEndMs: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SoundGuessGameContentDto {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverImagePath: string | null;
  status: SoundGuessGameStatus;
  imageWidth: number;
  imageHeight: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sounds: SoundGuessSoundDto[];
}
