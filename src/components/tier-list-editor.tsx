"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/confirm-dialog-provider";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { ItemPool } from "@/components/item-pool";
import { TierRow } from "@/components/tier-row";
import { Toolbar } from "@/components/toolbar";
import { Button } from "@/components/ui/button";
import {
  CROPPABLE_IMAGE_MIME,
  IMAGE_RECOMMENDED_RATIO_LABEL,
  IMAGE_RECOMMENDED_SIZE_LABEL,
  IMAGE_UPLOAD_LIMIT_BYTES,
} from "@/lib/image-upload-config";
import {
  buildEditorDraft,
  createDefaultTierListState,
  templateEditorPageDataToState,
} from "@/lib/tier-editor";
import { isCroppableImageType, isGifImageType } from "@/lib/image-processing";
import { useTierStore } from "@/store/useTierStore";
import { useUIStore } from "@/store/useUIStore";
import type { TemplateEditorPageData } from "@/types";
import type { PublicTierListEditorData } from "@/types/public-tier-lists";

interface TierListEditorProps {
  mode?: "local" | "template";
  initialData?: TemplateEditorPageData | PublicTierListEditorData;
  backHref?: string;
  warningMessage?: string | null;
}

const ACCEPTED_FORMATS_LABEL = "JPEG, PNG, WEBP";

function formatBytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

function getUnsupportedTypeMessage(file: File) {
  if (isGifImageType(file)) {
    return "GIF ยังไม่รองรับใน crop flow นี้ กรุณาใช้ JPEG, PNG หรือ WEBP";
  }

  return "รองรับเฉพาะไฟล์ JPEG, PNG และ WEBP สำหรับการครอปรูป";
}

function createCoverHelperText() {
  return `แนะนำ ${IMAGE_RECOMMENDED_SIZE_LABEL} อัตราส่วน ${IMAGE_RECOMMENDED_RATIO_LABEL} ไฟล์สุดท้ายต้องไม่เกิน ${formatBytes(
    IMAGE_UPLOAD_LIMIT_BYTES,
  )} และรองรับ ${ACCEPTED_FORMATS_LABEL}`;
}

function createLocalBaseline() {
  return {
    title: "Edit Your Title Name Tier List",
    description: "",
    coverImagePath: null,
    coverTempUploadPath: null,
    state: createDefaultTierListState(),
  };
}

function formatSaveStatus({
  mode,
  isDirty,
  isSaving,
  isCoverUploading,
}: {
  mode: "local" | "template";
  isDirty: boolean;
  isSaving: boolean;
  isCoverUploading: boolean;
}) {
  if (mode !== "template") return null;
  if (isCoverUploading) return "กำลังอัปโหลดหน้าปก...";
  if (isSaving) return "กำลังบันทึก template...";
  return isDirty
    ? "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก"
    : "ข้อมูลล่าสุดถูกบันทึกแล้ว";
}

