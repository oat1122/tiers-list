import { describe, expect, it } from "vitest";
import type { AdminTierListSummaryDto } from "@/types/admin-dashboard";
import {
  buildFormState,
  extractApiError,
  filterActiveLists,
  getErrorMessage,
  matchesFilter,
} from "@/app/dashboard/_components/dashboard-panel.utils";

function createList(
  overrides: Partial<AdminTierListSummaryDto> = {},
): AdminTierListSummaryDto {
  return {
    id: "list-1",
    title: "Anime Power Ranking",
    description: "Best fighters in the season",
    isPublic: 0,
    isTemplate: 0,
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
    deletedAt: null,
    itemCount: 5,
    owner: {
      id: "user-1",
      name: "Mavelus",
      email: "mavelus@example.com",
    },
    preview: null,
    ...overrides,
  };
}

describe("dashboard-panel.utils", () => {
  it("filters active lists by title, description, owner name, and owner email", () => {
    const titleMatch = createList();
    const descriptionMatch = createList({
      id: "list-2",
      title: "Movie Tier List",
      description: "Ranking anime openings",
    });
    const ownerMatch = createList({
      id: "list-3",
      title: "Games",
      owner: {
        id: "user-2",
        name: "Anime Admin",
        email: "owner@example.com",
      },
    });
    const emailMatch = createList({
      id: "list-4",
      title: "Shows",
      owner: {
        id: "user-3",
        name: "Owner",
        email: "anime@example.com",
      },
    });
    const nonMatch = createList({
      id: "list-5",
      title: "Books",
      description: "Literature only",
      owner: {
        id: "user-4",
        name: "Reader",
        email: "reader@example.com",
      },
    });

    expect(
      filterActiveLists(
        [titleMatch, descriptionMatch, ownerMatch, emailMatch, nonMatch],
        "anime",
        "all",
      ).map((list) => list.id),
    ).toEqual(["list-1", "list-2", "list-3", "list-4"]);
  });

  it("matches status filters correctly", () => {
    const publicList = createList({ isPublic: 1 });
    const privateList = createList({ isPublic: 0 });
    const templateList = createList({ isTemplate: 1 });

    expect(matchesFilter(publicList, "all")).toBe(true);
    expect(matchesFilter(publicList, "public")).toBe(true);
    expect(matchesFilter(privateList, "private")).toBe(true);
    expect(matchesFilter(templateList, "template")).toBe(true);
    expect(matchesFilter(privateList, "public")).toBe(false);
  });

  it("builds form state with defaults from a tier list summary", () => {
    expect(buildFormState()).toEqual({
      title: "",
      description: "",
      isPublic: false,
      isTemplate: false,
    });

    expect(
      buildFormState(
        createList({
          description: null,
          isPublic: 1,
          isTemplate: 1,
        }),
      ),
    ).toEqual({
      title: "Anime Power Ranking",
      description: "",
      isPublic: true,
      isTemplate: true,
    });
  });

  it("returns fallback values for incomplete api and error payloads", () => {
    expect(extractApiError({})).toBeNull();
    expect(extractApiError({ error: 500 })).toBeNull();
    expect(getErrorMessage({})).toBe("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });
});
