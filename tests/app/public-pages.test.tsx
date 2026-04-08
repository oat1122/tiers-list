import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connection: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  getPublicTierListGallery: vi.fn(),
  getPublicPictureRevealGames: vi.fn(),
  getPublicPictureRevealGameById: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: mocks.connection,
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-theme-toggle />,
}));

vi.mock("@/components/public-tier-list-gallery-section", () => ({
  PublicTierListGallerySection: ({
    publicLists,
  }: {
    publicLists: Array<{ id: string; title: string }>;
  }) => <div data-tier-list-gallery={publicLists.length} />,
}));

vi.mock("@/app/picture-reveal/_components/picture-reveal-gallery-client", () => ({
  PictureRevealGalleryClient: ({
    games,
  }: {
    games: Array<{ id: string; title: string }>;
  }) => <div data-picture-reveal-gallery={games.length}>{games[0]?.title}</div>,
}));

vi.mock(
  "@/app/picture-reveal/[id]/_components/picture-reveal-play-client",
  () => ({
    PictureRevealPlayClient: ({
      game,
    }: {
      game: { id: string; title: string; imageCount: number };
    }) => (
      <div data-picture-reveal-play={game.id} data-image-count={game.imageCount}>
        {game.title}
      </div>
    ),
  }),
);

vi.mock(
  "@/app/picture-reveal/create/_components/picture-reveal-local-creator-client",
  () => ({
    PictureRevealLocalCreatorClient: () => <div data-picture-reveal-local-creator />,
  }),
);

vi.mock(
  "@/app/picture-reveal/create/_components/picture-reveal-local-play-client",
  () => ({
    PictureRevealLocalPlayClient: () => <div data-picture-reveal-local-play />,
  }),
);

vi.mock("@/services/tier-lists.service", () => ({
  getPublicTierListGallery: mocks.getPublicTierListGallery,
}));

vi.mock("@/services/picture-reveal-games.service", () => ({
  getPublicPictureRevealGames: mocks.getPublicPictureRevealGames,
  getPublicPictureRevealGameById: mocks.getPublicPictureRevealGameById,
}));

describe("public pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connection.mockResolvedValue(undefined);
  });

  it("renders the public portal home page with both workspace links", async () => {
    mocks.getPublicTierListGallery.mockResolvedValue([{ id: "list-1" }]);
    mocks.getPublicPictureRevealGames.mockResolvedValue([{ id: "game-1" }]);

    const { default: HomePage } = await import("@/app/page");
    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("/tier-lists");
    expect(markup).toContain("/picture-reveal");
    expect(markup).toContain("/picture-reveal/create");
    expect(markup).toContain("Public Portal");
  });

  it("renders the tier-lists gallery route", async () => {
    mocks.getPublicTierListGallery.mockResolvedValue([{ id: "list-1" }]);

    const { default: TierListsPage } = await import("@/app/tier-lists/page");
    const markup = renderToStaticMarkup(await TierListsPage());

    expect(markup).toContain("data-tier-list-gallery=\"1\"");
    expect(markup).toContain("/create");
  });

  it("passes an empty public game list to the picture reveal gallery page", async () => {
    mocks.getPublicPictureRevealGames.mockResolvedValue([]);

    const { default: PictureRevealPage } = await import(
      "@/app/picture-reveal/page"
    );
    const markup = renderToStaticMarkup(await PictureRevealPage());

    expect(markup).toContain("data-picture-reveal-gallery=\"0\"");
    expect(markup).toContain("Picture Reveal");
  });

  it("renders the picture reveal play page with the public playable payload", async () => {
    mocks.getPublicPictureRevealGameById.mockResolvedValue({
      id: "game-1",
      title: "Guess the Animal",
      description: "Public game",
      coverImagePath: null,
      mode: "single",
      startScore: 1000,
      openTilePenalty: 50,
      specialTilePenalty: 200,
      imageWidth: 1080,
      imageHeight: 1080,
      updatedAt: new Date("2026-04-04T12:00:00.000Z"),
      imageCount: 1,
      images: [
        {
          id: "image-1",
          imagePath: "/uploads/cat.webp",
          answer: "Cat",
          rows: 2,
          cols: 2,
          specialTileCount: 1,
          specialPattern: "plus",
        },
      ],
    });

    const { default: PictureRevealGamePage } = await import(
      "@/app/picture-reveal/[id]/page"
    );
    const markup = renderToStaticMarkup(
      await PictureRevealGamePage({
        params: Promise.resolve({ id: "game-1" }),
      } as PageProps<"/picture-reveal/[id]">),
    );

    expect(markup).toContain("data-picture-reveal-play=\"game-1\"");
    expect(markup).toContain("data-image-count=\"1\"");
    expect(markup).toContain("Guess the Animal");
  });

  it("calls notFound for unknown picture reveal games", async () => {
    mocks.getPublicPictureRevealGameById.mockResolvedValue(null);

    const { default: PictureRevealGamePage } = await import(
      "@/app/picture-reveal/[id]/page"
    );

    await expect(
      PictureRevealGamePage({
        params: Promise.resolve({ id: "missing-game" }),
      } as PageProps<"/picture-reveal/[id]">),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("renders the local picture reveal creator route without auth", async () => {
    const { default: PictureRevealCreatePage } = await import(
      "@/app/picture-reveal/create/page"
    );
    const markup = renderToStaticMarkup(<PictureRevealCreatePage />);

    expect(markup).toContain("data-picture-reveal-local-creator");
  });

  it("renders the local picture reveal play route without auth", async () => {
    const { default: PictureRevealCreatePlayPage } = await import(
      "@/app/picture-reveal/create/play/page"
    );
    const markup = renderToStaticMarkup(<PictureRevealCreatePlayPage />);

    expect(markup).toContain("data-picture-reveal-local-play");
  });
});



