import type { ObjectFilterArgs, ValidTypes } from "../index";
import * as utils from "../utils";
const {
  earlyReturnChecks,
  filterByRegex,
  formatFilters,
  isValidValue,
  determineTargetValue,
} = utils;

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

describe("formatFilters", () => {
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
      {
        // Only filterKeys that are not already matched by regexKeys are returned.
        filters: ["meal", "deal", "steal"],
        regexFilters: [/^.ea.$/],
        expected: {
          filterKeys: ["steal"],
          regexKeys: [/^.ea.$/],
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

describe("isValidValue", () => {
  const primitives = [
    null,
    undefined,
    "string",
    25,
    true,
    BigInt(150),
    Symbol("symbol"),
  ];
  const arr = [1, "2", true];
  const excludedTypes = [arr, new Date(2022)];
  it("Should return true for primitives and excluded types", () => {
    [...primitives, ...excludedTypes].forEach(val =>
      expect(isValidValue(val)).toBe(true)
    );
  });
  it("Should return false for objects", () => {
    expect(isValidValue({ prop1: "prop1", prop2: "prop2" })).toBe(false);
  });
});

describe("determineTargetValue", () => {
  const expected = { prop1: "prop1" };
  const spyOnIsValid = jest.spyOn(utils, "isValidValue");
  beforeEach(() => spyOnIsValid.mockReset());
  it("Should always return targetValue for inclusive filtering", () => {
    spyOnIsValid.mockReturnValueOnce(false).mockReturnValueOnce(false);
    expect(determineTargetValue(expected, "include", false)).toEqual(expected);
    expect(determineTargetValue(expected, "include", true)).toEqual(expected);
  });
  it("Should always return targetValue for exclude and non-recursive filterings", () => {
    spyOnIsValid.mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(determineTargetValue(expected, "include", false)).toEqual(expected);
    expect(determineTargetValue(expected, "include", false)).toEqual(expected);
  });
  it("Should return targetValue for exclude recursive filterings, if value is valid", () => {
    spyOnIsValid.mockReturnValueOnce(true);
    expect(determineTargetValue(expected, "exclude", true)).toEqual(expected);
  });
  it("Should return empty object for recursive exclude filterings, if value is not valid", () => {
    spyOnIsValid.mockReturnValueOnce(false);
    expect(determineTargetValue(expected, "exclude", true)).toEqual({});
  });
});
