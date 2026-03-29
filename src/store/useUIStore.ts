"use client";

import { create } from "zustand";

interface UIState {
  // ─── Title ───────────────────────────────────────────────
  title: string;
  titleDraft: string;
  isEditingTitle: boolean;

  // ─── Dialog flags ────────────────────────────────────────
  isAddItemOpen: boolean;
  isTierSettingsOpen: boolean;
  isItemSettingsOpen: boolean;

  // ─── Export ──────────────────────────────────────────────
  isExporting: boolean;

  // ─── Title actions ───────────────────────────────────────
  startEditTitle: () => void;
  setTitleDraft: (draft: string) => void;
  commitTitle: () => void;
  cancelEditTitle: () => void;

  // ─── Dialog actions ──────────────────────────────────────
  setAddItemOpen: (open: boolean) => void;
  setTierSettingsOpen: (open: boolean) => void;
  setItemSettingsOpen: (open: boolean) => void;

  // ─── Export actions ──────────────────────────────────────
  setExporting: (val: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // ─── Initial state ───────────────────────────────────────
  title: "Edit Your Title Name Tier List",
  titleDraft: "",
  isEditingTitle: false,

  isAddItemOpen: false,
  isTierSettingsOpen: false,
  isItemSettingsOpen: false,

  isExporting: false,

  // ─── Title actions ───────────────────────────────────────
  startEditTitle: () =>
    set((state) => ({
      titleDraft: state.title,
      isEditingTitle: true,
    })),

  setTitleDraft: (draft) => set({ titleDraft: draft }),

  commitTitle: () =>
    set((state) => {
      const val = state.titleDraft.trim();
      return {
        title: val ? val : state.title,
        isEditingTitle: false,
      };
    }),

  cancelEditTitle: () => set({ isEditingTitle: false }),

  // ─── Dialog actions ──────────────────────────────────────
  setAddItemOpen: (open) => set({ isAddItemOpen: open }),
  setTierSettingsOpen: (open) => set({ isTierSettingsOpen: open }),
  setItemSettingsOpen: (open) => set({ isItemSettingsOpen: open }),

  // ─── Export actions ──────────────────────────────────────
  setExporting: (val) => set({ isExporting: val }),
}));
