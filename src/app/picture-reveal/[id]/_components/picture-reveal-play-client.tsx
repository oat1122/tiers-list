"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, RefreshCw, Trophy } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { PublicPictureRevealGameDetail } from "@/types/picture-reveal-public";
import {
  awardLeaderboardPoints,
  buildHostRounds,
  createTileStates,
  normalizeWinnerName,
  type PictureRevealHostRound,
  type PictureRevealLeaderboardEntry,
} from "./picture-reveal-play-client.utils";

type PlayViewState = "idle" | "active" | "completed";
type BoardSizePreset =
  | "full"
  | "comfortable"
  | "compact"
  | "half"
  | "small"
  | "tiny";

const BOARD_SIZE_OPTIONS: Array<{
  label: string;
  scale: number;
  value: BoardSizePreset;
}> = [
  { label: "100%", scale: 1, value: "full" },
  { label: "85%", scale: 0.85, value: "comfortable" },
  { label: "70%", scale: 0.7, value: "compact" },
  { label: "50%", scale: 0.5, value: "half" },
  { label: "35%", scale: 0.35, value: "small" },
  { label: "20%", scale: 0.2, value: "tiny" },
];

function modeLabel(mode: PublicPictureRevealGameDetail["mode"]) {
  return mode === "single" ? "Single" : "Marathon";
}

function TileBoard({
  gameTitle,
  round,
  aspectWidth,
  aspectHeight,
  openingTileNumber,
  recentAutoReveal,
  disabled,
  onOpenTile,
}: {
  gameTitle: string;
  round: PictureRevealHostRound;
  aspectWidth: number;
  aspectHeight: number;
  openingTileNumber: number | null;
  recentAutoReveal: number[];
  disabled: boolean;
  onOpenTile: (tileNumber: number) => Promise<void>;
}) {
  const tiles = createTileStates(round.image.totalTiles, round.openedTileNumbers);

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-slate-950 shadow-sm"
      style={{ aspectRatio: `${aspectWidth} / ${aspectHeight}` }}
    >
      <Image
        src={round.image.imagePath}
        alt={`Picture Reveal round ${round.roundIndex + 1} for ${gameTitle}`}
        fill
        unoptimized
        sizes="(max-width: 1280px) 100vw, 1100px"
        className="object-cover"
      />

      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${round.image.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${round.image.rows}, minmax(0, 1fr))`,
        }}
      >
        {tiles.map((tile) => {
          const isPending = openingTileNumber === tile.number;
          const isAutoOpened = recentAutoReveal.includes(tile.number);

          return (
            <button
              key={tile.number}
              type="button"
              aria-label={`Open tile ${tile.number}`}
              disabled={disabled || tile.isOpened}
              onClick={() => void onOpenTile(tile.number)}
              className={cn(
                "relative flex items-center justify-center border border-white/10 text-xs font-semibold text-white transition md:text-sm",
                tile.isOpened
                  ? "pointer-events-none bg-transparent text-transparent"
                  : "bg-black hover:bg-black/90",
                isAutoOpened && !tile.isOpened ? "bg-emerald-500/35" : null,
                isPending ? "bg-primary/70" : null,
              )}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <span>{tile.number}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardList({
  leaderboard,
}: {
  leaderboard: PictureRevealLeaderboardEntry[];
}) {
  if (leaderboard.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        No one has scored yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leaderboard.map((entry, index) => (
        <div
          key={entry.key}
          className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </div>
            <div>
              <p className="font-medium text-foreground">{entry.name}</p>
              <p className="text-xs text-muted-foreground">
                Awarded across completed rounds
              </p>
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground">{entry.score}</p>
        </div>
      ))}
    </div>
  );
}

function LeaderboardCard({
  leaderboard,
  className,
  isOpen,
  onToggle,
}: {
  leaderboard: PictureRevealLeaderboardEntry[];
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (!isOpen) {
    return (
      <div className={cn("flex justify-end", className)}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={onToggle}
        >
          <ChevronDown className="size-4" />
          Show Live Leaderboard
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("border-border/70 bg-background/92 shadow-sm", className)}>
      <CardHeader className="space-y-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle>Live Leaderboard</CardTitle>
            <CardDescription>
              Points are awarded only when the host reveals the answer and
              picks a winner.
            </CardDescription>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={onToggle}
          >
            <ChevronUp className="size-4" />
            Hide Live Leaderboard
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto">
        <LeaderboardList leaderboard={leaderboard} />
      </CardContent>
    </Card>
  );
}

function FloatingLeaderboard({
  leaderboard,
  isOpen,
  onToggle,
}: {
  leaderboard: PictureRevealLeaderboardEntry[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-4 lg:absolute lg:inset-x-4 lg:top-4 lg:z-20 lg:mb-0">
      <LeaderboardCard
        leaderboard={leaderboard}
        isOpen={isOpen}
        onToggle={onToggle}
        className={cn(
          "ml-auto w-full border-primary/15 bg-background/95 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/85",
          isOpen ? "max-w-md" : "max-w-sm",
        )}
      />
    </div>
  );
}

export function PictureRevealPlayClient({
  game,
}: {
  game: PublicPictureRevealGameDetail;
}) {
  const [viewState, setViewState] = useState<PlayViewState>("idle");
  const [rounds, setRounds] = useState<PictureRevealHostRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState<PictureRevealLeaderboardEntry[]>([]);
  const [openingTileNumber, setOpeningTileNumber] = useState<number | null>(null);
  const [recentAutoReveal, setRecentAutoReveal] = useState<number[]>([]);
  const [winnerName, setWinnerName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [boardSize, setBoardSize] = useState<BoardSizePreset>("full");
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
  const normalizedWinnerQuery = normalizeWinnerName(winnerName).toLocaleLowerCase(
    "th-TH",
  );
  const winnerSuggestions = leaderboard
    .filter((entry) =>
      normalizedWinnerQuery.length === 0
        ? true
        : entry.name.toLocaleLowerCase("th-TH").includes(normalizedWinnerQuery),
    )
    .slice(0, 6);
  const boardScale =
    BOARD_SIZE_OPTIONS.find((option) => option.value === boardSize)?.scale ?? 1;

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
                    hidden until you reveal it, and refreshing the page resets
                    the leaderboard.
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
                  This run lives only in browser state. Refreshing the page
                  starts over.
                </p>
                <Button type="button" onClick={startRun}>
                  Start Host Run
                </Button>
              </CardFooter>
            </Card>
          ) : null}

          {viewState === "active" && currentRound ? (
            <div className="relative">
              <FloatingLeaderboard
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
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Image Size
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Shrink the board if the picture feels too large on screen.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {BOARD_SIZE_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            size="sm"
                            variant={
                              boardSize === option.value ? "secondary" : "outline"
                            }
                            onClick={() => setBoardSize(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div
                      data-board-size={boardSize}
                      className="mx-auto w-full transition-[max-width] duration-200 ease-out"
                      style={{ maxWidth: `${boardScale * 100}%` }}
                    >
                      <TileBoard
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

                  {recentAutoReveal.length > 0 ? (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                      Special tile triggered {recentAutoReveal.length} extra opens:{" "}
                      {recentAutoReveal.join(", ")}
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
                            onChange={(event) => setWinnerName(event.target.value)}
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
              <FloatingLeaderboard
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
