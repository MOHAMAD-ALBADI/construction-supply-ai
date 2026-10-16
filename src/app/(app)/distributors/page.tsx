import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/layout/section-placeholder";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("nav.distributors") };

export default function DistributorsPage() {
  return (
    <SectionPlaceholder
      titleKey="nav.distributors"
      descriptionKey="pages.distributors.description"
      itemKeys={["pages.distributors.item1", "pages.distributors.item2", "pages.distributors.item3", "pages.distributors.item4"]}
      stage="7"
    />
  );
}
