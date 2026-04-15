import {
  LocalSoundGuessDraftSchema,
  LocalSoundGuessPlayableDraftSchema,
} from "@/lib/validations";
import type { SoundGuessContentFormState } from "@/lib/sound-guess-content-form";
import type { PublicSoundGuessGameDetail } from "@/types/sound-guess-public";
import type {
  LocalSoundGuessAssetRef,
  LocalSoundGuessDraft,
  LocalSoundGuessSoundDraft,
} from "@/types/sound-guess-local";

export const LOCAL_SOUND_GUESS_DRAFT_ID = "current-sound-guess-draft";

const DEFAULT_SOUND_GUESS_WIDTH = 1600;
const DEFAULT_SOUND_GUESS_HEIGHT = 900;

/**
 * Creates an empty local sound draft for the editor.
 *
 * @param sortOrder - Position of the sound inside the draft.
 * @returns Local sound draft with no audio and a blank answer.
 */
function createEmptyLocalSoundDraft(sortOrder: number): LocalSoundGuessSoundDraft {
  return {
    id: crypto.randomUUID(),
    answer: "",
    audio: null,
    image: null,
    audioStartMs: 0,
    audioEndMs: null,
    sortOrder,
  };
}

/**
 * Creates the first local draft shown to a browser-only sound guess creator.
 *
 * @returns Default local draft with one empty sound slot.
 */
