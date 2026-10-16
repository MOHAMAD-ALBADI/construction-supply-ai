import { describe, expect, it } from "vitest";

import { ar } from "./ar";
import { t, type DictionaryKey } from "./index";

describe("t", () => {
  it("returns the Arabic string for a key", () => {
    expect(t("common.simulated")).toBe("محاكاة");
  });

  it("interpolates named params and leaves unknown placeholders intact", () => {
    expect(t("home.heading", { brand: "اسم تجريبي" })).toBe("اسم تجريبي");
    expect(t("home.heading")).toBe("{brand}");
  });

  it("throws on a key that is not a string leaf", () => {
    expect(() => t("home.agents" as DictionaryKey)).toThrow("Missing i18n key");
  });
});

describe("ar dictionary", () => {
  it("has no empty strings", () => {
    const leaves: string[] = [];
    const walk = (node: unknown) => {
      if (typeof node === "string") leaves.push(node);
      else if (node && typeof node === "object") Object.values(node).forEach(walk);
    };
    walk(ar);

    expect(leaves.length).toBeGreaterThan(0);
    expect(leaves.filter((value) => value.trim() === "")).toEqual([]);
  });
});
