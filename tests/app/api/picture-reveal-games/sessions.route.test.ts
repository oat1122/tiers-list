import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.authGetSession,
    },
  },
}));

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

  it("returns 410 for the removed admin session history route", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });

    const response = await GET(
      createRequest(
        "http://localhost/api/picture-reveal-games/game-1/sessions?limit=10",
        "GET",
      ) as never,
      params(),
    );

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error:
        "Picture reveal session routes have been removed. Use the host-run client flow instead.",
    });
  });

  it("returns 410 when clients try to create a session", async () => {
    const response = await POST(
      createRequest(
        "http://localhost/api/picture-reveal-games/game-1/sessions",
        "POST",
      ) as never,
      params(),
    );

    expect(response.status).toBe(410);
    expect(response.headers.get("set-cookie")).toBeNull();
    await expect(response.json()).resolves.toEqual({
      error:
        "Picture reveal session routes have been removed. Use the host-run client flow instead.",
    });
  });
});
