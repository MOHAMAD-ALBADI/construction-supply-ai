import { CircleUserRound } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Badge } from "@/components/ui/badge";
import { brand } from "@/config/brand";
import { t } from "@/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-e bg-sidebar lg:flex">
        <div className="border-b p-4">
          <BrandMark />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <DesktopNav />
        </div>
        <p className="border-t p-4 text-xs leading-6 text-muted-foreground">{brand.taglineAr}</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <MobileNav />
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <div className="ms-auto flex items-center gap-3">
            <Badge variant="secondary">{t("shell.prototype")}</Badge>
            <span
              className="flex items-center gap-2 text-sm text-muted-foreground"
              title={t("shell.accountPending")}
            >
              <CircleUserRound className="size-5" aria-hidden />
              <span className="hidden sm:inline">{t("shell.account")}</span>
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
