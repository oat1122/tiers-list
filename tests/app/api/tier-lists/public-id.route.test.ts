import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublicTierListEditorData: vi.fn(),
}));

vi.mock("@/services/tier-lists.service", () => ({
  getPublicTierListEditorData: mocks.getPublicTierListEditorData,
}));

import { GET } from "@/app/api/tier-lists/public/[id]/route";

function params(id = "public-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/tier-lists/public/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns public editor data for an existing public tier list", async () => {
    mocks.getPublicTierListEditorData.mockResolvedValue({
      listId: "public-1",
      title: "Anime Rankings",
      description: "Community picks",
      editorConfig: {
        cardSize: "md",
        tiers: [{ id: "S", label: "S", color: "#ff7f7f", order: 0 }],
      },
      items: [],
      updatedAt: "2026-03-30T00:00:00.000Z",
    });

    const response = await GET(
      new Request("http://localhost") as never,
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ listId: "public-1" }),
    );
    expect(mocks.getPublicTierListEditorData).toHaveBeenCalledWith("public-1");
  });

  it("returns 404 when the requested list is missing or not public", async () => {
    mocks.getPublicTierListEditorData.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost") as never,
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("returns 400 when the route param is invalid", async () => {
    const response = await GET(
      new Request("http://localhost") as never,
      { params: Promise.resolve({ id: "" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.fieldErrors.id).toBeTruthy();
    expect(mocks.getPublicTierListEditorData).not.toHaveBeenCalled();
  });
});
