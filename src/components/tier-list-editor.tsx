"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { ItemPool } from "@/components/item-pool";
import { TierRow } from "@/components/tier-row";
import { Toolbar } from "@/components/toolbar";
import {
  buildEditorDraft,
  createDefaultTierListState,
  templateEditorPageDataToState,
} from "@/lib/tier-editor";
import { useTierStore } from "@/store/useTierStore";
import { useUIStore } from "@/store/useUIStore";
import type { TemplateEditorPageData } from "@/types";

interface TierListEditorProps {
  mode?: "local" | "template";
  initialTemplateData?: TemplateEditorPageData;
  backHref?: string;
}

function createLocalBaseline() {
  return {
    title: "Edit Your Title Name Tier List",
    description: "",
    state: createDefaultTierListState(),
  };
}

function formatSaveStatus({
  mode,
  isDirty,
  isSaving,
  saveMessage,
}: {
  mode: "local" | "template";
  isDirty: boolean;
  isSaving: boolean;
  saveMessage: string | null;
}) {
  if (mode !== "template") return null;
  if (isSaving) return "กำลังบันทึก template...";
  if (saveMessage) return saveMessage;
  return isDirty
    ? "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก"
    : "ข้อมูลล่าสุดถูกบันทึกแล้ว";
}

export function TierListEditor({
  mode = "local",
  initialTemplateData,
  backHref,
}: TierListEditorProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const { tiers, pool, cardSize, initialize, moveItem, moveRow } =
    useTierStore();
  const {
    title,
    titleDraft,
    isEditingTitle,
    initializeTitle,
    startEditTitle,
    setTitleDraft,
    commitTitle,
    cancelEditTitle,
  } = useUIStore();

  const [templateData, setTemplateData] = useState(initialTemplateData);
  const [description, setDescription] = useState(
    initialTemplateData?.description ?? "",
  );
  const [baselineDraft, setBaselineDraft] = useState(() =>
    buildEditorDraft({
      title: initialTemplateData?.title ?? createLocalBaseline().title,
      description: initialTemplateData?.description ?? "",
      state:
        initialTemplateData
          ? templateEditorPageDataToState(initialTemplateData).state
          : createLocalBaseline().state,
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "template" && templateData) {
      const nextState = templateEditorPageDataToState(templateData);
      initialize(nextState.state);
      initializeTitle(nextState.title);
      setDescription(nextState.description);
      setBaselineDraft(
        buildEditorDraft({
          title: nextState.title,
          description: nextState.description,
          state: nextState.state,
        }),
      );
      return;
    }

    const localBaseline = createLocalBaseline();
    initialize(localBaseline.state);
    initializeTitle(localBaseline.title);
    setDescription(localBaseline.description);
    setBaselineDraft(
      buildEditorDraft({
        title: localBaseline.title,
        description: localBaseline.description,
        state: localBaseline.state,
      }),
    );
  }, [initialize, initializeTitle, mode, templateData]);

  const draft = useMemo(
    () =>
      buildEditorDraft({
        title,
        description,
        state: { tiers, pool, cardSize },
      }),
    [cardSize, description, pool, tiers, title],
  );

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(baselineDraft),
    [baselineDraft, draft],
  );

  useEffect(() => {
    if (mode !== "template" || !isDirty) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty, mode]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (type === "TIER") {
      moveRow(source.index, destination.index);
      return;
    }

    moveItem(draggableId, source.droppableId, destination.droppableId, destination.index);
  };

  const handleSave = async () => {
    if (mode !== "template" || !templateData) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`/api/tier-lists/${templateData.listId}/editor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const payload = (await response.json()) as
        | TemplateEditorPageData
        | { error?: string };

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "บันทึก template ไม่สำเร็จ",
        );
      }

      setTemplateData(payload as TemplateEditorPageData);
      setSaveMessage("บันทึก template เรียบร้อยแล้ว");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "บันทึก template ไม่สำเร็จ",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBeforeNavigate = () => {
    if (!isDirty) return true;
    return window.confirm(
      "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?",
    );
  };

  const saveStatusText = formatSaveStatus({
    mode,
    isDirty,
    isSaving,
    saveMessage,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="mb-3 flex flex-col items-center">
            {isEditingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={commitTitle}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitTitle();
                  if (event.key === "Escape") cancelEditTitle();
                }}
                className="w-full max-w-xs border-b-2 border-primary bg-transparent text-center text-xl font-bold tracking-tight outline-none"
              />
            ) : (
              <h1
                className="cursor-pointer text-xl font-bold tracking-tight transition-opacity hover:opacity-70"
                onClick={startEditTitle}
                title="คลิกเพื่อแก้ไขชื่อ"
              >
                {title}
              </h1>
            )}

            {mode === "template" ? (
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="คำอธิบายของ template"
                className="mt-2 w-full max-w-md rounded-md border border-transparent bg-transparent px-3 py-1 text-center text-sm text-muted-foreground outline-none transition-colors focus:border-border focus:bg-muted/40"
              />
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">BY mavelus</p>
            )}
          </div>

          <Toolbar
            captureRef={captureRef}
            mode={mode}
            listId={templateData?.listId}
            backHref={backHref}
            onBeforeNavigate={handleBeforeNavigate}
            onSave={mode === "template" ? handleSave : undefined}
            isDirty={isDirty}
            isSaving={isSaving}
            saveStatusText={saveStatusText}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div
            ref={captureRef}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div
              data-export-only
              className="hidden flex-col items-center border-b border-border bg-card py-3"
            >
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              {description ? (
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">BY mavelus</p>
              )}
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

          <ItemPool />
        </DragDropContext>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground/40">
        Double-click tier label to rename • Drag items freely between tiers
      </footer>
    </div>
  );
}
