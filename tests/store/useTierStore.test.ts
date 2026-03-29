import { beforeEach, describe, expect, it } from "vitest";
import { useTierStore } from "@/store/useTierStore";
import type { TierItem, TierRow } from "@/types";

function createDefaultTiers(): TierRow[] {
  return [
    { id: "S", label: "S", color: "#ff7f7f", items: [] },
    { id: "A", label: "A", color: "#ffbf7f", items: [] },
    { id: "B", label: "B", color: "#ffdf7f", items: [] },
    { id: "C", label: "C", color: "#ffff7f", items: [] },
    { id: "D", label: "D", color: "#bfff7f", items: [] },
  ];
}

describe("useTierStore", () => {
  beforeEach(() => {
    useTierStore.setState({
      tiers: createDefaultTiers(),
      pool: [],
      cardSize: "md",
    });
  });

  it("moves an item from the pool into a tier", () => {
    const item: TierItem = { id: "item-1", name: "Alpha" };

    useTierStore.getState().addItemToPool(item);
    useTierStore.getState().moveItem("item-1", "pool", "S", 0);

    const state = useTierStore.getState();
    expect(state.pool).toEqual([]);
    expect(state.tiers[0].items).toEqual([item]);
  });

  it("returns a tier item back to the pool", () => {
    useTierStore.setState({
      tiers: createDefaultTiers().map((tier) =>
        tier.id === "S"
          ? {
              ...tier,
              items: [{ id: "item-1", name: "Alpha" }],
            }
          : tier,
      ),
      pool: [],
    });

    useTierStore.getState().returnItemToPool("item-1");

    const state = useTierStore.getState();
    expect(state.tiers[0].items).toEqual([]);
    expect(state.pool).toEqual([{ id: "item-1", name: "Alpha" }]);
  });

  it("removes a tier and moves its items back to the pool", () => {
    useTierStore.setState({
      tiers: [
        ...createDefaultTiers(),
        {
          id: "E",
          label: "E",
          color: "#000000",
          items: [{ id: "item-1", name: "Alpha" }],
        },
      ],
      pool: [],
    });

    useTierStore.getState().removeTier("E");

    const state = useTierStore.getState();
    expect(state.tiers.find((tier) => tier.id === "E")).toBeUndefined();
    expect(state.pool).toEqual([{ id: "item-1", name: "Alpha" }]);
  });

  it("resets all ranked items back into the pool", () => {
    useTierStore.setState({
      tiers: createDefaultTiers().map((tier) =>
        tier.id === "S"
          ? {
              ...tier,
              items: [{ id: "item-1", name: "Alpha" }],
            }
          : tier,
      ),
      pool: [{ id: "item-2", name: "Beta" }],
    });

    useTierStore.getState().resetItems();

    const state = useTierStore.getState();
    expect(state.tiers.every((tier) => tier.items.length === 0)).toBe(true);
    expect(state.pool).toEqual([
      { id: "item-2", name: "Beta" },
      { id: "item-1", name: "Alpha" },
    ]);
  });
});
