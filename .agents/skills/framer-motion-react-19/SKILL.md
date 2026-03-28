name: framer-motion-react-19
description: |
  Strict guidelines for implementing Framer Motion (v12) and @hello-pangea/dnd (v18) in Next.js 16 / React 19.
  Prevents SSR hydration mismatches, enforces strict Client Component usage, and optimizes animation performance.
user-invocable: true


# Framer Motion & Drag-and-Drop (React 19 / Next.js 16)

**Framework**: Next.js 16 (App Router)
**Animation**: Framer Motion (v12.x)
**Drag & Drop**: @hello-pangea/dnd (v18.x)



## 1. ⚠️ CRITICAL: Client Component Enforcement

Both `framer-motion` (`<motion.div>`, `AnimatePresence`) and `@hello-pangea/dnd` (`<DragDropContext>`, `<Droppable>`, `<Draggable>`) rely heavily on browser APIs (window, document, React Context).

* **Strict Rule**: Any file importing from `framer-motion` or `@hello-pangea/dnd` MUST have `"use client";` at the very top.
* **Component Isolation**: Do not place `<DragDropContext>` at the root `layout.tsx` of the application. Isolate it within the specific feature component (e.g., `TierListBoard.tsx`).


## 2. Preventing SSR Hydration Mismatches

`@hello-pangea/dnd` often throws Hydration Errors in Next.js because the server-rendered HTML does not match the client-rendered HTML once the drag context initializes. 

You MUST implement a "mounted" state check before rendering the DragDropContext.

**Mandatory Pattern for DnD Wrapper**:
```tsx
"use client";

import { useEffect, useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

export function DnDBoard({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    // Handle state update via Zustand or Server Actions here
  };

  if (!isMounted) {
    return null; // or a loading skeleton with the exact same dimensions
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  );
}
```


## 3. Combining Framer Motion with DnD

When using Framer Motion to animate the appearance/disappearance of items inside a droppable area, be careful not to conflict with `@hello-pangea/dnd`'s inline transforms.

* **Layout Animations**: Use `<motion.div layout>` for smooth reordering of items *outside* of the drag context (e.g., when moving an item from a pool to a tier via a button click).
* **Inner Draggable Wrapper**: Apply Framer Motion effects to the *child* of the `<Draggable>` provided component, NOT the Draggable node itself, to avoid overriding the drag transform matrix.

**Correct Usage**:
```tsx
<Draggable draggableId={item.id} index={index}>
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      // Apply Tailwind classes dynamically based on drag state
      className={cn("p-2", snapshot.isDragging && "opacity-80 z-50")}
    >
      {/* Apply Framer Motion to the INNER content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {item.content}
      </motion.div>
    </div>
  )}
</Draggable>
```

## 4. Performance & Hardware Acceleration

* **Animate Transforms, Not Layouts**: When defining custom animations, strictly animate `transform` properties (`x`, `y`, `scale`, `rotate`) and `opacity`. 
* **Avoid CSS Layout Triggers**: NEVER animate `width`, `height`, `top`, `left`, or `margin` using Framer Motion as it triggers expensive browser repaints.
* **will-change**: For heavily animated tier list items, use Framer Motion's `style={{ willChange: "transform" }}` sparingly on complex nodes.
