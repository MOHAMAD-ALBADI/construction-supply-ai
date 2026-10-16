import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/layout/section-placeholder";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("nav.factories") };

export default function FactoriesPage() {
  return (
    <SectionPlaceholder
      titleKey="nav.factories"
      descriptionKey="pages.factories.description"
      itemKeys={["pages.factories.item1", "pages.factories.item2", "pages.factories.item3", "pages.factories.item4"]}
      stage="7"
    />
  );
}
