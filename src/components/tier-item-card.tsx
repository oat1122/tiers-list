'use client';

import { Draggable } from '@hello-pangea/dnd';
import { X } from 'lucide-react';
import Image from 'next/image';
import { TierItem } from '@/types';
import { useTierStore } from '@/store/useTierStore';
import { cn } from '@/lib/utils';

interface TierItemCardProps {
  item: TierItem;
  index: number;
}

export function TierItemCard({ item, index }: TierItemCardProps) {
  const removeItem = useTierStore((s) => s.removeItem);

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'group relative shrink-0 w-16 h-16 rounded-md overflow-hidden',
            'border border-border select-none cursor-grab active:cursor-grabbing',
            'transition-shadow duration-150',
            snapshot.isDragging && 'shadow-2xl ring-2 ring-primary'
          )}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs font-medium text-center p-1 leading-tight">
              {item.name}
            </div>
          )}

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeItem(item.id);
            }}
            className={cn(
              'absolute top-0.5 right-0.5 rounded-full bg-black/70 text-white',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
              'w-4 h-4 flex items-center justify-center'
            )}
            aria-label={`Remove ${item.name}`}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </Draggable>
  );
}
