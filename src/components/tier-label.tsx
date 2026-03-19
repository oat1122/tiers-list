"use client";


interface TierLabelProps {
  tierId: string;
  label: string;
  color: string;
}

export function TierLabel({ label, color }: TierLabelProps) {
  const getFontClass = (text: string) => {
    if (text.length <= 3) return "text-lg";
    if (text.length <= 6) return "text-sm";
    return "text-xs";
  };

  return (
    <div className="relative shrink-0 w-20 flex items-center">
      <div
        className={`w-full min-h-[4rem] py-2 flex items-center justify-center rounded-sm font-bold select-none text-center px-1 leading-tight break-all ${getFontClass(label)}`}
        style={{ backgroundColor: color, color: getContrastColor(color) }}
      >
        {label}
      </div>
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
