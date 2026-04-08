// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PictureRevealPlayClient } from "@/app/picture-reveal/[id]/_components/picture-reveal-play-client";
import type { PublicPictureRevealGameDetail } from "@/types/picture-reveal-public";

vi.mock("next/image", () => ({
  default: ({
    alt,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fill: _fill,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    unoptimized: _unoptimized,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sizes: _sizes,
    ...props
  }: {
    alt: string;
    fill?: boolean;
    unoptimized?: boolean;
    sizes?: string;
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
  overrides: Partial<PublicPictureRevealGameDetail> = {},
): PublicPictureRevealGameDetail {
  const images =
    overrides.images ??
    [
      {
        id: "image-1",
        imagePath: "/uploads/cat.webp",
        answer: "Cat",
        rows: 2,
        cols: 2,
        totalTiles: 4,
        specialTileCount: 0,
        specialPattern: "plus",
      },
    ];

  return {
    id: "game-1",
    title: "Guess the Animal",
    description: "Host-run picture reveal",
    coverImagePath: null,
    mode: "single",
    startScore: 1000,
    openTilePenalty: 50,
    specialTilePenalty: 200,
    imageWidth: 1080,
    imageHeight: 1080,
    updatedAt: "2026-04-04T12:00:00.000Z",
    imageCount: images.length,
    images,
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

function getWinnerInput(container: HTMLElement) {
  const input = container.querySelector(
    'input[placeholder="Winner name"]',
  ) as HTMLInputElement | null;

  expect(input).toBeTruthy();

  return input;
}

function getBoardSizeWrapper(container: HTMLElement) {
  const wrapper = container.querySelector("[data-board-size]") as HTMLElement | null;

  expect(wrapper).toBeTruthy();

  return wrapper;
}

function getBoardScrollRegion(container: HTMLElement) {
  const region = container.querySelector(
    "[data-board-scroll-region]",
  ) as HTMLElement | null;

  expect(region).toBeTruthy();

  return region;
}

describe("PictureRevealPlayClient", () => {
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

  it("keeps the answer hidden until the host reveals it and awards the remaining score", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    await act(async () => {
      root.render(<PictureRevealPlayClient game={createGame()} />);
    });
    await flush();

    expect(container.textContent).toContain("Start Host Run");
    expect(container.textContent).toContain("Guess the Animal");

    await clickButton(container, "Start Host Run");

    expect(container.textContent).toContain("Open Tiles, Then Reveal the Answer");
    expect(container.textContent).toContain("Show Live Leaderboard");
    expect(container.textContent).not.toContain("Hide Live Leaderboard");
    expect(container.textContent).toContain(
      "Hidden until the host chooses to reveal it.",
    );
    expect(container.textContent).toContain("Image Size");
    expect(container.textContent).not.toContain("Scoring Rules");
    expect(container.textContent).not.toContain("Cat");
    expect(container.textContent).not.toContain("No one has scored yet.");
    expect(container.textContent).not.toContain(
      "Points are awarded only when the host reveals the answer and picks a winner.",
    );

    await clickButton(container, "Show Live Leaderboard");

    expect(container.textContent).toContain("Hide Live Leaderboard");
    expect(container.textContent).toContain("No one has scored yet.");
    expect(
      container
        .querySelector("[data-floating-leaderboard]")
        ?.className.includes("pointer-events-none"),
    ).toBe(true);
    expect(
      container
        .querySelector("[data-floating-leaderboard-card]")
        ?.className.includes("pointer-events-auto"),
    ).toBe(true);

    const boardWrapper = getBoardSizeWrapper(container);
    const boardScrollRegion = getBoardScrollRegion(container);

    expect(boardWrapper.getAttribute("data-board-size")).toBe("full");
    expect(boardWrapper.getAttribute("style")).toContain("min-width: 240px");
    expect(boardScrollRegion.className).toContain("overflow-x-auto");

    await clickButton(container, "70%");

    expect(boardWrapper.getAttribute("data-board-size")).toBe("compact");
    expect(boardWrapper.getAttribute("style")).toContain("70%");

    await clickButton(container, "85%");

    expect(boardWrapper.getAttribute("data-board-size")).toBe("comfortable");
    expect(boardWrapper.getAttribute("style")).toContain("85%");

    await clickButton(container, "20%");

    expect(boardWrapper.getAttribute("data-board-size")).toBe("tiny");
    expect(boardWrapper.getAttribute("style")).toContain("20%");

    const tileOne = container.querySelector('button[aria-label="Open tile 1"]');

    await act(async () => {
      tileOne?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(container.textContent).toContain("950");

    await clickButton(container, "Reveal Answer");

    expect(container.textContent).toContain("Cat");

    await typeIntoWinnerInput(container, "Alice");
    await clickButton(container, "Award 950");

    expect(container.textContent).toContain("Run Summary");
    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("950");
  });

  it("applies the special tile penalty and auto-reveals nearby tiles", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const game = createGame({
      images: [
        {
          id: "image-1",
          imagePath: "/uploads/lion.webp",
          answer: "Lion",
          rows: 3,
          cols: 3,
          totalTiles: 9,
          specialTileCount: 1,
          specialPattern: "plus",
        },
      ],
    });

    await act(async () => {
      root.render(<PictureRevealPlayClient game={game} />);
    });
    await flush();

    await clickButton(container, "Start Host Run");

    const specialTile = container.querySelector('button[aria-label="Open tile 2"]');

    await act(async () => {
      specialTile?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(container.textContent).toContain("750");
    expect(container.textContent).toContain(
      "Special tile triggered 3 extra opens: 1, 3, 5",
    );
  });

  it("keeps the leaderboard visible while the host skips a round and finishes a marathon run", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);

    const game = createGame({
      mode: "marathon",
      images: [
        {
          id: "image-1",
          imagePath: "/uploads/cat.webp",
          answer: "Cat",
          rows: 2,
          cols: 2,
          totalTiles: 4,
          specialTileCount: 0,
          specialPattern: "plus",
        },
        {
          id: "image-2",
          imagePath: "/uploads/dog.webp",
          answer: "Dog",
          rows: 2,
          cols: 2,
          totalTiles: 4,
          specialTileCount: 0,
          specialPattern: "plus",
        },
      ],
    });

    await act(async () => {
      root.render(<PictureRevealPlayClient game={game} />);
    });
    await flush();

    await clickButton(container, "Start Host Run");
    expect(container.textContent).toContain("Show Live Leaderboard");
    expect(container.textContent).not.toContain("No one has scored yet.");

    await clickButton(container, "Show Live Leaderboard");

    expect(container.textContent).toContain("Hide Live Leaderboard");
    expect(container.textContent).toContain("No one has scored yet.");
    expect(
      container
        .querySelector("[data-floating-leaderboard-card]")
        ?.className.includes("pointer-events-auto"),
    ).toBe(true);

    await clickButton(container, "Reveal Answer");
    await clickButton(container, "No Correct Answer");

    expect(container.textContent).toContain("Round 2");
    expect(container.textContent).toContain("Live Leaderboard");

    await clickButton(container, "Reveal Answer");
    await typeIntoWinnerInput(container, "Bob");
    await clickButton(container, "Award 1000");

    expect(container.textContent).toContain("Run Completed");
    expect(container.textContent).toContain("Bob");
    expect(container.textContent).toContain("No winner");
    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("Live Leaderboard");
    expect(container.textContent).toContain("1000");
  });

  it("suggests existing winner names so the host can reuse them quickly", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);

    const game = createGame({
      mode: "marathon",
      images: [
        {
          id: "image-1",
          imagePath: "/uploads/cat.webp",
          answer: "Cat",
          rows: 2,
          cols: 2,
          totalTiles: 4,
          specialTileCount: 0,
          specialPattern: "plus",
        },
        {
          id: "image-2",
          imagePath: "/uploads/dog.webp",
          answer: "Dog",
          rows: 2,
          cols: 2,
          totalTiles: 4,
          specialTileCount: 0,
          specialPattern: "plus",
        },
      ],
    });

    await act(async () => {
      root.render(<PictureRevealPlayClient game={game} />);
    });
    await flush();

    await clickButton(container, "Start Host Run");
    await clickButton(container, "Reveal Answer");
    await typeIntoWinnerInput(container, "โอ๊ต");
    await clickButton(container, "Award 1000");

    await clickButton(container, "Reveal Answer");

    const datalistOption = container.querySelector('datalist option[value="โอ๊ต"]');

    expect(datalistOption).toBeTruthy();
    expect(container.textContent).toContain("Existing Names");
    expect(findButtonByText(container, "โอ๊ต")).toBeTruthy();

    await clickButton(container, "โอ๊ต");

    expect(getWinnerInput(container)?.value).toBe("โอ๊ต");
  });

  it("starts fresh when the component mounts again", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    await act(async () => {
      root.render(<PictureRevealPlayClient game={createGame()} />);
    });
    await flush();

    await clickButton(container, "Start Host Run");
    expect(container.textContent).toContain("Open Tiles, Then Reveal the Answer");

    act(() => {
      root.unmount();
    });

    root = createRoot(container);

    await act(async () => {
      root.render(<PictureRevealPlayClient game={createGame()} />);
    });
    await flush();

    expect(container.textContent).toContain("Start Host Run");
    expect(container.textContent).not.toContain("Run Summary");
  });

  it("keeps a minimum playable board width even on the smallest resize preset", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const game = createGame({
      images: [
        {
          id: "image-1",
          imagePath: "/uploads/panorama.webp",
          answer: "Panorama",
          rows: 2,
          cols: 8,
          totalTiles: 16,
          specialTileCount: 0,
          specialPattern: "plus",
        },
      ],
    });

    await act(async () => {
      root.render(<PictureRevealPlayClient game={game} />);
    });
    await flush();

    await clickButton(container, "Start Host Run");
    await clickButton(container, "20%");

    const boardWrapper = getBoardSizeWrapper(container);

    expect(boardWrapper.getAttribute("data-board-size")).toBe("tiny");
    expect(boardWrapper.getAttribute("style")).toContain("max-width: 20%");
    expect(boardWrapper.getAttribute("style")).toContain("min-width: 320px");
  });
});



