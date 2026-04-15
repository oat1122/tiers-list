// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SoundGuessPlayClient } from "@/app/sound-guess/[id]/_components/sound-guess-play-client";
import { awardSoundGuessPoint } from "@/app/sound-guess/[id]/_components/sound-guess-play-client.utils";
import type { PublicSoundGuessGameDetail } from "@/types/sound-guess-public";

vi.mock("next/image", () => ({
  default: ({
    alt,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fill: _fill,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    unoptimized: _unoptimized,
    ...props
  }: {
    alt: string;
    fill?: boolean;
    unoptimized?: boolean;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function createGame(
  overrides: Partial<PublicSoundGuessGameDetail> = {},
): PublicSoundGuessGameDetail {
  const sounds = overrides.sounds ?? [
    {
      id: "sound-1",
      audioPath: "/uploads/bell.mp3",
      imagePath: null,
      answer: "Bell Song",
      audioStartMs: 1000,
      audioEndMs: 2000,
      sortOrder: 0,
    },
  ];

  return {
    id: "sound-game-1",
    title: "Guess the Songs",
    description: "Host-run sound game",
    coverImagePath: null,
    imageWidth: 1200,
    imageHeight: 800,
    updatedAt: "2026-04-10T12:00:00.000Z",
    soundCount: sounds.length,
    sounds,
    ...overrides,
  };
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

async function typeIntoWinnerInput(container: HTMLElement, value: string) {
  const input = container.querySelector('input[placeholder="Winner name"]');

  expect(input).toBeTruthy();

  await act(async () => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    valueSetter?.call(input, value);
    input?.dispatchEvent(new Event("input", { bubbles: true }));
    input?.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await flush();
}

describe("SoundGuessPlayClient", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    localStorage.clear();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
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

  it("keeps the answer hidden until reveal and awards one point", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    await act(async () => {
      root.render(<SoundGuessPlayClient game={createGame()} />);
    });
    await flush();

    expect(container.textContent).toContain("Start Host Run");
    expect(container.textContent).toContain("Guess the Songs");

    await clickButton(container, "Start Host Run");

    expect(container.textContent).toContain("Play the Sound");
    expect(container.textContent).toContain(
      "Hidden until the host chooses to reveal it.",
    );
    expect(container.textContent).not.toContain("Bell Song");

    await clickButton(container, "Reveal Answer");

    expect(container.textContent).toContain("Bell Song");

    await typeIntoWinnerInput(container, "Alice");
    await clickButton(container, "Award 1");

    expect(container.textContent).toContain("Run Summary");
    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("+1");
  });

  it("skips scoring when no one answers correctly", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    await act(async () => {
      root.render(<SoundGuessPlayClient game={createGame()} />);
    });
    await flush();

    await clickButton(container, "Start Host Run");
    await clickButton(container, "Reveal Answer");
    await clickButton(container, "No Correct Answer");

    expect(container.textContent).toContain("Run Summary");
    expect(container.textContent).toContain("No correct answer");
    expect(container.textContent).toContain("No one has scored yet.");
  });

  it("uses the cropped audio range for the visible player timeline", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    await act(async () => {
      root.render(<SoundGuessPlayClient game={createGame()} />);
    });
    await flush();

    await clickButton(container, "Start Host Run");

    const range = container.querySelector(
      '[data-testid="sound-guess-segment-player-range"]',
    ) as HTMLInputElement | null;
    const volume = container.querySelector(
      '[data-testid="sound-guess-segment-player-volume"]',
    ) as HTMLInputElement | null;

    expect(range).toBeTruthy();
    expect(range?.getAttribute("max")).toBe("1000");
    expect(container.textContent).toContain("00:01.00");
    expect(volume?.value).toBe("0.5");
  });

  it("remembers the public player volume in browser storage", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    await act(async () => {
      root.render(<SoundGuessPlayClient game={createGame()} />);
    });
    await flush();

    await clickButton(container, "Start Host Run");

    const volume = container.querySelector(
      '[data-testid="sound-guess-segment-player-volume"]',
    ) as HTMLInputElement | null;

    expect(volume).toBeTruthy();

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;

      valueSetter?.call(volume, "0.25");
      volume?.dispatchEvent(new Event("input", { bubbles: true }));
      volume?.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await flush();

    expect(localStorage.getItem("sound-guess-admin-audio-volume")).toBe("0.25");
    expect(container.textContent).toContain("25%");
  });

  it("merges duplicate winner names with lowercase th-TH keys", () => {
    const leaderboard = awardSoundGuessPoint(
      awardSoundGuessPoint([], " Alice  Smith "),
      "alice smith",
    );

    expect(leaderboard).toEqual([
      {
        key: "alice smith",
        name: "alice smith",
        score: 2,
      },
    ]);
  });
});
