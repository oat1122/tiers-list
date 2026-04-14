import {
  extractSoundGuessApiError,
  readSoundGuessJsonOrNull,
} from "@/app/dashboard/sound-guess/_components/sound-guess-admin.utils";

/**
 * Uploads a cropped cover image through the remote admin API.
 *
 * @param gameId - Game id whose cover image is being updated.
 * @param file - Cropped cover image file.
 * @returns Preview path returned by the upload endpoint.
 * @throws Error when the upload endpoint rejects the file.
 */
export async function uploadRemoteCover(gameId: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `/api/sound-guess-games/${gameId}/cover/upload-temp`,
    {
      method: "POST",
      body: formData,
    },
  );
  const payload = await readSoundGuessJsonOrNull(response);

  if (!response.ok) {
    throw new Error(
      extractSoundGuessApiError(payload) ?? "อัปโหลดรูปหน้าปกไม่สำเร็จ",
    );
  }

  return payload as { tempUploadPath: string };
}

/**
 * Uploads an audio file through the remote admin API.
 *
 * @param gameId - Game id whose sound content is being updated.
 * @param file - Audio file selected in the editor.
 * @returns Preview path returned by the upload endpoint.
 * @throws Error when the upload endpoint rejects the file.
 */
export async function uploadRemoteAudio(gameId: string, file: File) {
  const formData = new FormData();
  formData.append("audio", file);

  const response = await fetch(
    `/api/sound-guess-games/${gameId}/sounds/upload-temp`,
    {
      method: "POST",
      body: formData,
    },
  );
  const payload = await readSoundGuessJsonOrNull(response);

  if (!response.ok) {
    throw new Error(
      extractSoundGuessApiError(payload) ?? "อัปโหลดไฟล์เสียงไม่สำเร็จ",
    );
  }

  return payload as { tempAudioPath: string };
}

/**
 * Uploads a cropped per-sound image through the remote admin API.
 *
 * @param gameId - Game id whose sound content is being updated.
 * @param file - Cropped sound image file.
 * @returns Preview path returned by the upload endpoint.
 * @throws Error when the upload endpoint rejects the file.
 */
export async function uploadRemoteSoundImage(gameId: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `/api/sound-guess-games/${gameId}/sounds/images/upload-temp`,
    {
      method: "POST",
      body: formData,
    },
  );
  const payload = await readSoundGuessJsonOrNull(response);

  if (!response.ok) {
    throw new Error(
      extractSoundGuessApiError(payload) ?? "อัปโหลดรูปแผ่นเสียงไม่สำเร็จ",
    );
  }

  return payload as { tempImagePath: string };
}
