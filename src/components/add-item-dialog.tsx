'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTierStore } from '@/store/useTierStore';
import { TierItem } from '@/types';
import { ImagePlus, Type, X } from 'lucide-react';

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddItemDialog({ open, onClose }: AddItemDialogProps) {
  const addItemToPool = useTierStore((s) => s.addItemToPool);
  const [tab, setTab] = useState<'image' | 'text'>('image');
  const [textValue, setTextValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      const item: TierItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        name: file.name.replace(/\.[^.]+$/, ''),
        imageUrl: url,
      };
      addItemToPool(item);
    });
    onClose();
  };

  const handleTextAdd = () => {
    const name = textValue.trim();
    if (!name) return;
    const item: TierItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      name,
    };
    addItemToPool(item);
    setTextValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Items</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'image'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImagePlus className="w-4 h-4" /> Image
          </button>
          <button
            onClick={() => setTab('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'text'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Type className="w-4 h-4" /> Text
          </button>
        </div>

        {/* Image Tab */}
        {tab === 'image' && (
          <div>
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            >
              <ImagePlus className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click or drag &amp; drop images here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Multiple files supported
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}

        {/* Text Tab */}
        {tab === 'text' && (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextAdd()}
              placeholder="Enter item name…"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <Button onClick={handleTextAdd} disabled={!textValue.trim()}>
              Add Item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
