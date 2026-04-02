"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  Copy,
  Mail,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AdminTierListSummaryDto } from "@/types/admin-dashboard";
import type { DashboardListActionHandlers } from "./dashboard-panel.types";
import { formatDate } from "./dashboard-panel.utils";

export function EmptySection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant="secondary">{badge}</Badge>
    </div>
  );
}

function ListBadges({ list }: { list: AdminTierListSummaryDto }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {list.isTemplate === 1 ? <Badge variant="warning">เทมเพลต</Badge> : null}
      {list.isPublic === 1 ? <Badge variant="success">สาธารณะ</Badge> : null}
      {list.isPublic === 0 ? <Badge variant="secondary">ส่วนตัว</Badge> : null}
      {list.deletedAt ? (
        <Badge variant="destructive">อยู่ในถังขยะ</Badge>
      ) : null}
    </div>
  );
}

function MetaPill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/35 px-2.5 py-1 text-[11px] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

function CompactMetaRow({ list }: { list: AdminTierListSummaryDto }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MetaPill className="text-foreground">
        <UserRound className="size-3" />
        <span className="font-medium">{list.owner.name}</span>
      </MetaPill>
      <MetaPill>
        <ClipboardList className="size-3" />
        <span>{list.itemCount} items</span>
      </MetaPill>
      <MetaPill>
        <Clock3 className="size-3" />
        <span>{formatDate(list.updatedAt)}</span>
      </MetaPill>
      <MetaPill className="hidden max-w-[220px] md:inline-flex">
        <Mail className="size-3 shrink-0" />
        <span className="truncate">{list.owner.email}</span>
      </MetaPill>
    </div>
  );
}

