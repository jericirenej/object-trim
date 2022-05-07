import objectTrim from "../index";
describe("objectTrim", () => {
  const targetObject: Record<string, any> = {};
  const objKeys = ["one", "two", "three", "four"];
  objKeys.forEach(key => (targetObject[key] = key));
  it("Include filterType should return object with filterKeys only", () => {
    const filterKeys = ["one", "two"];
    const filteredObj = objectTrim({
      targetObject,
      filterKeys,
      filterType: "include",
    });
    const keys = Object.keys(filteredObj);
    expect(keys.length).toBe(filterKeys.length);
    expect(keys).toEqual(filterKeys);
  });
  it("Exclude filterType should return object without filterKeys", () => {
    const filterKeys = ["one"];
    const expectedLength = objKeys.length - filterKeys.length;
    const filteredObj = objectTrim({
      targetObject,
      filterKeys,
      filterType: "exclude",
    });
    const keys = Object.keys(filteredObj);
    expect(keys.length).toBe(expectedLength);
    filterKeys.forEach(key => expect(keys.includes(key)).toBe(false));
  });
  it("Should ignore filterKeys that are not part of the object", () => {
    const validFilters = ["one"];
    const filterKeys = [...validFilters, "invalidKey"];
    const args = { targetObject, filterKeys, filterType: "include" } as const;
    const filteredInclude = objectTrim(args);
    const keysInclude = Object.keys(filteredInclude);
    expect(keysInclude.length).toBe(validFilters.length);
    expect(keysInclude).toEqual(validFilters);

    const filteredExclude = objectTrim({ ...args, filterType: "exclude" });
    const keysExclude = Object.keys(filteredExclude);
    expect(keysExclude.length).toBe(objKeys.length - validFilters.length);
  });
  it("Should return original object if filterKeys are empty or none of them are in the targetObject", () => {
    [[], ["invalidKey"]].forEach(filterKeys => {
      (["exclude", "include"] as const).forEach(filterType => {
        const filteredObj = objectTrim({
          targetObject,
          filterKeys,
          filterType,
        });
        expect(filteredObj).toEqual(targetObject);
      });
    });
  });
});
