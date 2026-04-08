import type { Metadata } from "next";
import { PictureRevealLocalCreatorClient } from "./_components/picture-reveal-local-creator-client";

export const metadata: Metadata = {
  title: "สร้างเกมทายภาพ (Picture Reveal) | Local Creator",
  description:
    "สร้างเกมทายภาพ (Picture Reveal) ของคุณเอง เล่นในเบราว์เซอร์ได้ทันทีโดยไม่ต้องล็อกอินหรือบันทึกลงฐานข้อมูล",
};

export default function PictureRevealCreatePage() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.07),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_28%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-12">
        <PictureRevealLocalCreatorClient />
      </section>
    </div>
  );
}
