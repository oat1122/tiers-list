"use client";

import { Pause, Play } from "lucide-react";
import { memo, useRef, useState, type SyntheticEvent } from "react";
import { Button } from "@/components/ui/button";
import { formatAudioTime } from "./sound-guess-audio-utils";
import { useRememberedAudioVolume } from "./use-remembered-audio-volume";

interface SoundAudioSegmentPreviewProps {
  audioPath: string;
  endMs: number | null;
  rangeLabel: string;
  startMs: number;
}

/**
 * Converts milliseconds to the seconds unit used by HTMLMediaElement.
 *
 * @param value - Time value in milliseconds.
 * @returns Time value in seconds.
 */
function millisecondsToSeconds(value: number) {
  return value / 1000;
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
 * Renders a cropped audio preview whose visible scrubber represents only the selected segment.
 *
 * @param props - Audio path and selected segment boundaries.
 * @returns Custom cropped audio preview controls.
 */
function SoundAudioSegmentPreviewComponent({
  audioPath,
  endMs,
  rangeLabel,
  startMs,
}: SoundAudioSegmentPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rememberPreviewAudioVolume = useRememberedAudioVolume(audioRef);
  const [mediaDurationMs, setMediaDurationMs] = useState<number | null>(null);
  const [currentOffsetMs, setCurrentOffsetMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const segmentDurationMs = getSegmentDurationMs(
    startMs,
    endMs,
    mediaDurationMs,
  );
  const currentLabel = formatAudioTime(currentOffsetMs);
  const durationLabel =
    segmentDurationMs > 0 ? formatAudioTime(segmentDurationMs) : "--:--.--";

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
      audioRef.current.currentTime = millisecondsToSeconds(
        startMs + clampedOffsetMs,
      );
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
      audioElement.currentTime < millisecondsToSeconds(startMs) ||
      (endMs !== null && audioElement.currentTime >= millisecondsToSeconds(endMs))
    ) {
      seekSegmentOffset(0);
    }

    void audioElement.play();
    setPlaying(true);
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

  /**
   * Stops the custom playing state when media playback pauses naturally.
   *
   * @returns Nothing.
   */
  const handlePause = () => {
    setPlaying(false);
  };

  return (
    <div className="space-y-2">
      <audio
        ref={audioRef}
        src={audioPath}
        className="hidden"
        onLoadedMetadata={handleLoadedMetadata}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onVolumeChange={rememberPreviewAudioVolume}
      >
        <track kind="captions" />
      </audio>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-3 py-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={playing ? "Pause cropped audio" : "Play cropped audio"}
          onClick={togglePlayback}
          disabled={segmentDurationMs <= 0}
        >
          {playing ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <input
            type="range"
            min="0"
            max={Math.max(0, segmentDurationMs)}
            step="10"
            value={clampSegmentOffsetMs(currentOffsetMs, segmentDurationMs)}
            onChange={(event) => seekSegmentOffset(Number(event.target.value))}
            className="w-full accent-primary"
            aria-label="Cropped audio preview timeline"
            data-testid="sound-audio-segment-preview-range"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{currentLabel}</span>
            <span>{durationLabel}</span>
          </div>
        </div>
      </div>

      <div className="inline-flex rounded-xl border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
        {rangeLabel}
      </div>
    </div>
  );
}

export const SoundAudioSegmentPreview = memo(SoundAudioSegmentPreviewComponent);
