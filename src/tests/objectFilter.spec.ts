import objectFilter from "../index";
import { ValidTypes } from "../types.js";
describe("objectTrim", () => {
  const targetObject: Record<string, any> = {};
  const objKeys = ["one", "two", "three", "four"];
  objKeys.forEach(key => (targetObject[key] = key));
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
  it("Should return original object if filters are empty or none of them are in the targetObject", () => {
    [[], ["invalidKey"]].forEach(filters => {
      (["exclude", "include"] as const).forEach(filterType => {
        const filteredObj = objectFilter({
          targetObject,
          filters,
          filterType,
        });
        expect(filteredObj).toEqual(targetObject);
      });
    });
  });
  it("Should return original object, if an invalid filterType is passed", () => {
    const filteredObj = objectFilter({
      targetObject,
      filters: "one",
      filterType: "invalidType" as ValidTypes,
    });
    expect(filteredObj).toEqual(targetObject);
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
      const arr = [1, 2, 3],
        set = new Set([1, 2, 3]),
        map = new Map([["one", 1]]);
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
      });
      const firstLevelKeys = Object.keys(filteredObj);
      const nestedKeys = Object.keys(filteredObj.secondNesting);
      [firstLevelKeys, nestedKeys].forEach(keys => {
        const targetKeys = ["arr", "set", "map"];
        expect(targetKeys.every(key => keys.includes(key))).toBe(true);
      });
    });
  });
});
