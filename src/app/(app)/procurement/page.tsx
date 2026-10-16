import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/layout/section-placeholder";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("nav.procurement") };

export default function ProcurementPage() {
  return (
    <SectionPlaceholder
      titleKey="nav.procurement"
      descriptionKey="pages.procurement.description"
      itemKeys={["pages.procurement.item1", "pages.procurement.item2", "pages.procurement.item3", "pages.procurement.item4"]}
      stage="7–9"
    />
  );
}
