"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Trash2, GripVertical } from "lucide-react";
import { TierRow as TierRowType } from "@/types";
import { useTierStore } from "@/store/useTierStore";
import { TierLabel } from "@/components/tier-label";
import { TierItemCard } from "@/components/tier-item-card";

interface TierRowProps {
  tier: TierRowType;
  index: number;
}

export function TierRow({ tier, index }: TierRowProps) {
  const removeTier = useTierStore((s) => s.removeTier);

  return (
    <Draggable draggableId={`tier-${tier.id}`} index={index}>
      {(provided, snapshot) => (
        // ⚠️ Must be a plain div — Framer Motion `layout` on this element
        // conflicts with @hello-pangea/dnd transforms and causes rows to overlap.
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex items-stretch gap-0 border-b border-border last:border-b-0 transition-opacity duration-150 ${
            snapshot.isDragging
              ? "opacity-80 shadow-2xl ring-1 ring-border z-50"
              : "opacity-100"
          }`}
        >
          {/* Drag handle */}
          <div
            {...provided.dragHandleProps}
            className="flex items-center px-1 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Label */}
          <TierLabel tierId={tier.id} label={tier.label} color={tier.color} />

          {/* Items drop zone */}
          <Droppable droppableId={tier.id} type="ITEM" direction="horizontal">
            {(drop, dropSnapshot) => (
              <div
                ref={drop.innerRef}
                {...drop.droppableProps}
                className={`flex-1 flex flex-wrap gap-2 p-2 min-h-[72px] transition-colors duration-150 ${
                  dropSnapshot.isDraggingOver
                    ? "bg-primary/10"
                    : "bg-transparent"
                }`}
              >
                {tier.items.map((item, i) => (
                  <TierItemCard key={item.id} item={item} index={i} />
                ))}
                {drop.placeholder}
              </div>
            )}
          </Droppable>

          {/* Delete row */}
          <button
            onClick={() => removeTier(tier.id)}
            className="flex items-center px-2 text-muted-foreground/40 hover:text-destructive transition-colors"
            aria-label={`Remove tier ${tier.label}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </Draggable>
  );
}
