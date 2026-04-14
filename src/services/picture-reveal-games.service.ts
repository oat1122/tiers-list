import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { pictureRevealGames, pictureRevealImages } from "@/db/schema";
import { finalizePictureRevealTempImageFile } from "@/lib/picture-reveal-upload";
import type {
  CreatePictureRevealGameInput,
  PictureRevealImageDraftInput,
  SavePictureRevealGameContentInput,
  UpdatePictureRevealGameInput,
} from "@/lib/validations";
import { PictureRevealServiceError } from "@/services/picture-reveal-errors";

const DEFAULT_PICTURE_REVEAL_IMAGE_SIZE = 1080;

/**
 * Sorts records by their persisted display order without mutating the input.
 *
 * @param items - Records that contain a numeric sort order.
 * @returns New array ordered by ascending sort order.
 */
function sortBySortOrder<T extends { sortOrder: number }>(items: T[]) {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder);
}

/**
 * Counts active images for publishability checks.
 *
 * @param gameId - Game id whose non-deleted images should be counted.
 * @returns Number of active images attached to the game.
 */
async function countActiveImagesForGame(gameId: string) {
  const rows = await db
    .select({
      count: sql<number>`count(${pictureRevealImages.id})`
        .mapWith(Number)
        .as("count"),
    })
    .from(pictureRevealImages)
    .where(
      and(
        eq(pictureRevealImages.gameId, gameId),
        isNull(pictureRevealImages.deletedAt),
      ),
    );

  return rows[0]?.count ?? 0;
}

/**
 * Ensures a game has the required content before publishing.
 *
 * @param gameId - Game id being moved to published status.
 * @returns Promise resolved when the game can be published.
 * @throws PictureRevealServiceError when no active images are attached.
 */
async function assertPublishableGame(gameId: string) {
  const activeImageCount = await countActiveImagesForGame(gameId);

  if (activeImageCount === 0) {
    throw new PictureRevealServiceError(
      400,
      "Published games require at least one image",
    );
  }
}

/**
 * Loads non-deleted images for a game in display order.
 *
 * @param gameId - Game id whose images should be loaded.
 * @returns Active image rows ordered for editing and public playback.
 */
async function getActiveImagesForGame(gameId: string) {
  return db
    .select()
    .from(pictureRevealImages)
    .where(
      and(
        eq(pictureRevealImages.gameId, gameId),
        isNull(pictureRevealImages.deletedAt),
      ),
    )
    .orderBy(pictureRevealImages.sortOrder, pictureRevealImages.createdAt);
}

/**
 * Resolves the stored image path for a submitted image draft.
 *
 * @param imageDraft - Submitted image draft from the content editor.
 * @param existingImagePath - Current stored image path for existing images.
 * @returns Final image path to persist, or null when no image path is available.
 */
async function resolveImagePath(
  imageDraft: PictureRevealImageDraftInput,
  existingImagePath: string | null | undefined,
) {
  return imageDraft.tempImagePath
    ? await finalizePictureRevealTempImageFile(imageDraft.tempImagePath)
    : (imageDraft.imagePath ?? existingImagePath ?? null);
}

/**
 * Resolves the stored original image path for recrop support.
 *
 * @param imageDraft - Submitted image draft from the content editor.
 * @param existingOriginalImagePath - Current stored original image path.
 * @param resolvedImagePath - Final cropped image path used as a fallback.
 * @returns Final original image path to persist.
 */
async function resolveOriginalImagePath(
  imageDraft: PictureRevealImageDraftInput,
  existingOriginalImagePath: string | null | undefined,
  resolvedImagePath: string,
) {
  return imageDraft.tempOriginalImagePath
    ? await finalizePictureRevealTempImageFile(imageDraft.tempOriginalImagePath)
    : (imageDraft.originalImagePath ??
        existingOriginalImagePath ??
        resolvedImagePath);
}

/**
 * Finds image ids removed from the submitted content.
 *
 * @param existingImages - Active image rows currently persisted for the game.
 * @param keptImageIds - Image ids inserted or updated during the save operation.
 * @returns Existing image ids that should be soft-deleted.
 */
function findRemovedImageIds(
  existingImages: Array<{ id: string }>,
  keptImageIds: string[],
) {
  const keptIds = new Set(keptImageIds);

  return existingImages
    .filter((image) => !keptIds.has(image.id))
    .map((image) => image.id);
}

