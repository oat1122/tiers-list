import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-foreground",
        secondary: "border-border bg-background text-muted-foreground",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
