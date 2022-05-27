import type { ObjectFilterArgs, ValidTypes } from "../index";
import * as utils from "../utils";
const {
  earlyReturnChecks,
  filterByRegex,
  formatFilters,
  isValidValue,
  determineTargetValue,
  determineSuccessorObjKeys,
  updateFilteredObject,
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
    expect(filterByRegex(targetKeys, formattedRegex)).toStrictEqual(expected);
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
  afterAll(() => spyOnIsValid.mockRestore());
  const expected = { prop1: "prop1" };
  const spyOnIsValid = jest.spyOn(utils, "isValidValue");
  beforeEach(() => spyOnIsValid.mockReset());
  it("Should always return targetValue for inclusive filtering", () => {
    spyOnIsValid.mockReturnValueOnce(false).mockReturnValueOnce(false);
    expect(determineTargetValue(expected, "include", false)).toStrictEqual(expected);
    expect(determineTargetValue(expected, "include", true)).toStrictEqual(expected);
  });
  it("Should always return targetValue for exclude and non-recursive filterings", () => {
    spyOnIsValid.mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(determineTargetValue(expected, "include", false)).toStrictEqual(expected);
    expect(determineTargetValue(expected, "include", false)).toStrictEqual(expected);
  });
  it("Should return targetValue for exclude recursive filterings, if value is valid", () => {
    spyOnIsValid.mockReturnValueOnce(true);
    expect(determineTargetValue(expected, "exclude", true)).toStrictEqual(expected);
  });
  it("Should return empty object for recursive exclude filterings, if value is not valid", () => {
    spyOnIsValid.mockReturnValueOnce(false);
    expect(determineTargetValue(expected, "exclude", true)).toStrictEqual({});
  });
});

describe("updateFilteredObject", () => {
  const reducedFamilyTree = {
    name: "John",
    surname: "Doe",
    parents: {
      mother: {
        name: "Mother",
        surname: "Doe",
        parents: {
          mother: { name: "GrandMother", surname: "Doe" },
          father: { name: "GrandFather", surname: "Doe" },
        },
      },
      father: {
        name: "Father",
        surname: "Doe",
        parents: {
          mother: { name: "GrandMother", surname: "Doe" },
          father: { name: "GrandFather", surname: "Doe" },
        },
      },
    },
  };
  const pathArray = ["parents", "mother", "parents"];
  let baseFilteredObject = {
    name: "John",
    surname: "Doe",
    parents: {
      mother: {
        name: "Mother",
        surname: "Doe",
        parents: {},
      },
    },
  };
  const keysToInclude = ["mother"];
  it("With include filterType in recursive mode: should assign complete matched object to nested filteredObject", () => {
    const sourceObject = { ...reducedFamilyTree.parents.mother.parents };
    const filteredObject = JSON.parse(
      JSON.stringify(baseFilteredObject)
    ) as typeof baseFilteredObject;
    updateFilteredObject({
      sourceObject,
      pathArray,
      keysToInclude,
      filteredObject,
      filterType: "include",
      recursive: true,
    });
    expect(filteredObject.parents.mother.parents).toStrictEqual({
      mother: sourceObject.mother,
    });
  });
  it("With exclude filterType in recursive mode: should assign empty matched object to nested filterObject", () => {
    const sourceObject = { ...reducedFamilyTree.parents.mother.parents };
    const filteredObject = JSON.parse(
      JSON.stringify(baseFilteredObject)
    ) as typeof baseFilteredObject;
    updateFilteredObject({
      sourceObject,
      pathArray,
      keysToInclude,
      filteredObject,
      filterType: "exclude",
      recursive: true,
    });
    expect(filteredObject.parents.mother.parents).toStrictEqual({ mother: {} });
  });
  it("With primitive values in recursive mode: should perform identical assignment for both filterTypes", () => {
    const sourceObject = { ...reducedFamilyTree.parents.mother.parents.mother };
    const keysToInclude = ["name"];
    const pathArray = ["parents", "mother", "parents", "mother"];
    (["exclude", "include"] as ValidTypes[]).forEach(filterType => {
      const filteredObject = JSON.parse(
        JSON.stringify(baseFilteredObject)
      ) as typeof baseFilteredObject;
      updateFilteredObject({
        sourceObject,
        filteredObject,
        keysToInclude,
        pathArray,
        filterType,
        recursive: true,
      });
      expect(filteredObject.parents.mother.parents).toStrictEqual({
        mother: { name: "GrandMother" },
      });
    });
  });
  it("With non-recursive filterings: should perform identical assignment for both filterTypes", () => {
    const nestedProp = {
      otherProp: "otherProp",
      nestedProp: { subProp: "subProp" },
    };
    const sourceObject = {
      firstProp: "firstProp",
      nestedProp,
      thirdProp: "thirdProp",
    };
    const keysToInclude = ["firstProp", "nestedProp"];
    const expected = { firstProp: "firstProp", nestedProp };
    (["exclude", "include"] as ValidTypes[]).forEach(filterType => {
      const filteredObject: Record<string, any> = {};
      updateFilteredObject({
        sourceObject,
        filteredObject,
        pathArray: [],
        filterType,
        keysToInclude,
        recursive: false,
      });
      expect(filteredObject).toStrictEqual(expected);
    });
  });
});

describe("determineSuccessorObjKeys", () => {
  const sourceObject = {
      prop1: "prop1",
      targetProp1: { otherProp: "otherProp" },
      arrayProp: [1, 2, 3],
      dateProp: new Date(2022),
      targetProp2: { otherProp: "otherProp" },
    },
    sourceObjKeys = Object.keys(sourceObject),
    matchedKeys = ["targetProp2"];
  const baseArgs = { sourceObject, sourceObjKeys, matchedKeys };
  it("For include type: should return a list of non-primitive and non-excluded object type keys", () => {
    expect(
      determineSuccessorObjKeys({
        filterType: "include",
        ...baseArgs,
      })
    ).toStrictEqual(["targetProp1", "targetProp2"]);
  });
  it("For exclude type: should return a list of non-primitive, non-matched, and non-excluded object type keys", () => {
    expect(
      determineSuccessorObjKeys({
        filterType: "exclude",
        ...baseArgs,
      })
    ).toStrictEqual(["targetProp1"]);
  });
});
