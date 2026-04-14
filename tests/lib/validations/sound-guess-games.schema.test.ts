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

