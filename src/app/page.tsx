import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  Gamepad2,
  Home as HomeIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogIn,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getPublicPictureRevealGames } from "@/services/picture-reveal-games.service";
import { getPublicTierListGallery } from "@/services/tier-lists.service";

const HOME_URL = "https://mavelus-jk.com";
const portalOutlineLinkClassName =
  "inline-flex h-7 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const portalPrimaryLinkClassName =
  "inline-flex h-7 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-transparent bg-primary px-2.5 text-[0.8rem] font-medium whitespace-nowrap text-primary-foreground transition-all hover:bg-primary/80";

export const metadata: Metadata = {
  title: "Public Portal | Tiers List",
  description:
    "เลือก public workspace สำหรับเล่น Tier Lists และ Picture Reveal จากหน้าหลักเดียว",
};

export default async function HomePage() {
  await connection();

  const [publicLists, publicGames] = await Promise.all([
    getPublicTierListGallery(),
    getPublicPictureRevealGames(),
  ]);

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_26%),linear-gradient(180deg,_transparent,_rgba(15,23,42,0.03))] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-border/70 bg-background/90 shadow-sm">
          <CardContent className="space-y-6 px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">
                    <LayoutDashboard className="mr-1 size-3.5" />
                    Public Portal
                  </Badge>
                  <Badge variant="secondary">2 workspaces</Badge>
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                    เลือก public workspace ที่อยากเล่น
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                    แยกหน้า public ของ Tier Lists กับ Picture Reveal ออกจากกันให้ชัด
                    เพื่อให้แต่ละโหมดเล่นง่าย ค้นหาไว และแชร์ลิงก์ได้ตรงเส้นทางมากขึ้น
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={HOME_URL}
                  className={cn(portalOutlineLinkClassName)}
                >
                  <HomeIcon className="size-4" />
                  Back to home
                </a>
                <Link
                  href="/sign-in"
                  className={cn(portalPrimaryLinkClassName)}
                >
                  <LogIn className="size-4" />
                  Login
                </Link>
                <ThemeToggle />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/70 bg-background/88 shadow-sm">
                <CardHeader className="space-y-3">
                  <Badge variant="secondary" className="w-fit">
                    <LayoutTemplate className="mr-1 size-3.5" />
                    Tier Lists
                  </Badge>
                  <div className="space-y-2">
                    <CardTitle>เปิด gallery ของ public tier lists</CardTitle>
                    <CardDescription>
                      เลือก template จาก community แล้วต่อยอดใน local editor ได้ทันที
                      เหมาะกับคนที่อยากเริ่มจัดอันดับหรือหยิบรายการสำเร็จรูปไปเล่นต่อ
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
                    มีรายการ public พร้อมใช้งาน {publicLists.length} รายการ
                  </div>
                  <Link
                    href="/tier-lists"
                    className={cn(portalPrimaryLinkClassName)}
                  >
                    เปิด workspace
                    <ArrowRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-background/88 shadow-sm">
                <CardHeader className="space-y-3">
                  <Badge variant="secondary" className="w-fit">
                    <Gamepad2 className="mr-1 size-3.5" />
                    Picture Reveal
                  </Badge>
                  <div className="space-y-2">
                    <CardTitle>เล่นเกมเดาภาพแบบเปิดป้าย</CardTitle>
                    <CardDescription>
                      เลือกเกมสาธารณะแล้วเปิด tile ทีละช่องเพื่อเก็บคะแนน
                      รองรับทั้งโหมด single และ marathon พร้อมแชร์ลิงก์เข้าเล่นตรงเกม
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
                    มีเกม public ให้เล่น {publicGames.length} เกม
                  </div>
                  <Link
                    href="/picture-reveal"
                    className={cn(portalPrimaryLinkClassName)}
                  >
                    เปิด workspace
                    <ArrowRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
