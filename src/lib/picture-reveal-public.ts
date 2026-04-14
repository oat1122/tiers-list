import type {
  getPublicPictureRevealGameById,
  getPublicPictureRevealGames,
} from "@/services/picture-reveal-games.service";
import type {
  PublicPictureRevealGameDetail,
  PublicPictureRevealGameSummary,
} from "@/types/picture-reveal-public";

type PublicPictureRevealGameRow = Awaited<
  ReturnType<typeof getPublicPictureRevealGames>
>[number];

type PublicPictureRevealGameDetailRow = NonNullable<
  Awaited<ReturnType<typeof getPublicPictureRevealGameById>>
>;

/**
 * Converts a database-backed public game row into the API/page summary contract.
 *
 * @param game - Public game row returned by the service layer.
 * @returns Serializable public summary with date values converted to strings.
 */
export function serializePublicPictureRevealGameSummary(
  game: PublicPictureRevealGameRow,
): PublicPictureRevealGameSummary {
  return {
    id: game.id,
    title: game.title,
    description: game.description,
    coverImagePath: game.coverImagePath ?? null,
    mode: game.mode as PublicPictureRevealGameSummary["mode"],
    startScore: game.startScore,
    openTilePenalty: game.openTilePenalty,
    specialTilePenalty: game.specialTilePenalty,
    imageWidth: game.imageWidth,
    imageHeight: game.imageHeight,
    updatedAt: game.updatedAt.toISOString(),
    imageCount: game.imageCount,
  };
}

/**
 * Converts a public game row with images into the playable detail contract.
 *
 * @param game - Public game row with active images loaded by the service layer.
 * @returns Serializable game detail used by the public play page.
 */
export function serializePublicPictureRevealGameDetail(
  game: PublicPictureRevealGameDetailRow,
): PublicPictureRevealGameDetail {
  return {
    ...serializePublicPictureRevealGameSummary(game),
    images: game.images.map((image) => ({
      id: image.id,
      imagePath: image.imagePath,
      answer: image.answer,
      rows: image.rows,
      cols: image.cols,
      totalTiles: image.rows * image.cols,
      specialTileCount: image.specialTileCount,
      specialPattern:
        image.specialPattern as PublicPictureRevealGameDetail["images"][number]["specialPattern"],
    })),
  };
}
