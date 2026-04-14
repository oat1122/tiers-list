import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();
const getSessionMock = vi.fn();
const redirectMock = vi.fn((destination: string) => {
  throw new Error(`REDIRECT:${destination}`);
});
const getAdminSoundGuessGamesMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => null,
}));

vi.mock("@/services/sound-guess-games.service", () => ({
  getAdminSoundGuessGames: getAdminSoundGuessGamesMock,
}));

vi.mock("@/app/dashboard/sound-guess/_components/sound-guess-dashboard-client", () => ({
  SoundGuessDashboardClient: ({
    initialGames,
  }: {
    initialGames: Array<{ title: string }>;
  }) => <div data-sound-guess-dashboard>{initialGames[0]?.title}</div>,
}));

describe("sound guess dashboard pages", () => {
  beforeEach(() => {
    headersMock.mockReset();
    getSessionMock.mockReset();
    redirectMock.mockClear();
    getAdminSoundGuessGamesMock.mockReset();
    headersMock.mockResolvedValue(new Headers());
  });

  it("renders the portal link for admin users", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
      },
    });

    const { default: DashboardPage } = await import("@/app/dashboard/page");
    const markup = renderToStaticMarkup(await DashboardPage());

    expect(markup).toContain("/dashboard/sound-guess");
    expect(markup).toContain("/home-vinyl-quiz.svg");
  });

  it("renders the sound guess dashboard page for admins", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "admin-1",
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
      },
    });
    getAdminSoundGuessGamesMock.mockResolvedValue([
      {
        id: "game-1",
        userId: "admin-1",
        title: "Animal Sounds",
        description: null,
        coverImagePath: null,
        status: "draft",
        imageWidth: 1600,
        imageHeight: 900,
        soundCount: 1,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
        updatedAt: new Date("2026-04-01T00:00:00.000Z"),
        deletedAt: null,
      },
    ]);

    const { default: SoundGuessDashboardPage } = await import(
      "@/app/dashboard/sound-guess/page"
    );
    const markup = renderToStaticMarkup(await SoundGuessDashboardPage());

    expect(markup).toContain("Animal Sounds");
    expect(getAdminSoundGuessGamesMock).toHaveBeenCalledTimes(1);
  });

  it("redirects unauthenticated users away from the sound guess dashboard", async () => {
    getSessionMock.mockResolvedValue(null);

    const { default: SoundGuessDashboardPage } = await import(
      "@/app/dashboard/sound-guess/page"
    );

    await expect(SoundGuessDashboardPage()).rejects.toThrow(
      "REDIRECT:/sign-in",
    );
  });

  it("redirects non-admin users away from the sound guess dashboard", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });

    const { default: SoundGuessDashboardPage } = await import(
      "@/app/dashboard/sound-guess/page"
    );

    await expect(SoundGuessDashboardPage()).rejects.toThrow("REDIRECT:/");
  });
});
