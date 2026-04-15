"use client";

import Image from "next/image";
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
import type { PublicSoundGuessGameDetail } from "@/types/sound-guess-public";
import { SoundGuessSegmentPlayer } from "./sound-guess-segment-player";
import {
  awardSoundGuessPoint,
  buildSoundGuessHostRounds,
  normalizeWinnerName,
  type SoundGuessHostRound,
  type SoundGuessLeaderboardEntry,
} from "./sound-guess-play-client.utils";

type PlayViewState = "idle" | "active" | "completed";

/**
 * Renders the live leaderboard entries for a host-run game.
 *
 * @param props - Leaderboard entries accumulated in browser state.
 * @returns Leaderboard card content.
 */
function SoundGuessLeaderboard({
  leaderboard,
}: {
  leaderboard: SoundGuessLeaderboardEntry[];
}) {
  if (leaderboard.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No one has scored yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {leaderboard.map((entry, index) => (
        <div
          key={entry.key}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/70 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <span className="font-medium text-foreground">{entry.name}</span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {entry.score}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Runs the host-controlled sound guess game flow in browser state.
 *
 * @param props - Public game detail rendered by the server page.
 * @returns Interactive host player for revealing answers and awarding points.
 */
export function SoundGuessPlayClient({
  game,
}: {
  game: PublicSoundGuessGameDetail;
}) {
  const [viewState, setViewState] = useState<PlayViewState>("idle");
  const [rounds, setRounds] = useState<SoundGuessHostRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState<
    SoundGuessLeaderboardEntry[]
  >([]);
  const [winnerName, setWinnerName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const winnerSuggestionListId = useId();

  const currentRound = rounds[currentRoundIndex] ?? null;
  const completedRounds = rounds.filter((round) => round.isCompleted);
  const progressTotal = rounds.length || game.soundCount;
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

  /**
   * Starts or restarts a host run with a fresh round queue and leaderboard.
   *
   * @returns Nothing after browser state is reset for the next run.
   */
  function startRun() {
    const nextRounds = buildSoundGuessHostRounds(game);

    setRounds(nextRounds);
    setCurrentRoundIndex(0);
    setLeaderboard([]);
    setWinnerName("");
    setActionError(null);
    setViewState(nextRounds.length > 0 ? "active" : "idle");
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
   * Completes the current round and optionally awards one point.
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

    setRounds((currentRounds) =>
      currentRounds.map((round, index) =>
        index === currentRoundIndex
          ? {
              ...round,
              answerRevealed: true,
              isCompleted: true,
              awardedTo: normalizedName || null,
            }
          : round,
      ),
    );

    if (normalizedName) {
      setLeaderboard((currentEntries) =>
        awardSoundGuessPoint(currentEntries, normalizedName),
      );
    }

    setWinnerName("");
    setActionError(null);

    if (currentRoundIndex >= rounds.length - 1) {
      setViewState("completed");
      return;
    }

    setCurrentRoundIndex((value) => value + 1);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {viewState === "idle" ? (
        <Card className="border-border/70 bg-background/92 shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">Sound Guess</Badge>
              <Badge variant="secondary">{game.soundCount} sounds</Badge>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl md:text-3xl">
                Ready to Host {game.title}
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6 md:text-base">
                Start a fresh run in this browser tab. The answer stays hidden
                until the host reveals it, and each correct answer awards one
                point.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Sounds
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {game.soundCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Score
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                1 / answer
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Session
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                Local
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-border/70 bg-muted/35">
            <p className="text-sm text-muted-foreground">
              This run lives only in browser state. Refreshing starts over.
            </p>
            <Button type="button" onClick={startRun}>
              Start Host Run
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {viewState === "active" && currentRound ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="border-border/70 bg-background/92 shadow-sm">
            <CardHeader className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="warning">
                  Round {currentRound.roundIndex + 1}
                </Badge>
                <Badge variant="outline">Progress {progressValue}</Badge>
                <Badge variant="secondary">1 point</Badge>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Play the Sound, Then Reveal the Answer
                </CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-6 md:text-base">
                  Keep the answer hidden while players guess. Reveal it when
                  the host is ready, then award one point or skip the round.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-muted/25">
                  <Image
                    src={currentRound.sound.imagePath || "/placeholder-vinyl.svg"}
                    alt={`Sound art for round ${currentRound.roundIndex + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="space-y-4">
                  <SoundGuessSegmentPlayer
                    key={currentRound.id}
                    audioPath={currentRound.sound.audioPath}
                    startMs={currentRound.sound.audioStartMs}
                    endMs={currentRound.sound.audioEndMs}
                  />

                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Hidden Answer
                        </p>
                        <p className="text-sm text-muted-foreground">
                          The answer stays hidden until you reveal it.
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
                            {currentRound.sound.answer}
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
                            Award 1
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
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {actionError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {actionError}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="h-fit border-border/70 bg-background/92 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Leaderboard</CardTitle>
              <CardDescription>1 point for each correct answer.</CardDescription>
            </CardHeader>
            <CardContent>
              <SoundGuessLeaderboard leaderboard={leaderboard} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {viewState === "completed" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="border-border/70 bg-background/92 shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">
                  <Trophy className="mr-1 size-3.5" />
                  Run Completed
                </Badge>
                <Badge variant="secondary">{completedRounds.length} rounds</Badge>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl">
                  Run Summary
                </CardTitle>
                <CardDescription className="text-sm leading-6 md:text-base">
                  Review the completed sounds or start again for a fresh host
                  run.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedRounds.map((round) => (
                <div
                  key={round.id}
                  className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        Round {round.roundIndex + 1}: {round.sound.answer}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {round.awardedTo
                          ? `Awarded to ${round.awardedTo}`
                          : "No correct answer"}
                      </p>
                    </div>
                    <Badge variant={round.awardedTo ? "success" : "secondary"}>
                      {round.awardedTo ? "+1" : "0"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-border/70 bg-muted/35">
              <p className="text-sm text-muted-foreground">
                Refreshing also clears this local run.
              </p>
              <Button type="button" onClick={startRun}>
                <RefreshCw className="size-4" />
                Start Again
              </Button>
            </CardFooter>
          </Card>

          <Card className="h-fit border-border/70 bg-background/92 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Final Leaderboard</CardTitle>
              <CardDescription>Scores from this browser run.</CardDescription>
            </CardHeader>
            <CardContent>
              <SoundGuessLeaderboard leaderboard={leaderboard} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
