import type { Dictionary } from "./ar";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]> };

// Optional English copy (S10). Not wired into the UI in the MVP.
export const en: DeepPartial<Dictionary> = {
  common: {
    syntheticDataBanner: "Synthetic data — all organisations, prices and quantities are fictional demo values",
    simulated: "Simulated",
    vatNotice: "Prices exclude VAT (not calculated)",
  },
};
