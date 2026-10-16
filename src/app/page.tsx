import { brand } from "@/config/brand";
import { t } from "@/i18n";

const AGENT_KEYS = [
  "needsInventory",
  "supplierDiscovery",
  "groupProcurement",
  "negotiation",
  "logistics",
  "projectIntelligence",
] as const;

// Placeholder home until Stage 4 adds auth and per-org-type redirects.
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-16 sm:px-6">
      <header className="flex flex-col gap-4">
        <span className="w-fit rounded-full border px-3 py-1 text-xs text-muted-foreground">
          {t("home.status")}
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("home.heading", { brand: brand.nameAr })}
        </h1>
        <p className="max-w-2xl text-base leading-8 text-muted-foreground">{t("home.intro")}</p>
      </header>

      <section aria-labelledby="agents-title" className="flex flex-col gap-4">
        <h2 id="agents-title" className="text-lg font-semibold">
          {t("home.agentsTitle")}
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_KEYS.map((key, index) => (
            <li key={key} className="flex items-center gap-3 rounded-lg border bg-card p-4 text-card-foreground">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <span className="text-sm font-medium">{t(`home.agents.${key}`)}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
