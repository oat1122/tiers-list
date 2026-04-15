export const SOUND_GUESS_AUDIO_DEFAULT_VOLUME = 0.5;
export const SOUND_GUESS_AUDIO_VOLUME_STORAGE_KEY =
  "sound-guess-admin-audio-volume";

/**
 * Clamps a sound guess audio volume value to the browser-supported range.
 *
 * @param value - Raw volume value from user input or media events.
 * @returns Volume clamped between 0 and 1.
 */
export function clampSoundGuessAudioVolume(value: number) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Reads the remembered sound guess audio volume from localStorage.
 *
 * @returns Stored volume when valid, otherwise the default 50% volume.
 */
export function readRememberedSoundGuessAudioVolume() {
  if (typeof window === "undefined") {
    return SOUND_GUESS_AUDIO_DEFAULT_VOLUME;
  }

  try {
    const storedValue = window.localStorage.getItem(
      SOUND_GUESS_AUDIO_VOLUME_STORAGE_KEY,
    );

    if (!storedValue) {
      return SOUND_GUESS_AUDIO_DEFAULT_VOLUME;
    }

    const parsedValue = Number(storedValue);

    if (!Number.isFinite(parsedValue)) {
      return SOUND_GUESS_AUDIO_DEFAULT_VOLUME;
    }

    return clampSoundGuessAudioVolume(parsedValue);
  } catch {
    return SOUND_GUESS_AUDIO_DEFAULT_VOLUME;
  }
}

/**
 * Persists the shared sound guess audio volume for future previews and games.
 *
 * @param value - Volume value emitted by an audio element or volume slider.
 * @returns Nothing.
 */
export function rememberSoundGuessAudioVolume(value: number) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SOUND_GUESS_AUDIO_VOLUME_STORAGE_KEY,
      String(clampSoundGuessAudioVolume(value)),
    );
  } catch {
    // Ignore storage failures so browser privacy settings do not break playback.
  }
}
