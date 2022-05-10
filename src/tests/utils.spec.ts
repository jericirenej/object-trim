import type { ObjectFilterArgs, ValidTypes } from "../index";
import { earlyReturnChecks } from "../utils";

describe("earlyReturnChecks", () => {
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
