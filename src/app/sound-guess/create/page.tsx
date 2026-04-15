import type { Metadata } from "next";
import { SoundGuessLocalCreatorClient } from "./_components/sound-guess-local-creator-client";

export const metadata: Metadata = {
  title: "Create Sound Guess | Local Creator",
  description:
    "Create a browser-only Sound Guess game without login or server uploads.",
};

export default function SoundGuessCreatePage() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.07),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(244,63,94,0.08),_transparent_28%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-12">
        <SoundGuessLocalCreatorClient />
      </section>
    </div>
  );
}
