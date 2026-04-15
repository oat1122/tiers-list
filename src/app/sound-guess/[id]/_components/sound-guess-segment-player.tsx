"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  clampSoundGuessAudioVolume,
  readRememberedSoundGuessAudioVolume,
  rememberSoundGuessAudioVolume,
} from "@/lib/sound-guess-audio-volume";
import { cn } from "@/lib/utils";

interface SoundGuessSegmentPlayerProps {
  audioPath: string;
  endMs: number | null;
  startMs: number;
}

const timelineRangeClassName = cn(
  "relative z-10 h-7 w-full appearance-none bg-transparent",
  "focus-visible:outline-none",
  "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent",
  "[&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
  "[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/35 [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform",
  "hover:[&::-webkit-slider-thumb]:scale-110 focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-primary/20",
  "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent",
  "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary/35 [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow-md",
);

const volumeRangeClassName = cn(
  "h-5 w-full appearance-none bg-transparent",
  "focus-visible:outline-none",
  "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-muted",
  "[&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
  "[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-sm",
  "focus-visible:[&::-webkit-slider-thumb]:ring-3 focus-visible:[&::-webkit-slider-thumb]:ring-ring/30",
  "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-muted",
  "[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:bg-foreground",
);

/**
 * Formats milliseconds for the cropped public audio player.
 *
 * @param valueMs - Time value in milliseconds.
 * @returns Display label in mm:ss.SS format.
 */
