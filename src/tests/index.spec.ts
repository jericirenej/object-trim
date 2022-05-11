import objectFilter, { ObjectFilterArgs, type ValidTypes } from "../index";
import * as utils from "../utils";

const spyOnEarlyReturn = jest.spyOn(utils, "earlyReturnChecks"),
  spyOnFilterByRegex = jest.spyOn(utils, "filterByRegex"),
  spyOnFormatFilters = jest.spyOn(utils, "formatFilters");

const targetObject: Record<string, any> = {};
const objKeys = ["one", "two", "three", "four"];
objKeys.forEach(key => (targetObject[key] = key));

describe("objectFilter", () => {
  beforeEach(() => jest.clearAllMocks());
  describe("Early return checks and formatFilters call", () => {
    it("Should call earlyReturnChecks", () => {
      objectFilter({ targetObject });
      expect(spyOnEarlyReturn).toHaveBeenCalledTimes(1);
    });
    it("Should return original object if, earlyReturnChecks returns true", () => {
      spyOnEarlyReturn.mockReturnValueOnce(true);
      const filteredObj = objectFilter({
        targetObject,
        filters: "one",
        filterType: "include",
      });
      expect(filteredObj).toStrictEqual(targetObject);
    });
    it("Should call formatFilters with appropriate arguments", () => {
      const [filters, regexFilters] = [
        ["one", "two"],
        [/one/i, /two/i],
      ];
      objectFilter({ targetObject, filters, regexFilters });
      expect(spyOnFormatFilters).toHaveBeenCalledWith(filters, regexFilters);
    });
  });
  describe("Regular filters", () => {
    beforeEach(() => jest.clearAllMocks());
    it("Include filterType should return object with filter keys only", () => {
      const filters = ["one", "two"];
      const filteredObj = objectFilter({
        targetObject,
        filters,
        filterType: "include",
      });
      const keys = Object.keys(filteredObj);
      expect(keys.length).toBe(filters.length);
      expect(keys).toStrictEqual(filters);
    });
    it("Exclude filterType should return object without filter keys", () => {
      const filters = ["one"];
      const expectedLength = objKeys.length - filters.length;
      const filteredObj = objectFilter({
        targetObject,
        filters,
        filterType: "exclude",
      });
      const keys = Object.keys(filteredObj);
      expect(keys.length).toBe(expectedLength);
      filters.forEach(key => expect(keys.includes(key)).toBe(false));
    });
    it("Should properly parse a string filters argument", () => {
      const filters = "one";
      const expectedLength = objKeys.length - 1;
      const filteredObj = objectFilter({
        targetObject,
        filters,
        filterType: "exclude",
      });
      expect(Object.keys(filteredObj).length).toBe(expectedLength);
    });
    it("Should default to 'exclude' type, if filterType is not passed", () => {
      const filteredObj = objectFilter({
        targetObject,
        filters: "one",
      });
      expect(Object.keys(filteredObj).length).toBe(objKeys.length - 1);
    });
    it("Should return original object, if an invalid filterType is passed", () => {
      const filteredObj = objectFilter({
        targetObject,
        filters: "one",
        filterType: "invalidType" as ValidTypes,
      });
      expect(filteredObj).toStrictEqual(targetObject);
    });
  });
  describe("Regex filtering", () => {
    beforeEach(() => jest.clearAllMocks());
    it("Should only call filterByRegex, if regexFilters have been supplied", () => {
      objectFilter({ targetObject, filters: "one", regexFilters: undefined });
      objectFilter({ targetObject, filters: "one", regexFilters: "one" });
      expect(spyOnFilterByRegex).toHaveBeenCalledTimes(1);
    });
    it("Should call filterByRegex with appropriate arguments", () => {
      objectFilter({ targetObject, regexFilters: "two" });
      expect(spyOnFilterByRegex).toHaveBeenLastCalledWith(objKeys, [/two/]);
      objectFilter({ targetObject, regexFilters: [/one/i, "two"] });
      expect(spyOnFilterByRegex).toHaveBeenLastCalledWith(objKeys, [
        /one/i,
        /two/,
      ]);
    });
    it("filterRegex should be passed keys that are left after regular filter check", () => {
      objectFilter({ targetObject, filters: "one", regexFilters: "two" });
      expect(spyOnFilterByRegex.mock.calls.flat()[0]).not.toContain("one");
    });
    it("Should return properly filtered object", () => {
      const targetObject = {
        one: "one",
        tWo: "tWo",
        anotherProperty: "anotherProperty",
      };
      const exampleArgs: ObjectFilterArgs = {
        targetObject,
        regexFilters: [/one/i, /two/i],
        filterType: "exclude",
      };
      const [keysExclude, keysInclude] = [
        Object.keys(objectFilter(exampleArgs)),
        Object.keys(objectFilter({ ...exampleArgs, filterType: "include" })),
      ];

      expect(keysExclude).toStrictEqual(["anotherProperty"]);
      expect(keysInclude).toStrictEqual(["one", "tWo"]);
    });
  });
  describe("Both filter groups should play nice with each other", () => {
    const targetObject = {
      one: "one",
      tWo: "tWo",
      anotherProperty: "anotherProperty",
    };
    const [filters, regexFilters] = ["one", /two/i];
    const exampleArgs: ObjectFilterArgs = {
      targetObject,
      filters,
      regexFilters,
    };
    const [expectedExclude, expectedInclude] = [
      ["anotherProperty"],
      ["one", "tWo"],
    ];
    beforeEach(() => jest.clearAllMocks());
    it("When both filter groups are supplied, both should be applied", () => {
      const [keysExclude, keysInclude] = [
        Object.keys(objectFilter({ ...exampleArgs, filterType: "exclude" })),
        Object.keys(objectFilter({ ...exampleArgs, filterType: "include" })),
      ];
      expect(keysExclude).toStrictEqual(expectedExclude);
      expect(keysInclude).toStrictEqual(expectedInclude);
    });
    const [keysExclude, keysInclude] = [
      Object.keys(
        objectFilter({
          targetObject,
          filters: [filters, "invalidFilter"],
          regexFilters: [regexFilters, /invalidRegex/],
          filterType: "exclude",
        })
      ),
      Object.keys(objectFilter({ ...exampleArgs, filterType: "include" })),
    ];
    expect(keysExclude).toStrictEqual(expectedExclude);
    expect(keysInclude).toStrictEqual(expectedInclude);
  });
  it("Filters that do not match any keys should not influence result", () => {});
});
describe("Test recursive filtering", () => {
  const targetProp = "targetProp";
  const otherProp = "otherProp";
  const targetObject = {
    targetProp,
    nesting: { otherProp, targetProp, nesting: { otherProp, targetProp } },
  };
  const expectedExclude = {
    nesting: { otherProp, nesting: { otherProp } },
  };
  const expectedInclude = { targetProp };
  const baseArgs = {
    targetObject,
    filters: targetProp,
    recursive: true,
  } as const;
  it("Should recursively remove targeted props", () => {
    (["exclude", "include"] as const).forEach(filterType => {
      const filteredObj = objectFilter({ ...baseArgs, filterType });
      const expected =
        filterType === "exclude" ? expectedExclude : expectedInclude;
      expect(filteredObj).toStrictEqual(expected);
    });
  });
  it("Should not filter within arrays, maps, and sets", () => {
    const arr = [1, 2, targetProp],
      set = new Set([1, 2, targetProp]),
      map = new Map([[targetProp, targetProp]]);
    const expandedTarget = {
      ...targetObject,
      arr,
      set,
      map,
      secondNesting: { arr, set, map, targetProp, otherProp },
    };
    const filteredObj = objectFilter({
      ...baseArgs,
      targetObject: expandedTarget,
      filterType: "exclude",
    }) as Partial<typeof expandedTarget>;
    const targetKeys = ["arr", "set", "map"] as const;
    targetKeys.forEach(key => {
      if (key === "arr") {
        expect(filteredObj[key]!.includes(targetProp)).toBe(true);
        expect(filteredObj.secondNesting![key]!.includes(targetProp)).toBe(
          true
        );
      } else {
        expect(filteredObj[key]!.has(targetProp)).toBe(true);
        expect(filteredObj.secondNesting![key]!.has(targetProp)).toBe(true);
      }
    });
  });
});
