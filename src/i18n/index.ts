import { ar, type Dictionary } from "./ar";

type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type DictionaryKey = Leaves<Dictionary>;

type Params = Record<string, string | number>;

// Arabic is the only shipped locale in the MVP (AD-10); en.ts exists so a second locale
// can be added later without touching call sites.
export function t(key: DictionaryKey, params?: Params): string {
  const value = key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], ar);

  if (typeof value !== "string") {
    throw new Error(`Missing i18n key: ${key}`);
  }
  if (!params) return value;

  return value.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}
