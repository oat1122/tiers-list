"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  Sparkles,
  Undo2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DashboardDeleteDialog } from "./dashboard-delete-dialog";
import { DashboardFormDialog } from "./dashboard-form-dialog";
import { DashboardPanelHeader } from "./dashboard-panel-header";
import type {
  DashboardPanelProps,
  PaginatedListSection,
} from "./dashboard-panel.types";
import {
  CompactListCard,
  DashboardListActionMenu,
  EmptySection,
  SectionHeading,
  TemplatePreviewCard,
} from "./dashboard-list-cards";
import {
  buildVisiblePageNumbers,
  statusFilters,
} from "./dashboard-panel.utils";
import { useDashboardPanel } from "./use-dashboard-panel";

const easeOut = [0.22, 1, 0.36, 1] as const;

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: easeOut,
      staggerChildren: 0.08,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOut },
  },
};

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: easeOut },
  },
};

function getFormDialogKey(
  state: ReturnType<typeof useDashboardPanel>["state"]["formDialog"],
) {
  if (!state) {
    return "closed";
  }

  if (state.mode === "edit") {
    return `edit-${state.list.id}`;
  }

  return `create-${state.initial.isTemplate ? "template" : "list"}`;
}

function SectionSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

function SectionPagination({
  pageData,
  onPageChange,
}: {
  pageData: PaginatedListSection;
  onPageChange: (page: number) => void;
}) {
  if (pageData.totalItems <= pageData.pageSize) {
    return null;
  }

  const startItem = (pageData.currentPage - 1) * pageData.pageSize + 1;
  const endItem = Math.min(
    pageData.currentPage * pageData.pageSize,
    pageData.totalItems,
  );
  const visiblePages = buildVisiblePageNumbers(
    pageData.currentPage,
    pageData.totalPages,
  );

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        แสดง {startItem}-{endItem} จาก {pageData.totalItems} รายการ
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageData.currentPage - 1)}
          disabled={pageData.currentPage === 1}
        >
          <ChevronLeft className="size-4" />
          ก่อนหน้า
        </Button>
        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={page === pageData.currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageData.currentPage + 1)}
          disabled={pageData.currentPage === pageData.totalPages}
        >
          ถัดไป
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function DashboardPanel({ user, initialData }: DashboardPanelProps) {
  const { state, actions } = useDashboardPanel(initialData);

  return (
    <>
      <motion.div
        initial="hidden"
        animate="show"
        variants={pageVariants}
        className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.07),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(148,163,184,0.12),_transparent_28%)] px-4 py-6 md:px-6 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <motion.div variants={sectionVariants}>
            <DashboardPanelHeader
              user={user}
              stats={state.data.stats}
              feedback={state.feedback}
              busyAction={state.busyAction}
              isPending={state.isPending}
              isLoggingOut={state.isLoggingOut}
              onRefresh={actions.refreshData}
              onOpenCreateTemplate={actions.openCreateTemplate}
              onLogout={actions.logout}
            />
          </motion.div>

          <motion.div
            variants={sectionVariants}
            className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]"
          >
            <motion.div variants={sectionVariants}>
              <Card className="border-border/70 bg-background/88 shadow-sm">
                <CardHeader className="gap-4">
                  <SectionHeading
                    title="All Lists"
                    description="ค้นหาและจัดการรายการหลักทั้งหมดของระบบจากจุดเดียว"
                    badge={`${state.filteredActive.length} รายการ`}
                  />
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="w-full lg:max-w-sm">
                      <SectionSearchInput
                        value={state.search}
                        onChange={actions.setSearch}
                        placeholder="ค้นหาจากชื่อ คำอธิบาย หรือ owner"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {statusFilters.map((filter) => (
                        <Button
                          key={filter.key}
                          variant={
                            state.statusFilter === filter.key
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => actions.setStatusFilter(filter.key)}
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {state.filteredActive.length === 0 ? (
                    <EmptySection
                      title="ไม่พบรายการที่ตรงกับเงื่อนไข"
                      description="ลองล้างคำค้นหรือสลับตัวกรองเพื่อดูรายการอื่น"
                    />
                  ) : (
                    <>
                      <motion.div variants={listVariants} className="space-y-4">
                        {state.activePageData.items.map((list) => (
                          <motion.div
                            key={list.id}
                            layout
                            variants={listItemVariants}
                          >
                            <CompactListCard
                              list={list}
                              menu={
                                <DashboardListActionMenu
                                  list={list}
                                  busyAction={state.busyAction}
                                  onEdit={actions.openEditDialog}
                                  onOpenTemplateEditor={
                                    actions.openTemplateEditor
                                  }
                                  onMakePublic={actions.makePublic}
                                  onClosePublic={actions.closePublic}
                                  onToggleTemplate={actions.toggleTemplate}
                                  onClone={actions.clone}
                                  onRestore={actions.restore}
                                  onDelete={actions.selectDeleteTarget}
                                />
                              }
                              footer={
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => actions.openEditDialog(list)}
                                    disabled={Boolean(state.busyAction)}
                                  >
                                    แก้ไข
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      list.isPublic === 1
                                        ? void actions.closePublic(list)
                                        : void actions.makePublic(list)
                                    }
                                    disabled={Boolean(state.busyAction)}
                                  >
                                    {list.isPublic === 1
                                      ? "ปิดสาธารณะ"
                                      : "เปิดสาธารณะ"}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      actions.selectDeleteTarget(list)
                                    }
                                    disabled={Boolean(state.busyAction)}
                                  >
                                    ลบ
                                  </Button>
                                </>
                              }
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                      <SectionPagination
                        pageData={state.activePageData}
                        onPageChange={actions.setActivePage}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={sectionVariants} className="space-y-6">
              <Card className="border-border/70 bg-background/88 shadow-sm">
                <CardHeader>
                  <SectionHeading
                    title="Public Lists"
                    description="รายการที่กำลังเปิดให้เข้าถึงได้จากภายนอก"
                    badge={`${state.filteredPublic.length} รายการ`}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <SectionSearchInput
                    value={state.publicSearch}
                    onChange={actions.setPublicSearch}
                    placeholder="ค้นหา public list จากชื่อ คำอธิบาย หรือ owner"
                  />
                  {state.filteredPublic.length === 0 ? (
                    <EmptySection
                      title={
                        state.publicSearch.trim()
                          ? "ไม่พบรายการสาธารณะที่ตรงกับคำค้น"
                          : "ยังไม่มีรายการสาธารณะ"
                      }
                      description={
                        state.publicSearch.trim()
                          ? "ลองเปลี่ยนคำค้นเพื่อดูรายการอื่น"
                          : "เมื่อเปิดรายการเป็น public แล้วจะแสดงที่นี่"
                      }
                    />
                  ) : (
                    <>
                      <motion.div variants={listVariants} className="space-y-4">
                        {state.publicPageData.items.map((list) => (
                          <motion.div
                            key={list.id}
                            layout
                            variants={listItemVariants}
                          >
                            <CompactListCard
                              list={list}
                              menu={
                                <DashboardListActionMenu
                                  list={list}
                                  busyAction={state.busyAction}
                                  onEdit={actions.openEditDialog}
                                  onOpenTemplateEditor={
                                    actions.openTemplateEditor
                                  }
                                  onMakePublic={actions.makePublic}
                                  onClosePublic={actions.closePublic}
                                  onToggleTemplate={actions.toggleTemplate}
                                  onClone={actions.clone}
                                  onRestore={actions.restore}
                                  onDelete={actions.selectDeleteTarget}
                                />
                              }
                              footer={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void actions.closePublic(list)}
                                  disabled={Boolean(state.busyAction)}
                                >
                                  ปิดสาธารณะ
                                </Button>
                              }
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                      <SectionPagination
                        pageData={state.publicPageData}
                        onPageChange={actions.setPublicPage}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-background/88 shadow-sm">
                <CardHeader>
                  <SectionHeading
                    title="Templates"
                    description="ต้นแบบพร้อมใช้งานสำหรับโคลนไปสร้างรายการใหม่"
                    badge={`${state.filteredTemplates.length} รายการ`}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <SectionSearchInput
                    value={state.templateSearch}
                    onChange={actions.setTemplateSearch}
                    placeholder="ค้นหาเทมเพลตจากชื่อ คำอธิบาย หรือ owner"
                  />
                  {state.filteredTemplates.length === 0 ? (
                    <EmptySection
                      title={
                        state.templateSearch.trim()
                          ? "ไม่พบเทมเพลตที่ตรงกับคำค้น"
                          : "ยังไม่มีเทมเพลต"
                      }
                      description={
                        state.templateSearch.trim()
                          ? "ลองเปลี่ยนคำค้นเพื่อดูเทมเพลตอื่น"
                          : "สร้างรายการแบบ template เพื่อให้ระบบนำไปใช้ซ้ำได้เร็วขึ้น"
                      }
                    />
                  ) : (
                    <>
                      <motion.div variants={listVariants} className="space-y-4">
                        {state.templatePageData.items.map((list) => (
                          <motion.div
                            key={list.id}
                            layout
                            variants={listItemVariants}
                          >
                            <TemplatePreviewCard
                              list={list}
                              menu={
                                <DashboardListActionMenu
                                  list={list}
                                  busyAction={state.busyAction}
                                  onEdit={actions.openEditDialog}
                                  onOpenTemplateEditor={
                                    actions.openTemplateEditor
                                  }
                                  onMakePublic={actions.makePublic}
                                  onClosePublic={actions.closePublic}
                                  onToggleTemplate={actions.toggleTemplate}
                                  onClone={actions.clone}
                                  onRestore={actions.restore}
                                  onDelete={actions.selectDeleteTarget}
                                />
                              }
                              footer={
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void actions.clone(list)}
                                    disabled={Boolean(state.busyAction)}
                                  >
                                    <Copy className="size-4" />
                                    โคลน
                                  </Button>
                                  <Link
                                    href={`/dashboard/tier-lists/templates/${list.id}/edit-template`}
                                    className={cn(
                                      buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                      }),
                                    )}
                                  >
                                    <Sparkles className="size-4" />
                                    ปรับแต่งเทมเพลต
                                  </Link>
                                </>
                              }
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                      <SectionPagination
                        pageData={state.templatePageData}
                        onPageChange={actions.setTemplatePage}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-background/88 shadow-sm">
                <CardHeader>
                  <SectionHeading
                    title="Trash"
                    description="รายการที่ถูก soft delete และสามารถกู้คืนได้"
                    badge={`${state.filteredDeleted.length} รายการ`}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <SectionSearchInput
                    value={state.trashSearch}
                    onChange={actions.setTrashSearch}
                    placeholder="ค้นหาในถังขยะจากชื่อ คำอธิบาย หรือ owner"
                  />
                  {state.filteredDeleted.length === 0 ? (
                    <EmptySection
                      title={
                        state.trashSearch.trim()
                          ? "ไม่พบรายการในถังขยะที่ตรงกับคำค้น"
                          : "ถังขยะว่างอยู่"
                      }
                      description={
                        state.trashSearch.trim()
                          ? "ลองเปลี่ยนคำค้นเพื่อดูรายการอื่น"
                          : "รายการที่ถูกลบจะถูกเก็บไว้ชั่วคราวในส่วนนี้"
                      }
                    />
                  ) : (
                    <>
                      <motion.div variants={listVariants} className="space-y-4">
                        {state.trashPageData.items.map((list) => (
                          <motion.div
                            key={list.id}
                            layout
                            variants={listItemVariants}
                          >
                            <CompactListCard
                              list={list}
                              menu={
                                <DashboardListActionMenu
                                  list={list}
                                  busyAction={state.busyAction}
                                  onEdit={actions.openEditDialog}
                                  onOpenTemplateEditor={
                                    actions.openTemplateEditor
                                  }
                                  onMakePublic={actions.makePublic}
                                  onClosePublic={actions.closePublic}
                                  onToggleTemplate={actions.toggleTemplate}
                                  onClone={actions.clone}
                                  onRestore={actions.restore}
                                  onDelete={actions.selectDeleteTarget}
                                />
                              }
                              footer={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void actions.restore(list)}
                                  disabled={Boolean(state.busyAction)}
                                >
                                  <Undo2 className="size-4" />
                                  กู้คืน
                                </Button>
                              }
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                      <SectionPagination
                        pageData={state.trashPageData}
                        onPageChange={actions.setTrashPage}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            variants={sectionVariants}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-muted-foreground"
          >
            <p>
              ทำงานในนาม{" "}
              <span className="font-medium text-foreground">{user.name}</span>
            </p>
            <div className="flex items-center gap-3">
              <span>รองรับ desktop</span>
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-auto px-0 text-sm",
                )}
              >
                กลับหน้าหลัก
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <DashboardFormDialog
        key={getFormDialogKey(state.formDialog)}
        state={state.formDialog}
        open={state.formDialog !== null}
        pending={Boolean(state.busyAction)}
        onClose={actions.closeFormDialog}
        onSubmit={actions.submitForm}
      />
      <DashboardDeleteDialog
        target={state.deleteTarget}
        busyAction={state.busyAction}
        onClose={actions.clearDeleteTarget}
        onConfirm={actions.deleteSelected}
      />
    </>
  );
}
