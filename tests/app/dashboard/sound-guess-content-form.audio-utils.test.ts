// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clampAudioVolume,
  formatAudioRangeLabel,
  formatAudioTime,
  getAudioRangeError,
  getTimelinePercent,
  parseAudioTime,
  readRememberedAudioVolume,
  rememberAudioVolume,
  sanitizeAudioTimeDraft,
  snapAudioTime,
} from "@/app/dashboard/sound-guess/[id]/edit/_components/sound-guess-audio-utils";
import {
  AUDIO_TIME_STEP_MS,
  SOUND_GUESS_AUDIO_DEFAULT_VOLUME,
  SOUND_GUESS_AUDIO_VOLUME_STORAGE_KEY,
} from "@/app/dashboard/sound-guess/[id]/edit/_components/sound-guess-content-form.constants";

describe("sound guess content audio utils", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("formats and parses audio time labels", () => {
    expect(formatAudioTime(39_405)).toBe("00:39.41");
    expect(parseAudioTime("00:39.40")).toBe(39_400);
    expect(parseAudioTime("12.5")).toBe(12_500);
    expect(parseAudioTime("not time")).toBeNull();
  });

  it("sanitizes draft time text without forcing a final format", () => {
    expect(sanitizeAudioTimeDraft("00:10.999")).toBe("00:10.99");
    expect(sanitizeAudioTimeDraft("abc1:02.3x4")).toBe("1:02.34");
  });

  it("labels valid and invalid audio ranges", () => {
    expect(formatAudioRangeLabel(1_000, null)).toBe("00:01.00 - จบไฟล์");
    expect(formatAudioRangeLabel(1_000, 2_500)).toBe("00:01.00 - 00:02.50");
    expect(getAudioRangeError(3_000, 3_000)).toBe(
      "เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด",
    );
    expect(getAudioRangeError(1_000, null)).toBeNull();
  });

  it("clamps and snaps timeline values", () => {
    expect(getTimelinePercent(25, 100)).toBe(25);
    expect(getTimelinePercent(150, 100)).toBe(100);
    expect(getTimelinePercent(1, 0)).toBe(0);
    expect(snapAudioTime(24, 100)).toBe(
      Math.round(24 / AUDIO_TIME_STEP_MS) * AUDIO_TIME_STEP_MS,
    );
    expect(snapAudioTime(150, 100)).toBe(100);
    expect(clampAudioVolume(2)).toBe(1);
    expect(clampAudioVolume(-1)).toBe(0);
  });

  it("persists remembered volume and falls back when storage is unavailable", () => {
    expect(readRememberedAudioVolume()).toBe(SOUND_GUESS_AUDIO_DEFAULT_VOLUME);

    rememberAudioVolume(0.25);

    expect(localStorage.getItem(SOUND_GUESS_AUDIO_VOLUME_STORAGE_KEY)).toBe(
      "0.25",
    );
    expect(readRememberedAudioVolume()).toBe(0.25);

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    expect(readRememberedAudioVolume()).toBe(SOUND_GUESS_AUDIO_DEFAULT_VOLUME);
  });
});
