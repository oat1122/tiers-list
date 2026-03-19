'use client';

import { create } from 'zustand';
import { TierRow, TierItem } from '@/types';

const DEFAULT_TIERS: TierRow[] = [
  { id: 'S', label: 'S', color: '#ff7f7f', items: [] },
  { id: 'A', label: 'A', color: '#ffbf7f', items: [] },
  { id: 'B', label: 'B', color: '#ffdf7f', items: [] },
  { id: 'C', label: 'C', color: '#ffff7f', items: [] },
  { id: 'D', label: 'D', color: '#bfff7f', items: [] },
];

interface TierStore {
  tiers: TierRow[];
  pool: TierItem[];
  // Tier mutations
  addTier: (tier: TierRow) => void;
  removeTier: (tierId: string) => void;
  renameTier: (tierId: string, label: string) => void;
  setTierColor: (tierId: string, color: string) => void;
  // Item mutations
  addItemToPool: (item: TierItem) => void;
  removeItem: (itemId: string) => void;
  moveItem: (itemId: string, fromTierId: string | 'pool', toTierId: string | 'pool', toIndex: number) => void;
  // Reset
  reset: () => void;
}

export const useTierStore = create<TierStore>((set) => ({
  tiers: DEFAULT_TIERS,
  pool: [],

  addTier: (tier) =>
    set((state) => ({ tiers: [...state.tiers, tier] })),

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

  addItemToPool: (item) =>
    set((state) => ({ pool: [...state.pool, item] })),

  removeItem: (itemId) =>
    set((state) => ({
      tiers: state.tiers.map((t) => ({
        ...t,
        items: t.items.filter((i) => i.id !== itemId),
      })),
      pool: state.pool.filter((i) => i.id !== itemId),
    })),

  moveItem: (itemId, fromTierId, toTierId, toIndex) =>
    set((state) => {
      let item: TierItem | undefined;

      // Remove from source
      let newTiers = state.tiers.map((t) => {
        if (t.id === fromTierId) {
          item = t.items.find((i) => i.id === itemId);
          return { ...t, items: t.items.filter((i) => i.id !== itemId) };
        }
        return t;
      });
      let newPool = state.pool.filter((i) => {
        if (fromTierId === 'pool' && i.id === itemId) {
          item = i;
          return false;
        }
        return true;
      });

      if (!item) return state;

      // Insert at destination
      if (toTierId === 'pool') {
        newPool = [...newPool.slice(0, toIndex), item, ...newPool.slice(toIndex)];
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

  reset: () => set({ tiers: DEFAULT_TIERS, pool: [] }),
}));
