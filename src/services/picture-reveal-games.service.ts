import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  pictureRevealGames,
  pictureRevealImages,
  pictureRevealImageChoices,
} from "@/db/schema";
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

  const rows = await db
    .select({
      id: pictureRevealGames.id,
      title: pictureRevealGames.title,
      description: pictureRevealGames.description,
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
      pictureRevealGames.mode,
      pictureRevealGames.startScore,
      pictureRevealGames.openTilePenalty,
      pictureRevealGames.specialTilePenalty,
      pictureRevealGames.imageWidth,
      pictureRevealGames.imageHeight,
      pictureRevealGames.updatedAt,
    )
    .limit(1);

  return rows[0] ?? null;
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

  const images = await db
    .select()
    .from(pictureRevealImages)
    .where(
      and(eq(pictureRevealImages.gameId, id), isNull(pictureRevealImages.deletedAt)),
    )
    .orderBy(pictureRevealImages.sortOrder, pictureRevealImages.createdAt);

  const choices =
    images.length === 0
      ? []
      : await db
          .select()
          .from(pictureRevealImageChoices)
          .where(
            and(
              inArray(
                pictureRevealImageChoices.imageId,
                images.map((image) => image.id),
              ),
              isNull(pictureRevealImageChoices.deletedAt),
            ),
          )
          .orderBy(
            pictureRevealImageChoices.imageId,
            pictureRevealImageChoices.sortOrder,
            pictureRevealImageChoices.createdAt,
          );

  const choicesByImageId = new Map<
    string,
    Array<typeof pictureRevealImageChoices.$inferSelect>
  >();

  for (const choice of choices) {
    const group = choicesByImageId.get(choice.imageId) ?? [];
    group.push(choice);
    choicesByImageId.set(choice.imageId, group);
  }

  return {
    ...game,
    images: images.map((image) => ({
      ...image,
      choices: sortBySortOrder(choicesByImageId.get(image.id) ?? []),
    })),
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
    await tx
      .update(pictureRevealGames)
      .set({
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
      })
      .where(eq(pictureRevealGames.id, id));

    const existingImages = await tx
      .select()
      .from(pictureRevealImages)
      .where(
        and(eq(pictureRevealImages.gameId, id), isNull(pictureRevealImages.deletedAt)),
      );

    const existingChoices =
      existingImages.length === 0
        ? []
        : await tx
            .select()
            .from(pictureRevealImageChoices)
            .where(
              and(
                inArray(
                  pictureRevealImageChoices.imageId,
                  existingImages.map((image) => image.id),
                ),
                isNull(pictureRevealImageChoices.deletedAt),
              ),
            );

    const imageMap = new Map(existingImages.map((image) => [image.id, image]));
    const choicesByImageId = new Map<
      string,
      Array<typeof pictureRevealImageChoices.$inferSelect>
    >();

    for (const choice of existingChoices) {
      const group = choicesByImageId.get(choice.imageId) ?? [];
      group.push(choice);
      choicesByImageId.set(choice.imageId, group);
    }

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
          rows: imageDraft.rows,
          cols: imageDraft.cols,
          specialTileCount: imageDraft.specialTileCount,
          specialPattern: imageDraft.specialPattern,
          sortOrder: imageDraft.sortOrder,
        });
      }

      keptImageIds.push(imageId);

      const currentChoices = choicesByImageId.get(imageId) ?? [];
      const choiceMap = new Map(currentChoices.map((choice) => [choice.id, choice]));
      const keptChoiceIds: string[] = [];

      for (const choiceDraft of sortBySortOrder(imageDraft.choices)) {
        const existingChoice =
          choiceDraft.id && choiceMap.has(choiceDraft.id)
            ? choiceMap.get(choiceDraft.id)
            : null;
        const choiceId = existingChoice?.id ?? crypto.randomUUID();

        if (existingChoice) {
          await tx
            .update(pictureRevealImageChoices)
            .set({
              label: choiceDraft.label,
              isCorrect: choiceDraft.isCorrect,
              sortOrder: choiceDraft.sortOrder,
              deletedAt: null,
            })
            .where(eq(pictureRevealImageChoices.id, choiceId));
        } else {
          await tx.insert(pictureRevealImageChoices).values({
            id: choiceId,
            imageId,
            label: choiceDraft.label,
            isCorrect: choiceDraft.isCorrect,
            sortOrder: choiceDraft.sortOrder,
          });
        }

        keptChoiceIds.push(choiceId);
      }

      const removedChoiceIds = currentChoices
        .filter((choice) => !keptChoiceIds.includes(choice.id))
        .map((choice) => choice.id);

      if (removedChoiceIds.length > 0) {
        await tx
          .update(pictureRevealImageChoices)
          .set({ deletedAt: new Date() })
          .where(inArray(pictureRevealImageChoices.id, removedChoiceIds));
      }
    }

    const removedImageIds = existingImages
      .filter((image) => !keptImageIds.includes(image.id))
      .map((image) => image.id);

    if (removedImageIds.length > 0) {
      await tx
        .update(pictureRevealImages)
        .set({ deletedAt: new Date() })
        .where(inArray(pictureRevealImages.id, removedImageIds));

      await tx
        .update(pictureRevealImageChoices)
        .set({ deletedAt: new Date() })
        .where(
          and(
            inArray(pictureRevealImageChoices.imageId, removedImageIds),
            isNull(pictureRevealImageChoices.deletedAt),
          ),
        );
    }
  });

  return getPictureRevealGameContent(id);
}
