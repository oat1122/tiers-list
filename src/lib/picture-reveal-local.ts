import { createEmptyImageDraft } from "@/app/dashboard/picture-reveal/_components/picture-reveal-admin.utils";
import type { PictureRevealContentFormState } from "@/lib/picture-reveal-content-form";
import {
  LocalPictureRevealDraftSchema,
  LocalPictureRevealPlayableDraftSchema,
} from "@/lib/validations";
import type { PublicPictureRevealGameDetail } from "@/types/picture-reveal-public";
import type {
  LocalPictureRevealAssetRef,
  LocalPictureRevealDraft,
  LocalPictureRevealImageDraft,
} from "@/types/picture-reveal-local";

export const LOCAL_PICTURE_REVEAL_DRAFT_ID = "current-picture-reveal-draft";

function createEmptyLocalImageDraft(sortOrder: number): LocalPictureRevealImageDraft {
  const draft = createEmptyImageDraft(sortOrder);

  return {
    id: draft.id ?? crypto.randomUUID(),
    answer: draft.answer,
    rows: draft.rows,
    cols: draft.cols,
    specialTileCount: draft.specialTileCount,
    specialPattern: draft.specialPattern,
    sortOrder,
    image: null,
    originalImage: null,
  };
}

export function createDefaultLocalPictureRevealDraft(): LocalPictureRevealDraft {
  return {
    id: LOCAL_PICTURE_REVEAL_DRAFT_ID,
    title: "My Picture Reveal",
    description: "",
    mode: "single",
    startScore: 1000,
    openTilePenalty: 50,
    specialTilePenalty: 200,
    imageWidth: 1080,
    imageHeight: 1080,
    cover: null,
    images: [createEmptyLocalImageDraft(0)],
    updatedAt: new Date().toISOString(),
  };
}

export function revokeLocalPictureRevealDraftUrls(
  draft: LocalPictureRevealDraft | null | undefined,
) {
  if (!draft) {
    return;
  }

  if (draft.cover?.objectUrl) {
    URL.revokeObjectURL(draft.cover.objectUrl);
  }

  draft.images.forEach((image) => {
    if (image.image?.objectUrl) {
      URL.revokeObjectURL(image.image.objectUrl);
    }

    if (image.originalImage?.objectUrl) {
      URL.revokeObjectURL(image.originalImage.objectUrl);
    }
  });
}

export function buildPictureRevealLocalContentFormValues(
  draft: LocalPictureRevealDraft,
): PictureRevealContentFormState {
  return {
    coverImagePath: draft.cover?.objectUrl ?? null,
    coverTempUploadPath: null,
    coverAssetId: draft.cover?.assetId ?? null,
    imageWidth: draft.imageWidth,
    imageHeight: draft.imageHeight,
    images: draft.images.map((image, index) => ({
      id: image.id,
      imagePath: image.image?.objectUrl ?? undefined,
      originalImagePath: image.originalImage?.objectUrl ?? undefined,
      tempImagePath: undefined,
      tempOriginalImagePath: undefined,
      imageAssetId: image.image?.assetId ?? null,
      originalImageAssetId: image.originalImage?.assetId ?? null,
      answer: image.answer,
      rows: image.rows,
      cols: image.cols,
      specialTileCount: image.specialTileCount,
      specialPattern: image.specialPattern,
      sortOrder: image.sortOrder ?? index,
    })),
  };
}

function normalizeAssetRef(
  assetId: string | null | undefined,
  objectUrl: string | null | undefined,
  fallbackAsset: LocalPictureRevealAssetRef | null,
): LocalPictureRevealAssetRef | null {
  if (!assetId) {
    return null;
  }

  if (fallbackAsset?.assetId === assetId) {
    return {
      ...fallbackAsset,
      objectUrl: objectUrl ?? fallbackAsset.objectUrl ?? null,
    };
  }

  return {
    assetId,
    fileName: fallbackAsset?.fileName ?? "picture-reveal.webp",
    mimeType: fallbackAsset?.mimeType ?? "image/webp",
    objectUrl: objectUrl ?? fallbackAsset?.objectUrl ?? null,
  };
}

export function buildLocalPictureRevealDraftFromFormValues(params: {
  existingDraft?: LocalPictureRevealDraft | null;
  title: string;
  description: string;
  mode: LocalPictureRevealDraft["mode"];
  startScore: number;
  openTilePenalty: number;
  specialTilePenalty: number;
  content: PictureRevealContentFormState;
}): LocalPictureRevealDraft {
  const existingDraft = params.existingDraft ?? null;
  const imageMetadataById = new Map(
    existingDraft?.images.map((image) => [image.id, image]) ?? [],
  );

  const draft: LocalPictureRevealDraft = {
    id: existingDraft?.id ?? LOCAL_PICTURE_REVEAL_DRAFT_ID,
    title: params.title.trim(),
    description: params.description.trim(),
    mode: params.mode,
    startScore: params.startScore,
    openTilePenalty: params.openTilePenalty,
    specialTilePenalty: params.specialTilePenalty,
    imageWidth: Number(params.content.imageWidth) || 1080,
    imageHeight: Number(params.content.imageHeight) || 1080,
    cover: normalizeAssetRef(
      params.content.coverAssetId,
      params.content.coverImagePath ?? null,
      existingDraft?.cover ?? null,
    ),
    images: params.content.images.map((image, index) => {
      const existingImage = image.id ? imageMetadataById.get(image.id) : null;

      return {
        id: image.id ?? existingImage?.id ?? crypto.randomUUID(),
        answer: image.answer.trim(),
        rows: Number(image.rows) || 1,
        cols: Number(image.cols) || 1,
        specialTileCount: Number(image.specialTileCount) || 0,
        specialPattern: image.specialPattern,
        sortOrder: index,
        image: normalizeAssetRef(
          image.imageAssetId,
          image.imagePath ?? null,
          existingImage?.image ?? null,
        ),
        originalImage: normalizeAssetRef(
          image.originalImageAssetId,
          image.originalImagePath ?? null,
          existingImage?.originalImage ?? null,
        ),
      };
    }),
    updatedAt: new Date().toISOString(),
  };

  return LocalPictureRevealDraftSchema.parse(draft);
}

export function buildPlayablePictureRevealFromLocalDraft(
  draft: LocalPictureRevealDraft,
): PublicPictureRevealGameDetail {
  const normalizedDraft = LocalPictureRevealPlayableDraftSchema.parse(draft);

  return {
    id: normalizedDraft.id,
    title: normalizedDraft.title,
    description: normalizedDraft.description || null,
    coverImagePath: normalizedDraft.cover?.objectUrl ?? null,
    mode: normalizedDraft.mode,
    startScore: normalizedDraft.startScore,
    openTilePenalty: normalizedDraft.openTilePenalty,
    specialTilePenalty: normalizedDraft.specialTilePenalty,
    imageWidth: normalizedDraft.imageWidth,
    imageHeight: normalizedDraft.imageHeight,
    updatedAt: normalizedDraft.updatedAt,
    imageCount: normalizedDraft.images.length,
    images: normalizedDraft.images.map((image) => ({
      id: image.id,
      imagePath: image.image?.objectUrl ?? "",
      answer: image.answer,
      rows: image.rows,
      cols: image.cols,
      totalTiles: image.rows * image.cols,
      specialTileCount: image.specialTileCount,
      specialPattern: image.specialPattern,
    })),
  };
}
