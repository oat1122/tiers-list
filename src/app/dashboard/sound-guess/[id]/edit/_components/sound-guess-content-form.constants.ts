export {
  SOUND_GUESS_AUDIO_DEFAULT_VOLUME,
  SOUND_GUESS_AUDIO_VOLUME_STORAGE_KEY,
} from "@/lib/sound-guess-audio-volume";

export const SOUND_GUESS_DEFAULT_COVER_WIDTH = 1600;
export const SOUND_GUESS_DEFAULT_COVER_HEIGHT = 900;
export const SOUND_GUESS_SOUND_IMAGE_SIZE = 1080;
export const AUDIO_TIME_STEP_MS = 10;
export const AUDIO_ACCEPTED_MIME = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
] as const;
