import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublicSoundGuessGameById: vi.fn(),
  getPublicSoundGuessGames: vi.fn(),
}));

vi.mock("@/services/sound-guess-games.service", () => ({
  getPublicSoundGuessGameById: mocks.getPublicSoundGuessGameById,
  getPublicSoundGuessGames: mocks.getPublicSoundGuessGames,
}));

import { GET as GET_PUBLIC_DETAIL } from "@/app/api/sound-guess-games/public/[id]/route";
import { GET as GET_PUBLIC_LIST } from "@/app/api/sound-guess-games/public/route";

function params(id = "game-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/sound-guess-games/public routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists published games", async () => {
    mocks.getPublicSoundGuessGames.mockResolvedValue([
      { id: "game-1", title: "Mystery sounds", soundCount: 1 },
    ]);

    const response = await GET_PUBLIC_LIST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: "game-1", title: "Mystery sounds", soundCount: 1 },
    ]);
  });

  it("loads public detail with answers for client-run gameplay", async () => {
    mocks.getPublicSoundGuessGameById.mockResolvedValue({
      id: "game-1",
      sounds: [
        {
          id: "sound-1",
          audioPath: "/uploads/sound-guess/audio/bell.mp3",
          answer: "Bell",
        },
      ],
    });

    const response = await GET_PUBLIC_DETAIL(
      new Request("http://localhost") as never,
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "game-1",
      sounds: [
        {
          id: "sound-1",
          audioPath: "/uploads/sound-guess/audio/bell.mp3",
          answer: "Bell",
        },
      ],
    });
  });

  it("returns 404 when a public game is missing", async () => {
    mocks.getPublicSoundGuessGameById.mockResolvedValue(null);

    const response = await GET_PUBLIC_DETAIL(
      new Request("http://localhost") as never,
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });
});

