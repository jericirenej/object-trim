import type { ObjectFilterArgs, ValidTypes } from "../index";
import { earlyReturnChecks, filterByRegex, formatFilters } from "../utils";

const targetObject = { first: "first", second: "second" };
const filters = ["first"];
const regexFilters = [/fIrSt/i, "second"];
const filterType = "exclude";
const exampleArgs: Omit<ObjectFilterArgs, "recursive"> = {
  targetObject,
  filters,
  regexFilters,
  filterType,
};

describe("earlyReturnChecks", () => {
  it("Should return true if empty object is provided or if targetObject is undefined", () => {
    ([{}, undefined] as any[]).forEach(targetObject =>
      expect(earlyReturnChecks({ ...exampleArgs, targetObject })).toBe(true)
    );
  });
  it("Should return false with non-empty object, filters, and filterType", () => {
    expect(earlyReturnChecks(exampleArgs)).toBe(false);
  });
  it("Undefined filter type should not cause it to return true", () => {
    expect(earlyReturnChecks({ ...exampleArgs, filterType: undefined })).toBe(
      false
    );
  });
  it("Should return true, if filterType is invalid", () => {
    expect(
      earlyReturnChecks({ ...exampleArgs, filterType: "invalid" as ValidTypes })
    ).toBe(true);
  });
  it("Should return false, if at least one of the filterTypes is valid", () => {
    (["filters", "regexFilters"] as const).forEach(filterType =>
      expect(
        earlyReturnChecks({ ...exampleArgs, [filterType]: undefined })
      ).toBe(false)
    );
  });
  it("Should return true, if both filter groups are invalid", () => {
    expect(
      earlyReturnChecks({
        ...exampleArgs,
        regexFilters: undefined,
        filters: undefined,
      })
    ).toBe(true);
  });
  it("Should return true, if both filter groups do not contain any valid filter types", () => {
    const [invalidFilters, invalidRegex] = [
      [1, /regex/, new Set([1, 2, 3]), null] as any,
      [1, { prop: "prop" }, null] as any,
    ];
    expect(
      earlyReturnChecks({
        ...exampleArgs,
        filters: invalidFilters,
        regexFilters: invalidRegex,
      })
    ).toBe(true);
  });
});

describe.only("formatFilters", () => {
  it("Should return a properly formed response", () => {
    const variants = [
      {
        filters: "one",
        regexFilters: undefined,
        expected: { filterKeys: ["one"], regexKeys: [] },
      },
      {
        filters: undefined,
        regexFilters: "two",
        expected: { filterKeys: [], regexKeys: [/two/] },
      },
      {
        filters: ["one", "two"],
        regexFilters: ["three", /four/gi],
        expected: {
          filterKeys: ["one", "two"],
          regexKeys: [/three/, /four/gi],
        },
      },
    ];
    variants.forEach(variant => {
      const { expected, filters, regexFilters } = variant;
      expect(formatFilters(filters, regexFilters)).toStrictEqual(expected);
    });
  });
  it("Should exclude those filterKeys that are already matched by regexKey", () => {
    const config = {
      filters: ["first", "second", "third"],
      regexFilters: [/ir/],
      expected: { filterKeys: ["second"], regexKeys: [/ir/] },
    };
  });
});

describe("filterByRegex", () => {
  it("Should return a list of keys that match the supplied regex keys", () => {
    const formattedRegex = [/fIrSt/iu, /second/u, /č.*ž/u];
    const targetKeys = [
      "first",
      "firST",
      "second",
      "theSecond",
      "thesecond",
      "third",
      "ačpž",
    ];
    const expected = ["first", "firST", "second", "thesecond", "ačpž"];
    expect(filterByRegex(targetKeys, formattedRegex)).toEqual(expected);
  });
});
