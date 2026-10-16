import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/layout/section-placeholder";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("nav.logistics") };

export default function LogisticsPage() {
  return (
    <SectionPlaceholder
      titleKey="nav.logistics"
      descriptionKey="pages.logistics.description"
      itemKeys={["pages.logistics.item1", "pages.logistics.item2", "pages.logistics.item3", "pages.logistics.item4"]}
      stage="9–10"
    />
  );
}
