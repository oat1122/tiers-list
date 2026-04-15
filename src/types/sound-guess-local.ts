export interface LocalSoundGuessAssetRef {
  assetId: string;
  fileName: string;
  mimeType: string;
  objectUrl: string | null;
}

export interface LocalSoundGuessSoundDraft {
  id: string;
  answer: string;
  audio: LocalSoundGuessAssetRef | null;
  image: LocalSoundGuessAssetRef | null;
  audioStartMs: number;
  audioEndMs: number | null;
  sortOrder: number;
}

export interface LocalSoundGuessDraft {
  id: string;
  title: string;
  description: string;
  imageWidth: number;
  imageHeight: number;
  cover: LocalSoundGuessAssetRef | null;
  sounds: LocalSoundGuessSoundDraft[];
  updatedAt: string;
}
