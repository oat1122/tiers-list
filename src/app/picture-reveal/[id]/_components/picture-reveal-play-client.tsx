"use client";

import { useId, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPatternRevealTileNumbers } from "@/lib/picture-reveal-gameplay";
import type { PublicPictureRevealGameDetail } from "@/types/picture-reveal-public";
import {
  PICTURE_REVEAL_BOARD_SIZE_OPTIONS,
  PictureRevealBoardSizeControls,
  PictureRevealFloatingLeaderboard,
  PictureRevealTileBoard,
  type PictureRevealBoardSizePreset,
} from "./picture-reveal-play-ui";
import {
  awardLeaderboardPoints,
  buildHostRounds,
  normalizeWinnerName,
  type PictureRevealHostRound,
  type PictureRevealLeaderboardEntry,
} from "./picture-reveal-play-client.utils";

type PlayViewState = "idle" | "active" | "completed";
const MIN_BOARD_TILE_TARGET_PX = 40;
const MIN_BOARD_WIDTH_PX = 240;

/**
 * Formats the public session mode for host-facing badges.
 *
 * @param mode - Game mode configured for the picture reveal game.
 * @returns Display label for the mode badge.
 */
function modeLabel(mode: PublicPictureRevealGameDetail["mode"]) {
  return mode === "single" ? "Single" : "Marathon";
}

/**
 * Runs the host-controlled picture reveal game flow in browser state.
 *
 * @param props - Public game detail rendered by the server page.
 * @returns Interactive host player for opening tiles and awarding points.
 */
