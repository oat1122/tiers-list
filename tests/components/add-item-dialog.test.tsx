// @vitest-environment jsdom

import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addItemToPool: vi.fn(),
  onClose: vi.fn(),
}));

vi.mock("@/store/useTierStore", () => ({
  useTierStore: (
    selector: (state: { addItemToPool: typeof mocks.addItemToPool }) => unknown,
  ) =>
    selector({
      addItemToPool: mocks.addItemToPool,
    }),
}));

vi.mock("@/components/image-crop-dialog", () => ({
  ImageCropDialog: ({
    open,
    onCancel,
    onConfirm,
  }: {
    open: boolean;
    onCancel: () => void;
    onConfirm: (file: File) => Promise<void> | void;
  }) =>
    open ? (
      <div data-testid="crop-dialog">
        <button
          data-testid="crop-confirm"
          onClick={() =>
            void onConfirm(
              new File(["processed"], "cropped.webp", { type: "image/webp" }),
            )
          }
        >
          Confirm crop
        </button>
        <button data-testid="crop-cancel" onClick={onCancel}>
          Cancel crop
        </button>
      </div>
    ) : null,
}));

import { AddItemDialog } from "@/components/add-item-dialog";

function createFileList(files: File[]): FileList {
  return {
    ...files,
    length: files.length,
    item: (index: number) => files[index] ?? null,
    [Symbol.iterator]: function* iterator() {
      for (const file of files) {
        yield file;
      }
    },
  } as unknown as FileList;
}

function DialogHarness() {
  const [open, setOpen] = useState(true);

  return <AddItemDialog open={open} onClose={() => setOpen(false)} />;
}

describe("AddItemDialog", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tempUploadPath: "/uploads/tier-items/temp/temp-image.webp",
      }),
    }));
    vi.stubGlobal(
      "URL",
      Object.assign(globalThis.URL ?? {}, {
        createObjectURL: vi.fn(() => "blob:preview"),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("shows helper text for image uploads", async () => {
    await act(async () => {
      root.render(<AddItemDialog open onClose={mocks.onClose} />);
    });

    expect(document.body.textContent).toContain("1080x1080");
    expect(document.body.textContent).toContain("1:1");
    expect(document.body.textContent).toContain("JPEG, PNG, WEBP");
  });

  it("opens crop flow before temp upload in template mode", async () => {
    await act(async () => {
      root.render(
        <AddItemDialog
          open
          onClose={mocks.onClose}
          uploadContext={{ listId: "list-1" }}
        />,
      );
    });

    const fileInput = document.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    const sourceFile = new File(["source"], "draft.png", { type: "image/png" });
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: createFileList([sourceFile]),
    });

    await act(async () => {
      fileInput?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.addItemToPool).not.toHaveBeenCalled();
    expect(document.querySelector('[data-testid="crop-dialog"]')).not.toBeNull();

    await act(async () => {
      (
        document.querySelector('[data-testid="crop-confirm"]') as HTMLButtonElement
      )?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/tier-lists/list-1/items/upload-image-temp",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(mocks.addItemToPool).toHaveBeenCalledWith(
      expect.objectContaining({
        itemType: "image",
        name: "draft",
        tempUploadPath: "/uploads/tier-items/temp/temp-image.webp",
      }),
    );
    expect(mocks.onClose).toHaveBeenCalled();
  });

  it("shows an inline error for GIF files and skips crop", async () => {
    await act(async () => {
      root.render(<AddItemDialog open onClose={mocks.onClose} />);
    });

    const fileInput = document.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    const sourceFile = new File(["gif"], "animated.gif", { type: "image/gif" });
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: createFileList([sourceFile]),
    });

    await act(async () => {
      fileInput?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(document.body.textContent).toContain("GIF ยังไม่รองรับ");
    expect(document.querySelector('[data-testid="crop-dialog"]')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.addItemToPool).not.toHaveBeenCalled();
  });

  it("does not upload or add an item when crop is cancelled", async () => {
    await act(async () => {
      root.render(
        <AddItemDialog
          open
          onClose={mocks.onClose}
          uploadContext={{ listId: "list-1" }}
        />,
      );
    });

    const fileInput = document.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement | null;

    const sourceFile = new File(["source"], "draft.png", { type: "image/png" });
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: createFileList([sourceFile]),
    });

    await act(async () => {
      fileInput?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      (
        document.querySelector('[data-testid="crop-cancel"]') as HTMLButtonElement
      )?.click();
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.addItemToPool).not.toHaveBeenCalled();
  });

  it("closes after crop without triggering render-phase update warnings", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await act(async () => {
      root.render(<DialogHarness />);
    });

    const fileInput = document.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement | null;

    const sourceFile = new File(["source"], "draft.png", { type: "image/png" });
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: createFileList([sourceFile]),
    });

    await act(async () => {
      fileInput?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      (
        document.querySelector('[data-testid="crop-confirm"]') as HTMLButtonElement
      )?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.body.textContent).not.toContain("Add Items");
    expect(
      consoleError.mock.calls.flat().map(String).join("\n"),
    ).not.toContain("Cannot update a component");

    consoleError.mockRestore();
  });
});
