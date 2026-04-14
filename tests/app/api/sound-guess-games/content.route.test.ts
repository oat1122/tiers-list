import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
  getSoundGuessGameContent: vi.fn(),
  saveSoundGuessGameContent: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.authGetSession,
    },
  },
}));

vi.mock("@/services/sound-guess-games.service", () => ({
  getSoundGuessGameContent: mocks.getSoundGuessGameContent,
  saveSoundGuessGameContent: mocks.saveSoundGuessGameContent,
}));

import { GET, PUT } from "@/app/api/sound-guess-games/[id]/content/route";

function createJsonRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/sound-guess-games/game-1/content", {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function params(id = "game-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/sound-guess-games/[id]/content route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });
  });

  it("loads editable content for admins", async () => {
    mocks.getSoundGuessGameContent.mockResolvedValue({
      id: "game-1",
      sounds: [{ id: "sound-1", answer: "Bell" }],
    });

    const response = await GET(createJsonRequest("GET") as never, params());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "game-1",
      sounds: [{ id: "sound-1", answer: "Bell" }],
    });
  });

  it("returns 400 when content validation fails", async () => {
    const response = await PUT(
      createJsonRequest("PUT", {
        sounds: [{ answer: "Bell" }],
      }) as never,
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.saveSoundGuessGameContent).not.toHaveBeenCalled();
  });

  it("saves validated sound content", async () => {
    mocks.saveSoundGuessGameContent.mockResolvedValue({
      id: "game-1",
      sounds: [{ id: "sound-1", answer: "Bell" }],
    });

    const response = await PUT(
      createJsonRequest("PUT", {
        coverImagePath: null,
        sounds: [
          {
            tempAudioPath: "/uploads/sound-guess/audio/temp/bell.mp3",
            answer: "Bell",
            sortOrder: 0,
          },
        ],
      }) as never,
      params(),
    );

    expect(response.status).toBe(200);
    expect(mocks.saveSoundGuessGameContent).toHaveBeenCalledWith("game-1", {
      coverImagePath: null,
      imageWidth: 1600,
      imageHeight: 900,
      sounds: [
        {
          tempAudioPath: "/uploads/sound-guess/audio/temp/bell.mp3",
          answer: "Bell",
          audioStartMs: 0,
          audioEndMs: undefined,
          sortOrder: 0,
        },
      ],
    });
  });
});
