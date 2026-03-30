"use client";

import { create } from "zustand";

interface UIState {
  initialTitle: string;
  title: string;
  titleDraft: string;
  isEditingTitle: boolean;
  isAddItemOpen: boolean;
  isTierSettingsOpen: boolean;
  isItemSettingsOpen: boolean;
  isExporting: boolean;
  initializeTitle: (title: string) => void;
  startEditTitle: () => void;
  setTitleDraft: (draft: string) => void;
  commitTitle: () => void;
  cancelEditTitle: () => void;
  resetTitle: () => void;
  setAddItemOpen: (open: boolean) => void;
  setTierSettingsOpen: (open: boolean) => void;
  setItemSettingsOpen: (open: boolean) => void;
  setExporting: (val: boolean) => void;
}

const DEFAULT_TITLE = "Edit Your Title Name Tier List";

export const useUIStore = create<UIState>((set) => ({
  initialTitle: DEFAULT_TITLE,
  title: DEFAULT_TITLE,
  titleDraft: "",
  isEditingTitle: false,
  isAddItemOpen: false,
  isTierSettingsOpen: false,
  isItemSettingsOpen: false,
  isExporting: false,

  initializeTitle: (title) =>
    set({
      initialTitle: title,
      title,
      titleDraft: title,
      isEditingTitle: false,
    }),

  startEditTitle: () =>
    set((state) => ({
      titleDraft: state.title,
      isEditingTitle: true,
    })),

  setTitleDraft: (draft) => set({ titleDraft: draft }),

  commitTitle: () =>
    set((state) => {
      const value = state.titleDraft.trim();
      return {
        title: value ? value : state.title,
        titleDraft: value ? value : state.title,
        isEditingTitle: false,
      };
    }),

  cancelEditTitle: () =>
    set((state) => ({
      titleDraft: state.title,
      isEditingTitle: false,
    })),

  resetTitle: () =>
    set((state) => ({
      title: state.initialTitle,
      titleDraft: state.initialTitle,
      isEditingTitle: false,
    })),

  setAddItemOpen: (open) => set({ isAddItemOpen: open }),
  setTierSettingsOpen: (open) => set({ isTierSettingsOpen: open }),
  setItemSettingsOpen: (open) => set({ isItemSettingsOpen: open }),
  setExporting: (val) => set({ isExporting: val }),
}));
