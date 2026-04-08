"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { pictureRevealSessionModes } from "@/types/picture-reveal";

const CreatePictureRevealGameFormSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อเกม"),
  description: z.string().default(""),
  mode: z.enum(pictureRevealSessionModes),
  startScore: z.coerce.number().int().min(1),
  openTilePenalty: z.coerce.number().int().min(0),
  specialTilePenalty: z.coerce.number().int().min(0),
});

export type CreatePictureRevealGameFormValues = z.input<
  typeof CreatePictureRevealGameFormSchema
>;

interface PictureRevealGameCreateDialogProps {
  open: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: CreatePictureRevealGameFormValues) => Promise<void>;
}

const defaultValues: CreatePictureRevealGameFormValues = {
  title: "",
  description: "",
  mode: "single",
  startScore: 1000,
  openTilePenalty: 50,
  specialTilePenalty: 200,
};

export function PictureRevealGameCreateDialog({
  open,
  pending,
  error,
  onClose,
  onSubmit,
}: PictureRevealGameCreateDialogProps) {
  const form = useForm<CreatePictureRevealGameFormValues>({
    resolver: zodResolver(CreatePictureRevealGameFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>สร้างเกม Picture Reveal</DialogTitle>
          <DialogDescription>
            สร้างเป็น draft ก่อน แล้วค่อยไปตั้งค่า content และ publish ในหน้าแก้ไข
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5 px-6 py-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="picture-reveal-title">ชื่อเกม</Label>
            <Input id="picture-reveal-title" {...form.register("title")} />
            <p className="text-sm text-destructive">
              {form.formState.errors.title?.message ?? ""}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="picture-reveal-description">คำอธิบาย</Label>
            <Textarea
              id="picture-reveal-description"
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="picture-reveal-mode">โหมดเกม</Label>
            <Controller
              control={form.control}
              name="mode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="picture-reveal-mode">
                    <SelectValue placeholder="เลือกโหมดเกม" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">แบบข้อเดียว (Single)</SelectItem>
                    <SelectItem value="marathon">แบบต่อเนื่อง (Marathon)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start-score">คะแนนเริ่มต้น</Label>
              <Input
                id="start-score"
                type="number"
                {...form.register("startScore", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="open-penalty">หักต่อการเปิด</Label>
              <Input
                id="open-penalty"
                type="number"
                {...form.register("openTilePenalty", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="special-penalty">หักเพิ่มเมื่อเจอพิเศษ</Label>
              <Input
                id="special-penalty"
                type="number"
                {...form.register("specialTilePenalty", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <DialogFooter className="px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              สร้าง draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
