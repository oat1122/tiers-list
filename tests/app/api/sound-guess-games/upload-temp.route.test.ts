import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
  getSoundGuessGameById: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.authGetSession,
    },
  },
}));

vi.mock("@/services/sound-guess-games.service", () => ({
  getSoundGuessGameById: mocks.getSoundGuessGameById,
}));

import { POST } from "@/app/api/sound-guess-games/[id]/sounds/upload-temp/route";
import { SOUND_GUESS_AUDIO_UPLOAD_LIMIT_BYTES } from "@/lib/sound-guess-upload";

function params(id = "game-1") {
  return { params: Promise.resolve({ id }) };
}

function createFormRequest(formData: FormData) {
  return new Request(
    "http://localhost/api/sound-guess-games/game-1/sounds/upload-temp",
    {
      method: "POST",
      body: formData,
    },
  );
}

describe("/api/sound-guess-games/[id]/sounds/upload-temp route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });
    mocks.getSoundGuessGameById.mockResolvedValue({
      id: "game-1",
      deletedAt: null,
    });
  });

  it("rejects missing audio files", async () => {
    const response = await POST(createFormRequest(new FormData()) as never, params());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No audio file provided",
    });
  });

  it("rejects unsupported audio MIME types", async () => {
    const formData = new FormData();
    formData.set(
      "audio",
      new File(["not audio"], "clip.txt", { type: "text/plain" }),
    );

    const response = await POST(createFormRequest(formData) as never, params());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("unsupported_type");
  });

  it("rejects audio files over 20MB", async () => {
    const formData = new FormData();
    formData.set(
      "audio",
      new File(
        [new Uint8Array(SOUND_GUESS_AUDIO_UPLOAD_LIMIT_BYTES + 1)],
        "clip.mp3",
        { type: "audio/mpeg" },
      ),
    );

    const response = await POST(createFormRequest(formData) as never, params());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("file_too_large");
    expect(body.limitBytes).toBe(SOUND_GUESS_AUDIO_UPLOAD_LIMIT_BYTES);
  });
});

