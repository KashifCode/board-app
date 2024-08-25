import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { Camera, Color } from "@/types/canvas";

const COLORS = [
  "#DC2626",
  "#D97706",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#10B981",
  "#F87171",
  "#FBBF24",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
  "#34D399",
]

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function connectionIdToColor (connectionId: number): string {
  return COLORS[connectionId % COLORS.length];
}

export function pointerEventToCanvasPoint(
  e: React.PointerEvent,
  camera: Camera,
) {
  return {
    x: Math.round(e.clientX) - camera.x,
    y: Math.round(e.clientY) - camera.y,
  };
};

export function colorToCss(color: Color) {
  return `#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
}