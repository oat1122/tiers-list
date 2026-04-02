"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublicTierListSummary } from "@/types/public-tier-lists";

function formatUpdatedAt(updatedAt: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(updatedAt);
}

function PreviewBoard({ list }: { list: PublicTierListSummary }) {
  const previewRows = list.preview?.rows ?? [];

  if (previewRows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
        ยังไม่มีตัวอย่าง tier preview
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
                <span className="rounded-full border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                  +{row.overflowCount}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border/70 bg-background/80 px-3 py-2 text-[11px] text-muted-foreground">
        <span>ตัวอย่างล่าสุดจาก public tier list</span>
        <span>Pool {list.preview?.poolCount ?? 0}</span>
      </div>
    </div>
  );
}

export function PublicTierListGalleryCard({
  list,
}: {
  list: PublicTierListSummary;
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
      <CardHeader className="gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{list.title}</CardTitle>
          <div className="rounded-full border border-border bg-muted/35 px-2 py-0.5 text-[10px] text-muted-foreground">
            {list.itemCount} items
          </div>
        </div>
        <p className="line-clamp-2 text-[13px] leading-5 text-muted-foreground">
          {list.description?.trim() ||
            "เริ่มใช้งานจากรายการสาธารณะนี้แล้วจัดอันดับต่อได้ทันที"}
        </p>
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
                  ? "ปิดตัวอย่าง tier list"
                  : "เปิดตัวอย่าง tier list"}
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
                    <PreviewBoard list={list} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : (
          <PreviewBoard list={list} />
        )}
        <div className="text-xs text-muted-foreground">
          <span>อัปเดตล่าสุด {formatUpdatedAt(list.updatedAt)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-3 border-border/70 bg-muted/35">
        <Link
          href={`/create?source=${encodeURIComponent(list.id)}`}
          className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Start from this list
          <ArrowRight className="size-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
