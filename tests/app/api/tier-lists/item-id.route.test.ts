import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
  getTierListById: vi.fn(),
  getTierItemById: vi.fn(),
  updateTierItem: vi.fn(),
  softDeleteTierItem: vi.fn(),
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
}));

vi.mock("@/services/tier-items.service", () => ({
  getTierItemById: mocks.getTierItemById,
  updateTierItem: mocks.updateTierItem,
  softDeleteTierItem: mocks.softDeleteTierItem,
}));

import { PATCH } from "@/app/api/tier-lists/[id]/items/[itemId]/route";

function createJsonRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/tier-lists/list-1/items/item-1", {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function params() {
  return { params: Promise.resolve({ id: "list-1", itemId: "item-1" }) };
}

describe("/api/tier-lists/[id]/items/[itemId] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps label-only updates partial", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "owner-1", role: "user" },
    });
    mocks.getTierListById.mockResolvedValue({
      id: "list-1",
      userId: "owner-1",
      deletedAt: null,
    });
    mocks.getTierItemById.mockResolvedValue({
      id: "item-1",
      tierListId: "list-1",
      deletedAt: null,
    });

    const response = await PATCH(
      createJsonRequest("PATCH", { label: "Updated label" }) as never,
      params(),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateTierItem).toHaveBeenCalledWith("item-1", {
      label: "Updated label",
    });
  });

  it("returns 400 when validation fails", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "owner-1", role: "user" },
    });
    mocks.getTierListById.mockResolvedValue({
      id: "list-1",
      userId: "owner-1",
      deletedAt: null,
    });
    mocks.getTierItemById.mockResolvedValue({
      id: "item-1",
      tierListId: "list-1",
      deletedAt: null,
    });

    const response = await PATCH(
      createJsonRequest("PATCH", { label: "" }) as never,
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateTierItem).not.toHaveBeenCalled();
  });
});
