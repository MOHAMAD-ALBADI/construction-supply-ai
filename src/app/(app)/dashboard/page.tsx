import { Bot } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NAV_GROUPS } from "@/config/navigation";
import { t, type DictionaryKey } from "@/i18n";

export const metadata: Metadata = { title: t("nav.dashboard") };

const KPI_KEYS: DictionaryKey[] = [
  "pages.dashboard.kpis.openDemands",
  "pages.dashboard.kpis.activeGroups",
  "pages.dashboard.kpis.pendingApprovals",
  "pages.dashboard.kpis.agentRuns",
];

const AGENT_KEYS: DictionaryKey[] = [
  "agents.needsInventory",
  "agents.supplierDiscovery",
  "agents.groupProcurement",
  "agents.negotiation",
  "agents.logistics",
  "agents.projectIntelligence",
];

// Placeholder: real figures come from DB queries in Stage 11 (Doc 4 M18). No invented numbers.
export default function DashboardPage() {
  const sections = NAV_GROUPS.flatMap((group) => group.items).filter((item) => item.href !== "/dashboard");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{t("pages.dashboard.description")}</p>
      </header>

      <section aria-label={t("nav.dashboard")} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_KEYS.map((key) => (
          <Card key={key} size="sm">
            <CardHeader>
              <CardDescription>{t(key)}</CardDescription>
              <p className="text-3xl font-semibold text-muted-foreground">{t("common.notConnected")}</p>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{t("pages.dashboard.kpiNote")}</CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t("pages.dashboard.agentsTitle")}</CardTitle>
            <CardDescription>{t("pages.dashboard.agentsNote")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-2 sm:grid-cols-2">
              {AGENT_KEYS.map((key, index) => (
                <li key={key} className="flex items-center gap-3 rounded-md border p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{t(key)}</span>
                    <span className="text-xs text-muted-foreground">{t("agents.notActive")}</span>
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("pages.dashboard.sectionsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1">
              {sections.map(({ href, labelKey, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="flex-1">{t(labelKey)}</span>
                    {href === "/agents" && (
                      <Badge variant="outline">
                        <Bot aria-hidden />6
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
