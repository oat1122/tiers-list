"use client";

import "sonner/dist/styles.css";
import { Toaster, type ToasterProps } from "sonner";
import { useTheme } from "@/components/theme-provider";

export function AppToaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme}
      position="top-right"
      richColors
      closeButton
      duration={2800}
      toastOptions={{
        classNames: {
          toast:
            "border border-border bg-background text-foreground shadow-lg",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-foreground",
        },
      }}
      {...props}
    />
  );
}
