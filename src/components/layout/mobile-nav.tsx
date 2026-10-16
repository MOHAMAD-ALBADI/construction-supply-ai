"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { t } from "@/i18n";

// Below the lg breakpoint the sidebar becomes a drawer. side="right" is the start side in RTL.
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("shell.openMenu")}>
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" showCloseButton={false} className="w-72 gap-0 bg-sidebar p-0">
        <SheetHeader className="flex-row items-center justify-between border-b p-4">
          <SheetTitle className="sr-only">{t("shell.mainNav")}</SheetTitle>
          <SheetDescription className="sr-only">{t("shell.menuDescription")}</SheetDescription>
          <BrandMark />
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t("shell.closeMenu")}>
              <X />
            </Button>
          </SheetClose>
        </SheetHeader>
        <div className="overflow-y-auto p-3">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
