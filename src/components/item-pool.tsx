"use client";

import { Droppable } from "@hello-pangea/dnd";
import { TierItemCard } from "@/components/tier-item-card";
import { useTierStore } from "@/store/useTierStore";
import { PackageOpen } from "lucide-react";

export function ItemPool() {
  const pool = useTierStore((s) => s.pool);

  return (
    <div className="border border-border rounded-xl bg-card/50">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <PackageOpen className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Item Pool ({pool.length})
        </span>
      </div>
      <Droppable droppableId="pool" type="ITEM" direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-wrap gap-2 p-4 min-h-[100px] transition-colors ${
              snapshot.isDraggingOver ? "bg-primary/10" : ""
            } ${pool.length === 0 && !snapshot.isDraggingOver ? "items-center justify-center" : ""}`}
          >
            {pool.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-sm text-muted-foreground/50 select-none">
                Drop items here or add new ones above
              </p>
            )}
            {pool.map((item, i) => (
              <TierItemCard key={item.id} item={item} index={i} location="pool" />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
