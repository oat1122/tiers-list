"use client";

import { useRef, useState } from "react";
import { useTierStore } from "@/store/useTierStore";

const PRESET_COLORS = [
  "#ff7f7f",
  "#ffbf7f",
  "#ffdf7f",
  "#ffff7f",
  "#bfff7f",
  "#7fff7f",
  "#7fffff",
  "#7fbfff",
  "#7f7fff",
  "#ff7fff",
  "#ffffff",
  "#d0d0d0",
  "#a0a0a0",
  "#606060",
  "#303030",
];

interface TierLabelProps {
  tierId: string;
  label: string;
  color: string;
}

export function TierLabel({ tierId, label, color }: TierLabelProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState(false);
  const renameTier = useTierStore((s) => s.renameTier);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFontClass = (text: string) => {
    if (text.length <= 3) return "text-lg";
    if (text.length <= 6) return "text-sm";
    return "text-xs";
  };

  const handleDoubleClick = () => {
    setEditValue(label);
    setEditError(false);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  return (
    <div className="relative shrink-0 w-20 flex items-center">
      {/* Label box */}
      <div
        className={`w-full min-h-[4rem] py-2 flex items-center justify-center rounded-sm cursor-pointer font-bold select-none text-center px-1 leading-tight break-all ${getFontClass(label)}`}
        style={{ backgroundColor: color, color: getContrastColor(color) }}
        onDoubleClick={handleDoubleClick}
        title="Double-click to rename"
      >
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              if (e.target.value) setEditError(false);
            }}
            onBlur={() => {
              const val = editValue.trim();
              if (val) renameTier(tierId, val);
              setEditing(false);
              setEditError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = editValue.trim();
                if (!val) {
                  setEditError(true);
                  return;
                }
                renameTier(tierId, val);
                setEditing(false);
                setEditError(false);
              }
              if (e.key === "Escape") {
                setEditing(false);
                setEditError(false);
              }
            }}
            className={`w-full text-center bg-transparent outline-none font-bold ${getFontClass(editValue)} ${
              editError ? "ring-1 ring-red-500 rounded" : ""
            }`}
            style={{ color: getContrastColor(color) }}
          />
        ) : (
          label
        )}
      </div>
      {editError && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
          ใส่อย่างน้อย 1 ตัวอักษร
        </div>
      )}
    </div>
  );
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
