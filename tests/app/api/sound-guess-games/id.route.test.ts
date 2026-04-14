import { beforeEach, describe, expect, it, vi } from "vitest";
import { SoundGuessServiceError } from "@/services/sound-guess-errors";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
  getSoundGuessGameById: vi.fn(),
  softDeleteSoundGuessGame: vi.fn(),
  updateSoundGuessGame: vi.fn(),
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
  softDeleteSoundGuessGame: mocks.softDeleteSoundGuessGame,
  updateSoundGuessGame: mocks.updateSoundGuessGame,
}));

import { PATCH } from "@/app/api/sound-guess-games/[id]/route";

function createJsonRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/sound-guess-games/game-1", {
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

describe("/api/sound-guess-games/[id] route", () => {
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

  it("returns 400 when publishing without a sound", async () => {
    mocks.updateSoundGuessGame.mockRejectedValue(
      new SoundGuessServiceError(
        400,
        "Published games require at least one sound",
      ),
    );

    const response = await PATCH(
      createJsonRequest("PATCH", { status: "published" }) as never,
      params(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Published games require at least one sound",
    });
  });

  it("returns 400 when the route param is invalid", async () => {
    const response = await PATCH(
      createJsonRequest("PATCH", { title: "Updated" }) as never,
      params(""),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateSoundGuessGame).not.toHaveBeenCalled();
  });
});

