// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SoundGuessGalleryClient } from "@/app/sound-guess/_components/sound-guess-gallery-client";
import type { PublicSoundGuessGameSummary } from "@/types/sound-guess-public";

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
  overrides: Partial<PublicSoundGuessGameSummary> = {},
): PublicSoundGuessGameSummary {
  return {
    id: "sound-game-1",
    title: "Vinyl Quiz",
    description: "Guess songs from short clips",
    coverImagePath: null,
    imageWidth: 1200,
    imageHeight: 800,
    updatedAt: "2026-04-10T12:00:00.000Z",
    soundCount: 3,
    ...overrides,
  };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function typeIntoSearch(container: HTMLElement, value: string) {
  const input = container.querySelector(
    'input[aria-label="Search sound guess games"]',
  ) as HTMLInputElement | null;

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

describe("SoundGuessGalleryClient", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders public games and links to their play pages", async () => {
    await act(async () => {
      root.render(<SoundGuessGalleryClient games={[createGame()]} />);
    });
    await flush();

    expect(container.textContent).toContain("Vinyl Quiz");
    expect(container.textContent).toContain("Guess songs from short clips");
    expect(
      container.querySelector('a[href="/sound-guess/sound-game-1"]'),
    ).toBeTruthy();
  });

  it("filters games by search text", async () => {
    await act(async () => {
      root.render(
        <SoundGuessGalleryClient
          games={[
            createGame({ id: "sound-game-1", title: "Vinyl Quiz" }),
            createGame({ id: "sound-game-2", title: "Movie Themes" }),
          ]}
        />,
      );
    });
    await flush();

    await typeIntoSearch(container, "movie");

    expect(container.textContent).not.toContain("Vinyl Quiz");
    expect(container.textContent).toContain("Movie Themes");
  });

  it("renders an empty state without game links", async () => {
    await act(async () => {
      root.render(<SoundGuessGalleryClient games={[]} />);
    });
    await flush();

    expect(container.querySelector('a[href^="/sound-guess/"]')).toBeNull();
  });
});
