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

const DEFAULT_LOCAL_IMAGE_SIZE = 1080;
const MINIMUM_LOCAL_GRID_SIZE = 1;

/**
 * Creates an empty image draft for the local creator flow.
 *
 * @param sortOrder - Position of the image inside the local draft.
 * @returns Local image draft with default grid and scoring settings.
 */
function createEmptyLocalImageDraft(
  sortOrder: number,
): LocalPictureRevealImageDraft {
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

/**
 * Creates the first local draft shown to a new browser-only creator.
 *
 * @returns Default local draft with one empty image slot.
 */
export function createDefaultLocalPictureRevealDraft(): LocalPictureRevealDraft {
  return {
    id: LOCAL_PICTURE_REVEAL_DRAFT_ID,
    title: "My Picture Reveal",
    description: "",
    mode: "single",
    startScore: 1000,
    openTilePenalty: 50,
    specialTilePenalty: 200,
    imageWidth: DEFAULT_LOCAL_IMAGE_SIZE,
    imageHeight: DEFAULT_LOCAL_IMAGE_SIZE,
    cover: null,
    images: [createEmptyLocalImageDraft(0)],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Revokes object URLs owned by a local draft to avoid browser memory leaks.
 *
 * @param draft - Draft whose cover and image object URLs should be released.
 * @returns Nothing when the draft is absent or after URLs are revoked.
 */
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

/**
 * Converts a local draft into the shared content form shape.
 *
 * @param draft - Local draft loaded from IndexedDB or created in memory.
 * @returns Editor form values with local asset ids preserved.
 */
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

/**
 * Rebuilds a local asset reference from form values and an existing asset fallback.
 *
 * @param assetId - Asset id selected by the editor form.
 * @param objectUrl - Current preview URL for the asset.
 * @param fallbackAsset - Existing asset metadata used when the same asset is retained.
 * @returns Local asset reference, or null when no asset id is present.
 */
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

/**
 * Builds and validates a local draft from settings and content form state.
 *
 * @param params - Current local creator settings, content, and optional existing draft.
 * @returns Valid local draft ready to persist or play.
 * @throws ZodError when the rebuilt draft violates local draft validation.
 */
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
    imageWidth: Number(params.content.imageWidth) || DEFAULT_LOCAL_IMAGE_SIZE,
    imageHeight: Number(params.content.imageHeight) || DEFAULT_LOCAL_IMAGE_SIZE,
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
        rows: Number(image.rows) || MINIMUM_LOCAL_GRID_SIZE,
        cols: Number(image.cols) || MINIMUM_LOCAL_GRID_SIZE,
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

/**
 * Converts a complete local draft into the public game detail used by the play UI.
 *
 * @param draft - Local draft that must contain playable image assets and answers.
 * @returns Public game detail compatible with the hosted picture reveal player.
 * @throws ZodError when the draft is incomplete and cannot be played.
 */
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