/**
 * Loads one picture reveal game by id without filtering deleted rows.
 *
 * @param id - Picture reveal game id.
 * @returns Game row when found, otherwise null.
 */
export async function getPictureRevealGameById(id: string) {
  const rows = await db
    .select()
    .from(pictureRevealGames)
    .where(eq(pictureRevealGames.id, id))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Lists non-deleted picture reveal games for the admin dashboard.
 *
 * @returns Admin game summaries with active image counts.
 */
export async function getAdminPictureRevealGames() {
  const imageCount = sql<number>`count(${pictureRevealImages.id})`
    .mapWith(Number)
    .as("imageCount");

  return db
    .select({
      id: pictureRevealGames.id,
      userId: pictureRevealGames.userId,
      title: pictureRevealGames.title,
      description: pictureRevealGames.description,
      coverImagePath: pictureRevealGames.coverImagePath,
      status: pictureRevealGames.status,
      mode: pictureRevealGames.mode,
      startScore: pictureRevealGames.startScore,
      openTilePenalty: pictureRevealGames.openTilePenalty,
      specialTilePenalty: pictureRevealGames.specialTilePenalty,
      imageWidth: pictureRevealGames.imageWidth,
      imageHeight: pictureRevealGames.imageHeight,
      createdAt: pictureRevealGames.createdAt,
      updatedAt: pictureRevealGames.updatedAt,
      deletedAt: pictureRevealGames.deletedAt,
      imageCount,
    })
    .from(pictureRevealGames)
    .leftJoin(
      pictureRevealImages,
      and(
        eq(pictureRevealImages.gameId, pictureRevealGames.id),
        isNull(pictureRevealImages.deletedAt),
      ),
    )
    .where(isNull(pictureRevealGames.deletedAt))
    .groupBy(
      pictureRevealGames.id,
      pictureRevealGames.userId,
      pictureRevealGames.title,
      pictureRevealGames.description,
      pictureRevealGames.coverImagePath,
      pictureRevealGames.status,
      pictureRevealGames.mode,
      pictureRevealGames.startScore,
      pictureRevealGames.openTilePenalty,
      pictureRevealGames.specialTilePenalty,
      pictureRevealGames.imageWidth,
      pictureRevealGames.imageHeight,
      pictureRevealGames.createdAt,
      pictureRevealGames.updatedAt,
      pictureRevealGames.deletedAt,
    )
    .orderBy(
      desc(pictureRevealGames.updatedAt),
      desc(pictureRevealGames.createdAt),
    );
}

/**
 * Lists published picture reveal games for the public gallery.
 *
 * @returns Public game summaries with active image counts.
 */
export async function getPublicPictureRevealGames() {
  const imageCount = sql<number>`count(${pictureRevealImages.id})`
    .mapWith(Number)
    .as("imageCount");

  return db
    .select({
      id: pictureRevealGames.id,
      title: pictureRevealGames.title,
      description: pictureRevealGames.description,
      coverImagePath: pictureRevealGames.coverImagePath,
      mode: pictureRevealGames.mode,
      startScore: pictureRevealGames.startScore,
      openTilePenalty: pictureRevealGames.openTilePenalty,
      specialTilePenalty: pictureRevealGames.specialTilePenalty,
      imageWidth: pictureRevealGames.imageWidth,
      imageHeight: pictureRevealGames.imageHeight,
      updatedAt: pictureRevealGames.updatedAt,
      imageCount,
    })
    .from(pictureRevealGames)
    .leftJoin(
      pictureRevealImages,
      and(
        eq(pictureRevealImages.gameId, pictureRevealGames.id),
        isNull(pictureRevealImages.deletedAt),
      ),
    )
    .where(
      and(
        eq(pictureRevealGames.status, "published"),
        isNull(pictureRevealGames.deletedAt),
      ),
    )
    .groupBy(
      pictureRevealGames.id,
      pictureRevealGames.title,
      pictureRevealGames.description,
      pictureRevealGames.coverImagePath,
      pictureRevealGames.mode,
      pictureRevealGames.startScore,
      pictureRevealGames.openTilePenalty,
      pictureRevealGames.specialTilePenalty,
      pictureRevealGames.imageWidth,
      pictureRevealGames.imageHeight,
      pictureRevealGames.updatedAt,
    )
    .orderBy(
      desc(pictureRevealGames.updatedAt),
      desc(pictureRevealGames.createdAt),
    );
}

/**
 * Loads a published picture reveal game and its active images for public play.
 *
 * @param id - Picture reveal game id from the public route.
 * @returns Public game row with images, or null when unavailable.
 */
export async function getPublicPictureRevealGameById(id: string) {
  const imageCount = sql<number>`count(${pictureRevealImages.id})`
    .mapWith(Number)
    .as("imageCount");

  const gameRows = await db
    .select({
      id: pictureRevealGames.id,
      title: pictureRevealGames.title,
      description: pictureRevealGames.description,
      coverImagePath: pictureRevealGames.coverImagePath,
      mode: pictureRevealGames.mode,
      startScore: pictureRevealGames.startScore,
      openTilePenalty: pictureRevealGames.openTilePenalty,
      specialTilePenalty: pictureRevealGames.specialTilePenalty,
      imageWidth: pictureRevealGames.imageWidth,
      imageHeight: pictureRevealGames.imageHeight,
      updatedAt: pictureRevealGames.updatedAt,
      imageCount,
    })
    .from(pictureRevealGames)
    .leftJoin(
      pictureRevealImages,
      and(
        eq(pictureRevealImages.gameId, pictureRevealGames.id),
        isNull(pictureRevealImages.deletedAt),
      ),
    )
    .where(
      and(
        eq(pictureRevealGames.id, id),
        eq(pictureRevealGames.status, "published"),
        isNull(pictureRevealGames.deletedAt),
      ),
    )
    .groupBy(
      pictureRevealGames.id,
      pictureRevealGames.title,
      pictureRevealGames.description,
      pictureRevealGames.coverImagePath,
      pictureRevealGames.mode,
      pictureRevealGames.startScore,
      pictureRevealGames.openTilePenalty,
      pictureRevealGames.specialTilePenalty,
      pictureRevealGames.imageWidth,
      pictureRevealGames.imageHeight,
      pictureRevealGames.updatedAt,
    )
    .limit(1);

  const game = gameRows[0] ?? null;

  if (!game) {
    return null;
  }

  const images = await getActiveImagesForGame(id);

  return {
    ...game,
    images,
  };
}

/**
 * Creates a draft picture reveal game for an admin user.
 *
 * @param data - Validated create-game input from the route layer.
 * @param userId - Admin user id that owns the game.
 * @returns Created game row, or null if the insert cannot be reloaded.
 * @throws PictureRevealServiceError when callers attempt to publish on create.
 */
export async function createPictureRevealGame(
  data: CreatePictureRevealGameInput,
  userId: string,
) {
  if (data.status === "published") {
    throw new PictureRevealServiceError(
      400,
      "Create the game as draft before publishing",
    );
  }

  const id = crypto.randomUUID();

  await db.insert(pictureRevealGames).values({
    id,
    userId,
    title: data.title,
    description: data.description,
    coverImagePath: null,
    status: data.status,
    mode: data.mode,
    startScore: data.startScore,
    openTilePenalty: data.openTilePenalty,
    specialTilePenalty: data.specialTilePenalty,
    imageWidth: DEFAULT_PICTURE_REVEAL_IMAGE_SIZE,
    imageHeight: DEFAULT_PICTURE_REVEAL_IMAGE_SIZE,
  });

  return getPictureRevealGameById(id);
}

/**
 * Updates settings for an existing picture reveal game.
 *
 * @param id - Picture reveal game id to update.
 * @param data - Validated partial settings payload from the route layer.
 * @returns Updated game row, or null if the game cannot be reloaded.
 * @throws PictureRevealServiceError when publishing without required images.
 */
export async function updatePictureRevealGame(
  id: string,
  data: UpdatePictureRevealGameInput,
) {
  if (data.status === "published") {
    await assertPublishableGame(id);
  }

  await db
    .update(pictureRevealGames)
    .set(data)
    .where(eq(pictureRevealGames.id, id));

  return getPictureRevealGameById(id);
}

/**
 * Marks a picture reveal game as deleted while preserving historical rows.
 *
 * @param id - Picture reveal game id to soft-delete.
 * @returns Promise resolved after the deleted timestamp is stored.
 */
export async function softDeletePictureRevealGame(id: string) {
  await db
    .update(pictureRevealGames)
    .set({ deletedAt: new Date() })
    .where(eq(pictureRevealGames.id, id));
}

/**
 * Loads editable content for an admin picture reveal game.
 *
 * @param id - Picture reveal game id to load.
 * @returns Game row with active images, or null when missing or deleted.
 */
export async function getPictureRevealGameContent(id: string) {
  const game = await getPictureRevealGameById(id);

  if (!game || game.deletedAt) {
    return null;
  }

  const images = await getActiveImagesForGame(id);

  return {
    ...game,
    images,
  };
}

/**
 * Saves cover and image content for a picture reveal game.
 *
 * @param id - Picture reveal game id being edited.
 * @param data - Validated content payload from the editor route.
 * @returns Updated game content, or null if reloading fails after save.
 * @throws PictureRevealServiceError when the game is missing or content is invalid.
 */
export async function savePictureRevealGameContent(
  id: string,
  data: SavePictureRevealGameContentInput,
) {
  const game = await getPictureRevealGameById(id);

  if (!game || game.deletedAt) {
    throw new PictureRevealServiceError(404, "Game not found");
  }

  if (game.status === "published" && data.images.length === 0) {
    throw new PictureRevealServiceError(
      400,
      "Published games require at least one image",
    );
  }

  await db.transaction(async (tx) => {
    const resolvedCoverImagePath = data.coverTempUploadPath
      ? await finalizePictureRevealTempImageFile(data.coverTempUploadPath)
      : (data.coverImagePath ?? null);

    await tx
      .update(pictureRevealGames)
      .set({
        coverImagePath: resolvedCoverImagePath,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
      })
      .where(eq(pictureRevealGames.id, id));

    const existingImages = await tx
      .select()
      .from(pictureRevealImages)
      .where(
        and(
          eq(pictureRevealImages.gameId, id),
          isNull(pictureRevealImages.deletedAt),
        ),
      );

    const imageMap = new Map(existingImages.map((image) => [image.id, image]));
    const keptImageIds: string[] = [];

    for (const imageDraft of sortBySortOrder(data.images)) {
      const existingImage =
        imageDraft.id && imageMap.has(imageDraft.id)
          ? imageMap.get(imageDraft.id)
          : null;

      const imageId = existingImage?.id ?? crypto.randomUUID();
      const resolvedImagePath = await resolveImagePath(
        imageDraft,
        existingImage?.imagePath,
      );

      if (!resolvedImagePath) {
        throw new PictureRevealServiceError(400, "Image path is required");
      }

      const resolvedOriginalImagePath = await resolveOriginalImagePath(
        imageDraft,
        existingImage?.originalImagePath,
        resolvedImagePath,
      );

      if (existingImage) {
        await tx
          .update(pictureRevealImages)
          .set({
            imagePath: resolvedImagePath,
            originalImagePath: resolvedOriginalImagePath,
            answer: imageDraft.answer,
            rows: imageDraft.rows,
            cols: imageDraft.cols,
            specialTileCount: imageDraft.specialTileCount,
            specialPattern: imageDraft.specialPattern,
            sortOrder: imageDraft.sortOrder,
            deletedAt: null,
          })
          .where(eq(pictureRevealImages.id, imageId));
      } else {
        await tx.insert(pictureRevealImages).values({
          id: imageId,
          gameId: id,
          imagePath: resolvedImagePath,
          originalImagePath: resolvedOriginalImagePath,
          answer: imageDraft.answer,
          rows: imageDraft.rows,
          cols: imageDraft.cols,
          specialTileCount: imageDraft.specialTileCount,
          specialPattern: imageDraft.specialPattern,
          sortOrder: imageDraft.sortOrder,
        });
      }

      keptImageIds.push(imageId);
    }

    const removedImageIds = findRemovedImageIds(existingImages, keptImageIds);

    if (removedImageIds.length > 0) {
      await tx
        .update(pictureRevealImages)
        .set({ deletedAt: new Date() })
        .where(inArray(pictureRevealImages.id, removedImageIds));
    }
  });

  return getPictureRevealGameContent(id);
}
