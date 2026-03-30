"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  ClipboardList,
  Copy,
  Crown,
  Loader2,
  LogOut,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  AdminDashboardResponseDto,
  AdminTierListSummaryDto,
} from "@/types/admin-dashboard";

type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
};

type FeedbackState = {
  tone: "success" | "error";
  message: string;
} | null;

type StatusFilter = "all" | "public" | "private" | "template";

type FormState = {
  title: string;
  description: string;
  isPublic: boolean;
  isTemplate: boolean;
};

type FormDialogState =
  | { mode: "create"; initial: FormState }
  | { mode: "edit"; list: AdminTierListSummaryDto; initial: FormState }
  | null;

interface DashboardPanelProps {
  user: DashboardUser;
  initialData: AdminDashboardResponseDto;
}

const statusFilters: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "ทั้งหมด" },
  { key: "public", label: "สาธารณะ" },
  { key: "private", label: "ส่วนตัว" },
  { key: "template", label: "เทมเพลต" },
];

const emptyFormState: FormState = {
  title: "",
  description: "",
  isPublic: false,
  isTemplate: false,
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "เกิดข้อผิดพลาดที่ไม่คาดคิด";
}

function extractApiError(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return null;
}

async function readJsonOrNull(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

async function fetchDashboardData() {
  const response = await fetch("/api/tier-lists/admin", {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readJsonOrNull(response);

  if (!response.ok) {
    throw new Error(extractApiError(payload) ?? "โหลดข้อมูล dashboard ไม่สำเร็จ");
  }

  return payload as AdminDashboardResponseDto;
}

function buildFormState(list?: AdminTierListSummaryDto): FormState {
  if (!list) {
    return emptyFormState;
  }

  return {
    title: list.title,
    description: list.description ?? "",
    isPublic: list.isPublic === 1,
    isTemplate: list.isTemplate === 1,
  };
}

function matchesFilter(list: AdminTierListSummaryDto, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "public") return list.isPublic === 1;
  if (filter === "private") return list.isPublic === 0;
  return list.isTemplate === 1;
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: typeof ClipboardList;
}) {
  return (
    <Card className="border-border/70 bg-background/85 shadow-sm">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="mt-1 text-3xl">{value}</CardTitle>
          </div>
          <div className="flex size-11 items-center justify-center rounded-2xl border border-border bg-muted/50">
            <Icon className="size-5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function EmptySection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant="secondary">{badge}</Badge>
    </div>
  );
}

function ListBadges({ list }: { list: AdminTierListSummaryDto }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {list.isTemplate === 1 ? <Badge variant="warning">เทมเพลต</Badge> : null}
      {list.isPublic === 1 ? <Badge variant="success">สาธารณะ</Badge> : null}
      {list.isPublic === 0 ? <Badge variant="secondary">ส่วนตัว</Badge> : null}
      {list.deletedAt ? <Badge variant="destructive">อยู่ในถังขยะ</Badge> : null}
    </div>
  );
}