function formatSegmentTime(valueMs: number) {
  const safeMs = Math.max(0, Number.isFinite(valueMs) ? valueMs : 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((safeMs % 1000) / 10);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

/**
 * Calculates the playable cropped segment duration.
 *
 * @param startMs - Segment start in milliseconds.
 * @param endMs - Segment end in milliseconds, or null to use the media end.
 * @param mediaDurationMs - Full media duration in milliseconds when known.
 * @returns Segment duration in milliseconds.
 */
function getSegmentDurationMs(
  startMs: number,
  endMs: number | null,
  mediaDurationMs: number | null,
) {
  if (endMs !== null) {
    return Math.max(0, endMs - startMs);
  }

  if (mediaDurationMs !== null) {
    return Math.max(0, mediaDurationMs - startMs);
  }

  return 0;
}

/**
 * Clamps a segment-relative playhead to the cropped segment bounds.
 *
 * @param value - Segment-relative time in milliseconds.
 * @param segmentDurationMs - Cropped segment duration in milliseconds.
 * @returns Clamped segment-relative time in milliseconds.
 */
function clampSegmentOffsetMs(value: number, segmentDurationMs: number) {
  return Math.min(segmentDurationMs, Math.max(0, value));
}

/**
 * Converts the current playhead into a bounded percentage for the timeline fill.
 *
 * @param currentOffsetMs - Segment-relative playhead in milliseconds.
 * @param segmentDurationMs - Cropped segment duration in milliseconds.
 * @returns Progress percentage between 0 and 100.
 */
function getTimelineProgressPercent(
  currentOffsetMs: number,
  segmentDurationMs: number,
) {
  if (segmentDurationMs <= 0) {
    return 0;
  }

  return (clampSegmentOffsetMs(currentOffsetMs, segmentDurationMs) /
    segmentDurationMs) *
    100;
}

/**
 * Renders a public game audio player whose timeline covers only the cropped range.
 *
 * @param props - Audio path and crop boundaries.
 * @returns Custom audio player for one sound guess round.
 */
export function SoundGuessSegmentPlayer({
  audioPath,
  endMs,
  startMs,
}: SoundGuessSegmentPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mediaDurationMs, setMediaDurationMs] = useState<number | null>(null);
  const [currentOffsetMs, setCurrentOffsetMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(
    readRememberedSoundGuessAudioVolume,
  );
  const segmentDurationMs = getSegmentDurationMs(
    startMs,
    endMs,
    mediaDurationMs,
  );
  const volumeLabel = `${Math.round(volume * 100)}%`;
  const currentLabel = formatSegmentTime(currentOffsetMs);
  const durationLabel =
    segmentDurationMs > 0 ? formatSegmentTime(segmentDurationMs) : "--:--.--";
  const timelineProgressPercent = getTimelineProgressPercent(
    currentOffsetMs,
    segmentDurationMs,
  );

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audioElement = audioRef.current;

    return () => {
      audioElement?.pause();
    };
  }, [audioPath, endMs, startMs]);

  /**
   * Seeks the hidden audio element to a segment-relative position.
   *
   * @param nextOffsetMs - Segment-relative time in milliseconds.
   * @returns Nothing.
   */
  const seekSegmentOffset = (nextOffsetMs: number) => {
    const clampedOffsetMs = clampSegmentOffsetMs(
      nextOffsetMs,
      segmentDurationMs,
    );

    setCurrentOffsetMs(clampedOffsetMs);

    if (audioRef.current) {
      audioRef.current.currentTime = (startMs + clampedOffsetMs) / 1000;
    }
  };

  /**
   * Starts or pauses playback within the selected crop range.
   *
   * @returns Nothing.
   */
  const togglePlayback = () => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    if (playing) {
      audioElement.pause();
      setPlaying(false);
      return;
    }

    if (
      audioElement.currentTime < startMs / 1000 ||
      (endMs !== null && audioElement.currentTime >= endMs / 1000)
    ) {
      seekSegmentOffset(0);
    }

    void audioElement.play();
    setPlaying(true);
  };

  /**
   * Applies and remembers the public game player volume.
   *
   * @param nextVolume - Raw volume value from the volume slider.
   * @returns Nothing.
   */
  const updateVolume = (nextVolume: number) => {
    const clampedVolume = clampSoundGuessAudioVolume(nextVolume);

    setVolumeState(clampedVolume);
    rememberSoundGuessAudioVolume(clampedVolume);

    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  };

  /**
   * Initializes media duration and moves playback to the crop start.
   *
   * @param event - Metadata event emitted by the hidden audio element.
   * @returns Nothing.
   */
  const handleLoadedMetadata = (event: SyntheticEvent<HTMLAudioElement>) => {
    const nextDurationMs = Math.round(event.currentTarget.duration * 1000);

    if (Number.isFinite(nextDurationMs)) {
      setMediaDurationMs(nextDurationMs);
    }

    seekSegmentOffset(0);
  };

  /**
   * Keeps the custom playhead synchronized with the hidden audio element.
   *
   * @param event - Time update event emitted by the hidden audio element.
   * @returns Nothing.
   */
  const handleTimeUpdate = (event: SyntheticEvent<HTMLAudioElement>) => {
    const currentMs = Math.round(event.currentTarget.currentTime * 1000);

    if (endMs !== null && currentMs >= endMs) {
      event.currentTarget.pause();
      setPlaying(false);
      seekSegmentOffset(segmentDurationMs);
      return;
    }

    setCurrentOffsetMs(
      clampSegmentOffsetMs(currentMs - startMs, segmentDurationMs),
    );
  };

  return (
    <div className="space-y-3">
      <audio
        ref={audioRef}
        src={audioPath}
        className="hidden"
        onLoadedMetadata={handleLoadedMetadata}
        onPause={() => setPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onVolumeChange={(event) => updateVolume(event.currentTarget.volume)}
      >
        <track kind="captions" />
      </audio>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <Button
          type="button"
          variant="default"
          size="icon-lg"
          aria-label={playing ? "Pause sound" : "Play sound"}
          onClick={togglePlayback}
          disabled={segmentDurationMs <= 0}
          className="size-11 rounded-full border border-primary/20 shadow-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
        >
          {playing ? (
            <Pause className="size-4" />
          ) : (
            <Play className="ml-0.5 size-4" />
          )}
        </Button>
        <div className="min-w-[min(100%,16rem)] flex-1">
          <div className="group relative">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />
            <div
              className="pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary transition-[width]"
              style={{ width: `${timelineProgressPercent}%` }}
            />
            <input
              type="range"
              min="0"
              max={Math.max(0, segmentDurationMs)}
              step="10"
              value={clampSegmentOffsetMs(currentOffsetMs, segmentDurationMs)}
              onChange={(event) =>
                seekSegmentOffset(Number(event.target.value))
              }
              className={timelineRangeClassName}
              aria-label="Sound guess cropped audio timeline"
              data-testid="sound-guess-segment-player-range"
            />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="font-medium tabular-nums text-foreground">
              {currentLabel}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {durationLabel}
            </span>
          </div>
        </div>
        <div className="flex basis-full items-center gap-3 text-muted-foreground sm:basis-40 lg:basis-36">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Volume2 className="size-4" aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => updateVolume(Number(event.target.value))}
              className={volumeRangeClassName}
              aria-label="Sound guess audio volume"
              data-testid="sound-guess-segment-player-volume"
            />
            <span className="w-10 text-right text-xs tabular-nums">
              {volumeLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
