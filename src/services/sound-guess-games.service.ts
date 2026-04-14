import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { soundGuessGames, soundGuessSounds } from "@/db/schema";
import {
  finalizeSoundGuessTempAudioFile,
  finalizeSoundGuessTempCoverImageFile,
} from "@/lib/sound-guess-upload";
import type {
  CreateSoundGuessGameInput,
  SaveSoundGuessGameContentInput,
  SoundGuessSoundDraftInput,
  UpdateSoundGuessGameInput,
} from "@/lib/validations";
import { SoundGuessServiceError } from "@/services/sound-guess-errors";

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
 * Counts active sounds for publishability checks.
 *
 * @param gameId - Game id whose non-deleted sounds should be counted.
 * @returns Number of active sounds attached to the game.
 */
async function countActiveSoundsForGame(gameId: string) {
  const rows = await db
    .select({
      count: sql<number>`count(${soundGuessSounds.id})`
        .mapWith(Number)
        .as("count"),
    })
    .from(soundGuessSounds)
    .where(
      and(
        eq(soundGuessSounds.gameId, gameId),
        isNull(soundGuessSounds.deletedAt),
      ),
    );

  return rows[0]?.count ?? 0;
}

/**
 * Ensures a game has required content before publishing.
 *
 * @param gameId - Game id being moved to published status.
 * @returns Promise resolved when the game can be published.
 * @throws SoundGuessServiceError when no active sounds are attached.
 */
async function assertPublishableGame(gameId: string) {
  const activeSoundCount = await countActiveSoundsForGame(gameId);

  if (activeSoundCount === 0) {
    throw new SoundGuessServiceError(
      400,
      "Published games require at least one sound",
    );
  }
}

/**
 * Loads non-deleted sounds for a game in display order.
 *
 * @param gameId - Game id whose sounds should be loaded.
 * @returns Active sound rows ordered for editing and public playback.
 */
async function getActiveSoundsForGame(gameId: string) {
  return db
    .select()
    .from(soundGuessSounds)
    .where(
      and(
        eq(soundGuessSounds.gameId, gameId),
        isNull(soundGuessSounds.deletedAt),
      ),
    )
    .orderBy(soundGuessSounds.sortOrder, soundGuessSounds.createdAt);
}

/**
 * Resolves the stored audio path for a submitted sound draft.
 *
 * @param soundDraft - Submitted sound draft from the content editor.
 * @param existingAudioPath - Current stored audio path for existing sounds.
 * @returns Final audio path to persist, or null when no audio path is available.
 */
async function resolveAudioPath(
  soundDraft: SoundGuessSoundDraftInput,
  existingAudioPath: string | null | undefined,
) {
  return soundDraft.tempAudioPath
    ? await finalizeSoundGuessTempAudioFile(soundDraft.tempAudioPath)
    : (soundDraft.audioPath ?? existingAudioPath ?? null);
}

/**
 * Finds sound ids removed from the submitted content.
 *
 * @param existingSounds - Active sound rows currently persisted for the game.
 * @param keptSoundIds - Sound ids inserted or updated during the save operation.
 * @returns Existing sound ids that should be soft-deleted.
 */
function findRemovedSoundIds(
  existingSounds: Array<{ id: string }>,
  keptSoundIds: string[],
) {
  const keptIds = new Set(keptSoundIds);

  return existingSounds
    .filter((sound) => !keptIds.has(sound.id))
    .map((sound) => sound.id);
}

/**
 * Loads one sound guess game by id without filtering deleted rows.
 *
 * @param id - Sound guess game id.
 * @returns Game row when found, otherwise null.
 */
