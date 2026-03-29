import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
  createTierList: vi.fn(),
  getMyTierLists: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.authGetSession,
    },
  },
}));

vi.mock("@/services/tier-lists.service", () => ({
  createTierList: mocks.createTierList,
  getMyTierLists: mocks.getMyTierLists,
}));

import { GET, POST } from "@/app/api/tier-lists/route";

function createJsonRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/tier-lists", {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("/api/tier-lists route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated GET requests", async () => {
    mocks.authGetSession.mockResolvedValue(null);

    const response = await GET(createJsonRequest("GET") as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.getMyTierLists).not.toHaveBeenCalled();
  });

  it("returns the authenticated user's tier lists", async () => {
    const lists = [{ id: "list-1", title: "Favorites" }];
    mocks.authGetSession.mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });
    mocks.getMyTierLists.mockResolvedValue(lists);

    const response = await GET(createJsonRequest("GET") as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(lists);
    expect(mocks.getMyTierLists).toHaveBeenCalledWith("user-1");
  });

  it("returns 400 when POST validation fails", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });

    const response = await POST(
      createJsonRequest("POST", { title: "" }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.fieldErrors.title).toBeTruthy();
    expect(mocks.createTierList).not.toHaveBeenCalled();
  });

  it("forces non-admin template creation back to a normal list", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });
    mocks.createTierList.mockResolvedValue({ id: "list-1" });

    const response = await POST(
      createJsonRequest("POST", {
        title: "Community Rankings",
        isTemplate: 1,
      }) as never,
    );

    expect(response.status).toBe(201);
    expect(mocks.createTierList).toHaveBeenCalledWith(
      {
        title: "Community Rankings",
        isPublic: 0,
        isTemplate: 0,
      },
      "user-1",
    );
  });

  it("keeps template creation enabled for admins", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });
    mocks.createTierList.mockResolvedValue({ id: "list-1" });

    const response = await POST(
      createJsonRequest("POST", {
        title: "Official Template",
        isTemplate: 1,
        isPublic: 1,
      }) as never,
    );

    expect(response.status).toBe(201);
    expect(mocks.createTierList).toHaveBeenCalledWith(
      {
        title: "Official Template",
        isPublic: 1,
        isTemplate: 1,
      },
      "admin-1",
    );
  });
});
