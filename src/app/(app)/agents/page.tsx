import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/layout/section-placeholder";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t("nav.agents") };

export default function AgentsPage() {
  return (
    <SectionPlaceholder
      titleKey="nav.agents"
      descriptionKey="pages.agents.description"
      itemKeys={["pages.agents.item1", "pages.agents.item2", "pages.agents.item3", "pages.agents.item4"]}
      stage="5"
    />
  );
}
