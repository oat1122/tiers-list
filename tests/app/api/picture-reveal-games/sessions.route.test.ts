import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
  createPictureRevealSession: vi.fn(),
  getAdminPictureRevealSessionHistory: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.authGetSession,
    },
  },
}));

vi.mock("@/services/picture-reveal-play.service", async () => {
  const actual = await vi.importActual<typeof import("@/services/picture-reveal-play.service")>(
    "@/services/picture-reveal-play.service",
  );

  return {
    ...actual,
    createPictureRevealSession: mocks.createPictureRevealSession,
    getAdminPictureRevealSessionHistory: mocks.getAdminPictureRevealSessionHistory,
  };
});

import { GET, POST } from "@/app/api/picture-reveal-games/[id]/sessions/route";

function createRequest(url: string, method: string) {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
    },
  });
}

function params(id = "game-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/picture-reveal-games/[id]/sessions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 for non-admin session history requests", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });

    const response = await GET(
      createRequest(
        "http://localhost/api/picture-reveal-games/game-1/sessions",
        "GET",
      ) as never,
      params(),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("returns admin session history when authorized", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });
    mocks.getAdminPictureRevealSessionHistory.mockResolvedValue([
      { id: "session-1" },
    ]);

    const response = await GET(
      createRequest(
        "http://localhost/api/picture-reveal-games/game-1/sessions?limit=10",
        "GET",
      ) as never,
      params(),
    );

    expect(response.status).toBe(200);
    expect(mocks.getAdminPictureRevealSessionHistory).toHaveBeenCalledWith(
      "game-1",
      { limit: 10 },
    );
  });

  it("sets the anonymous player token cookie when creating a session", async () => {
    mocks.createPictureRevealSession.mockResolvedValue({
      session: { id: "session-1" },
      issuedPlayerToken: "token-1",
    });

    const response = await POST(
      createRequest(
        "http://localhost/api/picture-reveal-games/game-1/sessions",
        "POST",
      ) as never,
      params(),
    );

    expect(response.status).toBe(201);
    expect(mocks.createPictureRevealSession).toHaveBeenCalledWith("game-1", null);
    expect(response.headers.get("set-cookie")).toContain(
      "picture_reveal_player_token=token-1",
    );
  });
});
