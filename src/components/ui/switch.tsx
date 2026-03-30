"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-6 w-11 items-center rounded-full border border-transparent bg-input p-0.5 shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-background shadow-sm transition-transform data-[checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
