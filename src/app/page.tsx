import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Home as HomeIcon,
  LayoutTemplate,
  LogIn,
  Sparkles,
} from "lucide-react";
import { PublicTierListGalleryCard } from "@/components/public-tier-list-gallery-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPublicTierListGallery } from "@/services/tier-lists.service";

const HOME_URL = "https://mavelus-jk.com";

export const metadata: Metadata = {
  title: "Tier List Templates",
  description: "เลือก public tier lists จากหน้าแรกแล้วเริ่มจัดอันดับต่อใน local editor ได้ทันที",
};

export default async function Home() {
  const publicLists = await getPublicTierListGallery();

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(to_bottom,_transparent,_rgba(15,23,42,0.03))]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 md:px-10 md:py-12">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-border/70 bg-background/85 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/35 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" />
              Public Tier List Gallery
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <a
                href={HOME_URL}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <HomeIcon className="size-4" />
                Back to home
              </a>
              <div className="hidden h-7 w-px bg-border/80 sm:block" />
              <Link
                href="/sign-in"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <LogIn className="size-4" />
                Login
              </Link>
              <ThemeToggle />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)] lg:items-end">
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                เลือก template จาก community แล้วเริ่มจัดอันดับต่อได้ทันที
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                หน้าแรกจะแสดง public tier lists ที่พร้อมให้คุณหยิบไปใช้เป็นต้นแบบ
                จากนั้นเปิดต่อใน local editor ได้เลยโดยไม่ต้องล็อกอิน
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-border/70 bg-muted/25 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                  <LayoutTemplate className="size-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    อยากเริ่มจากหน้าเปล่า?
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    เปิด editor ใหม่ได้ทันทีถ้ายังไม่อยากใช้รายการต้นแบบ
                  </p>
                  <Link
                    href="/create"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    Create from scratch
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="space-y-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">Templates พร้อมใช้</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              เลือกจากรายการสาธารณะที่อัปเดตล่าสุด แล้วเข้าไปจัดอันดับต่อใน editor ของคุณ
            </p>
          </div>

          {publicLists.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-border bg-background/80 px-6 py-16 text-center shadow-sm">
              <p className="text-lg font-semibold text-foreground">
                ยังไม่มี public tier list ให้เลือกในตอนนี้
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                คุณยังสามารถเริ่มจัดอันดับจากหน้าเปล่าได้ทันที
              </p>
              <Link
                href="/create"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Open local editor
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {publicLists.map((list) => (
                <PublicTierListGalleryCard key={list.id} list={list} />
              ))}
            </div>
          )}
        </main>
      </section>
    </div>
  );
}
