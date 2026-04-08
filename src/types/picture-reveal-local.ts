import type {
  PictureRevealSessionMode,
  PictureRevealSpecialPattern,
} from "./picture-reveal";

export interface LocalPictureRevealAssetRef {
  assetId: string;
  fileName: string;
  mimeType: string;
  objectUrl: string | null;
}

export interface LocalPictureRevealImageDraft {
  id: string;
  answer: string;
  rows: number;
  cols: number;
  specialTileCount: number;
  specialPattern: PictureRevealSpecialPattern;
  sortOrder: number;
  image: LocalPictureRevealAssetRef | null;
  originalImage: LocalPictureRevealAssetRef | null;
}

export interface LocalPictureRevealDraft {
  id: string;
  title: string;
  description: string;
  mode: PictureRevealSessionMode;
  startScore: number;
  openTilePenalty: number;
  specialTilePenalty: number;
  imageWidth: number;
  imageHeight: number;
  cover: LocalPictureRevealAssetRef | null;
  images: LocalPictureRevealImageDraft[];
  updatedAt: string;
}
