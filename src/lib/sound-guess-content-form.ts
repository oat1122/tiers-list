import type { SaveSoundGuessGameContentInput } from "@/lib/validations";

export interface SoundGuessContentFormSoundState {
  id?: string;
  audioPath?: string;
  tempAudioPath?: string;
  imagePath?: string | null;
  tempImagePath?: string | null;
  answer: string;
  audioStartMs: number;
  audioEndMs: number | null;
  sortOrder: number;
}

export interface SoundGuessContentFormState {
  coverImagePath: string | null;
  coverTempUploadPath: string | null;
  imageWidth: number;
  imageHeight: number;
  sounds: SoundGuessContentFormSoundState[];
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
    imageWidth: state.imageWidth ?? 1600,
    imageHeight: state.imageHeight ?? 900,
    sounds: state.sounds.map((sound, soundIndex) => ({
      id: sound.id,
      audioPath: sound.audioPath,
      tempAudioPath: sound.tempAudioPath,
      imagePath: sound.imagePath ?? null,
      tempImagePath: sound.tempImagePath ?? null,
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
