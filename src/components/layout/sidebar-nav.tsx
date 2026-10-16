// Not a "use client" entry itself: it is rendered only inside client boundaries
// (DesktopNav, MobileNav), so it may take the onNavigate callback.
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_GROUPS, isActivePath } from "@/config/navigation";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label={t("shell.mainNav")} className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-medium text-muted-foreground">{t(group.labelKey)}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ href, labelKey, icon: Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-ring",
                      active && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {t(labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
