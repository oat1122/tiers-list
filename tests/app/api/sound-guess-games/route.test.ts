import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
  createSoundGuessGame: vi.fn(),
  getAdminSoundGuessGames: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.authGetSession,
    },
  },
}));

vi.mock("@/services/sound-guess-games.service", () => ({
  createSoundGuessGame: mocks.createSoundGuessGame,
  getAdminSoundGuessGames: mocks.getAdminSoundGuessGames,
}));

import { GET, POST } from "@/app/api/sound-guess-games/route";

function createJsonRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/sound-guess-games", {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("/api/sound-guess-games route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when a non-admin requests the admin list", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });

    const response = await GET(createJsonRequest("GET") as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(mocks.getAdminSoundGuessGames).not.toHaveBeenCalled();
  });

  it("returns the admin games list for admins", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });
    mocks.getAdminSoundGuessGames.mockResolvedValue([
      { id: "game-1", title: "Mystery sounds", soundCount: 2 },
    ]);

    const response = await GET(createJsonRequest("GET") as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: "game-1", title: "Mystery sounds", soundCount: 2 },
    ]);
  });

  it("returns 400 when POST validation fails", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });

    const response = await POST(
      createJsonRequest("POST", { title: "" }) as never,
    );

    expect(response.status).toBe(400);
    expect(mocks.createSoundGuessGame).not.toHaveBeenCalled();
  });

  it("creates a draft game for an admin user", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });
    mocks.createSoundGuessGame.mockResolvedValue({ id: "game-1" });

    const response = await POST(
      createJsonRequest("POST", { title: "Mystery sounds" }) as never,
    );

    expect(response.status).toBe(201);
    expect(mocks.createSoundGuessGame).toHaveBeenCalledWith(
      {
        title: "Mystery sounds",
        status: "draft",
      },
      "admin-1",
    );
  });
});

