// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SoundGuessLocalPlayClient } from "@/app/sound-guess/create/_components/sound-guess-local-play-client";

const mocks = vi.hoisted(() => ({
  loadCurrentDraft: vi.fn(),
  revokeLocalSoundGuessDraftUrls: vi.fn(),
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

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => null,
}));

vi.mock("@/app/sound-guess/[id]/_components/sound-guess-play-client", () => ({
  SoundGuessPlayClient: ({ game }: { game: { title: string } }) => (
    <div data-local-sound-guess-play>{game.title}</div>
  ),
}));

vi.mock("@/lib/sound-guess-local-store", () => ({
  loadCurrentDraft: mocks.loadCurrentDraft,
}));

vi.mock("@/lib/sound-guess-local", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/sound-guess-local")>();

  return {
    ...actual,
    revokeLocalSoundGuessDraftUrls: mocks.revokeLocalSoundGuessDraftUrls,
  };
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("SoundGuessLocalPlayClient", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.loadCurrentDraft.mockReset();
    mocks.revokeLocalSoundGuessDraftUrls.mockReset();
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

  it("shows a recovery link when no local draft exists", async () => {
    mocks.loadCurrentDraft.mockResolvedValue(null);

    await act(async () => {
      root.render(<SoundGuessLocalPlayClient />);
    });
    await flush();

    expect(container.textContent).toContain("Local game is not ready");
    expect(container.querySelector('a[href="/sound-guess/create"]')).toBeTruthy();
  });
});
