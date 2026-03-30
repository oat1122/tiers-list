import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    select: mocks.select,
  },
}));

import { getPublicTierListGallery } from "@/services/tier-lists.service";

function createSummaryQuery(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
  };
}

function createPreviewListsQuery(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  };
}

function createPreviewItemsQuery(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
  };
}

describe("getPublicTierListGallery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns public summaries in query order with preview and pool counts", async () => {
    const updatedAt = new Date("2026-03-30T10:00:00.000Z");

    mocks.select
      .mockReturnValueOnce(
        createSummaryQuery([
          {
            id: "public-1",
            title: "Anime Rankings",
            description: "Community picks",
            updatedAt,
            itemCount: 3,
          },
        ]),
      )
      .mockReturnValueOnce(
        createPreviewListsQuery([
          {
            id: "public-1",
            title: "Anime Rankings",
            description: "Community picks",
            editorConfig: null,
            updatedAt,
          },
        ]),
      )
      .mockReturnValueOnce(
        createPreviewItemsQuery([
          {
            id: "item-1",
            tierListId: "public-1",
            label: "Gojo",
            tier: "S",
            position: 0,
            itemType: "text",
            imagePath: null,
            showCaption: 1,
            createdAt: updatedAt,
            deletedAt: null,
          },
          {
            id: "item-2",
            tierListId: "public-1",
            label: "Waiting",
            tier: "pool",
            position: 0,
            itemType: "text",
            imagePath: null,
            showCaption: 1,
            createdAt: updatedAt,
            deletedAt: null,
          },
        ]),
      );

    const result = await getPublicTierListGallery();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "public-1",
      title: "Anime Rankings",
      itemCount: 3,
      updatedAt,
      preview: {
        poolCount: 1,
      },
    });
    expect(result[0].preview?.rows[0]).toMatchObject({
      id: "S",
      label: "S",
      itemCount: 1,
      items: [{ label: "Gojo", itemType: "text" }],
    });
  });

  it("returns an empty array without loading previews when no public rows exist", async () => {
    mocks.select.mockReturnValueOnce(createSummaryQuery([]));

    const result = await getPublicTierListGallery();

    expect(result).toEqual([]);
    expect(mocks.select).toHaveBeenCalledTimes(1);
  });
});
