import { describe, expect, it } from "vitest";
import {
  buildLocalSoundGuessDraftFromFormValues,
  buildPlayableSoundGuessFromLocalDraft,
  buildSoundGuessLocalContentFormValues,
  createDefaultLocalSoundGuessDraft,
} from "@/lib/sound-guess-local";

describe("sound guess local draft helpers", () => {
  it("creates a default local draft for new creators", () => {
    const draft = createDefaultLocalSoundGuessDraft();

    expect(draft.title).toBe("My Sound Guess");
    expect(draft.imageWidth).toBe(1600);
    expect(draft.imageHeight).toBe(900);
    expect(draft.sounds).toHaveLength(1);
    expect(draft.sounds[0]?.id).toBeTruthy();
  });

  it("builds form values with local object URLs and asset ids", () => {
    const draft = createDefaultLocalSoundGuessDraft();
    draft.cover = {
      assetId: "cover-1",
      fileName: "cover.webp",
      mimeType: "image/webp",
      objectUrl: "blob:cover",
    };
    draft.sounds[0] = {
      ...draft.sounds[0]!,
      audio: {
        assetId: "audio-1",
        fileName: "bell.mp3",
        mimeType: "audio/mpeg",
        objectUrl: "blob:audio",
      },
      image: {
        assetId: "image-1",
        fileName: "vinyl.webp",
        mimeType: "image/webp",
        objectUrl: "blob:image",
      },
    };

    const values = buildSoundGuessLocalContentFormValues(draft);

    expect(values.coverImagePath).toBe("blob:cover");
    expect(values.coverAssetId).toBe("cover-1");
    expect(values.sounds[0]?.audioPath).toBe("blob:audio");
    expect(values.sounds[0]?.audioAssetId).toBe("audio-1");
    expect(values.sounds[0]?.imagePath).toBe("blob:image");
    expect(values.sounds[0]?.imageAssetId).toBe("image-1");
  });

  it("keeps local asset references when rebuilding from editor state", () => {
    const draft = createDefaultLocalSoundGuessDraft();
    const content = buildSoundGuessLocalContentFormValues(draft);

    content.coverAssetId = "cover-1";
    content.coverImagePath = "blob:cover";
    content.sounds[0] = {
      ...content.sounds[0]!,
      answer: "",
      audioPath: "blob:audio",
      audioAssetId: "audio-1",
      imagePath: "blob:image",
      imageAssetId: "image-1",
    };

    const rebuilt = buildLocalSoundGuessDraftFromFormValues({
      existingDraft: draft,
      title: "",
      description: "",
      content,
    });

    expect(rebuilt.cover?.assetId).toBe("cover-1");
    expect(rebuilt.sounds[0]?.audio?.assetId).toBe("audio-1");
    expect(rebuilt.sounds[0]?.image?.assetId).toBe("image-1");
  });

  it("rejects an incomplete local draft before play", () => {
    const draft = createDefaultLocalSoundGuessDraft();

    expect(() => buildPlayableSoundGuessFromLocalDraft(draft)).toThrow();
  });

  it("builds a playable game from a completed local draft", () => {
    const draft = createDefaultLocalSoundGuessDraft();
    draft.sounds[0] = {
      ...draft.sounds[0]!,
      answer: "Bell Song",
      audio: {
        assetId: "audio-1",
        fileName: "bell.mp3",
        mimeType: "audio/mpeg",
        objectUrl: "blob:audio",
      },
      image: {
        assetId: "image-1",
        fileName: "vinyl.webp",
        mimeType: "image/webp",
        objectUrl: "blob:image",
      },
      audioStartMs: 1000,
      audioEndMs: 5000,
    };

    const playable = buildPlayableSoundGuessFromLocalDraft(draft);

    expect(playable.title).toBe("My Sound Guess");
    expect(playable.soundCount).toBe(1);
    expect(playable.sounds[0]?.audioPath).toBe("blob:audio");
    expect(playable.sounds[0]?.imagePath).toBe("blob:image");
    expect(playable.sounds[0]?.answer).toBe("Bell Song");
    expect(playable.sounds[0]?.audioStartMs).toBe(1000);
    expect(playable.sounds[0]?.audioEndMs).toBe(5000);
  });
});