export async function getSoundGuessGameById(id: string) {
  const rows = await db
    .select()
    .from(soundGuessGames)
    .where(eq(soundGuessGames.id, id))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Lists non-deleted sound guess games for the admin dashboard.
 *
 * @returns Admin game summaries with active sound counts.
 */
export async function getAdminSoundGuessGames() {
  const soundCount = sql<number>`count(${soundGuessSounds.id})`
    .mapWith(Number)
    .as("soundCount");

  return db
    .select({
      id: soundGuessGames.id,
      userId: soundGuessGames.userId,
      title: soundGuessGames.title,
      description: soundGuessGames.description,
      coverImagePath: soundGuessGames.coverImagePath,
      status: soundGuessGames.status,
      createdAt: soundGuessGames.createdAt,
      updatedAt: soundGuessGames.updatedAt,
      deletedAt: soundGuessGames.deletedAt,
      soundCount,
    })
    .from(soundGuessGames)
    .leftJoin(
      soundGuessSounds,
      and(
        eq(soundGuessSounds.gameId, soundGuessGames.id),
        isNull(soundGuessSounds.deletedAt),
      ),
    )
    .where(isNull(soundGuessGames.deletedAt))
    .groupBy(
      soundGuessGames.id,
      soundGuessGames.userId,
      soundGuessGames.title,
      soundGuessGames.description,
      soundGuessGames.coverImagePath,
      soundGuessGames.status,
      soundGuessGames.createdAt,
      soundGuessGames.updatedAt,
      soundGuessGames.deletedAt,
    )
    .orderBy(desc(soundGuessGames.updatedAt), desc(soundGuessGames.createdAt));
}

/**
 * Lists published sound guess games for the public gallery.
 *
 * @returns Public game summaries with active sound counts.
 */
export async function getPublicSoundGuessGames() {
  const soundCount = sql<number>`count(${soundGuessSounds.id})`
    .mapWith(Number)
    .as("soundCount");

  return db
    .select({
      id: soundGuessGames.id,
      title: soundGuessGames.title,
      description: soundGuessGames.description,
      coverImagePath: soundGuessGames.coverImagePath,
      updatedAt: soundGuessGames.updatedAt,
      soundCount,
    })
    .from(soundGuessGames)
    .leftJoin(
      soundGuessSounds,
      and(
        eq(soundGuessSounds.gameId, soundGuessGames.id),
        isNull(soundGuessSounds.deletedAt),
      ),
    )
    .where(
      and(
        eq(soundGuessGames.status, "published"),
        isNull(soundGuessGames.deletedAt),
      ),
    )
    .groupBy(
      soundGuessGames.id,
      soundGuessGames.title,
      soundGuessGames.description,
      soundGuessGames.coverImagePath,
      soundGuessGames.updatedAt,
    )
    .orderBy(desc(soundGuessGames.updatedAt), desc(soundGuessGames.createdAt));
}

/**
 * Loads a published sound guess game and its active sounds for public play.
 *
 * @param id - Sound guess game id from the public route.
 * @returns Public game row with sounds, or null when unavailable.
 */
export async function getPublicSoundGuessGameById(id: string) {
  const soundCount = sql<number>`count(${soundGuessSounds.id})`
    .mapWith(Number)
    .as("soundCount");

  const gameRows = await db
    .select({
      id: soundGuessGames.id,
      title: soundGuessGames.title,
      description: soundGuessGames.description,
      coverImagePath: soundGuessGames.coverImagePath,
      updatedAt: soundGuessGames.updatedAt,
      soundCount,
    })
    .from(soundGuessGames)
    .leftJoin(
      soundGuessSounds,
      and(
        eq(soundGuessSounds.gameId, soundGuessGames.id),
        isNull(soundGuessSounds.deletedAt),
      ),
    )
    .where(
      and(
        eq(soundGuessGames.id, id),
        eq(soundGuessGames.status, "published"),
        isNull(soundGuessGames.deletedAt),
      ),
    )
    .groupBy(
      soundGuessGames.id,
      soundGuessGames.title,
      soundGuessGames.description,
      soundGuessGames.coverImagePath,
      soundGuessGames.updatedAt,
    )
    .limit(1);

  const game = gameRows[0] ?? null;

  if (!game) {
    return null;
  }

  const sounds = await getActiveSoundsForGame(id);

  return {
    ...game,
    sounds,
  };
}

/**
 * Creates a draft sound guess game for an admin user.
 *
 * @param data - Validated create-game input from the route layer.
 * @param userId - Admin user id that owns the game.
 * @returns Created game row, or null if the insert cannot be reloaded.
 * @throws SoundGuessServiceError when callers attempt to publish on create.
 */
export async function createSoundGuessGame(
  data: CreateSoundGuessGameInput,
  userId: string,
) {
  if (data.status === "published") {
    throw new SoundGuessServiceError(
      400,
      "Create the game as draft before publishing",
    );
  }

  const id = crypto.randomUUID();

  await db.insert(soundGuessGames).values({
    id,
    userId,
    title: data.title,
    description: data.description,
    coverImagePath: null,
    status: data.status,
  });

  return getSoundGuessGameById(id);
}

/**
 * Updates settings for an existing sound guess game.
 *
 * @param id - Sound guess game id to update.
 * @param data - Validated partial settings payload from the route layer.
 * @returns Updated game row, or null if the game cannot be reloaded.
 * @throws SoundGuessServiceError when publishing without required sounds.
 */
export async function updateSoundGuessGame(
  id: string,
  data: UpdateSoundGuessGameInput,
) {
  if (data.status === "published") {
    await assertPublishableGame(id);
  }

  await db.update(soundGuessGames).set(data).where(eq(soundGuessGames.id, id));

  return getSoundGuessGameById(id);
}

/**
 * Marks a sound guess game as deleted while preserving historical rows.
 *
 * @param id - Sound guess game id to soft-delete.
 * @returns Promise resolved after the deleted timestamp is stored.
 */
export async function softDeleteSoundGuessGame(id: string) {
  await db
    .update(soundGuessGames)
    .set({ deletedAt: new Date() })
    .where(eq(soundGuessGames.id, id));
}

/**
 * Loads editable content for an admin sound guess game.
 *
 * @param id - Sound guess game id to load.
 * @returns Game row with active sounds, or null when missing or deleted.
 */
export async function getSoundGuessGameContent(id: string) {
  const game = await getSoundGuessGameById(id);

  if (!game || game.deletedAt) {
    return null;
  }

  const sounds = await getActiveSoundsForGame(id);

  return {
    ...game,
    sounds,
  };
}

/**
 * Resolves the stored cover path for submitted content.
 *
 * @param currentCoverImagePath - Existing cover path on the game row.
 * @param data - Validated content payload from the editor route.
 * @returns Final cover path to persist, preserving existing cover when omitted.
 */
async function resolveCoverImagePath(
  currentCoverImagePath: string | null,
  data: SaveSoundGuessGameContentInput,
) {
  if (data.coverTempUploadPath) {
    return finalizeSoundGuessTempCoverImageFile(data.coverTempUploadPath);
  }

  if ("coverImagePath" in data) {
    return data.coverImagePath ?? null;
  }

  return currentCoverImagePath;
}

/**
 * Saves cover and sound content for a sound guess game.
 *
 * @param id - Sound guess game id being edited.
 * @param data - Validated content payload from the editor route.
 * @returns Updated game content, or null if reloading fails after save.
 * @throws SoundGuessServiceError when the game is missing or content is invalid.
 */
export async function saveSoundGuessGameContent(
  id: string,
  data: SaveSoundGuessGameContentInput,
) {
  const game = await getSoundGuessGameById(id);

  if (!game || game.deletedAt) {
    throw new SoundGuessServiceError(404, "Game not found");
  }

  if (game.status === "published" && data.sounds.length === 0) {
    throw new SoundGuessServiceError(
      400,
      "Published games require at least one sound",
    );
  }

  await db.transaction(async (tx) => {
    const resolvedCoverImagePath = await resolveCoverImagePath(
      game.coverImagePath,
      data,
    );

    await tx
      .update(soundGuessGames)
      .set({ coverImagePath: resolvedCoverImagePath })
      .where(eq(soundGuessGames.id, id));

    const existingSounds = await tx
      .select()
      .from(soundGuessSounds)
      .where(
        and(
          eq(soundGuessSounds.gameId, id),
          isNull(soundGuessSounds.deletedAt),
        ),
      );

    const soundMap = new Map(existingSounds.map((sound) => [sound.id, sound]));
    const keptSoundIds: string[] = [];

    for (const soundDraft of sortBySortOrder(data.sounds)) {
      const existingSound =
        soundDraft.id && soundMap.has(soundDraft.id)
          ? soundMap.get(soundDraft.id)
          : null;

      const soundId = existingSound?.id ?? crypto.randomUUID();
      const resolvedAudioPath = await resolveAudioPath(
        soundDraft,
        existingSound?.audioPath,
      );

      if (!resolvedAudioPath) {
        throw new SoundGuessServiceError(400, "Audio path is required");
      }

      if (existingSound) {
        await tx
          .update(soundGuessSounds)
          .set({
            audioPath: resolvedAudioPath,
            answer: soundDraft.answer,
            sortOrder: soundDraft.sortOrder,
            deletedAt: null,
          })
          .where(eq(soundGuessSounds.id, soundId));
      } else {
        await tx.insert(soundGuessSounds).values({
          id: soundId,
          gameId: id,
          audioPath: resolvedAudioPath,
          answer: soundDraft.answer,
          sortOrder: soundDraft.sortOrder,
        });
      }

      keptSoundIds.push(soundId);
    }

    const removedSoundIds = findRemovedSoundIds(existingSounds, keptSoundIds);

    if (removedSoundIds.length > 0) {
      await tx
        .update(soundGuessSounds)
        .set({ deletedAt: new Date() })
        .where(inArray(soundGuessSounds.id, removedSoundIds));
    }
  });

  return getSoundGuessGameContent(id);
}

