import { CircleDashed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t, type DictionaryKey } from "@/i18n";

type Props = {
  titleKey: DictionaryKey;
  descriptionKey: DictionaryKey;
  itemKeys: DictionaryKey[];
  stage: string;
};

// Honest placeholder for a platform area that a later roadmap stage will build (Doc 6).
export function SectionPlaceholder({ titleKey, descriptionKey, itemKeys, stage }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{t(titleKey)}</h1>
          <Badge variant="outline">{t("common.underConstruction")}</Badge>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{t(descriptionKey)}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("common.plannedContent")}</CardTitle>
          <CardDescription>{t("common.plannedStage", { stage })}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {itemKeys.map((key) => (
              <li key={key} className="flex items-start gap-3 rounded-md border border-dashed p-3 text-sm">
                <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                {t(key)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
