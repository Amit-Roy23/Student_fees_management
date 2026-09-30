import { describe, it, expect } from "vitest";
import { dictionaries } from "./dictionaries";

function getObjectKeysRecursive(obj: Record<string, any>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys = keys.concat(getObjectKeysRecursive(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("i18n Dictionaries Completeness", () => {
  const enKeys = getObjectKeysRecursive(dictionaries.en);
  const bnKeys = getObjectKeysRecursive(dictionaries.bn);
  const hiKeys = getObjectKeysRecursive(dictionaries.hi);

  it("Bengali dictionary must have every key present in English", () => {
    const missingInBn = enKeys.filter((k) => !bnKeys.includes(k));
    expect(missingInBn).toEqual([]);
  });

  it("Hindi dictionary must have every key present in English", () => {
    const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
    expect(missingInHi).toEqual([]);
  });

  it("All translations should have non-empty string values", () => {
    for (const key of enKeys) {
      const parts = key.split(".");
      const getVal = (dict: any) => parts.reduce((acc, part) => acc?.[part], dict);

      expect(typeof getVal(dictionaries.en)).toBe("string");
      expect(getVal(dictionaries.en).length).toBeGreaterThan(0);

      expect(typeof getVal(dictionaries.bn)).toBe("string");
      expect(getVal(dictionaries.bn).length).toBeGreaterThan(0);

      expect(typeof getVal(dictionaries.hi)).toBe("string");
      expect(getVal(dictionaries.hi).length).toBeGreaterThan(0);
    }
  });
});