export function PictureRevealPlayClient({
  game,
}: {
  game: PublicPictureRevealGameDetail;
}) {
  const [viewState, setViewState] = useState<PlayViewState>("idle");
  const [rounds, setRounds] = useState<PictureRevealHostRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState<
    PictureRevealLeaderboardEntry[]
  >([]);
  const [openingTileNumber, setOpeningTileNumber] = useState<number | null>(
    null,
  );
  const [recentAutoReveal, setRecentAutoReveal] = useState<number[]>([]);
  const [winnerName, setWinnerName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [boardSize, setBoardSize] =
    useState<PictureRevealBoardSizePreset>("full");
  const winnerSuggestionListId = useId();

  const currentRound = rounds[currentRoundIndex] ?? null;
  const completedRounds = rounds.filter((round) => round.isCompleted);
  const boardDisabled =
    !currentRound ||
    openingTileNumber !== null ||
    currentRound.answerRevealed ||
    viewState !== "active";
  const currentScore = currentRound?.currentScore ?? game.startScore;
  const progressTotal = rounds.length || game.imageCount;
  const progressValue =
    viewState === "idle"
      ? "Not started"
      : `${Math.min(currentRoundIndex + 1, progressTotal)} / ${progressTotal}`;
  const normalizedWinnerQuery =
    normalizeWinnerName(winnerName).toLocaleLowerCase("th-TH");
  const winnerSuggestions = leaderboard
    .filter((entry) =>
      normalizedWinnerQuery.length === 0
        ? true
        : entry.name.toLocaleLowerCase("th-TH").includes(normalizedWinnerQuery),
    )
    .slice(0, 6);
  const boardScale =
    PICTURE_REVEAL_BOARD_SIZE_OPTIONS.find(
      (option) => option.value === boardSize,
    )?.scale ?? 1;
  const minimumBoardWidth =
    currentRound !== null
      ? Math.max(
          currentRound.image.cols * MIN_BOARD_TILE_TARGET_PX,
          MIN_BOARD_WIDTH_PX,
        )
      : MIN_BOARD_WIDTH_PX;

  /**
   * Starts or restarts a host run with a fresh round queue and leaderboard.
   *
   * @returns Nothing after browser state is reset for the next run.
   */
  function startRun() {
    const nextRounds = buildHostRounds(game);

    setRounds(nextRounds);
    setCurrentRoundIndex(0);
    setLeaderboard([]);
    setWinnerName("");
    setOpeningTileNumber(null);
    setRecentAutoReveal([]);
    setActionError(null);
    setShowLeaderboard(false);
    setViewState(nextRounds.length > 0 ? "active" : "idle");
  }

  /**
   * Opens a tile, applies scoring penalties, and reveals special-pattern tiles.
   *
   * @param tileNumber - One-based tile number selected by the host.
   * @returns Promise resolved after the active round state is updated.
   */
  async function openTile(tileNumber: number) {
    if (!currentRound || currentRound.answerRevealed) {
      return;
    }

    if (currentRound.openedTileNumbers.includes(tileNumber)) {
      return;
    }

    setOpeningTileNumber(tileNumber);
    setActionError(null);

    try {
      const openedTileNumbers = new Set(currentRound.openedTileNumbers);
      const isSpecial = currentRound.specialTileNumbers.includes(tileNumber);
      const autoOpenedTileNumbers = isSpecial
        ? getPatternRevealTileNumbers(tileNumber, currentRound.image).filter(
            (nextTileNumber) =>
              !openedTileNumbers.has(nextTileNumber) &&
              nextTileNumber !== tileNumber,
          )
        : [];

      openedTileNumbers.add(tileNumber);

      for (const nextTileNumber of autoOpenedTileNumbers) {
        openedTileNumbers.add(nextTileNumber);
      }

      setRecentAutoReveal(autoOpenedTileNumbers);
      setRounds((currentRounds) =>
        currentRounds.map((round, index) =>
          index === currentRoundIndex
            ? {
                ...round,
                openedTileNumbers: [...openedTileNumbers].sort(
                  (left, right) => left - right,
                ),
                currentScore: Math.max(
                  round.currentScore -
                    game.openTilePenalty -
                    (isSpecial ? game.specialTilePenalty : 0),
                  0,
                ),
              }
            : round,
        ),
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not open the tile.",
      );
    } finally {
      setOpeningTileNumber(null);
    }
  }

  /**
   * Reveals the current round answer without completing the round.
   *
   * @returns Nothing after the current round is marked as answer-revealed.
   */
  function revealAnswer() {
    if (!currentRound) {
      return;
    }

    setActionError(null);
    setRounds((currentRounds) =>
      currentRounds.map((round, index) =>
        index === currentRoundIndex
          ? {
              ...round,
              answerRevealed: true,
            }
          : round,
      ),
    );
  }

  /**
   * Completes the current round and optionally awards its remaining score.
   *
   * @param rawWinnerName - Winner name typed by the host, or null to skip awards.
   * @returns Nothing after advancing to the next round or completing the run.
   */
  function completeRound(rawWinnerName: string | null) {
    if (!currentRound) {
      return;
    }

    const normalizedName = rawWinnerName
      ? normalizeWinnerName(rawWinnerName)
      : "";

    if (rawWinnerName && !normalizedName) {
      setActionError("Type a winner name before awarding points.");
      return;
    }

    const awardedScore = normalizedName ? currentRound.currentScore : 0;

    setRounds((currentRounds) =>
      currentRounds.map((round, index) =>
        index === currentRoundIndex
          ? {
              ...round,
              answerRevealed: true,
              isCompleted: true,
              awardedTo: normalizedName || null,
              awardedScore,
            }
          : round,
      ),
    );

    if (normalizedName) {
      setLeaderboard((currentEntries) =>
        awardLeaderboardPoints(currentEntries, normalizedName, awardedScore),
      );
    }

    setWinnerName("");
    setRecentAutoReveal([]);
    setActionError(null);

    if (currentRoundIndex >= rounds.length - 1) {
      setViewState("completed");
      return;
    }

    setCurrentRoundIndex((value) => value + 1);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="space-y-6">
        {viewState === "idle" ? (
          <Card className="border-border/70 bg-background/92 shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="warning">{modeLabel(game.mode)}</Badge>
                <Badge variant="secondary">{game.imageCount} images</Badge>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl">
                  Ready to Host {game.title}
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6 md:text-base">
                  Start a fresh host run in this browser tab. The answer stays
                  hidden until you reveal it, and refreshing the page resets the
                  leaderboard.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Start Score
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {game.startScore}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Open Tile
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  -{game.openTilePenalty}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Special Tile
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  -{game.specialTilePenalty}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-border/70 bg-muted/35">
              <p className="text-sm text-muted-foreground">
                This run lives only in browser state. Refreshing the page starts
                over.
              </p>
              <Button type="button" onClick={startRun}>
                Start Host Run
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        {viewState === "active" && currentRound ? (
          <div className="relative">
            <PictureRevealFloatingLeaderboard
              leaderboard={leaderboard}
              isOpen={showLeaderboard}
              onToggle={() => setShowLeaderboard((value) => !value)}
            />

            <Card className="border-border/70 bg-background/92 shadow-sm">
              <CardHeader className="space-y-5 lg:min-h-44 lg:pr-[24rem]">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">
                    Round {currentRound.roundIndex + 1}
                  </Badge>
                  <Badge variant="secondary">{modeLabel(game.mode)}</Badge>
                  <Badge variant="outline">Score {currentScore}</Badge>
                  <Badge variant="outline">Progress {progressValue}</Badge>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-semibold tracking-tight md:text-4xl xl:text-5xl">
                    Open Tiles, Then Reveal the Answer
                  </CardTitle>
                  <CardDescription className="max-w-3xl text-sm leading-6 md:text-base">
                    Keep the answer hidden while opening tiles. When the host is
                    ready, reveal it and award the remaining round score to one
                    winner or skip if nobody got it.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <PictureRevealBoardSizeControls
                    boardSize={boardSize}
                    onBoardSizeChange={setBoardSize}
                  />

                  <div
                    data-board-scroll-region
                    className="overflow-x-auto pb-2"
                  >
                    <div
                      data-board-size={boardSize}
                      className="mx-auto w-full transition-[max-width] duration-200 ease-out"
                      style={{
                        maxWidth: `${boardScale * 100}%`,
                        minWidth: `${minimumBoardWidth}px`,
                      }}
                    >
                      <PictureRevealTileBoard
                        gameTitle={game.title}
                        round={currentRound}
                        aspectWidth={game.imageWidth}
                        aspectHeight={game.imageHeight}
                        openingTileNumber={openingTileNumber}
                        recentAutoReveal={recentAutoReveal}
                        disabled={boardDisabled}
                        onOpenTile={openTile}
                      />
                    </div>
                  </div>
                </div>

                {recentAutoReveal.length > 0 ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                    Special tile triggered {recentAutoReveal.length} extra
                    opens: {recentAutoReveal.join(", ")}
                  </div>
                ) : null}

                <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Hidden Answer
                      </p>
                      <p className="text-sm text-muted-foreground">
                        The answer stays hidden until you click reveal.
                      </p>
                    </div>
                    {!currentRound.answerRevealed ? (
                      <Button type="button" onClick={revealAnswer}>
                        Reveal Answer
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-4">
                    {currentRound.answerRevealed ? (
                      <>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Answer
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {currentRound.image.answer}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Hidden until the host chooses to reveal it.
                      </p>
                    )}
                  </div>

                  {currentRound.answerRevealed ? (
                    <div className="mt-4 space-y-3">
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                        <Input
                          list={winnerSuggestionListId}
                          value={winnerName}
                          onChange={(event) =>
                            setWinnerName(event.target.value)
                          }
                          placeholder="Winner name"
                        />
                        <Button
                          type="button"
                          onClick={() => completeRound(winnerName)}
                        >
                          Award {currentRound.currentScore}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => completeRound(null)}
                        >
                          No Correct Answer
                        </Button>
                      </div>

                      <datalist id={winnerSuggestionListId}>
                        {leaderboard.map((entry) => (
                          <option key={entry.key} value={entry.name} />
                        ))}
                      </datalist>

                      {winnerSuggestions.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Existing Names
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {winnerSuggestions.map((entry) => (
                              <Button
                                key={entry.key}
                                type="button"
                                size="sm"
                                variant={
                                  winnerName === entry.name
                                    ? "secondary"
                                    : "outline"
                                }
                                onClick={() => setWinnerName(entry.name)}
                              >
                                {entry.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {viewState === "completed" ? (
          <div className="relative">
            <PictureRevealFloatingLeaderboard
              leaderboard={leaderboard}
              isOpen={showLeaderboard}
              onToggle={() => setShowLeaderboard((value) => !value)}
            />

            <Card className="border-border/70 bg-background/92 shadow-sm">
              <CardHeader className="space-y-4 lg:min-h-40 lg:pr-[24rem]">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">
                    <Trophy className="mr-1 size-3.5" />
                    Run Completed
                  </Badge>
                  <Badge variant="secondary">{modeLabel(game.mode)}</Badge>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl md:text-3xl">
                    Run Summary
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 md:text-base">
                    Review the completed rounds or start again for a fresh host
                    run.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 lg:pr-[24rem]">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Winners
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">
                      {leaderboard.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Rounds
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">
                      {completedRounds.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Top Score
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">
                      {leaderboard[0]?.score ?? 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {completedRounds.map((round) => (
                    <div
                      key={round.id}
                      className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          Round {round.roundIndex + 1}
                        </Badge>
                        {round.awardedTo ? (
                          <Badge variant="success">{round.awardedTo}</Badge>
                        ) : (
                          <Badge variant="outline">No winner</Badge>
                        )}
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <p>
                          Answer:{" "}
                          <span className="font-medium text-foreground">
                            {round.image.answer}
                          </span>
                        </p>
                        <p>
                          Opened tiles:{" "}
                          <span className="font-medium text-foreground">
                            {round.openedTileNumbers.length}
                          </span>
                        </p>
                        <p>
                          Awarded score:{" "}
                          <span className="font-medium text-foreground">
                            {round.awardedScore}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-border/70 bg-muted/35">
                <p className="text-sm text-muted-foreground">
                  Refreshing the page or starting again resets the run.
                </p>
                <Button type="button" onClick={startRun}>
                  <RefreshCw className="size-4" />
                  Host Another Run
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : null}

        {actionError ? (
          <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
            <CardContent className="px-5 py-4 text-sm text-destructive">
              {actionError}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
