import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { NAV_GROUPS, isActivePath } from "./navigation";

describe("NAV_GROUPS", () => {
  const items = NAV_GROUPS.flatMap((group) => group.items);

  it("links only to routes that have a page", () => {
    const missing = items
      .map((item) => item.href)
      .filter((href) => !existsSync(join(process.cwd(), "src", "app", "(app)", href, "page.tsx")));

    expect(missing).toEqual([]);
  });

  it("has unique hrefs", () => {
    const hrefs = items.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("isActivePath", () => {
  it("matches the route itself and nested routes, not prefixes of other words", () => {
    expect(isActivePath("/procurement", "/procurement")).toBe(true);
    expect(isActivePath("/procurement/groups", "/procurement")).toBe(true);
    expect(isActivePath("/procurementx", "/procurement")).toBe(false);
  });
});
