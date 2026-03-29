"use client";

import { useRef } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";

import { useTierStore } from "@/store/useTierStore";
import { useUIStore } from "@/store/useUIStore";
import { TierRow } from "@/components/tier-row";
import { ItemPool } from "@/components/item-pool";
import { Toolbar } from "@/components/toolbar";

export function TierListApp() {
  const { tiers, moveRow, moveItem } = useTierStore();
  const {
    title,
    titleDraft,
    isEditingTitle,
    startEditTitle,
    setTitleDraft,
    commitTitle,
    cancelEditTitle,
  } = useUIStore();
  const captureRef = useRef<HTMLDivElement>(null);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    if (type === "TIER") {
      moveRow(source.index, destination.index);
      return;
    }

    // type === 'ITEM'
    const itemId = draggableId;
    const fromId = source.droppableId; // tier.id or 'pool'
    const toId = destination.droppableId;
    moveItem(itemId, fromId, toId, destination.index);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex flex-col items-center mb-3">
            {isEditingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  if (e.key === "Escape") cancelEditTitle();
                }}
                className="text-xl font-bold tracking-tight text-center bg-transparent border-b-2 border-primary outline-none w-full max-w-xs"
              />
            ) : (
              <h1
                className="text-xl font-bold tracking-tight cursor-pointer hover:opacity-70 transition-opacity"
                onClick={startEditTitle}
                title="คลิกเพื่อแก้ไขชื่อ"
              >
                {title}
              </h1>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">BY mavelus</p>
          </div>
          <Toolbar captureRef={captureRef} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Tier board – capture area */}
          <div
            ref={captureRef}
            className="border border-border rounded-xl overflow-hidden bg-card"
          >
            {/* Export header – hidden in UI, shown only during PNG capture */}
            <div
              data-export-only
              className="hidden flex flex-col items-center py-3 border-b border-border bg-card"
            >
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">BY mavelus</p>
            </div>
            <Droppable droppableId="tier-board" type="TIER">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {tiers.map((tier, index) => (
                    <TierRow key={tier.id} tier={tier} index={index} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Item pool */}
          <ItemPool />
        </DragDropContext>
      </main>

      <footer className="text-center text-xs text-muted-foreground/40 py-4">
        Double-click tier label to rename · Drag items freely between tiers
      </footer>
    </div>
  );
}
