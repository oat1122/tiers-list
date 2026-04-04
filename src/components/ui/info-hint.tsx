"use client";

import { CircleHelp } from "lucide-react";

import { cn } from "@/lib/utils";

function InfoHint({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "group/info-hint relative inline-flex items-center",
        className,
      )}
    >
      <button
        type="button"
        aria-label={label}
        className="peer inline-flex items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
      >
        <CircleHelp className="size-4" />
      </button>
      <span className="pointer-events-none absolute top-full left-0 z-50 mt-2 hidden w-64 rounded-xl border border-border bg-popover px-3 py-2 text-xs leading-5 text-popover-foreground shadow-xl group-hover/info-hint:block peer-focus-visible:block">
        {children}
      </span>
    </span>
  );
}

export { InfoHint };
