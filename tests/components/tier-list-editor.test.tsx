// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialogProvider } from "@/components/confirm-dialog-provider";
import type { TemplateEditorPageData } from "@/types";

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  moveItem: vi.fn(),
  moveRow: vi.fn(),
  initializeTitle: vi.fn(),
  startEditTitle: vi.fn(),
  setTitleDraft: vi.fn(),
  commitTitle: vi.fn(),
  cancelEditTitle: vi.fn(),
  toolbar: vi.fn(() => <div data-testid="toolbar" />),
}));

vi.mock("@/store/useTierStore", () => ({
  useTierStore: () => ({
    tiers: [],
    pool: [],
    cardSize: "md",
    initialize: mocks.initialize,
    moveItem: mocks.moveItem,
    moveRow: mocks.moveRow,
  }),
}));

vi.mock("@/store/useUIStore", () => ({
  useUIStore: () => ({
    title: "Editor title",
    titleDraft: "Editor title",
    isEditingTitle: false,
    initializeTitle: mocks.initializeTitle,
    startEditTitle: mocks.startEditTitle,
    setTitleDraft: mocks.setTitleDraft,
    commitTitle: mocks.commitTitle,
    cancelEditTitle: mocks.cancelEditTitle,
  }),
}));

vi.mock("@/components/item-pool", () => ({
  ItemPool: () => <div data-testid="item-pool" />,
}));

vi.mock("@/components/tier-row", () => ({
  TierRow: () => <div data-testid="tier-row" />,
}));

vi.mock("@/components/toolbar", () => ({
  Toolbar: mocks.toolbar,
}));

vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Droppable: ({
    children,
  }: {
    children: (provided: {
      innerRef: () => void;
      droppableProps: Record<string, never>;
      placeholder: null;
    }) => React.ReactNode;
  }) =>
    children({
      innerRef: () => undefined,
      droppableProps: {},
      placeholder: null,
    }),
}));

import { TierListEditor } from "@/components/tier-list-editor";

function createInitialData(): TemplateEditorPageData {
  return {
    listId: "public-1",
    title: "Anime Rankings",
    description: "Community picks",
    editorConfig: {
      cardSize: "lg",
      tiers: [{ id: "S", label: "S", color: "#ff7f7f", order: 0 }],
    },
    items: [
      {
        id: "item-1",
        label: "Gojo",
        tier: "S",
        position: 0,
        itemType: "text",
        showCaption: 1,
      },
      {
        id: "item-2",
        label: "Waiting",
        tier: "pool",
        position: 0,
        itemType: "text",
        showCaption: 1,
      },
    ],
    updatedAt: "2026-03-30T00:00:00.000Z",
  };
}

describe("TierListEditor initialization", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("initializes a blank local editor when no preload data is provided", async () => {
    await act(async () => {
      root.render(
        <ConfirmDialogProvider>
          <TierListEditor mode="local" />
        </ConfirmDialogProvider>,
      );
    });

    expect(mocks.initializeTitle).toHaveBeenLastCalledWith(
      "Edit Your Title Name Tier List",
    );
    expect(mocks.initialize).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cardSize: "md",
        pool: [],
      }),
    );
  });

  it("hydrates local mode from preloaded public editor data", async () => {
    await act(async () => {
      root.render(
        <ConfirmDialogProvider>
          <TierListEditor mode="local" initialData={createInitialData()} />
        </ConfirmDialogProvider>,
      );
    });

    expect(mocks.initializeTitle).toHaveBeenLastCalledWith("Anime Rankings");
    expect(mocks.initialize).toHaveBeenLastCalledWith({
      cardSize: "lg",
      pool: [
        expect.objectContaining({
          id: "item-2",
          name: "Waiting",
        }),
      ],
      tiers: [
        expect.objectContaining({
          id: "S",
          items: [
            expect.objectContaining({
              id: "item-1",
              name: "Gojo",
              persistedId: "item-1",
            }),
          ],
        }),
      ],
    });
  });

  it("keeps template mode wired to the template save toolbar flow", async () => {
    await act(async () => {
      root.render(
        <ConfirmDialogProvider>
          <TierListEditor mode="template" initialData={createInitialData()} />
        </ConfirmDialogProvider>,
      );
    });

    const lastToolbarProps = mocks.toolbar.mock.calls.at(-1)?.[0];

    expect(lastToolbarProps).toEqual(
      expect.objectContaining({
        mode: "template",
        listId: "public-1",
        onSave: expect.any(Function),
      }),
    );
  });
});
