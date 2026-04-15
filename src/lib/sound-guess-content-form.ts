import type { SaveSoundGuessGameContentInput } from "@/lib/validations";

export interface SoundGuessContentFormSoundState {
  id?: string;
  audioPath?: string;
  tempAudioPath?: string;
  audioAssetId?: string | null;
  imagePath?: string | null;
  tempImagePath?: string | null;
  imageAssetId?: string | null;
  answer: string;
  audioStartMs: number;
  audioEndMs: number | null;
  sortOrder: number;
}

export interface SoundGuessContentFormState {
  coverImagePath: string | null;
  coverTempUploadPath: string | null;
  coverAssetId?: string | null;
  imageWidth: number;
  imageHeight: number;
  sounds: SoundGuessContentFormSoundState[];
}

export interface SoundGuessCoverUploadResult {
  previewPath: string;
  coverAssetId?: string | null;
  tempUploadPath?: string | null;
}

export interface SoundGuessAudioUploadResult {
  previewPath: string;
  audioAssetId?: string | null;
  tempAudioPath?: string | null;
}

export interface SoundGuessSoundImageUploadResult {
  previewPath: string;
  imageAssetId?: string | null;
  tempImagePath?: string | null;
}

export interface SoundGuessContentUploadAdapter {
  uploadCover: (file: File) => Promise<SoundGuessCoverUploadResult>;
  uploadAudio: (file: File) => Promise<SoundGuessAudioUploadResult>;
  uploadSoundImage: (file: File) => Promise<SoundGuessSoundImageUploadResult>;
}

/**
 * Creates a stable empty sound draft for the content editor.
 *
 * @param sortOrder - Position of the new sound in the editor list.
 * @returns Sound draft with blank answer and no uploaded audio.
 */
export function createEmptySoundGuessSoundDraft(sortOrder: number) {
  return {
    id: crypto.randomUUID(),
    answer: "",
    imagePath: null,
    tempImagePath: null,
    audioStartMs: 0,
    audioEndMs: null,
    sortOrder,
  } satisfies SoundGuessContentFormSoundState;
}

/**
 * Normalizes a sound guess content form snapshot for react-hook-form resets.
 *
 * @param state - Partial or complete form state loaded from local UI state.
 * @returns Complete form state with stable arrays and nullable cover fields.
 */
export function buildSoundGuessContentFormSnapshot(
  state: SoundGuessContentFormState,
): SoundGuessContentFormState {
  return {
    coverImagePath: state.coverImagePath ?? null,
    coverTempUploadPath: state.coverTempUploadPath ?? null,
    coverAssetId: state.coverAssetId ?? null,
    imageWidth: state.imageWidth ?? 1600,
    imageHeight: state.imageHeight ?? 900,
    sounds: state.sounds.map((sound, soundIndex) => ({
      id: sound.id,
      audioPath: sound.audioPath,
      tempAudioPath: sound.tempAudioPath,
      audioAssetId: sound.audioAssetId ?? null,
      imagePath: sound.imagePath ?? null,
      tempImagePath: sound.tempImagePath ?? null,
      imageAssetId: sound.imageAssetId ?? null,
      answer: sound.answer ?? "",
      audioStartMs: sound.audioStartMs ?? 0,
      audioEndMs: sound.audioEndMs ?? null,
      sortOrder: soundIndex,
    })),
  };
}

/**
 * Converts content form state into the API payload accepted by the backend.
 *
 * @param values - Raw form values produced by the content editor.
 * @returns Valid API input with trimmed answers and sequential sort order.
 */
export function normalizeSoundGuessContentInput(
  values: SoundGuessContentFormState,
): SaveSoundGuessGameContentInput {
  return {
    coverImagePath: values.coverImagePath ?? null,
    coverTempUploadPath: values.coverTempUploadPath ?? null,
    imageWidth: values.imageWidth,
    imageHeight: values.imageHeight,
    sounds: values.sounds.map((sound, soundIndex) => ({
      id: sound.id,
      audioPath: sound.audioPath,
      tempAudioPath: sound.tempAudioPath,
      imagePath: sound.imagePath ?? null,
      tempImagePath: sound.tempImagePath ?? null,
      answer: sound.answer.trim(),
      audioStartMs: sound.audioStartMs,
      audioEndMs: sound.audioEndMs ?? null,
      sortOrder: soundIndex,
    })),
  };
}
