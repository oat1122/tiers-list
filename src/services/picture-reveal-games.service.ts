import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { pictureRevealGames, pictureRevealImages } from "@/db/schema";
import { finalizePictureRevealTempImageFile } from "@/lib/picture-reveal-upload";
import type {
  CreatePictureRevealGameInput,
  SavePictureRevealGameContentInput,
  UpdatePictureRevealGameInput,
} from "@/lib/validations";
import { PictureRevealServiceError } from "@/services/picture-reveal-errors";

function sortBySortOrder<T extends { sortOrder: number }>(items: T[]) {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder);
}

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

async function assertPublishableGame(gameId: string) {
  const activeImageCount = await countActiveImagesForGame(gameId);

  if (activeImageCount === 0) {
    throw new PictureRevealServiceError(
      400,
      "Published games require at least one image",
    );
  }
}

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

export async function getPictureRevealGameById(id: string) {
  const rows = await db
    .select()
    .from(pictureRevealGames)
    .where(eq(pictureRevealGames.id, id))
    .limit(1);

  return rows[0] ?? null;
}

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
    .orderBy(desc(pictureRevealGames.updatedAt), desc(pictureRevealGames.createdAt));
}

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
    .orderBy(desc(pictureRevealGames.updatedAt), desc(pictureRevealGames.createdAt));
}

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
    imageWidth: 1080,
    imageHeight: 1080,
  });

  return getPictureRevealGameById(id);
}

export async function updatePictureRevealGame(
  id: string,
  data: UpdatePictureRevealGameInput,
) {
  if (data.status === "published") {
    await assertPublishableGame(id);
  }

  await db.update(pictureRevealGames).set(data).where(eq(pictureRevealGames.id, id));

  return getPictureRevealGameById(id);
}

export async function softDeletePictureRevealGame(id: string) {
  await db
    .update(pictureRevealGames)
    .set({ deletedAt: new Date() })
    .where(eq(pictureRevealGames.id, id));
}

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
      : data.coverImagePath ?? null;

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
      const resolvedImagePath = imageDraft.tempImagePath
        ? await finalizePictureRevealTempImageFile(imageDraft.tempImagePath)
        : imageDraft.imagePath ?? existingImage?.imagePath ?? null;
      const resolvedOriginalImagePath = imageDraft.tempOriginalImagePath
        ? await finalizePictureRevealTempImageFile(
            imageDraft.tempOriginalImagePath,
          )
        : imageDraft.originalImagePath ??
          existingImage?.originalImagePath ??
          resolvedImagePath;

      if (!resolvedImagePath) {
        throw new PictureRevealServiceError(400, "Image path is required");
      }

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

    const removedImageIds = existingImages
      .filter((image) => !keptImageIds.includes(image.id))
      .map((image) => image.id);

    if (removedImageIds.length > 0) {
      await tx
        .update(pictureRevealImages)
        .set({ deletedAt: new Date() })
        .where(inArray(pictureRevealImages.id, removedImageIds));
    }
  });

  return getPictureRevealGameContent(id);
}
