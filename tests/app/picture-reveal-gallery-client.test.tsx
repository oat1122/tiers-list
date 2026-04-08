// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PictureRevealGalleryClient } from "@/app/picture-reveal/_components/picture-reveal-gallery-client";
import type { PublicPictureRevealGameSummary } from "@/types/picture-reveal-public";

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
  overrides: Partial<PublicPictureRevealGameSummary> = {},
): PublicPictureRevealGameSummary {
  return {
    id: "game-1",
    title: "Animal Quiz",
    description: "Guess the hidden animal",
    coverImagePath: "/uploads/picture-reveal/cover.webp",
    mode: "marathon",
    startScore: 1000,
    openTilePenalty: 50,
    specialTilePenalty: 200,
    imageWidth: 1080,
    imageHeight: 1080,
    updatedAt: "2026-04-08T12:00:00.000Z",
    imageCount: 4,
    ...overrides,
  };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("PictureRevealGalleryClient", () => {
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

  it("renders the uploaded cover image instead of the old score summary block", async () => {
    await act(async () => {
      root.render(<PictureRevealGalleryClient games={[createGame()]} />);
    });
    await flush();

    expect(container.querySelector('img[alt="Cover for Animal Quiz"]')).toBeTruthy();
    expect(container.textContent).not.toContain("Open Tile");
    expect(container.textContent).not.toContain("Special");
    expect(container.textContent).not.toContain("Start");
  });

  it("shows a local creator CTA alongside the public gallery", async () => {
    await act(async () => {
      root.render(<PictureRevealGalleryClient games={[createGame()]} />);
    });
    await flush();

    expect(container.querySelector('a[href="/picture-reveal/create"]')).toBeTruthy();
    expect(container.textContent).toContain("สร้างเกมของคุณเอง");
  });
});