export function createDefaultLocalSoundGuessDraft(): LocalSoundGuessDraft {
  return {
    id: LOCAL_SOUND_GUESS_DRAFT_ID,
    title: "My Sound Guess",
    description: "",
    imageWidth: DEFAULT_SOUND_GUESS_WIDTH,
    imageHeight: DEFAULT_SOUND_GUESS_HEIGHT,
    cover: null,
    sounds: [createEmptyLocalSoundDraft(0)],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Revokes object URLs owned by a local sound guess draft.
 *
 * @param draft - Draft whose cover, audio, and image object URLs should be released.
 * @returns Nothing when the draft is absent or after URLs are revoked.
 */
export function revokeLocalSoundGuessDraftUrls(
  draft: LocalSoundGuessDraft | null | undefined,
) {
  if (!draft) {
    return;
  }

  if (draft.cover?.objectUrl) {
    URL.revokeObjectURL(draft.cover.objectUrl);
  }

  draft.sounds.forEach((sound) => {
    if (sound.audio?.objectUrl) {
      URL.revokeObjectURL(sound.audio.objectUrl);
    }

    if (sound.image?.objectUrl) {
      URL.revokeObjectURL(sound.image.objectUrl);
    }
  });
}

/**
 * Converts a local draft into the shared sound guess editor form state.
 *
 * @param draft - Local draft loaded from IndexedDB or created in memory.
 * @returns Editor form values with local asset ids and preview URLs preserved.
 */
export function buildSoundGuessLocalContentFormValues(
  draft: LocalSoundGuessDraft,
): SoundGuessContentFormState {
  return {
    coverImagePath: draft.cover?.objectUrl ?? null,
    coverTempUploadPath: null,
    coverAssetId: draft.cover?.assetId ?? null,
    imageWidth: draft.imageWidth,
    imageHeight: draft.imageHeight,
    sounds: draft.sounds.map((sound, index) => ({
      id: sound.id,
      audioPath: sound.audio?.objectUrl ?? undefined,
      tempAudioPath: undefined,
      audioAssetId: sound.audio?.assetId ?? null,
      imagePath: sound.image?.objectUrl ?? null,
      tempImagePath: null,
      imageAssetId: sound.image?.assetId ?? null,
      answer: sound.answer,
      audioStartMs: sound.audioStartMs,
      audioEndMs: sound.audioEndMs,
      sortOrder: sound.sortOrder ?? index,
    })),
  };
}

/**
 * Rebuilds a local asset reference from editor state and existing metadata.
 *
 * @param assetId - Asset id selected by the editor form.
 * @param objectUrl - Current preview URL for the asset.
 * @param fallbackAsset - Existing asset metadata used when the same asset is retained.
 * @param defaultFileName - File name used when a new asset has no draft metadata yet.
 * @param defaultMimeType - MIME type used when a new asset has no draft metadata yet.
 * @returns Local asset reference, or null when no asset id is present.
 */
function normalizeAssetRef(
  assetId: string | null | undefined,
  objectUrl: string | null | undefined,
  fallbackAsset: LocalSoundGuessAssetRef | null,
  defaultFileName: string,
  defaultMimeType: string,
): LocalSoundGuessAssetRef | null {
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
    fileName: defaultFileName,
    mimeType: defaultMimeType,
    objectUrl: objectUrl ?? fallbackAsset?.objectUrl ?? null,
  };
}

/**
 * Builds and validates a local sound guess draft from settings and content state.
 *
 * @param params - Current local creator settings, content, and optional existing draft.
 * @returns Valid local draft ready to persist or play.
 * @throws ZodError when the rebuilt draft violates local draft validation.
 */
export function buildLocalSoundGuessDraftFromFormValues(params: {
  existingDraft?: LocalSoundGuessDraft | null;
  title: string;
  description: string;
  content: SoundGuessContentFormState;
}): LocalSoundGuessDraft {
  const existingDraft = params.existingDraft ?? null;
  const soundMetadataById = new Map(
    existingDraft?.sounds.map((sound) => [sound.id, sound]) ?? [],
  );

  const draft: LocalSoundGuessDraft = {
    id: existingDraft?.id ?? LOCAL_SOUND_GUESS_DRAFT_ID,
    title: params.title.trim(),
    description: params.description.trim(),
    imageWidth: Number(params.content.imageWidth) || DEFAULT_SOUND_GUESS_WIDTH,
    imageHeight:
      Number(params.content.imageHeight) || DEFAULT_SOUND_GUESS_HEIGHT,
    cover: normalizeAssetRef(
      params.content.coverAssetId,
      params.content.coverImagePath ?? null,
      existingDraft?.cover ?? null,
      "sound-guess-cover.webp",
      "image/webp",
    ),
    sounds: params.content.sounds.map((sound, index) => {
      const existingSound = sound.id ? soundMetadataById.get(sound.id) : null;

      return {
        id: sound.id ?? existingSound?.id ?? crypto.randomUUID(),
        answer: sound.answer.trim(),
        audio: normalizeAssetRef(
          sound.audioAssetId,
          sound.audioPath ?? null,
          existingSound?.audio ?? null,
          "sound-guess-audio",
          "audio/mpeg",
        ),
        image: normalizeAssetRef(
          sound.imageAssetId,
          sound.imagePath ?? null,
          existingSound?.image ?? null,
          "sound-guess-image.webp",
          "image/webp",
        ),
        audioStartMs: Number(sound.audioStartMs) || 0,
        audioEndMs: sound.audioEndMs ?? null,
        sortOrder: index,
      };
    }),
    updatedAt: new Date().toISOString(),
  };

  return LocalSoundGuessDraftSchema.parse(draft);
}

/**
 * Converts a complete local draft into the public game detail used by play UI.
 *
 * @param draft - Local draft that must contain playable audio assets and answers.
 * @returns Public game detail compatible with the hosted sound guess player.
 * @throws ZodError when the draft is incomplete and cannot be played.
 */
export function buildPlayableSoundGuessFromLocalDraft(
  draft: LocalSoundGuessDraft,
): PublicSoundGuessGameDetail {
  const normalizedDraft = LocalSoundGuessPlayableDraftSchema.parse(draft);

  return {
    id: normalizedDraft.id,
    title: normalizedDraft.title,
    description: normalizedDraft.description || null,
    coverImagePath: normalizedDraft.cover?.objectUrl ?? null,
    imageWidth: normalizedDraft.imageWidth,
    imageHeight: normalizedDraft.imageHeight,
    updatedAt: normalizedDraft.updatedAt,
    soundCount: normalizedDraft.sounds.length,
    sounds: normalizedDraft.sounds.map((sound) => ({
      id: sound.id,
      audioPath: sound.audio?.objectUrl ?? "",
      imagePath: sound.image?.objectUrl ?? null,
      answer: sound.answer,
      audioStartMs: sound.audioStartMs,
      audioEndMs: sound.audioEndMs ?? null,
      sortOrder: sound.sortOrder,
    })),
  };
}
