import objectTrim from "../index";
import { ValidTypes } from "../types.js";
describe("objectTrim", () => {
  const targetObject: Record<string, any> = {};
  const objKeys = ["one", "two", "three", "four"];
  objKeys.forEach(key => (targetObject[key] = key));
  it("Include filterType should return object with filter keys only", () => {
    const filters = ["one", "two"];
    const filteredObj = objectTrim({
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
    const filteredObj = objectTrim({
      targetObject,
      filters,
      filterType: "exclude",
    });
    const keys = Object.keys(filteredObj);
    expect(keys.length).toBe(expectedLength);
    filters.forEach(key => expect(keys.includes(key)).toBe(false));
  });
  it("Should properly parse a string filters argument", ()=> {
    const filters = "one";
    const expectedLength = objKeys.length - 1;
    const filteredObj = objectTrim({targetObject, filters, filterType: "exclude"});
    expect(Object.keys(filteredObj).length).toBe(expectedLength);
  })
  it("Should ignore filters that are not part of the object", () => {
    const validFilters = ["one"];
    const filters = [...validFilters, "invalidKey"];
    const args = { targetObject, filters, filterType: "include" } as const;
    const filteredInclude = objectTrim(args);
    const keysInclude = Object.keys(filteredInclude);
    expect(keysInclude.length).toBe(validFilters.length);
    expect(keysInclude).toEqual(validFilters);

    const filteredExclude = objectTrim({ ...args, filterType: "exclude" });
    const keysExclude = Object.keys(filteredExclude);
    expect(keysExclude.length).toBe(objKeys.length - validFilters.length);
  });
  it("Should return original object if filters are empty or none of them are in the targetObject", () => {
    [[], ["invalidKey"]].forEach(filters => {
      (["exclude", "include"] as const).forEach(filterType => {
        const filteredObj = objectTrim({
          targetObject,
          filters,
          filterType,
        });
        expect(filteredObj).toEqual(targetObject);
      });
    });
  });
  it("Should return original object, if an invalid filterType is passed", ()=> {
    const filteredObj = objectTrim({targetObject, filters:"one", filterType: "invalidType" as ValidTypes});
    expect(filteredObj).toEqual(targetObject);
  })
});