function ListCard({
  list,
  footer,
  menu,
}: {
  list: AdminTierListSummaryDto;
  footer?: ReactNode;
  menu?: ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-background/85 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-base">{list.title}</CardTitle>
            <ListBadges list={list} />
          </div>
          {menu}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          {list.description?.trim() || "ยังไม่มีคำอธิบายสำหรับรายการนี้"}
        </p>
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
              Owner
            </p>
            <p className="mt-1 font-medium text-foreground">{list.owner.name}</p>
            <p className="text-xs">{list.owner.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
                Items
              </p>
              <p className="mt-1 font-medium text-foreground">{list.itemCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
                Updated
              </p>
              <p className="mt-1 font-medium text-foreground">
                {formatDate(list.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      {footer ? <CardFooter className="flex flex-wrap gap-2">{footer}</CardFooter> : null}
    </Card>
  );
}

function FormDialog({
  state,
  open,
  pending,
  onClose,
  onSubmit,
}: {
  state: FormDialogState;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: FormState) => Promise<void>;
}) {
  const [values, setValues] = useState<FormState>(state?.initial ?? emptyFormState);

  if (!state) {
    return null;
  }

  const isEditMode = state.mode === "edit";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "แก้ไขรายละเอียด Tier List" : "สร้าง Tier List ใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "อัปเดตชื่อ คำอธิบาย และสถานะของรายการได้ในที่เดียว"
              : "สร้างรายการใหม่สำหรับจัดการในระบบ พร้อมตั้งค่าสถานะเบื้องต้นได้ทันที"}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5 px-6 py-5"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit(values);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="dashboard-list-title">ชื่อรายการ</Label>
            <Input
              id="dashboard-list-title"
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="เช่น Anime Power Ranking"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dashboard-list-description">คำอธิบาย</Label>
            <Textarea
              id="dashboard-list-description"
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="อธิบายวัตถุประสงค์หรือแนวทางของ tier list นี้"
            />
          </div>
          <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label>แสดงเป็นสาธารณะ</Label>
                <p className="text-sm text-muted-foreground">
                  เปิดให้ผู้อื่นเห็นรายการนี้ผ่าน public API
                </p>
              </div>
              <Switch
                checked={values.isPublic}
                onCheckedChange={(checked) =>
                  setValues((current) => ({ ...current, isPublic: checked }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label>ทำเป็นเทมเพลต</Label>
                <p className="text-sm text-muted-foreground">
                  ใช้เป็นต้นแบบให้ clone ไปใช้งานต่อได้
                </p>
              </div>
              <Switch
                checked={values.isTemplate}
                onCheckedChange={(checked) =>
                  setValues((current) => ({ ...current, isTemplate: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter className="px-0 pb-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending || !values.title.trim()}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEditMode ? "บันทึกการเปลี่ยนแปลง" : "สร้างรายการ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DashboardPanel({ user, initialData }: DashboardPanelProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [formDialog, setFormDialog] = useState<FormDialogState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTierListSummaryDto | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const filteredActive = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    return data.active.filter((list) => {
      const matchesKeyword =
        keyword.length === 0 ||
        list.title.toLowerCase().includes(keyword) ||
        (list.description ?? "").toLowerCase().includes(keyword) ||
        list.owner.name.toLowerCase().includes(keyword) ||
        list.owner.email.toLowerCase().includes(keyword);

      return matchesKeyword && matchesFilter(list, statusFilter);
    });
  }, [data.active, deferredSearch, statusFilter]);

  const setFreshData = (nextData: AdminDashboardResponseDto) => {
    startTransition(() => {
      setData(nextData);
    });
  };

  const refreshData = async (message?: string) => {
    const nextData = await fetchDashboardData();
    setFreshData(nextData);
    if (message) {
      setFeedback({ tone: "success", message });
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
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusyAction(null);
    }
  };

  const submitForm = async (values: FormState) => {
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

  const handleToggleField = async (
    list: AdminTierListSummaryDto,
    field: "isPublic" | "isTemplate",
    value: number,
    successMessage: string,
  ) => {
    await runAction(`${field}-${list.id}`, async () => {
      const response = await fetch(`/api/tier-lists/${list.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      const result = await readJsonOrNull(response);

      if (!response.ok) {
        throw new Error(extractApiError(result) ?? "อัปเดตสถานะไม่สำเร็จ");
      }
    }, successMessage);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await runAction(
      `delete-${deleteTarget.id}`,
      async () => {
        const response = await fetch(`/api/tier-lists/${deleteTarget.id}`, {
          method: "DELETE",
        });

        const result = await readJsonOrNull(response);
        if (!response.ok) {
          throw new Error(extractApiError(result) ?? "ลบรายการไม่สำเร็จ");
        }

        setDeleteTarget(null);
      },
      "ย้ายรายการไปถังขยะเรียบร้อยแล้ว",
    );
  };

  const handleRestore = async (list: AdminTierListSummaryDto) => {
    await runAction(`restore-${list.id}`, async () => {
      const response = await fetch(`/api/tier-lists/${list.id}/restore`, {
        method: "POST",
      });

      const result = await readJsonOrNull(response);
      if (!response.ok) {
        throw new Error(extractApiError(result) ?? "กู้คืนรายการไม่สำเร็จ");
      }
    }, "กู้คืนรายการเรียบร้อยแล้ว");
  };

  const handleClone = async (list: AdminTierListSummaryDto) => {
    await runAction(`clone-${list.id}`, async () => {
      const response = await fetch(`/api/tier-lists/${list.id}/clone`, {
        method: "POST",
      });

      const result = await readJsonOrNull(response);
      if (!response.ok) {
        throw new Error(extractApiError(result) ?? "โคลนเทมเพลตไม่สำเร็จ");
      }
    }, "สร้างสำเนาจากเทมเพลตเรียบร้อยแล้ว");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("ออกจากระบบไม่สำเร็จ");
      }

      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
      setIsLoggingOut(false);
    }
  };

  const renderMenu = (list: AdminTierListSummaryDto) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        aria-label={`การจัดการ ${list.title}`}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {!list.deletedAt ? (
          <DropdownMenuItem
            onClick={() =>
              setFormDialog({ mode: "edit", list, initial: buildFormState(list) })
            }
          >
            <Sparkles className="size-4" />
            แก้ไขรายละเอียด
          </DropdownMenuItem>
        ) : null}
        {!list.deletedAt ? (
          <DropdownMenuItem
            onClick={() =>
              handleToggleField(
                list,
                "isPublic",
                list.isPublic === 1 ? 0 : 1,
                list.isPublic === 1
                  ? "เปลี่ยนเป็นรายการส่วนตัวแล้ว"
                  : "เปิดเป็นรายการสาธารณะแล้ว",
              )
            }
          >
            <ShieldCheck className="size-4" />
            {list.isPublic === 1 ? "เปลี่ยนเป็นส่วนตัว" : "เปิดเป็นสาธารณะ"}
          </DropdownMenuItem>
        ) : null}
        {!list.deletedAt ? (
          <DropdownMenuItem
            onClick={() =>
              handleToggleField(
                list,
                "isTemplate",
                list.isTemplate === 1 ? 0 : 1,
                list.isTemplate === 1
                  ? "ยกเลิกสถานะเทมเพลตแล้ว"
                  : "บันทึกเป็นเทมเพลตแล้ว",
              )
            }
          >
            <Copy className="size-4" />
            {list.isTemplate === 1 ? "ยกเลิกเทมเพลต" : "ทำเป็นเทมเพลต"}
          </DropdownMenuItem>
        ) : null}
        {list.isTemplate === 1 && !list.deletedAt ? (
          <DropdownMenuItem onClick={() => handleClone(list)}>
            <Copy className="size-4" />
            โคลนเทมเพลต
          </DropdownMenuItem>
        ) : null}
        {list.isTemplate === 1 && !list.deletedAt ? (
          <DropdownMenuItem>
            <Link
              href={`/dashboard/templates/${list.id}/edit-template`}
              className="flex w-full items-center gap-2"
            >
              <Sparkles className="size-4" />
              ปรับแต่ง template
            </Link>
          </DropdownMenuItem>
        ) : null}
        {list.deletedAt ? (
          <DropdownMenuItem onClick={() => handleRestore(list)}>
            <Undo2 className="size-4" />
            กู้คืนรายการ
          </DropdownMenuItem>
        ) : null}
        {!list.deletedAt ? <DropdownMenuSeparator /> : null}
        {!list.deletedAt ? (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setDeleteTarget(list)}
          >
            <Trash2 className="size-4" />
            ย้ายไปถังขยะ
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.07),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(148,163,184,0.12),_transparent_28%)] px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardContent className="space-y-6 px-6 py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">
                      <Crown className="mr-1 size-3.5" />
                      Admin Control Center
                    </Badge>
                    <Badge variant="secondary">{user.email}</Badge>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                      จัดการระบบ Tier Lists แบบภาพรวม
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                      ตรวจสอบรายการทั้งหมด จัดการสถานะสาธารณะ ดูเทมเพลต
                      และกู้คืนข้อมูลจากถังขยะได้ในหน้าเดียว
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <ThemeToggle />
                  <Button
                    variant="outline"
                    onClick={() => void refreshData("รีเฟรชข้อมูลล่าสุดแล้ว")}
                    disabled={Boolean(busyAction) || isPending}
                  >
                    {busyAction === null && !isPending ? (
                      <RefreshCw className="size-4" />
                    ) : (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    รีเฟรช
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFormDialog({ mode: "create", initial: emptyFormState })
                    }
                    disabled={Boolean(busyAction)}
                  >
                    <Plus className="size-4" />
                    สร้างรายการ
                  </Button>
                  <Button
                    onClick={() =>
                      setFormDialog({
                        mode: "create",
                        initial: { ...emptyFormState, isTemplate: true },
                      })
                    }
                    disabled={Boolean(busyAction)}
                  >
                    <Sparkles className="size-4" />
                    สร้างเทมเพลต
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleLogout()}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LogOut className="size-4" />
                    )}
                    ออกจากระบบ
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  label="รายการทั้งหมด"
                  value={data.stats.activeCount}
                  hint="รวมรายการที่ยังใช้งานอยู่ในระบบ"
                  icon={ClipboardList}
                />
                <SummaryCard
                  label="สาธารณะ"
                  value={data.stats.publicCount}
                  hint="รายการที่เปิดให้ใช้งานผ่าน public API"
                  icon={ShieldCheck}
                />
                <SummaryCard
                  label="เทมเพลต"
                  value={data.stats.templateCount}
                  hint="ต้นแบบที่สามารถ clone ไปใช้ต่อได้"
                  icon={Sparkles}
                />
                <SummaryCard
                  label="ถังขยะ"
                  value={data.stats.deletedCount}
                  hint="รายการที่ถูก soft delete และรอกู้คืน"
                  icon={Trash2}
                />
              </div>
              {feedback ? (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
                    feedback.tone === "success"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                      : "border-destructive/20 bg-destructive/10 text-destructive",
                  )}
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>{feedback.message}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
            <Card className="border-border/70 bg-background/88 shadow-sm">
              <CardHeader className="gap-4">
                <SectionHeading
                  title="All Lists"
                  description="ค้นหาและจัดการรายการหลักทั้งหมดของระบบจากจุดเดียว"
                  badge={`${filteredActive.length} รายการ`}
                />
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-sm">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="ค้นหาจากชื่อ คำอธิบาย หรือ owner"
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {statusFilters.map((filter) => (
                      <Button
                        key={filter.key}
                        variant={statusFilter === filter.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(filter.key)}
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredActive.length === 0 ? (
                  <EmptySection
                    title="ไม่พบรายการที่ตรงกับเงื่อนไข"
                    description="ลองล้างคำค้น หรือสลับตัวกรองเพื่อดูรายการอื่น"
                  />
                ) : (
                  filteredActive.map((list) => (
                    <ListCard
                      key={list.id}
                      list={list}
                      menu={renderMenu(list)}
                      footer={
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setFormDialog({
                                mode: "edit",
                                list,
                                initial: buildFormState(list),
                              })
                            }
                          >
                            แก้ไข
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleField(
                                list,
                                "isPublic",
                                list.isPublic === 1 ? 0 : 1,
                                list.isPublic === 1
                                  ? "เปลี่ยนเป็นรายการส่วนตัวแล้ว"
                                  : "เปิดเป็นรายการสาธารณะแล้ว",
                              )
                            }
                          >
                            {list.isPublic === 1 ? "ปิดสาธารณะ" : "เปิดสาธารณะ"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleField(
                                list,
                                "isTemplate",
                                list.isTemplate === 1 ? 0 : 1,
                                list.isTemplate === 1
                                  ? "ยกเลิกสถานะเทมเพลตแล้ว"
                                  : "บันทึกเป็นเทมเพลตแล้ว",
                              )
                            }
                          >
                            {list.isTemplate === 1 ? "ยกเลิกเทมเพลต" : "ทำเป็นเทมเพลต"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(list)}
                          >
                            ลบ
                          </Button>
                        </>
                      }
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/70 bg-background/88 shadow-sm">
                <CardHeader>
                  <SectionHeading
                    title="Public Lists"
                    description="รายการที่กำลังเปิดให้เข้าถึงได้ภายนอก"
                    badge={`${data.public.length} รายการ`}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.public.length === 0 ? (
                    <EmptySection
                      title="ยังไม่มีรายการสาธารณะ"
                      description="เมื่อเปิดรายการเป็น public แล้วจะปรากฏที่นี่"
                    />
                  ) : (
                    data.public.map((list) => (
                      <ListCard
                        key={list.id}
                        list={list}
                        menu={renderMenu(list)}
                        footer={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleField(
                                list,
                                "isPublic",
                                0,
                                "เปลี่ยนเป็นรายการส่วนตัวแล้ว",
                              )
                            }
                          >
                            ปิดสาธารณะ
                          </Button>
                        }
                      />
                    ))
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/88 shadow-sm">
                <CardHeader>
                  <SectionHeading
                    title="Templates"
                    description="ต้นแบบพร้อมใช้งานสำหรับ clone ไปสร้างรายการใหม่"
                    badge={`${data.templates.length} รายการ`}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.templates.length === 0 ? (
                    <EmptySection
                      title="ยังไม่มีเทมเพลต"
                      description="สร้างรายการแบบ template เพื่อให้ระบบ reuse ได้เร็วขึ้น"
                    />
                  ) : (
                    data.templates.map((list) => (
                      <ListCard
                        key={list.id}
                        list={list}
                        menu={renderMenu(list)}
                        footer={
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleClone(list)}
                            >
                              <Copy className="size-4" />
                              โคลนเทมเพลต
                            </Button>
                            <Link
                              href={`/dashboard/templates/${list.id}/edit-template`}
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                              )}
                            >
                              <Sparkles className="size-4" />
                              ปรับแต่ง template
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleToggleField(
                                  list,
                                  "isTemplate",
                                  0,
                                  "ยกเลิกสถานะเทมเพลตแล้ว",
                                )
                              }
                            >
                              ยกเลิกเทมเพลต
                            </Button>
                          </>
                        }
                      />
                    ))
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/88 shadow-sm">
                <CardHeader>
                  <SectionHeading
                    title="Trash"
                    description="รายการที่ถูก soft delete และสามารถกู้คืนได้"
                    badge={`${data.deleted.length} รายการ`}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.deleted.length === 0 ? (
                    <EmptySection
                      title="ถังขยะว่างอยู่"
                      description="รายการที่ถูกลบจะถูกเก็บไว้ชั่วคราวในส่วนนี้"
                    />
                  ) : (
                    data.deleted.map((list) => (
                      <ListCard
                        key={list.id}
                        list={list}
                        menu={renderMenu(list)}
                        footer={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleRestore(list)}
                          >
                            <Undo2 className="size-4" />
                            กู้คืน
                          </Button>
                        }
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            <p>
              ทำงานในนาม <span className="font-medium text-foreground">{user.name}</span>
            </p>
            <div className="flex items-center gap-3">
              <span>รองรับ mobile และ desktop</span>
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
          </div>
        </div>
      </div>

      <FormDialog
        key={
          formDialog
            ? formDialog.mode === "edit"
              ? `edit-${formDialog.list.id}`
              : `create-${formDialog.initial.isTemplate ? "template" : "list"}`
            : "closed"
        }
        state={formDialog}
        open={formDialog !== null}
        pending={Boolean(busyAction)}
        onClose={() => setFormDialog(null)}
        onSubmit={submitForm}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ย้ายรายการไปถังขยะ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `รายการ "${deleteTarget.title}" จะถูกย้ายออกจาก active lists และยังสามารถกู้คืนได้จาก Trash`
                : "ยืนยันการลบรายการนี้"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={Boolean(busyAction)}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={Boolean(busyAction)}
            >
              {busyAction?.startsWith("delete-") ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              ยืนยันการลบ
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
