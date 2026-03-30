"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FormDialogState, FormState } from "./dashboard-panel.types";
import { emptyFormState } from "./dashboard-panel.utils";

interface DashboardFormDialogProps {
  state: FormDialogState;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: FormState) => Promise<void>;
}

export function DashboardFormDialog({
  state,
  open,
  pending,
  onClose,
  onSubmit,
}: DashboardFormDialogProps) {
  const [values, setValues] = useState<FormState>(
    state?.initial ?? { ...emptyFormState },
  );

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
              ? "อัปเดตชื่อ คำอธิบาย และสถานะของรายการได้จากหน้าต่างนี้"
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
                setValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
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
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="อธิบายวัตถุประสงค์หรือแนวทางของ tier list นี้"
            />
          </div>
          <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label>แสดงเป็นสาธารณะ</Label>
                <p className="text-sm text-muted-foreground">
                  เปิดให้ผู้ใช้อื่นเห็นรายการนี้ผ่าน public API
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
                  ใช้เป็นต้นแบบให้โคลนไปใช้งานต่อได้
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
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
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