function TemplatePreviewBoard({
  list,
  caption = "พรีวิวตัวอย่างจากเทมเพลตล่าสุด",
}: {
  list: AdminTierListSummaryDto;
  caption?: string;
}) {
  const previewRows = list.preview?.rows ?? [];

  if (previewRows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
        ยังไม่มีข้อมูลพรีวิวสำหรับเทมเพลตนี้
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/15">
      <div className="divide-y divide-border/70">
        {previewRows.map((row) => (
          <div key={row.id} className="flex items-stretch gap-0">
            <div className="w-16 shrink-0 border-r border-border/70 p-1.5">
              <div
                className="flex min-h-11 items-center justify-center rounded-lg px-1.5 text-center text-[11px] font-semibold leading-tight text-black"
                style={{ backgroundColor: row.color }}
              >
                {row.label}
              </div>
            </div>
            <div className="flex min-h-14 flex-1 flex-wrap items-center gap-1.5 px-2.5 py-2">
              {row.items.length > 0 ? (
                row.items.map((item, index) => (
                  <span
                    key={`${row.id}-${index}`}
                    className="inline-flex"
                    title={item.label}
                  >
                    {item.itemType === "image" && item.imagePath ? (
                      <span className="relative size-10 overflow-hidden rounded-md border border-border bg-background">
                        <Image
                          src={item.imagePath}
                          alt={item.label}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </span>
                    ) : (
                      <span className="max-w-[7rem] truncate rounded-full border border-border bg-background px-2 py-1 text-[11px] text-foreground">
                        {item.label}
                      </span>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-muted-foreground/70">
                  ยังไม่มีรายการ
                </span>
              )}
              {row.overflowCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-1 text-[11px]"
                >
                  +{row.overflowCount}
                </Badge>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border/70 bg-background/80 px-3 py-2 text-[11px] text-muted-foreground">
        <span>{caption}</span>
        <span>Pool {list.preview?.poolCount ?? 0}</span>
      </div>
    </div>
  );
}

export function DashboardListActionMenu({
  list,
  busyAction,
  onEdit,
  onOpenTemplateEditor,
  onMakePublic,
  onClosePublic,
  onToggleTemplate,
  onClone,
  onRestore,
  onDelete,
}: DashboardListActionHandlers & {
  list: AdminTierListSummaryDto;
  busyAction: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        aria-busy={Boolean(busyAction)}
        aria-label={`จัดการ ${list.title}`}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {!list.deletedAt ? (
          <DropdownMenuItem onClick={() => onEdit(list)}>
            <Sparkles className="size-4" />
            แก้ไขรายละเอียด
          </DropdownMenuItem>
        ) : null}
        {list.isTemplate === 1 && !list.deletedAt ? (
          <DropdownMenuItem onClick={() => onOpenTemplateEditor(list)}>
            <Sparkles className="size-4" />
            ปรับแต่งเทมเพลต
          </DropdownMenuItem>
        ) : null}
        {!list.deletedAt ? (
          <DropdownMenuItem
            onClick={() =>
              list.isPublic === 1
                ? void onClosePublic(list)
                : void onMakePublic(list)
            }
          >
            <ShieldCheck className="size-4" />
            {list.isPublic === 1 ? "เปลี่ยนเป็นส่วนตัว" : "เปิดเป็นสาธารณะ"}
          </DropdownMenuItem>
        ) : null}
        {!list.deletedAt ? (
          <DropdownMenuItem onClick={() => void onToggleTemplate(list)}>
            <Copy className="size-4" />
            {list.isTemplate === 1 ? "ยกเลิกเทมเพลต" : "ทำเป็นเทมเพลต"}
          </DropdownMenuItem>
        ) : null}
        {list.isTemplate === 1 && !list.deletedAt ? (
          <DropdownMenuItem onClick={() => void onClone(list)}>
            <Copy className="size-4" />
            โคลนเทมเพลต
          </DropdownMenuItem>
        ) : null}
        {list.deletedAt ? (
          <DropdownMenuItem onClick={() => void onRestore(list)}>
            <Undo2 className="size-4" />
            กู้คืนรายการ
          </DropdownMenuItem>
        ) : null}
        {!list.deletedAt ? <DropdownMenuSeparator /> : null}
        {!list.deletedAt ? (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(list)}
          >
            <Trash2 className="size-4" />
            ย้ายไปถังขยะ
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CompactListCard({
  list,
  footer,
  menu,
  previewCaption = "พรีวิวตัวอย่างของรายการ",
}: {
  list: AdminTierListSummaryDto;
  footer?: ReactNode;
  menu?: ReactNode;
  previewCaption?: string;
}) {
  const hasPreview = Boolean(list.preview?.rows?.length);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <Card size="sm" className="border-border/70 bg-background/92 shadow-sm">
      {list.coverImagePath ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl border-b border-border/70">
          <Image
            src={list.coverImagePath}
            alt={`Cover for ${list.title}`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <CardTitle className="text-sm md:text-[15px]">
              {list.title}
            </CardTitle>
            <ListBadges list={list} />
          </div>
          {menu}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-[13px] leading-5 text-muted-foreground">
          {list.description?.trim() || "ยังไม่มีคำอธิบายสำหรับรายการนี้"}
        </p>
        <CompactMetaRow list={list} />
        {hasPreview ? (
          <div className="rounded-2xl border border-border/70 bg-muted/18">
            <button
              type="button"
              onClick={() => setIsPreviewOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
            >
              <span className="text-[13px]">
                {isPreviewOpen
                  ? "ซ่อนตัวอย่าง tier list"
                  : "เปิดดูตัวอย่าง tier list"}
              </span>
              {isPreviewOpen ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {isPreviewOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border/70 p-2">
                    <TemplatePreviewBoard list={list} caption={previewCaption} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </CardContent>
      {footer ? (
        <CardFooter className="flex flex-wrap gap-2 border-border/70 bg-muted/35">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function TemplatePreviewCard({
  list,
  footer,
  menu,
}: {
  list: AdminTierListSummaryDto;
  footer?: ReactNode;
  menu?: ReactNode;
}) {
  const hasPreview = Boolean(list.preview?.rows?.length);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <Card size="sm" className="border-border/70 bg-background/94 shadow-sm">
      {list.coverImagePath ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl border-b border-border/70">
          <Image
            src={list.coverImagePath}
            alt={`Cover for ${list.title}`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <CardTitle className="text-sm md:text-[15px]">
              {list.title}
            </CardTitle>
            <ListBadges list={list} />
          </div>
          {menu}
        </div>
        <CardDescription className="line-clamp-2 text-[13px] leading-5">
          {list.description?.trim() || "ยังไม่มีคำอธิบายสำหรับรายการนี้"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasPreview ? (
          <div className="rounded-2xl border border-border/70 bg-muted/18">
            <button
              type="button"
              onClick={() => setIsPreviewOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
            >
              <span className="text-[13px]">
                {isPreviewOpen
                  ? "ซ่อนตัวอย่างเทมเพลต"
                  : "เปิดดูตัวอย่างเทมเพลต"}
              </span>
              {isPreviewOpen ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {isPreviewOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border/70 p-2">
                    <TemplatePreviewBoard list={list} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : (
          <TemplatePreviewBoard list={list} />
        )}
      </CardContent>
      {footer ? (
        <CardFooter className="flex flex-wrap gap-2 border-border/70 bg-muted/35">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
