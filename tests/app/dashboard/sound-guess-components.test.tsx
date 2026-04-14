// @vitest-environment jsdom

import { act, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SoundGuessDashboardClient } from "@/app/dashboard/sound-guess/_components/sound-guess-dashboard-client";
import { SoundGuessGameCard } from "@/app/dashboard/sound-guess/_components/sound-guess-game-card";
import { SoundGuessContentForm } from "@/app/dashboard/sound-guess/[id]/edit/_components/sound-guess-content-form";
import {
  buildSoundGuessContentFormSnapshot,
  type SoundGuessContentFormState,
} from "@/lib/sound-guess-content-form";
import type { SoundGuessGameSummaryDto } from "@/types/sound-guess-admin";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  confirm: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => null,
}));

vi.mock("@/components/confirm-dialog-provider", () => ({
  useConfirmDialog: () => ({
    confirm: mocks.confirm,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
    warning: mocks.toastWarning,
  },
}));

function createGame(
  overrides: Partial<SoundGuessGameSummaryDto> = {},
): SoundGuessGameSummaryDto {
  return {
    id: "game-1",
    userId: "admin-1",
    title: "Animal Sounds",
    description: "Guess the animal",
    coverImagePath: null,
    status: "draft",
    imageWidth: 1600,
    imageHeight: 900,
    soundCount: 1,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

function createInitialValues(
  overrides: Partial<SoundGuessContentFormState> = {},
): SoundGuessContentFormState {
  return buildSoundGuessContentFormSnapshot({
    coverImagePath: null,
    coverTempUploadPath: null,
    imageWidth: 1600,
    imageHeight: 900,
    sounds: [
      {
        id: "sound-1",
        answer: "",
        imagePath: null,
        tempImagePath: null,
        audioStartMs: 0,
        audioEndMs: null,
        sortOrder: 0,
      },
    ],
    ...overrides,
  });
}

function ContentHarness({
  initialValues,
  onSave = vi.fn(),
}: {
  initialValues: SoundGuessContentFormState;
  onSave?: (values: unknown) => Promise<void>;
}) {
  const [contentDirty, setContentDirty] = useState(false);

  return (
    <div data-dirty={contentDirty ? "true" : "false"}>
      <SoundGuessContentForm
        gameId="game-1"
        initialValues={initialValues}
        onDirtyChange={setContentDirty}
        onSave={onSave as never}
      />
    </div>
  );
}

/**
 * Waits for React updates and dynamic client imports used by editor dialogs.
 *
 * @returns Nothing after queued microtasks have settled.
 */
async function flush() {
  await act(async () => {
    for (let tick = 0; tick < 8; tick += 1) {
      await Promise.resolve();
    }
  });
}

async function clickButton(container: HTMLElement, text: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.includes(text),
  );

  expect(button).toBeTruthy();

  await act(async () => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await flush();
}

async function clickButtonByLabel(container: HTMLElement, label: string) {
  const button = container.querySelector(
    `button[aria-label="${label}"]`,
  ) as HTMLButtonElement | null;

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

describe("SoundGuessGameCard", () => {
  it("uses the vinyl placeholder when a game has no cover", () => {
    const markup = renderToStaticMarkup(<SoundGuessGameCard game={createGame()} />);

    expect(markup).toContain("/placeholder-vinyl.svg");
    expect(markup).toContain("Animal Sounds");
  });
});

describe("SoundGuessDashboardClient", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.confirm.mockResolvedValue(true);
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    global.fetch = vi.fn(async () =>
      Response.json({ success: true }, { status: 200 }),
    );
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

  it("soft deletes a game from the dashboard list", async () => {
    await act(async () => {
      root.render(<SoundGuessDashboardClient initialGames={[createGame()]} />);
    });
    await flush();

    expect(container.textContent).toContain("Animal Sounds");

    await clickButton(container, "ลบ");

    expect(mocks.confirm).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/sound-guess-games/game-1",
      { method: "DELETE" },
    );
    expect(container.textContent).not.toContain("Animal Sounds");
  });
});

describe("SoundGuessContentForm", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    localStorage.clear();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    global.fetch = vi.fn(async () =>
      Response.json(
        { tempAudioPath: "/uploads/sound-guess/audio/temp/bell.mp3" },
        { status: 201 },
      ),
    );
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

  it("uploads audio and renders a native audio preview", async () => {
    await act(async () => {
      root.render(<ContentHarness initialValues={createInitialValues()} />);
    });
    await flush();

    const input = container.querySelector(
      "#sound-guess-audio-upload-0",
    ) as HTMLInputElement | null;

    expect(input).toBeTruthy();

    await changeFileInput(
      input!,
      new File(["audio"], "bell.mp3", { type: "audio/mpeg" }),
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/sound-guess-games/game-1/sounds/upload-temp",
      expect.objectContaining({ method: "POST" }),
    );
    expect(
      container.querySelector(
        'audio[src="/uploads/sound-guess/audio/temp/bell.mp3"]',
      ),
    ).toBeTruthy();

    const audio = container.querySelector(
      'audio[src="/uploads/sound-guess/audio/temp/bell.mp3"]',
    ) as HTMLAudioElement | null;

    expect(audio?.volume).toBe(0.5);

    await act(async () => {
      audio!.volume = 0.25;
      audio!.dispatchEvent(new Event("volumechange", { bubbles: true }));
    });

    expect(localStorage.getItem("sound-guess-admin-audio-volume")).toBe("0.25");
    expect(container.textContent).toContain("00:00.00 - จบไฟล์");
    expect(
      container.querySelector('[data-testid="sound-audio-segment-preview-range"]'),
    ).toBeTruthy();
  });

  it("renders a cropped audio preview timeline for the saved crop range", async () => {
    const initialValues = createInitialValues({
      sounds: [
        {
          id: "sound-1",
          audioPath: "/uploads/sound-guess/audio/bell.mp3",
          tempAudioPath: null,
          imagePath: null,
          tempImagePath: null,
          answer: "Bell",
          audioStartMs: 131_700,
          audioEndMs: 182_560,
          sortOrder: 0,
        },
      ],
    });

    await act(async () => {
      root.render(<ContentHarness initialValues={initialValues} />);
    });
    await flush();

    const audio = container.querySelector("audio") as HTMLAudioElement | null;
    const range = container.querySelector(
      '[data-testid="sound-audio-segment-preview-range"]',
    ) as HTMLInputElement | null;

    expect(audio?.getAttribute("src")).toBe(
      "/uploads/sound-guess/audio/bell.mp3",
    );
    expect(audio?.hasAttribute("controls")).toBe(false);
    expect(range).toBeTruthy();
    expect(container.textContent).toContain("02:11.70 - 03:02.56");

    Object.defineProperty(audio!, "pause", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(audio!, "play", {
      configurable: true,
      value: vi.fn(async () => undefined),
    });
    Object.defineProperty(audio!, "duration", {
      configurable: true,
      value: 258,
    });

    await act(async () => {
      audio!.dispatchEvent(new Event("loadedmetadata", { bubbles: true }));
    });
    await flush();

    expect(audio?.currentTime).toBe(131.7);
    expect(range?.max).toBe("50860");

    await act(async () => {
      audio!.currentTime = 182.56;
      audio!.dispatchEvent(new Event("timeupdate", { bubbles: true }));
    });
    await flush();

    expect(audio?.pause).toHaveBeenCalledTimes(1);
    expect(audio?.currentTime).toBe(182.56);
  });

  it("adds and removes sound cards", async () => {
    await act(async () => {
      root.render(<ContentHarness initialValues={createInitialValues()} />);
    });
    await flush();

    await clickButtonByLabel(container, "Add sound");

    expect(container.querySelectorAll('[aria-label="Remove sound"]').length).toBe(
      2,
    );

    const removeButtons = container.querySelectorAll(
      '[aria-label="Remove sound"]',
    );

    expect(removeButtons.length).toBeGreaterThan(0);

    await act(async () => {
      removeButtons[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(container.querySelectorAll('[aria-label="Remove sound"]').length).toBe(
      1,
    );
  });

  it("does not save invalid sound content", async () => {
    const onSave = vi.fn(async () => undefined);

    await act(async () => {
      root.render(
        <ContentHarness
          initialValues={createInitialValues()}
          onSave={onSave}
        />,
      );
    });
    await flush();

    await clickButtonByLabel(container, "Save sound content");

    expect(onSave).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Audio file is required");
  });

  it("renders the ratio controls and per-sound vinyl placeholder", async () => {
    await act(async () => {
      root.render(<ContentHarness initialValues={createInitialValues()} />);
    });
    await flush();

    expect(container.textContent).toContain("Ratio");
    expect(container.innerHTML).toContain("/placeholder-vinyl.svg");
  });

  it("opens the sound image crop dialog after selecting a vinyl image", async () => {
    await act(async () => {
      root.render(<ContentHarness initialValues={createInitialValues()} />);
    });
    await flush();

    const input = container.querySelector(
      "#sound-guess-image-upload-0",
    ) as HTMLInputElement | null;

    expect(input).toBeTruthy();

    await changeFileInput(
      input!,
      new File(["image"], "vinyl.webp", { type: "image/webp" }),
    );

    expect(document.body.textContent).toContain("ครอปรูปก่อนใช้งาน");
  });

  it("uses two-decimal audio crop inputs and rejects inverted ranges", async () => {
    const initialValues = createInitialValues({
      sounds: [
        {
          id: "sound-1",
          audioPath: "/uploads/sound-guess/audio/bell.mp3",
          tempAudioPath: null,
          imagePath: null,
          tempImagePath: null,
          answer: "Bell",
          audioStartMs: 39_400,
          audioEndMs: 40_555,
          sortOrder: 0,
        },
      ],
    });

    await act(async () => {
      root.render(<ContentHarness initialValues={initialValues} />);
    });
    await flush();

    await clickButton(container, "กำหนดช่วงเสียง");

    const startInput = document.body.querySelector(
      "#sound-audio-start-input",
    ) as HTMLInputElement | null;
    const endInput = document.body.querySelector(
      "#sound-audio-end-input",
    ) as HTMLInputElement | null;

    expect(startInput?.value).toBe("00:39.40");
    expect(endInput?.value).toBe("00:40.56");

    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(endInput, "00:10.999");
      endInput!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await flush();

    expect(endInput?.value).toBe("00:10.99");

    await clickButton(document.body, "ใช้ช่วงเสียงนี้");

    expect(document.body.textContent).toContain(
      "เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด",
    );
  });

  it("supports direct timeline dragging for playhead, range, and handles", async () => {
    const initialValues = createInitialValues({
      sounds: [
        {
          id: "sound-1",
          audioPath: "/uploads/sound-guess/audio/bell.mp3",
          tempAudioPath: null,
          imagePath: null,
          tempImagePath: null,
          answer: "Bell",
          audioStartMs: 10_000,
          audioEndMs: 30_000,
          sortOrder: 0,
        },
      ],
    });

    await act(async () => {
      root.render(<ContentHarness initialValues={initialValues} />);
    });
    await flush();

    await clickButton(container, "กำหนดช่วงเสียง");

    const timeline = document.body.querySelector(
      '[data-testid="sound-audio-timeline"]',
    ) as HTMLDivElement | null;
    const track = document.body.querySelector(
      '[data-testid="sound-audio-timeline-track"]',
    ) as HTMLDivElement | null;
    const audio = Array.from(document.body.querySelectorAll("audio")).at(
      -1,
    ) as HTMLAudioElement | undefined;

    expect(timeline).toBeTruthy();
    expect(track).toBeTruthy();
    expect(audio).toBeTruthy();

    Object.defineProperty(track!, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 8,
        height: 8,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => null,
      }),
    });
    Object.defineProperty(audio!, "duration", {
      configurable: true,
      value: 100,
    });
    Object.defineProperty(audio!, "play", {
      configurable: true,
      value: vi.fn(async () => undefined),
    });

    await act(async () => {
      audio!.dispatchEvent(new Event("loadedmetadata", { bubbles: true }));
    });
    await flush();

    const startInput = document.body.querySelector(
      "#sound-audio-start-input",
    ) as HTMLInputElement | null;
    const endInput = document.body.querySelector(
      "#sound-audio-end-input",
    ) as HTMLInputElement | null;
    const startHandle = document.body.querySelector(
      '[aria-label="ย่อขยายเวลาเริ่มต้น"]',
    ) as HTMLButtonElement | null;
    const endHandle = document.body.querySelector(
      '[aria-label="ย่อขยายเวลาสิ้นสุด"]',
    ) as HTMLButtonElement | null;
    const rangeHandle = document.body.querySelector(
      '[aria-label="ย้ายช่วงเสียง"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      startHandle!.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, clientX: 10 }),
      );
      timeline!.dispatchEvent(
        new MouseEvent("pointermove", { bubbles: true, clientX: 20 }),
      );
      timeline!.dispatchEvent(
        new MouseEvent("pointerup", { bubbles: true, clientX: 20 }),
      );
    });
    await flush();

    expect(startInput?.value).toBe("00:20.00");

    await act(async () => {
      endHandle!.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, clientX: 30 }),
      );
      timeline!.dispatchEvent(
        new MouseEvent("pointermove", { bubbles: true, clientX: 60 }),
      );
      timeline!.dispatchEvent(
        new MouseEvent("pointerup", { bubbles: true, clientX: 60 }),
      );
    });
    await flush();

    expect(endInput?.value).toBe("01:00.00");

    await act(async () => {
      rangeHandle!.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, clientX: 30 }),
      );
      timeline!.dispatchEvent(
        new MouseEvent("pointermove", { bubbles: true, clientX: 40 }),
      );
      timeline!.dispatchEvent(
        new MouseEvent("pointerup", { bubbles: true, clientX: 40 }),
      );
    });
    await flush();

    expect(startInput?.value).toBe("00:30.00");
    expect(endInput?.value).toBe("01:10.00");

    await act(async () => {
      timeline!.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, clientX: 55 }),
      );
      timeline!.dispatchEvent(
        new MouseEvent("pointerup", { bubbles: true, clientX: 55 }),
      );
    });
    await clickButton(document.body, "ทดลองฟัง");

    expect(audio?.currentTime).toBe(55);
  });
});