export function TierListEditor({
  mode = "local",
  initialData,
  backHref,
  warningMessage,
}: TierListEditorProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { confirm } = useConfirmDialog();
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

  const [editorData, setEditorData] = useState(initialData);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [coverImagePath, setCoverImagePath] = useState<string | null>(
    initialData?.coverImagePath ?? null,
  );
  const [coverTempUploadPath, setCoverTempUploadPath] = useState<string | null>(
    null,
  );
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [baselineDraft, setBaselineDraft] = useState(() =>
    buildEditorDraft({
      title: initialData?.title ?? createLocalBaseline().title,
      description: initialData?.description ?? "",
      coverImagePath: initialData?.coverImagePath ?? null,
      coverTempUploadPath: null,
      state: initialData
        ? templateEditorPageDataToState(initialData).state
        : createLocalBaseline().state,
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  useEffect(() => {
    setEditorData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (editorData) {
      const nextState = templateEditorPageDataToState(editorData);
      initialize(nextState.state);
      initializeTitle(nextState.title);
      setDescription(nextState.description);
      setCoverImagePath(editorData.coverImagePath ?? null);
      setCoverTempUploadPath(null);
      setCoverError(null);
      setBaselineDraft(
        buildEditorDraft({
          title: nextState.title,
          description: nextState.description,
          coverImagePath: editorData.coverImagePath ?? null,
          coverTempUploadPath: null,
          state: nextState.state,
        }),
      );
      return;
    }

    const localBaseline = createLocalBaseline();
    initialize(localBaseline.state);
    initializeTitle(localBaseline.title);
    setDescription(localBaseline.description);
    setCoverImagePath(localBaseline.coverImagePath);
    setCoverTempUploadPath(localBaseline.coverTempUploadPath);
    setCoverError(null);
    setBaselineDraft(
      buildEditorDraft({
        title: localBaseline.title,
        description: localBaseline.description,
        coverImagePath: localBaseline.coverImagePath,
        coverTempUploadPath: localBaseline.coverTempUploadPath,
        state: localBaseline.state,
      }),
    );
  }, [editorData, initialize, initializeTitle]);

  const draft = useMemo(
    () =>
      buildEditorDraft({
        title,
        description,
        coverImagePath,
        coverTempUploadPath,
        state: { tiers, pool, cardSize },
      }),
    [cardSize, coverImagePath, coverTempUploadPath, description, pool, tiers, title],
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

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || mode !== "template" || !editorData) {
      return;
    }

    if (!isCroppableImageType(file)) {
      setCoverError(getUnsupportedTypeMessage(file));
      event.target.value = "";
      toast.error(getUnsupportedTypeMessage(file));
      return;
    }

    setCoverError(null);
    setPendingCoverFile(file);
    event.target.value = "";
  };

  const handleProcessedCover = async (processedFile: File) => {
    if (mode !== "template" || !editorData) {
      return;
    }

    setIsCoverUploading(true);
    setCoverError(null);

    try {
      const formData = new FormData();
      formData.append("image", processedFile);

      const response = await fetch(
        `/api/tier-lists/${editorData.listId}/cover/upload-temp`,
        {
          method: "POST",
          body: formData,
        },
      );

      const payload = (await response.json()) as {
        error?: string;
        tempUploadPath?: string;
      };

      if (!response.ok || !payload.tempUploadPath) {
        throw new Error(payload.error ?? "อัปโหลดหน้าปกไม่สำเร็จ");
      }

      setCoverTempUploadPath(payload.tempUploadPath);
      setCoverImagePath(payload.tempUploadPath);
      setPendingCoverFile(null);
      toast.success("อัปโหลดหน้าปกสำเร็จ");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "อัปโหลดหน้าปกไม่สำเร็จ";
      setCoverError(message);
      toast.error(message);
    } finally {
      setIsCoverUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    if (
      coverImagePath &&
      !(await confirm({
        title: "ลบหน้าปกตอนนี้ไหม?",
        description: "หน้าปกที่ตั้งไว้จะถูกนำออกจาก draft นี้ทันที",
        confirmLabel: "ลบหน้าปก",
        cancelLabel: "ยกเลิก",
        variant: "destructive",
      }))
    ) {
      return;
    }

    setCoverImagePath(null);
    setCoverTempUploadPath(null);
    setCoverError(null);
    toast.success("ลบหน้าปกออกจาก draft แล้ว");
  };

  const handleSave = async () => {
    if (mode !== "template" || !editorData || isCoverUploading) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/tier-lists/${editorData.listId}/editor`, {
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

      setEditorData(payload as TemplateEditorPageData);
      toast.success("บันทึก template สำเร็จ");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "บันทึก template ไม่สำเร็จ",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBeforeNavigate = async () => {
    if (!isDirty) return true;

    return confirm({
      title: "ออกจากหน้านี้โดยไม่บันทึก?",
      description:
        "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก หากออกตอนนี้ข้อมูลที่แก้ไว้จะหายไป",
      confirmLabel: "ออกจากหน้า",
      cancelLabel: "อยู่ต่อ",
      variant: "destructive",
    });
  };

  const handleBeforeReset = async () => {
    if (!isDirty) return true;

    return confirm({
      title: "รีเซ็ต tier list ตอนนี้ไหม?",
      description: "การจัด tier และชื่อรายการที่ยังไม่ได้บันทึกจะถูกล้างออก",
      confirmLabel: "รีเซ็ต",
      cancelLabel: "ยกเลิก",
      variant: "destructive",
    });
  };

  const saveStatusText = formatSaveStatus({
    mode,
    isDirty,
    isSaving,
    isCoverUploading,
  });
  const coverHelperText = createCoverHelperText();

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 py-3">
            {warningMessage ? (
              <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                {warningMessage}
              </div>
            ) : null}
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
              listId={editorData?.listId}
              backHref={backHref}
              onBeforeNavigate={handleBeforeNavigate}
              onBeforeReset={handleBeforeReset}
              onSave={mode === "template" ? handleSave : undefined}
              isDirty={isDirty}
              isSaving={isSaving || isCoverUploading}
              saveStatusText={saveStatusText}
            />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
          {mode === "template" ? (
            <section className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-muted/30 md:max-w-sm">
                  {coverImagePath ? (
                    <Image
                      src={coverImagePath}
                      alt={`Cover for ${title}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      ยังไม่มีรูปหน้าปก
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  <div>
                    <h2 className="text-base font-semibold">หน้าปกเทมเพลต</h2>
                    <p className="text-sm text-muted-foreground">
                      อัปโหลดรูปสำหรับใช้เป็นภาพปกของเทมเพลต
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept={CROPPABLE_IMAGE_MIME.join(",")}
                      className="hidden"
                      onChange={(event) => void handleCoverUpload(event)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isCoverUploading}
                    >
                      {isCoverUploading ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <ImagePlus className="size-4" />
                      )}
                      {coverImagePath ? "เปลี่ยนหน้าปก" : "อัปโหลดหน้าปก"}
                    </Button>
                    {coverImagePath ? (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => void handleRemoveCover()}
                        disabled={isCoverUploading}
                      >
                        <Trash2 className="size-4" />
                        ลบรูป
                      </Button>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground">{coverHelperText}</p>
                  {coverError ? (
                    <p className="text-sm text-destructive">{coverError}</p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <DragDropContext onDragEnd={onDragEnd}>
            <div
              ref={captureRef}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div
                data-export-only
                className="hidden flex flex-col items-center border-b border-border bg-card py-3 text-center"
              >
                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">BY mavelus</p>
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
          Double-click tier label to rename | Drag items freely between tiers
        </footer>
      </div>

      <ImageCropDialog
        open={!!pendingCoverFile}
        file={pendingCoverFile}
        onCancel={() => setPendingCoverFile(null)}
        onConfirm={handleProcessedCover}
      />
    </>
  );
}
