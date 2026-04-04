import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
  createPictureRevealGame: vi.fn(),
  getAdminPictureRevealGames: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.authGetSession,
    },
  },
}));

vi.mock("@/services/picture-reveal-games.service", () => ({
  createPictureRevealGame: mocks.createPictureRevealGame,
  getAdminPictureRevealGames: mocks.getAdminPictureRevealGames,
}));

import { GET, POST } from "@/app/api/picture-reveal-games/route";

function createJsonRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/picture-reveal-games", {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("/api/picture-reveal-games route", () => {
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
  });

  it("returns the admin games list for admins", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });
    mocks.getAdminPictureRevealGames.mockResolvedValue([
      { id: "game-1", title: "Animals" },
    ]);

    const response = await GET(createJsonRequest("GET") as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: "game-1", title: "Animals" },
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
    expect(mocks.createPictureRevealGame).not.toHaveBeenCalled();
  });

  it("creates a game for an admin user", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });
    mocks.createPictureRevealGame.mockResolvedValue({ id: "game-1" });

    const response = await POST(
      createJsonRequest("POST", { title: "Animals" }) as never,
    );

    expect(response.status).toBe(201);
    expect(mocks.createPictureRevealGame).toHaveBeenCalledWith(
      {
        title: "Animals",
        status: "draft",
        mode: "single",
        startScore: 1000,
        openTilePenalty: 50,
        specialTilePenalty: 200,
      },
      "admin-1",
    );
  });
});
