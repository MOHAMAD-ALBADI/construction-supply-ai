import { Construction } from "lucide-react";
import Link from "next/link";

import { brand } from "@/config/brand";

export function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Construction className="size-4" aria-hidden />
      </span>
      <span className="text-sm font-bold leading-tight">{brand.nameAr}</span>
    </Link>
  );
}
