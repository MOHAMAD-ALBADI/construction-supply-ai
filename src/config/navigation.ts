import {
  Bot,
  Factory,
  HardHat,
  LayoutDashboard,
  ShoppingCart,
  Store,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import type { DictionaryKey } from "@/i18n";

export type NavItem = { href: string; labelKey: DictionaryKey; icon: LucideIcon };
export type NavGroup = { labelKey: DictionaryKey; items: NavItem[] };

// Platform areas and routes (Doc 2 §3.1, AD-12). Role-based filtering arrives with auth in Stage 4.
export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.groups.overview",
    items: [{ href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard }],
  },
  {
    labelKey: "nav.groups.supplyChain",
    items: [
      { href: "/factories", labelKey: "nav.factories", icon: Factory },
      { href: "/distributors", labelKey: "nav.distributors", icon: Warehouse },
      { href: "/retailers", labelKey: "nav.retailers", icon: Store },
      { href: "/contractors", labelKey: "nav.contractors", icon: HardHat },
    ],
  },
  {
    labelKey: "nav.groups.operations",
    items: [
      { href: "/procurement", labelKey: "nav.procurement", icon: ShoppingCart },
      { href: "/logistics", labelKey: "nav.logistics", icon: Truck },
    ],
  },
  {
    labelKey: "nav.groups.intelligence",
    items: [{ href: "/agents", labelKey: "nav.agents", icon: Bot }],
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
