import type {
  getPublicSoundGuessGameById,
  getPublicSoundGuessGames,
} from "@/services/sound-guess-games.service";
import type {
  PublicSoundGuessGameDetail,
  PublicSoundGuessGameSummary,
} from "@/types/sound-guess-public";

type PublicSoundGuessGameRow = Awaited<
  ReturnType<typeof getPublicSoundGuessGames>
>[number];

type PublicSoundGuessGameDetailRow = NonNullable<
  Awaited<ReturnType<typeof getPublicSoundGuessGameById>>
>;

/**
 * Converts a database-backed public sound guess row into the page summary contract.
 *
 * @param game - Public game row returned by the service layer.
 * @returns Serializable public summary with date values converted to strings.
 */
export function serializePublicSoundGuessGameSummary(
  game: PublicSoundGuessGameRow,
): PublicSoundGuessGameSummary {
  return {
    id: game.id,
    title: game.title,
    description: game.description,
    coverImagePath: game.coverImagePath ?? null,
    imageWidth: game.imageWidth,
    imageHeight: game.imageHeight,
    updatedAt: game.updatedAt.toISOString(),
    soundCount: game.soundCount,
  };
}

/**
 * Converts a public sound guess row with sounds into the playable detail contract.
 *
 * @param game - Public game row with active sounds loaded by the service layer.
 * @returns Serializable game detail used by the public play page.
 */
export function serializePublicSoundGuessGameDetail(
  game: PublicSoundGuessGameDetailRow,
): PublicSoundGuessGameDetail {
  return {
    ...serializePublicSoundGuessGameSummary(game),
    sounds: game.sounds.map((sound) => ({
      id: sound.id,
      audioPath: sound.audioPath,
      imagePath: sound.imagePath ?? null,
      answer: sound.answer,
      audioStartMs: sound.audioStartMs,
      audioEndMs: sound.audioEndMs ?? null,
      sortOrder: sound.sortOrder,
    })),
  };
}
