"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  AdminDashboardResponseDto,
  AdminTierListSummaryDto,
} from "@/types/admin-dashboard";
import type {
  DashboardPanelActions,
  DashboardPanelState,
} from "./dashboard-panel.types";
import { requestSignOut } from "@/lib/request-sign-out";
import {
  buildFormState,
  emptyFormState,
  extractApiError,
  filterActiveLists,
  filterListsBySearch,
  getErrorMessage,
  paginateLists,
  readJsonOrNull,
} from "./dashboard-panel.utils";

async function fetchDashboardData() {
  const response = await fetch("/api/tier-lists/admin", {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readJsonOrNull(response);

  if (!response.ok) {
    throw new Error(
      extractApiError(payload) ?? "โหลดข้อมูล dashboard ไม่สำเร็จ",
    );
  }

  return payload as AdminDashboardResponseDto;
}

export function useDashboardPanel(initialData: AdminDashboardResponseDto) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [formDialog, setFormDialog] =
    useState<DashboardPanelState["formDialog"]>(null);
  const [feedback, setFeedback] =
    useState<DashboardPanelState["feedback"]>(null);
  const [search, setSearch] = useState("");
  const [publicSearch, setPublicSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [trashSearch, setTrashSearch] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [publicPage, setPublicPage] = useState(1);
  const [templatePage, setTemplatePage] = useState(1);
  const [trashPage, setTrashPage] = useState(1);
  const [statusFilter, setStatusFilter] =
    useState<DashboardPanelState["statusFilter"]>("all");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AdminTierListSummaryDto | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);
  const deferredPublicSearch = useDeferredValue(publicSearch);
  const deferredTemplateSearch = useDeferredValue(templateSearch);
  const deferredTrashSearch = useDeferredValue(trashSearch);

  const filteredActive = useMemo(
    () => filterActiveLists(data.active, deferredSearch, statusFilter),
    [data.active, deferredSearch, statusFilter],
  );
  const filteredPublic = useMemo(
    () => filterListsBySearch(data.public, deferredPublicSearch),
    [data.public, deferredPublicSearch],
  );
  const filteredTemplates = useMemo(
    () => filterListsBySearch(data.templates, deferredTemplateSearch),
    [data.templates, deferredTemplateSearch],
  );
  const filteredDeleted = useMemo(
    () => filterListsBySearch(data.deleted, deferredTrashSearch),
    [data.deleted, deferredTrashSearch],
  );
  const activePageData = useMemo(
    () => paginateLists(filteredActive, activePage),
    [activePage, filteredActive],
  );
  const publicPageData = useMemo(
    () => paginateLists(filteredPublic, publicPage),
    [filteredPublic, publicPage],
  );
  const templatePageData = useMemo(
    () => paginateLists(filteredTemplates, templatePage),
    [filteredTemplates, templatePage],
  );
  const trashPageData = useMemo(
    () => paginateLists(filteredDeleted, trashPage),
    [filteredDeleted, trashPage],
  );

  useEffect(() => {
    setActivePage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    setPublicPage(1);
  }, [publicSearch]);

  useEffect(() => {
    setTemplatePage(1);
  }, [templateSearch]);

  useEffect(() => {
    setTrashPage(1);
  }, [trashSearch]);

  useEffect(() => {
    if (activePage !== activePageData.currentPage) {
      setActivePage(activePageData.currentPage);
    }
  }, [activePage, activePageData.currentPage]);

  useEffect(() => {
    if (publicPage !== publicPageData.currentPage) {
      setPublicPage(publicPageData.currentPage);
    }
  }, [publicPage, publicPageData.currentPage]);

  useEffect(() => {
    if (templatePage !== templatePageData.currentPage) {
      setTemplatePage(templatePageData.currentPage);
    }
  }, [templatePage, templatePageData.currentPage]);

  useEffect(() => {
    if (trashPage !== trashPageData.currentPage) {
      setTrashPage(trashPageData.currentPage);
    }
  }, [trashPage, trashPageData.currentPage]);

  const setFreshData = (nextData: AdminDashboardResponseDto) => {
    startTransition(() => {
      setData(nextData);
    });
  };

  const refreshData: DashboardPanelActions["refreshData"] = async (message) => {
    const nextData = await fetchDashboardData();
    setFreshData(nextData);

    if (message) {
      toast.success(message);
    }
  };

  const runAction = async (
    label: string,
    action: () => Promise<void>,
    successMessage: string,
  ) => {
    setBusyAction(label);
    setFeedback(null);

    try {
      await action();
      await refreshData(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  };

  const openEditDialog: DashboardPanelActions["openEditDialog"] = (list) => {
    setFormDialog({
      mode: "edit",
      list,
      initial: buildFormState(list),
    });
  };

  const openCreateTemplate: DashboardPanelActions["openCreateTemplate"] =
    () => {
      setFormDialog({
        mode: "create",
        initial: { ...emptyFormState, isTemplate: true },
      });
    };

  const closeFormDialog: DashboardPanelActions["closeFormDialog"] = () => {
    setFormDialog(null);
  };

  const submitForm: DashboardPanelActions["submitForm"] = async (values) => {
    if (!formDialog) return;

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      isPublic: values.isPublic ? 1 : 0,
      isTemplate: values.isTemplate ? 1 : 0,
    };

    await runAction(
      formDialog.mode === "edit" ? "update-list" : "create-list",
      async () => {
        const response = await fetch(
          formDialog.mode === "edit"
            ? `/api/tier-lists/${formDialog.list.id}`
            : "/api/tier-lists",
          {
            method: formDialog.mode === "edit" ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        const result = await readJsonOrNull(response);

        if (!response.ok) {
          throw new Error(
            extractApiError(result) ??
              (formDialog.mode === "edit"
                ? "อัปเดตรายการไม่สำเร็จ"
                : "สร้างรายการไม่สำเร็จ"),
          );
        }

        setFormDialog(null);
      },
      formDialog.mode === "edit"
        ? "อัปเดตรายการเรียบร้อยแล้ว"
        : payload.isTemplate === 1
          ? "สร้างเทมเพลตใหม่เรียบร้อยแล้ว"
          : "สร้างรายการใหม่เรียบร้อยแล้ว",
    );
  };

  const updateField = async (
    list: AdminTierListSummaryDto,
    field: "isPublic" | "isTemplate",
    value: number,
    successMessage: string,
  ) => {
    await runAction(
      `${field}-${list.id}`,
      async () => {
        const response = await fetch(`/api/tier-lists/${list.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });

        await readJsonOrNull(response);
      },
      successMessage,
    );
  };

  const makePublic: DashboardPanelActions["makePublic"] = async (list) => {
    await updateField(list, "isPublic", 1, "เปิดเป็นรายการสาธารณะแล้ว");
  };

  const closePublic: DashboardPanelActions["closePublic"] = async (list) => {
    await runAction(
      `close-public-${list.id}`,
      async () => {
        const response = await fetch(`/api/tier-lists/${list.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublic: 0, isTemplate: 1 }),
        });

        await readJsonOrNull(response);
      },
      "เปลี่ยนเป็นรายการส่วนตัวและบันทึกเป็นเทมเพลตแล้ว",
    );
  };

  const toggleTemplate: DashboardPanelActions["toggleTemplate"] = async (
    list,
  ) => {
    await updateField(
      list,
      "isTemplate",
      list.isTemplate === 1 ? 0 : 1,
      list.isTemplate === 1
        ? "ยกเลิกสถานะเทมเพลตแล้ว"
        : "บันทึกเป็นเทมเพลตแล้ว",
    );
  };

  const selectDeleteTarget: DashboardPanelActions["selectDeleteTarget"] = (
    list,
  ) => {
    setDeleteTarget(list);
  };

  const clearDeleteTarget: DashboardPanelActions["clearDeleteTarget"] = () => {
    setDeleteTarget(null);
  };

  const deleteSelected: DashboardPanelActions["deleteSelected"] = async () => {
    if (!deleteTarget) return;

    await runAction(
      `delete-${deleteTarget.id}`,
      async () => {
        const response = await fetch(`/api/tier-lists/${deleteTarget.id}`, {
          method: "DELETE",
        });

        await readJsonOrNull(response);

        setDeleteTarget(null);
      },
      "ย้ายรายการไปถังขยะเรียบร้อยแล้ว",
    );
  };

  const restore: DashboardPanelActions["restore"] = async (list) => {
    await runAction(
      `restore-${list.id}`,
      async () => {
        const response = await fetch(`/api/tier-lists/${list.id}/restore`, {
          method: "POST",
        });

        await readJsonOrNull(response);
      },
      "กู้คืนรายการเรียบร้อยแล้ว",
    );
  };

  const clone: DashboardPanelActions["clone"] = async (list) => {
    await runAction(
      `clone-${list.id}`,
      async () => {
        const response = await fetch(`/api/tier-lists/${list.id}/clone`, {
          method: "POST",
        });

        await readJsonOrNull(response);
      },
      "สร้างสำเนาจากเทมเพลตเรียบร้อยแล้ว",
    );
  };

  const logout: DashboardPanelActions["logout"] = async () => {
    setIsLoggingOut(true);

    try {
      await requestSignOut();

      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsLoggingOut(false);
    }
  };

  const openTemplateEditor: DashboardPanelActions["openTemplateEditor"] = (
    list,
  ) => {
    router.push(`/dashboard/tier-lists/templates/${list.id}/edit-template`);
  };

  const state: DashboardPanelState = {
    data,
    filteredActive,
    filteredPublic,
    filteredTemplates,
    filteredDeleted,
    activePageData,
    publicPageData,
    templatePageData,
    trashPageData,
    formDialog,
    feedback,
    search,
    publicSearch,
    templateSearch,
    trashSearch,
    statusFilter,
    busyAction,
    deleteTarget,
    isLoggingOut,
    isPending,
  };

  const actions: DashboardPanelActions = {
    setSearch,
    setPublicSearch,
    setTemplateSearch,
    setTrashSearch,
    setStatusFilter,
    setActivePage,
    setPublicPage,
    setTemplatePage,
    setTrashPage,
    refreshData,
    openCreateTemplate,
    openEditDialog,
    closeFormDialog,
    submitForm,
    selectDeleteTarget,
    clearDeleteTarget,
    deleteSelected,
    makePublic,
    closePublic,
    toggleTemplate,
    restore,
    clone,
    logout,
    openTemplateEditor,
  };

  return { state, actions };
}

