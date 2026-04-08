import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Gamepad2, Home as HomeIcon, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { serializePublicPictureRevealGameSummary } from "@/lib/picture-reveal-public";
import { getPublicPictureRevealGames } from "@/services/picture-reveal-games.service";
import { PictureRevealGalleryClient } from "./_components/picture-reveal-gallery-client";

const HOME_URL = "https://mavelus-jk.com";

export const metadata: Metadata = {
  title: "Picture Reveal | Public Games",
  description: "เลือกเกม Picture Reveal ที่เปิดสาธารณะแล้วเริ่มเดาภาพได้ทันที",
};

export default async function PictureRevealPage() {
  await connection();

  const games = (await getPublicPictureRevealGames()).map(
    serializePublicPictureRevealGameSummary,
  );

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.07),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_28%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-12">
        <header className="rounded-[2rem] border border-border/70 bg-background/90 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="warning">
                  <Gamepad2 className="mr-1 size-3.5" />
                  Picture Reveal
                </Badge>
                <Badge variant="secondary">{games.length} เกมสาธารณะ</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={HOME_URL}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <HomeIcon className="size-4" />
                  กลับหน้าหลัก
                </a>
                <Link
                  href="/"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  หน้าหลักรวมเกม
                </Link>
                <Link
                  href="/tier-lists"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  จัดอันดับ (Tier Lists)
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <LogIn className="size-4" />
                  เข้าสู่ระบบ
                </Link>
                <ThemeToggle />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                เลือกเกมเดาภาพที่อยากท้าทาย
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                แต่ละเกมมีรูปแบบการเล่นและจำนวนภาพไม่เหมือนกัน เลือกเกมที่ใช่แล้วเข้าไปเปิดป้าย ทายคำตอบ และเล่นต่อได้ทันทีจากหน้านี้
              </p>
            </div>
          </div>
        </header>

        <PictureRevealGalleryClient games={games} />
      </section>
    </div>
  );
}