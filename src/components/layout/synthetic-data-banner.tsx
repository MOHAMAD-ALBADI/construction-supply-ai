import { publicEnv } from "@/env";
import { t } from "@/i18n";

// Shown on every page in demo mode so no viewer mistakes demo records for real ones (Doc 7 §1.8).
export function SyntheticDataBanner() {
  if (!publicEnv.NEXT_PUBLIC_DEMO_MODE) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
    >
      {t("common.syntheticDataBanner")}
    </div>
  );
}
