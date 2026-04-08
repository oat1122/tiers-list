"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestSignOut } from "@/lib/request-sign-out";

export function SignOutButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);

    try {
      await requestSignOut();
      window.location.assign("/sign-in");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ออกจากระบบไม่สำเร็จ";
      toast.error(message);
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => void handleSignOut()}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
      ออกจากระบบ
    </Button>
  );
}
