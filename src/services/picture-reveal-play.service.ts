import { createHash, randomBytes } from "node:crypto";
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { db } from "@/db";
export { PICTURE_REVEAL_PLAYER_TOKEN_COOKIE } from "@/lib/picture-reveal-constants";
import {
  pictureRevealGames,
  pictureRevealImages,
  pictureRevealImageChoices,
  pictureRevealPlayRounds,
  pictureRevealPlaySessions,
} from "@/db/schema";
import type {
  GuessPictureRevealChoiceInput,
  OpenPictureRevealTileInput,
  PictureRevealSessionListQueryInput,
} from "@/lib/validations";
import { PictureRevealServiceError } from "@/services/picture-reveal-errors";
import type {
  PictureRevealChoiceSnapshot,
  PictureRevealGameSnapshot,
  PictureRevealImageSnapshot,
  PictureRevealRoundView,
  PictureRevealSessionView,
  PictureRevealSpecialPattern,
} from "@/types/picture-reveal";

type PlayableImage = typeof pictureRevealImages.$inferSelect & {
  choices: Array<typeof pictureRevealImageChoices.$inferSelect>;
};

function hashPlayerToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function shuffleArray<T>(items: T[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function buildGameSnapshot(
  game: typeof pictureRevealGames.$inferSelect,
): PictureRevealGameSnapshot {
  return {
    title: game.title,
    description: game.description,
    status: game.status as PictureRevealGameSnapshot["status"],
    mode: game.mode as PictureRevealGameSnapshot["mode"],
    startScore: game.startScore,
    openTilePenalty: game.openTilePenalty,
    specialTilePenalty: game.specialTilePenalty,
  };
}

function buildImageSnapshot(
  image: typeof pictureRevealImages.$inferSelect,
): PictureRevealImageSnapshot {
  return {
    id: image.id,
    imagePath: image.imagePath,
    rows: image.rows,
    cols: image.cols,
    totalTiles: image.rows * image.cols,
    specialTileCount: image.specialTileCount,
    specialPattern: image.specialPattern as PictureRevealSpecialPattern,
  };
}

function buildChoiceSnapshot(
  choices: Array<typeof pictureRevealImageChoices.$inferSelect>,
): PictureRevealChoiceSnapshot[] {
  return [...choices]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((choice) => ({
      id: choice.id,
      label: choice.label,
      isCorrect: choice.isCorrect === 1,
      sortOrder: choice.sortOrder,
    }));
}

function getCorrectChoiceId(choiceSnapshot: PictureRevealChoiceSnapshot[]) {
  return choiceSnapshot.find((choice) => choice.isCorrect)?.id ?? null;
}

function createTileStates(totalTiles: number, openedTileNumbers: number[]) {
  const opened = new Set(openedTileNumbers);

  return Array.from({ length: totalTiles }, (_value, index) => ({
    number: index + 1,
    isOpened: opened.has(index + 1),
  }));
}

function buildRoundView(
  round: typeof pictureRevealPlayRounds.$inferSelect,
): PictureRevealRoundView {
  const choiceMap = new Map(
    round.choiceSnapshot.map((choice) => [choice.id, choice]),
  );

  return {
    id: round.id,
    roundIndex: round.roundIndex,
    outcome: round.outcome as PictureRevealRoundView["outcome"],
    imagePath: round.imageSnapshot.imagePath,
    rows: round.imageSnapshot.rows,
    cols: round.imageSnapshot.cols,
    tiles: createTileStates(
      round.imageSnapshot.totalTiles,
      round.openedTileNumbers,
    ),
    choices: round.shuffledChoiceOrder
      .map((choiceId) => choiceMap.get(choiceId))
      .filter((choice): choice is PictureRevealChoiceSnapshot => Boolean(choice))
      .map((choice) => ({
        id: choice.id,
        label: choice.label,
      })),
    openedTileNumbers: [...round.openedTileNumbers].sort((a, b) => a - b),
    guessedChoiceId: round.guessedChoiceId ?? null,
    correctChoiceId:
      round.outcome === "pending" ? null : getCorrectChoiceId(round.choiceSnapshot),
    roundScore: round.roundScore ?? null,
  };
}

function buildSessionView(
  session: typeof pictureRevealPlaySessions.$inferSelect,
  rounds: Array<typeof pictureRevealPlayRounds.$inferSelect>,
): PictureRevealSessionView & {
  gameTitle: string;
  totalRounds: number;
} {
  const sortedRounds = [...rounds].sort((left, right) => left.roundIndex - right.roundIndex);
  const currentRound =
    session.status === "active"
      ? sortedRounds.find((round) => round.roundIndex === session.currentRoundIndex) ??
        null
      : null;

  const completedRounds = sortedRounds.filter((round) => {
    if (session.status === "active") {
      return round.roundIndex < session.currentRoundIndex;
    }

    return round.outcome !== "pending";
  });

  return {
    id: session.id,
    gameId: session.gameId,
    gameTitle: session.gameSnapshot.title,
    mode: session.modeSnapshot as PictureRevealSessionView["mode"],
    status: session.status as PictureRevealSessionView["status"],
    currentScore: session.currentScore,
    finalScore: session.finalScore ?? null,
    roundCount: session.imageQueue.length,
    totalRounds: session.imageQueue.length,
    currentRound: currentRound ? buildRoundView(currentRound) : null,
    completedRounds: completedRounds.map(buildRoundView),
  };
}

function getPatternOffsets(pattern: PictureRevealSpecialPattern) {
  switch (pattern) {
    case "plus":
      return [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const;
    case "diagonal":
      return [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ] as const;
    case "ring":
      return [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ] as const;
    case "wide-plus":
      return [
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 2],
      ] as const;
    default:
      return [] as const;
  }
}

function toGridPosition(tileNumber: number, cols: number) {
  const zeroBased = tileNumber - 1;
  return {
    row: Math.floor(zeroBased / cols),
    col: zeroBased % cols,
  };
}

function toTileNumber(row: number, col: number, cols: number) {
  return row * cols + col + 1;
}

export function getPatternRevealTileNumbers(
  tileNumber: number,
  imageSnapshot: PictureRevealImageSnapshot,
) {
  const origin = toGridPosition(tileNumber, imageSnapshot.cols);
  const offsets = getPatternOffsets(imageSnapshot.specialPattern);
  const numbers = new Set<number>();

  for (const [rowOffset, colOffset] of offsets) {
    const nextRow = origin.row + rowOffset;
    const nextCol = origin.col + colOffset;

    if (
      nextRow < 0 ||
      nextCol < 0 ||
      nextRow >= imageSnapshot.rows ||
      nextCol >= imageSnapshot.cols
    ) {
      continue;
    }

    numbers.add(toTileNumber(nextRow, nextCol, imageSnapshot.cols));
  }

  return [...numbers].sort((left, right) => left - right);
}

function pickUniqueTileNumbers(totalTiles: number, count: number) {
  return shuffleArray(
    Array.from({ length: totalTiles }, (_value, index) => index + 1),
  )
    .slice(0, count)
    .sort((left, right) => left - right);
}

async function getPlayablePublishedGame(gameId: string) {
  const gameRows = await db
    .select()
    .from(pictureRevealGames)
    .where(
      and(
        eq(pictureRevealGames.id, gameId),
        eq(pictureRevealGames.status, "published"),
        isNull(pictureRevealGames.deletedAt),
      ),
    )
    .limit(1);

  const game = gameRows[0] ?? null;

  if (!game) {
    throw new PictureRevealServiceError(404, "Game not found");
  }

  const images = await db
    .select()
    .from(pictureRevealImages)
    .where(
      and(
        eq(pictureRevealImages.gameId, gameId),
        isNull(pictureRevealImages.deletedAt),
      ),
    )
    .orderBy(pictureRevealImages.sortOrder, pictureRevealImages.createdAt);

  if (images.length === 0) {
    throw new PictureRevealServiceError(400, "Game has no playable images");
  }

  const choices = await db
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

  const choicesByImageId = new Map<string, Array<typeof pictureRevealImageChoices.$inferSelect>>();

  for (const choice of choices) {
    const group = choicesByImageId.get(choice.imageId) ?? [];
    group.push(choice);
    choicesByImageId.set(choice.imageId, group);
  }

  const playableImages: PlayableImage[] = images.map((image) => ({
    ...image,
    choices: choicesByImageId.get(image.id) ?? [],
  }));

  if (playableImages.some((image) => image.choices.length < 2)) {
    throw new PictureRevealServiceError(
      400,
      "All published images must have at least two choices",
    );
  }

  return {
    game,
    images: playableImages,
  };
}

async function getLastPlayedImageId(gameId: string, playerTokenHash: string) {
  const sessions = await db
    .select()
    .from(pictureRevealPlaySessions)
    .where(
      and(
        eq(pictureRevealPlaySessions.gameId, gameId),
        eq(pictureRevealPlaySessions.playerTokenHash, playerTokenHash),
      ),
    )
    .orderBy(desc(pictureRevealPlaySessions.createdAt))
    .limit(1);

  const lastSession = sessions[0] ?? null;

  if (!lastSession) {
    return null;
  }

  const rounds = await db
    .select({
      imageId: pictureRevealPlayRounds.imageId,
    })
    .from(pictureRevealPlayRounds)
    .where(eq(pictureRevealPlayRounds.sessionId, lastSession.id))
    .orderBy(desc(pictureRevealPlayRounds.roundIndex), desc(pictureRevealPlayRounds.createdAt))
    .limit(1);

  return rounds[0]?.imageId ?? null;
}

export function createImageQueue(
  images: PlayableImage[],
  mode: string,
  lastPlayedImageId: string | null,
) {
  if (mode === "single") {
    const candidates =
      lastPlayedImageId && images.length > 1
        ? images.filter((image) => image.id !== lastPlayedImageId)
        : images;

    return [shuffleArray(candidates)[0].id];
  }

  return shuffleArray(images.map((image) => image.id));
}

async function getSessionWithRounds(sessionId: string) {
  const sessionRows = await db
    .select()
    .from(pictureRevealPlaySessions)
    .where(eq(pictureRevealPlaySessions.id, sessionId))
    .limit(1);

  const session = sessionRows[0] ?? null;

  if (!session) {
    throw new PictureRevealServiceError(404, "Session not found");
  }

  const rounds = await db
    .select()
    .from(pictureRevealPlayRounds)
    .where(eq(pictureRevealPlayRounds.sessionId, sessionId))
    .orderBy(pictureRevealPlayRounds.roundIndex, pictureRevealPlayRounds.createdAt);

  return { session, rounds };
}

function assertSessionAccess(
  session: typeof pictureRevealPlaySessions.$inferSelect,
  playerToken: string | null,
  isAdmin: boolean,
) {
  if (isAdmin) {
    return;
  }

  if (!playerToken) {
    throw new PictureRevealServiceError(401, "Player token required");
  }

  if (hashPlayerToken(playerToken) !== session.playerTokenHash) {
    throw new PictureRevealServiceError(403, "Forbidden");
  }
}

function getCurrentRound(
  session: typeof pictureRevealPlaySessions.$inferSelect,
  rounds: Array<typeof pictureRevealPlayRounds.$inferSelect>,
) {
  const round =
    rounds.find((item) => item.roundIndex === session.currentRoundIndex) ?? null;

  if (!round) {
    throw new PictureRevealServiceError(500, "Current round not found");
  }

  return round;
}

function buildSeedRounds(params: {
  sessionId: string;
  imageQueue: string[];
  imagesById: Map<string, PlayableImage>;
  startScore: number;
}) {
  return params.imageQueue.map((imageId, roundIndex) => {
    const image = params.imagesById.get(imageId);

    if (!image) {
      throw new PictureRevealServiceError(500, "Queued image not found");
    }

    const imageSnapshot = buildImageSnapshot(image);
    const choiceSnapshot = buildChoiceSnapshot(image.choices);

    return {
      id: crypto.randomUUID(),
      sessionId: params.sessionId,
      imageId: image.id,
      roundIndex,
      outcome: "pending" as const,
      openedTileCount: 0,
      autoOpenedTileCount: 0,
      specialHitCount: 0,
      roundScore: null,
      sessionScoreBefore: roundIndex === 0 ? params.startScore : 0,
      sessionScoreAfter: roundIndex === 0 ? params.startScore : 0,
      imageSnapshot,
      choiceSnapshot,
      shuffledChoiceOrder: shuffleArray(choiceSnapshot.map((choice) => choice.id)),
      specialTileNumbers: pickUniqueTileNumbers(
        imageSnapshot.totalTiles,
        imageSnapshot.specialTileCount,
      ),
      openedTileNumbers: [],
      completedAt: null,
    };
  });
}

export async function createPictureRevealSession(
  gameId: string,
  currentPlayerToken: string | null,
) {
  const { game, images } = await getPlayablePublishedGame(gameId);
  const playerToken = currentPlayerToken ?? randomBytes(24).toString("hex");
  const playerTokenHash = hashPlayerToken(playerToken);
  const lastPlayedImageId =
    game.mode === "single"
      ? await getLastPlayedImageId(gameId, playerTokenHash)
      : null;
  const imageQueue = createImageQueue(images, game.mode, lastPlayedImageId);
  const sessionId = crypto.randomUUID();
  const imagesById = new Map(images.map((image) => [image.id, image]));
  const rounds = buildSeedRounds({
    sessionId,
    imageQueue,
    imagesById,
    startScore: game.startScore,
  });

  await db.transaction(async (tx) => {
    await tx.insert(pictureRevealPlaySessions).values({
      id: sessionId,
      gameId,
      playerTokenHash,
      modeSnapshot: game.mode,
      status: "active",
      currentRoundIndex: 0,
      currentScore: game.startScore,
      finalScore: null,
      gameSnapshot: buildGameSnapshot(game),
      imageQueue,
      completedAt: null,
    });

    await tx.insert(pictureRevealPlayRounds).values(rounds);
  });

  const sessionView = await getPictureRevealSessionView(
    gameId,
    sessionId,
    playerToken,
    false,
  );

  return {
    session: sessionView,
    issuedPlayerToken: currentPlayerToken ? null : playerToken,
  };
}

export async function getPictureRevealSessionView(
  gameId: string,
  sessionId: string,
  playerToken: string | null,
  isAdmin = false,
) {
  const { session, rounds } = await getSessionWithRounds(sessionId);

  if (session.gameId !== gameId) {
    throw new PictureRevealServiceError(404, "Session not found");
  }

  assertSessionAccess(session, playerToken, isAdmin);

  return buildSessionView(session, rounds);
}

export async function openPictureRevealTile(
  gameId: string,
  sessionId: string,
  input: OpenPictureRevealTileInput,
  playerToken: string | null,
  isAdmin = false,
) {
  const { session, rounds } = await getSessionWithRounds(sessionId);

  if (session.gameId !== gameId) {
    throw new PictureRevealServiceError(404, "Session not found");
  }

  assertSessionAccess(session, playerToken, isAdmin);

  if (session.status !== "active") {
    throw new PictureRevealServiceError(400, "Session already completed");
  }

  const round = getCurrentRound(session, rounds);

  if (round.outcome !== "pending") {
    throw new PictureRevealServiceError(400, "Round already completed");
  }

  if (input.tileNumber > round.imageSnapshot.totalTiles) {
    throw new PictureRevealServiceError(400, "Invalid tile number");
  }

  const openedTileNumbers = new Set(round.openedTileNumbers);

  if (openedTileNumbers.has(input.tileNumber)) {
    throw new PictureRevealServiceError(400, "Tile already opened");
  }

  const isSpecial = round.specialTileNumbers.includes(input.tileNumber);
  const autoOpenedTileNumbers = isSpecial
    ? getPatternRevealTileNumbers(input.tileNumber, round.imageSnapshot).filter(
        (tileNumber) => !openedTileNumbers.has(tileNumber) && tileNumber !== input.tileNumber,
      )
    : [];

  openedTileNumbers.add(input.tileNumber);

  for (const tileNumber of autoOpenedTileNumbers) {
    openedTileNumbers.add(tileNumber);
  }

  const nextScore = Math.max(
    session.currentScore -
      session.gameSnapshot.openTilePenalty -
      (isSpecial ? session.gameSnapshot.specialTilePenalty : 0),
    0,
  );

  await db
    .update(pictureRevealPlayRounds)
    .set({
      openedTileNumbers: [...openedTileNumbers].sort((left, right) => left - right),
      openedTileCount: openedTileNumbers.size,
      autoOpenedTileCount: round.autoOpenedTileCount + autoOpenedTileNumbers.length,
      specialHitCount: round.specialHitCount + (isSpecial ? 1 : 0),
      sessionScoreAfter: nextScore,
    })
    .where(eq(pictureRevealPlayRounds.id, round.id));

  await db
    .update(pictureRevealPlaySessions)
    .set({ currentScore: nextScore })
    .where(eq(pictureRevealPlaySessions.id, session.id));

  return getPictureRevealSessionView(gameId, sessionId, playerToken, isAdmin);
}

export async function guessPictureRevealChoice(
  gameId: string,
  sessionId: string,
  input: GuessPictureRevealChoiceInput,
  playerToken: string | null,
  isAdmin = false,
) {
  const { session, rounds } = await getSessionWithRounds(sessionId);

  if (session.gameId !== gameId) {
    throw new PictureRevealServiceError(404, "Session not found");
  }

  assertSessionAccess(session, playerToken, isAdmin);

  if (session.status !== "active") {
    throw new PictureRevealServiceError(400, "Session already completed");
  }

  const round = getCurrentRound(session, rounds);

  if (round.outcome !== "pending") {
    throw new PictureRevealServiceError(400, "Round already completed");
  }

  const choiceIds = new Set(round.choiceSnapshot.map((choice) => choice.id));

  if (!choiceIds.has(input.choiceId)) {
    throw new PictureRevealServiceError(400, "Choice not found");
  }

  const correctChoiceId = getCorrectChoiceId(round.choiceSnapshot);
  const isCorrect = input.choiceId === correctChoiceId;
  const roundScore = isCorrect ? session.currentScore : 0;
  const completedAt = new Date();
  const nextRoundIndex = session.currentRoundIndex + 1;
  const isLastRound = nextRoundIndex >= session.imageQueue.length;

  await db
    .update(pictureRevealPlayRounds)
    .set({
      guessedChoiceId: input.choiceId,
      outcome: isCorrect ? "correct" : "wrong",
      roundScore,
      sessionScoreAfter: session.currentScore,
      completedAt,
    })
    .where(eq(pictureRevealPlayRounds.id, round.id));

  if (session.modeSnapshot === "single") {
    await db
      .update(pictureRevealPlaySessions)
      .set({
        status: "completed",
        finalScore: roundScore,
        completedAt,
      })
      .where(eq(pictureRevealPlaySessions.id, session.id));
  } else if (isLastRound) {
    await db
      .update(pictureRevealPlaySessions)
      .set({
        status: "completed",
        finalScore: session.currentScore,
        completedAt,
      })
      .where(eq(pictureRevealPlaySessions.id, session.id));
  } else {
    const nextRound = rounds.find((item) => item.roundIndex === nextRoundIndex);

    if (!nextRound) {
      throw new PictureRevealServiceError(500, "Next round not found");
    }

    await db
      .update(pictureRevealPlaySessions)
      .set({ currentRoundIndex: nextRoundIndex })
      .where(eq(pictureRevealPlaySessions.id, session.id));

    await db
      .update(pictureRevealPlayRounds)
      .set({
        sessionScoreBefore: session.currentScore,
        sessionScoreAfter: session.currentScore,
      })
      .where(eq(pictureRevealPlayRounds.id, nextRound.id));
  }

  return getPictureRevealSessionView(gameId, sessionId, playerToken, isAdmin);
}

export async function getAdminPictureRevealSessionHistory(
  gameId: string,
  query: PictureRevealSessionListQueryInput,
) {
  const sessions = await db
    .select()
    .from(pictureRevealPlaySessions)
    .where(
      query.status
        ? and(
            eq(pictureRevealPlaySessions.gameId, gameId),
            eq(pictureRevealPlaySessions.status, query.status),
          )
        : eq(pictureRevealPlaySessions.gameId, gameId),
    )
    .orderBy(desc(pictureRevealPlaySessions.createdAt))
    .limit(query.limit);

  if (sessions.length === 0) {
    return [];
  }

  const rounds = await db
    .select()
    .from(pictureRevealPlayRounds)
    .where(
      inArray(
        pictureRevealPlayRounds.sessionId,
        sessions.map((session) => session.id),
      ),
    )
    .orderBy(
      pictureRevealPlayRounds.sessionId,
      pictureRevealPlayRounds.roundIndex,
      pictureRevealPlayRounds.createdAt,
    );

  const roundsBySessionId = new Map<
    string,
    Array<typeof pictureRevealPlayRounds.$inferSelect>
  >();

  for (const round of rounds) {
    const group = roundsBySessionId.get(round.sessionId) ?? [];
    group.push(round);
    roundsBySessionId.set(round.sessionId, group);
  }

  return sessions.map((session) => {
    const sessionRounds = roundsBySessionId.get(session.id) ?? [];
    const correctRounds = sessionRounds.filter((round) => round.outcome === "correct")
      .length;
    const wrongRounds = sessionRounds.filter((round) => round.outcome === "wrong")
      .length;

    return {
      id: session.id,
      gameId: session.gameId,
      title: session.gameSnapshot.title,
      mode: session.modeSnapshot,
      status: session.status,
      currentScore: session.currentScore,
      finalScore: session.finalScore,
      roundCount: session.imageQueue.length,
      correctRounds,
      wrongRounds,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    };
  });
}
