import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/layout/section-placeholder";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("nav.contractors") };

export default function ContractorsPage() {
  return (
    <SectionPlaceholder
      titleKey="nav.contractors"
      descriptionKey="pages.contractors.description"
      itemKeys={["pages.contractors.item1", "pages.contractors.item2", "pages.contractors.item3", "pages.contractors.item4"]}
      stage="6"
    />
  );
}
