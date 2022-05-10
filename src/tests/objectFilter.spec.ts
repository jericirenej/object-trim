import objectFilter, { type ValidTypes } from "../index";
import * as utils from "../utils";

const spyOnEarlyReturn = jest.spyOn(utils, "earlyReturnChecks");
const spyOnFilterByRegex = jest.spyOn(utils, "filterByRegex");

const targetObject: Record<string, any> = {};
const objKeys = ["one", "two", "three", "four"];
objKeys.forEach(key => (targetObject[key] = key));

describe("objectFilter", () => {
  beforeEach(() => jest.clearAllMocks());
  describe("Early return checks", () => {
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
      expect(filteredObj).toEqual(targetObject);
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
      expect(keys).toEqual(filters);
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
    it("Should ignore filters that are not part of the object", () => {
      const validFilters = ["one"];
      const filters = [...validFilters, "invalidKey"];
      const args = { targetObject, filters, filterType: "include" } as const;
      const filteredInclude = objectFilter(args);
      const keysInclude = Object.keys(filteredInclude);
      expect(keysInclude.length).toBe(validFilters.length);
      expect(keysInclude).toEqual(validFilters);

      const filteredExclude = objectFilter({ ...args, filterType: "exclude" });
      const keysExclude = Object.keys(filteredExclude);
      expect(keysExclude.length).toBe(objKeys.length - validFilters.length);
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
      expect(filteredObj).toEqual(targetObject);
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
  });
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
      expect(filteredObj).toEqual(expected);
    });
  });
  it("Should not filter arrays, maps, and sets", () => {
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
