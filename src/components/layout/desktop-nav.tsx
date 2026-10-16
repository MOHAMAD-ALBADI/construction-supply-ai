"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";

// Client boundary for the persistent (lg+) sidebar; active-link state needs usePathname.
export function DesktopNav() {
  return <SidebarNav />;
}
