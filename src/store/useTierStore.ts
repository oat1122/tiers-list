"use client";

import { create } from "zustand";
import { TierRow, TierItem, CardSize } from "@/types";

const DEFAULT_TIERS: TierRow[] = [
  { id: "S", label: "S", color: "#ff7f7f", items: [] },
  { id: "A", label: "A", color: "#ffbf7f", items: [] },
  { id: "B", label: "B", color: "#ffdf7f", items: [] },
  { id: "C", label: "C", color: "#ffff7f", items: [] },
  { id: "D", label: "D", color: "#bfff7f", items: [] },
];

interface TierStore {
  tiers: TierRow[];
  pool: TierItem[];
  cardSize: CardSize;
  setCardSize: (size: CardSize) => void;
  addTier: (tier: TierRow) => void;
  removeTier: (tierId: string) => void;
  renameTier: (tierId: string, label: string) => void;
  setTierColor: (tierId: string, color: string) => void;
  moveRow: (fromIndex: number, toIndex: number) => void;
  addItemToPool: (item: TierItem) => void;
  removeItem: (itemId: string) => void;
  returnItemToPool: (itemId: string) => void;
  renameItem: (itemId: string, name: string) => void;
  moveItem: (
    itemId: string,
    fromTierId: string | "pool",
    toTierId: string | "pool",
    toIndex: number,
  ) => void;
  resetItems: () => void;
  reset: () => void;
}

export const useTierStore = create<TierStore>((set) => ({
  tiers: DEFAULT_TIERS,
  pool: [],
  cardSize: "md",

  setCardSize: (size) => set({ cardSize: size }),

  addTier: (tier) => set((state) => ({ tiers: [...state.tiers, tier] })),

  removeTier: (tierId) =>
    set((state) => ({
      tiers: state.tiers.filter((t) => t.id !== tierId),
      pool: [
        ...state.pool,
        ...(state.tiers.find((t) => t.id === tierId)?.items ?? []),
      ],
    })),

  renameTier: (tierId, label) =>
    set((state) => ({
      tiers: state.tiers.map((t) => (t.id === tierId ? { ...t, label } : t)),
    })),

  setTierColor: (tierId, color) =>
    set((state) => ({
      tiers: state.tiers.map((t) => (t.id === tierId ? { ...t, color } : t)),
    })),

  moveRow: (fromIndex, toIndex) =>
    set((state) => {
      const tiers = [...state.tiers];
      const [removed] = tiers.splice(fromIndex, 1);
      tiers.splice(toIndex, 0, removed);
      return { tiers };
    }),

  addItemToPool: (item) => set((state) => ({ pool: [...state.pool, item] })),

  removeItem: (itemId) =>
    set((state) => ({
      tiers: state.tiers.map((t) => ({
        ...t,
        items: t.items.filter((i) => i.id !== itemId),
      })),
      pool: state.pool.filter((i) => i.id !== itemId),
    })),

  returnItemToPool: (itemId) =>
    set((state) => {
      let found: TierItem | undefined;
      const tiers = state.tiers.map((t) => {
        const item = t.items.find((i) => i.id === itemId);
        if (item) {
          found = item;
          return { ...t, items: t.items.filter((i) => i.id !== itemId) };
        }
        return t;
      });
      return found ? { tiers, pool: [...state.pool, found] } : state;
    }),

  renameItem: (itemId, name) =>
    set((state) => ({
      tiers: state.tiers.map((t) => ({
        ...t,
        items: t.items.map((i) => (i.id === itemId ? { ...i, name } : i)),
      })),
      pool: state.pool.map((i) => (i.id === itemId ? { ...i, name } : i)),
    })),

  moveItem: (itemId, fromTierId, toTierId, toIndex) =>
    set((state) => {
      let item: TierItem | undefined;

      let newTiers = state.tiers.map((t) => {
        if (t.id === fromTierId) {
          item = t.items.find((i) => i.id === itemId);
          return { ...t, items: t.items.filter((i) => i.id !== itemId) };
        }
        return t;
      });
      let newPool = state.pool.filter((i) => {
        if (fromTierId === "pool" && i.id === itemId) {
          item = i;
          return false;
        }
        return true;
      });

      if (!item) return state;

      if (toTierId === "pool") {
        newPool = [
          ...newPool.slice(0, toIndex),
          item,
          ...newPool.slice(toIndex),
        ];
      } else {
        newTiers = newTiers.map((t) => {
          if (t.id === toTierId) {
            const items = [...t.items];
            items.splice(toIndex, 0, item!);
            return { ...t, items };
          }
          return t;
        });
      }

      return { tiers: newTiers, pool: newPool };
    }),

  resetItems: () =>
    set((state) => ({
      pool: [...state.pool, ...state.tiers.flatMap((t) => t.items)],
      tiers: state.tiers.map((t) => ({ ...t, items: [] })),
    })),

  reset: () => set({ tiers: DEFAULT_TIERS, pool: [] }),
}));
