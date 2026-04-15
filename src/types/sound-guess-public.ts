export interface PublicSoundGuessGameSummary {
  id: string;
  title: string;
  description: string | null;
  coverImagePath: string | null;
  imageWidth: number;
  imageHeight: number;
  updatedAt: string;
  soundCount: number;
}

export interface PublicSoundGuessPlayableSound {
  id: string;
  audioPath: string;
  imagePath: string | null;
  answer: string;
  audioStartMs: number;
  audioEndMs: number | null;
  sortOrder: number;
}

export interface PublicSoundGuessGameDetail
  extends PublicSoundGuessGameSummary {
  sounds: PublicSoundGuessPlayableSound[];
}
