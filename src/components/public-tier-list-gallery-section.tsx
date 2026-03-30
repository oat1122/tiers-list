"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { PublicTierListGalleryCard } from "@/components/public-tier-list-gallery-card";
import { Input } from "@/components/ui/input";
import type { PublicTierListSummary } from "@/types/public-tier-lists";

function normalizeQuery(value: string) {
  return value.trim().toLocaleLowerCase("th-TH");
}

export function PublicTierListGallerySection({
  publicLists,
}: {
  publicLists: PublicTierListSummary[];
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filteredLists = useMemo(() => {
    const normalizedQuery = normalizeQuery(deferredQuery);

    if (!normalizedQuery) {
      return publicLists;
    }

    return publicLists.filter((list) => {
      const searchableText = [list.title, list.description ?? ""]
        .join(" ")
        .toLocaleLowerCase("th-TH");

      return searchableText.includes(normalizedQuery);
    });
  }, [deferredQuery, publicLists]);

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Templates พร้อมใช้
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              เลือกจากรายการสาธารณะที่อัปเดตล่าสุด แล้วเข้าไปจัดอันดับต่อใน
              editor ของคุณ
            </p>
          </div>

          <label className="relative block w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหา template..."
              aria-label="Search templates"
              className="h-10 rounded-xl bg-background pl-9"
            />
          </label>
        </div>
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
      ) : filteredLists.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-background/80 px-6 py-14 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">
            ไม่พบ template ที่ตรงกับคำค้นหา
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            ลองค้นหาด้วยชื่ออื่น หรือคำที่สั้นลง
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredLists.map((list) => (
            <PublicTierListGalleryCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </main>
  );
}
