"use client";

import { Direction } from "radix-ui";

// Radix primitives (menus, popovers, sliders…) read reading direction from context,
// not from the <html dir> attribute, so the whole app is wrapped once here.
export function DirectionProvider({ children }: { children: React.ReactNode }) {
  return <Direction.Provider dir="rtl">{children}</Direction.Provider>;
}
