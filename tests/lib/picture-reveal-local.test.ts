import { describe, expect, it } from "vitest";
import {
  buildLocalPictureRevealDraftFromFormValues,
  buildPictureRevealLocalContentFormValues,
  buildPlayablePictureRevealFromLocalDraft,
  createDefaultLocalPictureRevealDraft,
} from "@/lib/picture-reveal-local";

describe("picture reveal local draft helpers", () => {
  it("creates a default local draft for new creators", () => {
    const draft = createDefaultLocalPictureRevealDraft();

    expect(draft.title).toBe("My Picture Reveal");
    expect(draft.images).toHaveLength(1);
    expect(draft.images[0]?.id).toBeTruthy();
  });

  it("builds a playable game from a completed local draft", () => {
    const draft = createDefaultLocalPictureRevealDraft();
    draft.cover = {
      assetId: "cover-1",
      fileName: "cover.webp",
      mimeType: "image/webp",
      objectUrl: "blob:cover",
    };
    draft.images[0] = {
      ...draft.images[0],
      answer: "Cat",
      image: {
        assetId: "image-1",
        fileName: "cat.webp",
        mimeType: "image/webp",
        objectUrl: "blob:image",
      },
      originalImage: {
        assetId: "image-original-1",
        fileName: "cat-original.webp",
        mimeType: "image/webp",
        objectUrl: "blob:image-original",
      },
    };

    const playable = buildPlayablePictureRevealFromLocalDraft(draft);

    expect(playable.title).toBe("My Picture Reveal");
    expect(playable.coverImagePath).toBe("blob:cover");
    expect(playable.images[0]?.imagePath).toBe("blob:image");
    expect(playable.images[0]?.totalTiles).toBe(
      playable.images[0]!.rows * playable.images[0]!.cols,
    );
  });

  it("rejects an incomplete local draft before play", () => {
    const draft = createDefaultLocalPictureRevealDraft();

    expect(() => buildPlayablePictureRevealFromLocalDraft(draft)).toThrow();
  });

  it("keeps local asset references when rebuilding from editor state", () => {
    const draft = createDefaultLocalPictureRevealDraft();
    const content = buildPictureRevealLocalContentFormValues(draft);

    content.coverAssetId = "cover-1";
    content.coverImagePath = "blob:cover";
    content.images[0] = {
      ...content.images[0],
      answer: "",
      imageAssetId: "image-1",
      originalImageAssetId: "image-original-1",
      imagePath: "blob:image",
      originalImagePath: "blob:image-original",
    };

    const rebuilt = buildLocalPictureRevealDraftFromFormValues({
      existingDraft: draft,
      title: "",
      description: "",
      mode: "single",
      startScore: 1000,
      openTilePenalty: 50,
      specialTilePenalty: 200,
      content,
    });

    expect(rebuilt.cover?.assetId).toBe("cover-1");
    expect(rebuilt.images[0]?.image?.assetId).toBe("image-1");
    expect(rebuilt.images[0]?.originalImage?.assetId).toBe("image-original-1");
  });
});
