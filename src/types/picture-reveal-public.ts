import type {
  PictureRevealSessionMode,
  PictureRevealSpecialPattern,
} from "./picture-reveal";

export interface PublicPictureRevealGameSummary {
  id: string;
  title: string;
  description: string | null;
  coverImagePath: string | null;
  mode: PictureRevealSessionMode;
  startScore: number;
  openTilePenalty: number;
  specialTilePenalty: number;
  imageWidth: number;
  imageHeight: number;
  updatedAt: string;
  imageCount: number;
}

export interface PublicPictureRevealPlayableImage {
  id: string;
  imagePath: string;
  answer: string;
  rows: number;
  cols: number;
  totalTiles: number;
  specialTileCount: number;
  specialPattern: PictureRevealSpecialPattern;
}

export interface PublicPictureRevealGameDetail
  extends PublicPictureRevealGameSummary {
  images: PublicPictureRevealPlayableImage[];
}
