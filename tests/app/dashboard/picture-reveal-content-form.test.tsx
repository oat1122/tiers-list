// @vitest-environment jsdom

import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PictureRevealContentForm,
  type PictureRevealContentUploadAdapter,
} from "@/app/dashboard/picture-reveal/[id]/edit/_components/picture-reveal-content-form";
import {
  buildPictureRevealContentFormSnapshot,
  type PictureRevealContentFormState,
} from "@/lib/picture-reveal-content-form";

vi.mock("next/image", () => ({
  default: ({
    alt,
    fill: _fill,
    unoptimized: _unoptimized,
    sizes: _sizes,
    ...props
  }: {
    alt: string;
    fill?: boolean;
    unoptimized?: boolean;
    sizes?: string;
    [key: string]: unknown;
  }) => <img alt={alt} {...props} />,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/components/image-crop-dialog", () => ({
  ImageCropDialog: ({
    open,
    file,
    onConfirm,
  }: {
    open: boolean;
    file: File | null;
    onConfirm: (file: File) => void | Promise<void>;
  }) =>
    open ? (
      <button
        type="button"
        data-crop-confirm
        onClick={() => {
          if (file) {
            void onConfirm(file);
          }
        }}
      >
        Confirm crop
      </button>
    ) : null,
}));

function createInitialValues(
  overrides: Partial<PictureRevealContentFormState> = {},
): PictureRevealContentFormState {
  return buildPictureRevealContentFormSnapshot({
    coverImagePath: null,
    coverTempUploadPath: null,
    coverAssetId: null,
    imageWidth: 1080,
    imageHeight: 1080,
    images: [],
    ...overrides,
  });
}

function EditorLikeHarness({
  initialValues,
  uploadAdapter,
}: {
  initialValues: PictureRevealContentFormState;
  uploadAdapter?: PictureRevealContentUploadAdapter;
}) {
  const [contentDirty, setContentDirty] = useState(false);

  return (
    <div data-dirty={contentDirty ? "true" : "false"}>
      <PictureRevealContentForm
        initialValues={{
          ...initialValues,
          images: initialValues.images.map((image) => ({ ...image })),
        }}
        onDirtyChange={setContentDirty}
        uploadAdapter={uploadAdapter}
      />
    </div>
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function findButtonByText(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll("button")).find((button) =>
    button.textContent?.includes(text),
  );
}

async function clickButton(container: HTMLElement, text: string) {
  const button = findButtonByText(container, text);

  expect(button).toBeTruthy();

  await act(async () => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await flush();
}

async function changeFileInput(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [file],
  });

  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await flush();
}

describe("PictureRevealContentForm", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("keeps ratio preset changes after the editor rerenders", async () => {
    await act(async () => {
      root.render(<EditorLikeHarness initialValues={createInitialValues()} />);
    });
    await flush();

    expect(container.textContent).toContain("ขนาดปัจจุบัน: 1080x1080");
    expect(findButtonByText(container, "16:9")?.hasAttribute("disabled")).toBe(
      false,
    );

    await clickButton(container, "16:9");

    expect(container.textContent).toContain("ขนาดปัจจุบัน: 1920x1080");
    expect(
      (container.querySelector("#content-image-width") as HTMLInputElement | null)
        ?.value,
    ).toBe("1920");
    expect(
      (container.querySelector("#content-image-height") as HTMLInputElement | null)
        ?.value,
    ).toBe("1080");
  });

  it("shows the cover preview after upload even when the editor rerenders", async () => {
    const uploadAdapter: PictureRevealContentUploadAdapter = {
      uploadCover: vi.fn(async () => ({
        previewPath: "blob:cover-preview",
        coverAssetId: "cover-1",
      })),
      uploadImage: vi.fn(async () => ({
        previewPath: "blob:image-preview",
        originalPreviewPath: "blob:image-original",
        imageAssetId: "image-1",
        originalImageAssetId: "image-original-1",
      })),
    };

    await act(async () => {
      root.render(
        <EditorLikeHarness
          initialValues={createInitialValues()}
          uploadAdapter={uploadAdapter}
        />,
      );
    });
    await flush();

    const input = container.querySelector(
      "#picture-reveal-cover-upload",
    ) as HTMLInputElement | null;

    expect(input).toBeTruthy();

    await changeFileInput(
      input!,
      new File(["cover"], "cover.png", { type: "image/png" }),
    );

    await clickButton(container, "Confirm crop");

    expect(uploadAdapter.uploadCover).toHaveBeenCalledTimes(1);
    expect(container.querySelector('img[src="blob:cover-preview"]')).toBeTruthy();
  });

  it("adds a new image card instead of restoring the empty placeholder", async () => {
    await act(async () => {
      root.render(<EditorLikeHarness initialValues={createInitialValues()} />);
    });
    await flush();

    expect(container.textContent).toContain("ยังไม่มีรูปภาพ");

    await clickButton(container, "เพิ่มรูปภาพ");

    expect(container.textContent).not.toContain("ยังไม่มีรูปภาพ");
    expect(container.textContent).toContain("รูปที่ 1");
    expect(container.textContent).toContain("คำตอบ");
  });
});
