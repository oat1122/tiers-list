import Image from "next/image";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTileStates } from "@/app/picture-reveal/[id]/_components/picture-reveal-play-client.utils";
import { cn } from "@/lib/utils";
import type {
  PictureRevealHostRound,
  PictureRevealLeaderboardEntry,
} from "@/app/picture-reveal/[id]/_components/picture-reveal-play-client.utils";

export type PictureRevealBoardSizePreset =
  | "full"
  | "comfortable"
  | "compact"
  | "half"
  | "small"
  | "tiny";

export interface PictureRevealBoardSizeOption {
  label: string;
  scale: number;
  value: PictureRevealBoardSizePreset;
}

export const PICTURE_REVEAL_BOARD_SIZE_OPTIONS: PictureRevealBoardSizeOption[] =
  [
    { label: "100%", scale: 1, value: "full" },
    { label: "85%", scale: 0.85, value: "comfortable" },
    { label: "70%", scale: 0.7, value: "compact" },
    { label: "50%", scale: 0.5, value: "half" },
    { label: "35%", scale: 0.35, value: "small" },
    { label: "20%", scale: 0.2, value: "tiny" },
  ];

/**
 * Renders the interactive image tile board for the active host round.
 *
 * @param props - Board rendering state and open-tile callback.
 * @returns Tile board with covered, opened, pending, and auto-reveal states.
 */
export function PictureRevealTileBoard({
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
  const tiles = createTileStates(
    round.image.totalTiles,
    round.openedTileNumbers,
  );

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
                  : "bg-black",
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

/**
 * Renders leaderboard rows for completed round awards.
 *
 * @param props - Sorted leaderboard entries for the current host run.
 * @returns Empty state or ranked leaderboard rows.
 */
export function PictureRevealLeaderboardList({
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

/**
 * Renders the collapsible leaderboard card shared by active and completed views.
 *
 * @param props - Leaderboard state, visibility flag, and toggle callback.
 * @returns Collapsed toggle button or expanded leaderboard card.
 */
export function PictureRevealLeaderboardCard({
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
          className="pointer-events-auto shrink-0"
          onClick={onToggle}
        >
          <ChevronDown className="size-4" />
          Show Live Leaderboard
        </Button>
      </div>
    );
  }

  return (
    <Card
      data-floating-leaderboard-card
      className={cn(
        "pointer-events-auto border-border/70 bg-background/92 shadow-sm",
        className,
      )}
    >
      <CardHeader className="space-y-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle>Live Leaderboard</CardTitle>
            <CardDescription>
              Points are awarded only when the host reveals the answer and picks
              a winner.
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
        <PictureRevealLeaderboardList leaderboard={leaderboard} />
      </CardContent>
    </Card>
  );
}

/**
 * Positions the live leaderboard above the play board on large screens.
 *
 * @param props - Leaderboard state, visibility flag, and toggle callback.
 * @returns Floating leaderboard shell used by active and summary views.
 */
export function PictureRevealFloatingLeaderboard({
  leaderboard,
  isOpen,
  onToggle,
}: {
  leaderboard: PictureRevealLeaderboardEntry[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      data-floating-leaderboard
      className="pointer-events-none mb-4 lg:absolute lg:inset-x-4 lg:top-4 lg:z-20 lg:mb-0"
    >
      <PictureRevealLeaderboardCard
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

/**
 * Renders board size controls for the active host round.
 *
 * @param props - Current board size and setter callback.
 * @returns Buttons that adjust the rendered board width.
 */
export function PictureRevealBoardSizeControls({
  boardSize,
  onBoardSizeChange,
}: {
  boardSize: PictureRevealBoardSizePreset;
  onBoardSizeChange: (value: PictureRevealBoardSizePreset) => void;
}) {
  return (
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
        {PICTURE_REVEAL_BOARD_SIZE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={boardSize === option.value ? "secondary" : "outline"}
            onClick={() => onBoardSizeChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
