"use client";

import { Draggable } from "@hello-pangea/dnd";
import { X } from "lucide-react";
import Image from "next/image";
import { CardSize, TierItem } from "@/types";
import { useTierStore } from "@/store/useTierStore";
import { cn } from "@/lib/utils";

const SIZE_MAP: Record<CardSize, { card: string; img: string; text: string }> =
  {
    sm: { card: "w-16", img: "h-16", text: "text-[9px]" },
    md: { card: "w-20", img: "h-20", text: "text-[10px]" },
    lg: { card: "w-24", img: "h-24", text: "text-xs" },
  };

interface TierItemCardProps {
  item: TierItem;
  index: number;
  location: "pool" | "tier";
}

export function TierItemCard({ item, index, location }: TierItemCardProps) {
  const removeItem = useTierStore((s) => s.removeItem);
  const returnItemToPool = useTierStore((s) => s.returnItemToPool);
  const cardSize = useTierStore((s) => s.cardSize);
  const sz = SIZE_MAP[cardSize];
  const hasCaption = !!item.imageUrl && !!item.showCaption;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (location === "tier") {
      returnItemToPool(item.id);
    } else {
      removeItem(item.id);
    }
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            `group relative shrink-0 ${sz.card} rounded-md overflow-hidden flex flex-col`,
            "border border-border select-none cursor-grab active:cursor-grabbing",
            "transition-shadow duration-150",
            snapshot.isDragging && "shadow-2xl ring-2 ring-primary",
          )}
        >
          {item.imageUrl ? (
            <>
              <div
                className={cn(
                  "relative w-full shrink-0",
                  hasCaption ? sz.img : "flex-1",
                )}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {hasCaption && (
                <div
                  className={cn(
                    "w-full bg-muted text-muted-foreground font-medium text-center px-0.5 py-0.5 leading-tight break-all",
                    sz.text,
                  )}
                >
                  {item.name}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted text-muted-foreground font-medium text-center p-1 leading-tight break-all text-xs">
              {item.name}
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleRemove}
            className={cn(
              "absolute top-0.5 right-0.5 rounded-full bg-black/70 text-white",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
              "w-4 h-4 flex items-center justify-center",
            )}
            aria-label={
              location === "tier"
                ? `Return ${item.name} to pool`
                : `Remove ${item.name}`
            }
            title={location === "tier" ? "คืนกลับ Pool" : "ลบ"}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </Draggable>
  );
}
