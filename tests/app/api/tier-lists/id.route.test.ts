import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
  getTierListById: vi.fn(),
  updateTierList: vi.fn(),
  softDeleteTierList: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.authGetSession,
    },
  },
}));

vi.mock("@/services/tier-lists.service", () => ({
  getTierListById: mocks.getTierListById,
  updateTierList: mocks.updateTierList,
  softDeleteTierList: mocks.softDeleteTierList,
}));

import { DELETE, GET, PATCH } from "@/app/api/tier-lists/[id]/route";

function createJsonRequest(method: string, body?: unknown) {
  return new Request(`http://localhost/api/tier-lists/list-1`, {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function params(id = "list-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/tier-lists/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns public lists without requiring a session", async () => {
    mocks.authGetSession.mockResolvedValue(null);
    mocks.getTierListById.mockResolvedValue({
      id: "list-1",
      userId: "owner-1",
      isPublic: 1,
      isTemplate: 0,
      deletedAt: null,
    });

    const response = await GET(createJsonRequest("GET") as never, params());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ id: "list-1" }),
    );
  });

  it("returns 401 for private lists when no session exists", async () => {
    mocks.authGetSession.mockResolvedValue(null);
    mocks.getTierListById.mockResolvedValue({
      id: "list-1",
      userId: "owner-1",
      isPublic: 0,
      isTemplate: 0,
      deletedAt: null,
    });

    const response = await GET(createJsonRequest("GET") as never, params());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when a different non-admin user requests a private list", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "user-2", role: "user" },
    });
    mocks.getTierListById.mockResolvedValue({
      id: "list-1",
      userId: "owner-1",
      isPublic: 0,
      isTemplate: 0,
      deletedAt: null,
    });

    const response = await GET(createJsonRequest("GET") as never, params());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("returns 404 for deleted lists when the requester is not an admin", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });
    mocks.getTierListById.mockResolvedValue({
      id: "list-1",
      userId: "owner-1",
      isPublic: 1,
      isTemplate: 0,
      deletedAt: new Date(),
    });

    const response = await GET(createJsonRequest("GET") as never, params());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("returns 401 for unauthenticated PATCH requests", async () => {
    mocks.authGetSession.mockResolvedValue(null);

    const response = await PATCH(
      createJsonRequest("PATCH", { title: "Updated" }) as never,
      params(),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when PATCH validation fails", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "owner-1", role: "user" },
    });
    mocks.getTierListById.mockResolvedValue({
      id: "list-1",
      userId: "owner-1",
      isPublic: 0,
      isTemplate: 0,
      deletedAt: null,
    });

    const response = await PATCH(
      createJsonRequest("PATCH", { title: "" }) as never,
      params(),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.fieldErrors.title).toBeTruthy();
    expect(mocks.updateTierList).not.toHaveBeenCalled();
  });

  it("strips admin-only template updates for non-admin users", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "owner-1", role: "user" },
    });
    mocks.getTierListById.mockResolvedValue({
      id: "list-1",
      userId: "owner-1",
      isPublic: 0,
      isTemplate: 0,
      deletedAt: null,
    });
    mocks.updateTierList.mockResolvedValue({
      id: "list-1",
      title: "Updated",
    });

    const response = await PATCH(
      createJsonRequest("PATCH", { title: "Updated", isTemplate: 1 }) as never,
      params(),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateTierList).toHaveBeenCalledWith("list-1", {
      title: "Updated",
    });
  });

  it("deletes a list for an authorized owner", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "owner-1", role: "user" },
    });
    mocks.getTierListById.mockResolvedValue({
      id: "list-1",
      userId: "owner-1",
      isPublic: 0,
      isTemplate: 0,
      deletedAt: null,
    });

    const response = await DELETE(
      createJsonRequest("DELETE") as never,
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: "Deleted successfully",
    });
    expect(mocks.softDeleteTierList).toHaveBeenCalledWith("list-1");
  });
});
