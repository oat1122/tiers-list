import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insertValues: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    insert: mocks.insert,
    select: mocks.select,
  },
}));

import { createFromTemplate, createTierList } from "@/services/tier-lists.service";

function createSelectByIdQuery(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
}

describe("tier list mutation services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insert.mockReturnValue({
      values: mocks.insertValues.mockResolvedValue(undefined),
    });
  });

  it("returns the inserted tier list by its generated id", async () => {
    let insertedValues: Record<string, unknown> | null = null;
    mocks.insertValues.mockImplementation(async (values) => {
      insertedValues = values as Record<string, unknown>;
    });
    mocks.select.mockImplementation(() =>
      createSelectByIdQuery([
        {
          id: insertedValues?.id,
          userId: insertedValues?.userId,
          title: insertedValues?.title,
        },
      ]),
    );

    const created = await createTierList(
      {
        title: "Deterministic create",
        description: "test",
        isPublic: 1,
        isTemplate: 0,
      },
      "user-1",
    );

    expect(insertedValues).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        userId: "user-1",
        title: "Deterministic create",
      }),
    );
    expect(created).toEqual(
      expect.objectContaining({
        id: insertedValues?.id,
        userId: "user-1",
        title: "Deterministic create",
      }),
    );
  });

  it("rejects soft-deleted templates before cloning", async () => {
    mocks.select.mockReturnValueOnce(
      createSelectByIdQuery([
        {
          id: "template-1",
          isTemplate: 1,
          deletedAt: new Date("2026-03-31T00:00:00.000Z"),
        },
      ]),
    );

    await expect(
      createFromTemplate("template-1", "user-1"),
    ).rejects.toThrow("Template not found");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
