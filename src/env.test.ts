import { describe, expect, it } from "vitest";

import { publicEnv } from "./env";

describe("publicEnv", () => {
  it("only exposes NEXT_PUBLIC_ variables and never a secret", () => {
    const keys = Object.keys(publicEnv);

    expect(keys.every((key) => key.startsWith("NEXT_PUBLIC_"))).toBe(true);
    expect(keys.filter((key) => /SECRET|OPENAI|SERVICE_ROLE|PASSWORD/.test(key))).toEqual([]);
  });
});
