import type { Metadata } from "next";
import { SoundGuessLocalPlayClient } from "../_components/sound-guess-local-play-client";

export const metadata: Metadata = {
  title: "Play Local Sound Guess",
  description: "Play the Sound Guess draft saved in this browser.",
};

export default function SoundGuessCreatePlayPage() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.07),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(244,63,94,0.08),_transparent_28%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-12">
        <SoundGuessLocalPlayClient />
      </section>
    </div>
  );
}
