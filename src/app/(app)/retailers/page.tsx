import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/layout/section-placeholder";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("nav.retailers") };

export default function RetailersPage() {
  return (
    <SectionPlaceholder
      titleKey="nav.retailers"
      descriptionKey="pages.retailers.description"
      itemKeys={["pages.retailers.item1", "pages.retailers.item2", "pages.retailers.item3", "pages.retailers.item4"]}
      stage="5"
    />
  );
}
