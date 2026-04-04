"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  Crown,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AdminDashboardResponseDto } from "@/types/admin-dashboard";
import type {
  DashboardUser,
  FeedbackState,
} from "./dashboard-panel.types";

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: typeof ClipboardList;
}) {
  return (
    <Card className="border-border/70 bg-background/85 shadow-sm">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="mt-1 text-3xl">{value}</CardTitle>
          </div>
          <div className="flex size-11 items-center justify-center rounded-2xl border border-border bg-muted/50">
            <Icon className="size-5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

interface DashboardPanelHeaderProps {
  user: DashboardUser;
  stats: AdminDashboardResponseDto["stats"];
  feedback: FeedbackState;
  busyAction: string | null;
  isPending: boolean;
  isLoggingOut: boolean;
  onRefresh: (message?: string) => Promise<void>;
  onOpenCreateTemplate: () => void;
  onLogout: () => Promise<void>;
}

export function DashboardPanelHeader({
  user,
  stats,
  feedback,
  busyAction,
  isPending,
  isLoggingOut,
  onRefresh,
  onOpenCreateTemplate,
  onLogout,
}: DashboardPanelHeaderProps) {
  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardContent className="space-y-6 px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">
                <Crown className="mr-1 size-3.5" />
                Admin Control Center
              </Badge>
              <Badge variant="secondary">{user.email}</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                จัดการระบบ Tier Lists แบบภาพรวม
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                ตรวจสอบรายการทั้งหมด จัดการสถานะสาธารณะ ดูเทมเพลต
                และกู้คืนข้อมูลจากถังขยะได้ในหน้าเดียว
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ArrowLeft className="size-4" />
              กลับหน้า Dashboard
            </Link>
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => void onRefresh("รีเฟรชข้อมูลล่าสุดแล้ว")}
              disabled={Boolean(busyAction) || isPending}
            >
              {busyAction === null && !isPending ? (
                <RefreshCw className="size-4" />
              ) : (
                <Loader2 className="size-4 animate-spin" />
              )}
              รีเฟรช
            </Button>
            <Button
              onClick={onOpenCreateTemplate}
              disabled={Boolean(busyAction)}
            >
              <Sparkles className="size-4" />
              สร้างเทมเพลต
            </Button>
            <Button
              variant="outline"
              onClick={() => void onLogout()}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              ออกจากระบบ
            </Button>
          </div>
        </div>
        <Separator />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="รายการทั้งหมด"
            value={stats.activeCount}
            hint="รวมรายการที่ยังใช้งานอยู่ในระบบ"
            icon={ClipboardList}
          />
          <SummaryCard
            label="สาธารณะ"
            value={stats.publicCount}
            hint="รายการที่เปิดให้เข้าถึงผ่าน public API"
            icon={ShieldCheck}
          />
          <SummaryCard
            label="เทมเพลต"
            value={stats.templateCount}
            hint="ต้นแบบที่สามารถโคลนไปใช้งานต่อได้"
            icon={Sparkles}
          />
          <SummaryCard
            label="ถังขยะ"
            value={stats.deletedCount}
            hint="รายการที่ถูก soft delete และรอกู้คืน"
            icon={Trash2}
          />
        </div>
        {feedback ? (
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
              feedback.tone === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                : "border-destructive/20 bg-destructive/10 text-destructive",
            )}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{feedback.message}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
