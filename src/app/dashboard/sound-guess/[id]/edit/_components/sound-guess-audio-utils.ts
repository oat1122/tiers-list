import {
  AUDIO_TIME_STEP_MS,
  SOUND_GUESS_AUDIO_DEFAULT_VOLUME,
  SOUND_GUESS_AUDIO_VOLUME_STORAGE_KEY,
} from "./sound-guess-content-form.constants";

/**
 * Formats milliseconds as a compact editor time label.
 *
 * @param value - Time value in milliseconds.
 * @returns Time label formatted as mm:ss.SS.
 */
export function formatAudioTime(value: number) {
  const safeValue = Math.max(
    0,
    Math.round(value / AUDIO_TIME_STEP_MS) * AUDIO_TIME_STEP_MS,
  );
  const minutes = Math.floor(safeValue / 60_000);
  const seconds = Math.floor((safeValue % 60_000) / 1000);
  const centiseconds = Math.floor((safeValue % 1000) / AUDIO_TIME_STEP_MS);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}.${String(centiseconds).padStart(2, "0")}`;
}

/**
 * Parses editor time text in mm:ss.SS or seconds form.
 *
 * @param value - Raw text entered by the admin.
 * @returns Milliseconds when valid, otherwise null.
 */
export function parseAudioTime(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (/^\d+(\.\d{1,3})?$/.test(trimmedValue)) {
    return Math.round(Number(trimmedValue) * 1000);
  }

  const match = trimmedValue.match(/^(\d+):([0-5]?\d)(?:\.(\d{1,3}))?$/);

  if (!match) {
    return null;
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fraction = match[3] ?? "0";
  const milliseconds = Number(fraction.padEnd(3, "0").slice(0, 3));

  return minutes * 60_000 + seconds * 1000 + milliseconds;
}

/**
 * Normalizes a draft audio time input without forcing a final time format.
 *
 * @param value - Raw input value from the editor.
 * @returns Input value containing only time-safe characters and two decimals.
 */
export function sanitizeAudioTimeDraft(value: string) {
  const sanitized = value.replace(/[^\d:.]/g, "");
  const [head, ...decimalParts] = sanitized.split(".");

  if (decimalParts.length === 0) {
    return head;
  }

  return `${head}.${decimalParts.join("").slice(0, 2)}`;
}

/**
 * Builds a compact range label for the selected audio segment.
 *
 * @param startMs - Selected range start in milliseconds.
 * @param endMs - Selected range end in milliseconds, or null for the file end.
 * @returns User-facing selected range label.
 */
export function formatAudioRangeLabel(startMs: number, endMs: number | null) {
  const startLabel = formatAudioTime(startMs);

  if (endMs === null) {
    return `${startLabel} - จบไฟล์`;
  }

  return `${startLabel} - ${formatAudioTime(endMs)}`;
}

/**
 * Validates the selected audio segment range.
 *
 * @param startMs - Selected range start in milliseconds.
 * @param endMs - Selected range end in milliseconds, or null for the file end.
 * @returns Error message when invalid, otherwise null.
 */
export function getAudioRangeError(startMs: number, endMs: number | null) {
  if (endMs !== null && endMs <= startMs) {
    return "เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด";
  }

  return null;
}

/**
 * Converts a time value into a timeline percentage.
 *
 * @param value - Time value in milliseconds.
 * @param maxValue - Timeline duration in milliseconds.
 * @returns Clamped percentage between 0 and 100.
 */
export function getTimelinePercent(value: number, maxValue: number) {
  if (maxValue <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (value / maxValue) * 100));
}

/**
 * Snaps a time value to the editor step and timeline bounds.
 *
 * @param value - Raw time value in milliseconds.
 * @param maxValue - Timeline duration in milliseconds.
 * @returns Clamped, snapped time value.
 */
export function snapAudioTime(value: number, maxValue: number) {
  const snappedValue =
    Math.round(value / AUDIO_TIME_STEP_MS) * AUDIO_TIME_STEP_MS;

  return Math.min(maxValue, Math.max(0, snappedValue));
}

/**
 * Clamps an audio volume value to the browser-supported range.
 *
 * @param value - Raw volume value.
 * @returns Volume clamped between 0 and 1.
 */
export function clampAudioVolume(value: number) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Reads the remembered admin audio volume from localStorage.
 *
 * @returns Stored volume when valid, otherwise the default editor volume.
 */
export function readRememberedAudioVolume() {
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

    return clampAudioVolume(parsedValue);
  } catch {
    return SOUND_GUESS_AUDIO_DEFAULT_VOLUME;
  }
}

/**
 * Persists the shared admin audio volume for future audio previews.
 *
 * @param value - Volume value emitted by an audio element.
 * @returns Nothing.
 */
export function rememberAudioVolume(value: number) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SOUND_GUESS_AUDIO_VOLUME_STORAGE_KEY,
      String(clampAudioVolume(value)),
    );
  } catch {
    // Ignore storage failures so browser privacy settings do not break playback.
  }
}
