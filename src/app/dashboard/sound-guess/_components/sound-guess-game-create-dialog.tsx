"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";

const CreateSoundGuessGameFormSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อเกม"),
  description: z.string().default(""),
});

export type CreateSoundGuessGameFormValues = z.input<
  typeof CreateSoundGuessGameFormSchema
>;

interface SoundGuessGameCreateDialogProps {
  open: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: CreateSoundGuessGameFormValues) => Promise<void>;
}

const defaultValues: CreateSoundGuessGameFormValues = {
  title: "",
  description: "",
};

export function SoundGuessGameCreateDialog({
  open,
  pending,
  error,
  onClose,
  onSubmit,
}: SoundGuessGameCreateDialogProps) {
  const form = useForm<CreateSoundGuessGameFormValues>({
    resolver: zodResolver(CreateSoundGuessGameFormSchema),
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
          <DialogTitle>สร้างเกม Sound Guess</DialogTitle>
          <DialogDescription>
            สร้างเป็น draft ก่อน แล้วค่อยเพิ่มเสียง คำตอบ และ publish ในหน้าแก้ไข
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5 px-6 py-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="sound-guess-title">ชื่อเกม</Label>
            <Input id="sound-guess-title" {...form.register("title")} />
            <p className="text-sm text-destructive">
              {form.formState.errors.title?.message ?? ""}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sound-guess-description">คำอธิบาย</Label>
            <Textarea
              id="sound-guess-description"
              {...form.register("description")}
            />
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

