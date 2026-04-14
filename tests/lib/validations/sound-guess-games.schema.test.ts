import { describe, expect, it } from "vitest";
import {
  CreateSoundGuessGameSchema,
  SaveSoundGuessGameContentSchema,
} from "@/lib/validations/sound-guess-games.schema";

describe("CreateSoundGuessGameSchema", () => {
  it("applies default draft game settings", () => {
    const result = CreateSoundGuessGameSchema.safeParse({
      title: "Mystery sounds",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      title: "Mystery sounds",
      status: "draft",
    });
  });

  it("rejects empty titles", () => {
    const result = CreateSoundGuessGameSchema.safeParse({ title: "" });

    expect(result.success).toBe(false);
  });
});

describe("SaveSoundGuessGameContentSchema", () => {
  it("accepts a valid sound with a temporary audio path and answer", () => {
    const result = SaveSoundGuessGameContentSchema.safeParse({
      imageWidth: 1600,
      imageHeight: 900,
      sounds: [
        {
          tempAudioPath: "/uploads/sound-guess/audio/temp/chime.mp3",
          answer: "Chime",
          sortOrder: 0,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.sounds[0]?.answer).toBe("Chime");
    expect(result.data?.imageWidth).toBe(1600);
    expect(result.data?.imageHeight).toBe(900);
  });

  it("accepts an existing audio path with an optional cover", () => {
    const result = SaveSoundGuessGameContentSchema.safeParse({
      coverImagePath: "/uploads/sound-guess/covers/cover.webp",
      sounds: [
        {
          audioPath: "/uploads/sound-guess/audio/bell.mp3",
          answer: "Bell",
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.sounds[0]?.sortOrder).toBe(0);
  });

  it("accepts optional sound images and audio crop metadata", () => {
    const result = SaveSoundGuessGameContentSchema.safeParse({
      sounds: [
        {
          audioPath: "/uploads/sound-guess/audio/bell.mp3",
          imagePath: "/uploads/sound-guess/sound-images/bell.webp",
          answer: "Bell",
          audioStartMs: 500,
          audioEndMs: 2500,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.sounds[0]).toEqual(
      expect.objectContaining({
        imagePath: "/uploads/sound-guess/sound-images/bell.webp",
        audioStartMs: 500,
        audioEndMs: 2500,
      }),
    );
  });

  it("rejects invalid cover dimensions", () => {
    const result = SaveSoundGuessGameContentSchema.safeParse({
      imageWidth: 99,
      imageHeight: 900,
      sounds: [
        {
          audioPath: "/uploads/sound-guess/audio/bell.mp3",
          answer: "Bell",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects audio crops whose end is not after the start", () => {
    const result = SaveSoundGuessGameContentSchema.safeParse({
      sounds: [
        {
          audioPath: "/uploads/sound-guess/audio/bell.mp3",
          answer: "Bell",
          audioStartMs: 3000,
          audioEndMs: 3000,
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Audio end time must be after start time",
    );
  });

  it("rejects content without an audio path", () => {
    const result = SaveSoundGuessGameContentSchema.safeParse({
      sounds: [
        {
          answer: "Rain",
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Audio file is required");
  });

  it("rejects empty answers", () => {
    const result = SaveSoundGuessGameContentSchema.safeParse({
      sounds: [
        {
          audioPath: "/uploads/sound-guess/audio/rain.mp3",
          answer: "",
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
