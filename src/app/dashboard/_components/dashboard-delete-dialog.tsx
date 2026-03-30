"use client";

import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { AdminTierListSummaryDto } from "@/types/admin-dashboard";

interface DashboardDeleteDialogProps {
  target: AdminTierListSummaryDto | null;
  busyAction: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DashboardDeleteDialog({
  target,
  busyAction,
  onClose,
  onConfirm,
}: DashboardDeleteDialogProps) {
  return (
    <AlertDialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ย้ายรายการไปถังขยะ?</AlertDialogTitle>
          <AlertDialogDescription>
            {target
              ? `รายการ "${target.title}" จะถูกย้ายออกจากรายการที่ใช้งานอยู่ และยังสามารถกู้คืนได้จากถังขยะ`
              : "ยืนยันการลบรายการนี้"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={Boolean(busyAction)}
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onConfirm()}
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
  );
}
