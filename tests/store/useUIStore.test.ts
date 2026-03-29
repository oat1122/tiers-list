import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "@/store/useUIStore";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      title: "Edit Your Title Name Tier List",
      titleDraft: "",
      isEditingTitle: false,
      isAddItemOpen: false,
      isTierSettingsOpen: false,
      isItemSettingsOpen: false,
      isExporting: false,
    });
  });

  it("starts title editing with the current title as draft", () => {
    useUIStore.getState().startEditTitle();

    const state = useUIStore.getState();
    expect(state.isEditingTitle).toBe(true);
    expect(state.titleDraft).toBe("Edit Your Title Name Tier List");
  });

  it("commits a trimmed title and keeps the original when the draft is blank", () => {
    useUIStore.getState().setTitleDraft("  Updated Tier List  ");
    useUIStore.getState().commitTitle();

    expect(useUIStore.getState().title).toBe("Updated Tier List");

    useUIStore.getState().startEditTitle();
    useUIStore.getState().setTitleDraft("   ");
    useUIStore.getState().commitTitle();

    expect(useUIStore.getState().title).toBe("Updated Tier List");
    expect(useUIStore.getState().isEditingTitle).toBe(false);
  });

  it("toggles dialog and export flags", () => {
    useUIStore.getState().setAddItemOpen(true);
    useUIStore.getState().setTierSettingsOpen(true);
    useUIStore.getState().setItemSettingsOpen(true);
    useUIStore.getState().setExporting(true);

    const state = useUIStore.getState();
    expect(state.isAddItemOpen).toBe(true);
    expect(state.isTierSettingsOpen).toBe(true);
    expect(state.isItemSettingsOpen).toBe(true);
    expect(state.isExporting).toBe(true);
  });
});
