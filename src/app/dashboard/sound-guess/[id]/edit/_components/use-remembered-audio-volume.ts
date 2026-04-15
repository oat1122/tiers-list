"use client";

import {
  useCallback,
  useEffect,
  useState,
  type RefObject,
  type SyntheticEvent,
} from "react";
import {
  clampAudioVolume,
  readRememberedAudioVolume,
  rememberAudioVolume,
} from "./sound-guess-audio-utils";

/**
 * Applies and remembers the shared admin audio volume for one audio element.
 *
 * @param audioRef - Ref pointing at an audio element rendered by the editor.
 * @returns Current volume, setter, and media volumechange handler.
 */
export function useRememberedAudioVolume(
  audioRef: RefObject<HTMLAudioElement | null>,
) {
  const [volume, setVolumeState] = useState(readRememberedAudioVolume);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    audioElement.volume = volume;
  }, [audioRef, volume]);

  /**
   * Applies and persists a user-selected volume value.
   *
   * @param nextVolume - Raw volume value from the slider.
   * @returns Nothing.
   */
  const setVolume = useCallback(
    (nextVolume: number) => {
      const clampedVolume = clampAudioVolume(nextVolume);

      setVolumeState(clampedVolume);
      rememberAudioVolume(clampedVolume);

      if (audioRef.current) {
        audioRef.current.volume = clampedVolume;
      }
    },
    [audioRef],
  );

  /**
   * Captures volume changes made through native media controls.
   *
   * @param event - Volume change event emitted by an audio element.
   * @returns Nothing.
   */
  const handleVolumeChange = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      const clampedVolume = clampAudioVolume(event.currentTarget.volume);

      setVolumeState(clampedVolume);
      rememberAudioVolume(clampedVolume);
    },
    [],
  );

  return {
    volume,
    setVolume,
    handleVolumeChange,
  };
}
