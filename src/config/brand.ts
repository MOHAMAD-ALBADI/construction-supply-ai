import { publicEnv } from "@/env";

// The commercial brand is not final (Doc 1). Every visible product name comes from here,
// so a rename is an env change (NEXT_PUBLIC_BRAND_NAME_*) or a one-line edit — never a refactor.
export const brand = {
  nameAr: publicEnv.NEXT_PUBLIC_BRAND_NAME_AR ?? "منصة توريد البناء",
  nameEn: publicEnv.NEXT_PUBLIC_BRAND_NAME_EN ?? "Construction Supply Platform",
  taglineAr: "تنسيق ذكي لتوريد مواد البناء من المصنع إلى الموقع",
} as const;
