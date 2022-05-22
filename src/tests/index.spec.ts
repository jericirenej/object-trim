import * as index from "../index";
import objectFilter, { ObjectFilterArgs, type ValidTypes } from "../index";
import * as utils from "../utils";
import mockTestObjects from "./mockTestObjects";

const spyOnEarlyReturn = jest.spyOn(utils, "earlyReturnChecks"),
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
    it("Should default to 'exclude' type, if filterType is not passed", () => {
      const filteredObj = objectFilter({
        targetObject,
        filters: "one",
      });
      expect(Object.keys(filteredObj).length).toBe(objKeys.length - 1);
    });
    it("Should default to recursive filtering, if recursive argument not passed", () => {
      const spyOnRecursiveFilter = jest.spyOn(index, "recursiveFilter");
      objectFilter({targetObject,filters: "one",});
      expect(spyOnRecursiveFilter.mock.calls.flat()[0]["recursive"]).toBe(true);
      spyOnRecursiveFilter.mockClear();
    });
    it("Should respect recursive argument, if passed", () => {
      const spyOnRecursiveFilter = jest.spyOn(index, "recursiveFilter");
      [false,true].forEach(recursive => {
        objectFilter({targetObject,filters: "one", recursive});
        expect(spyOnRecursiveFilter.mock.calls.flat()[0]["recursive"]).toBe(recursive);
        spyOnRecursiveFilter.mockClear();
      })
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
  //!MISSING or redundant!
  it("Filters that do not match any keys should not influence result", () => {});
});

describe("Recursive filtering", () => {
  const targetProp = "targetProp";
  const otherProp = "otherProp";
  const thirdProp = "thirdProp";
  const targetObject = {
    targetProp,
    nesting: {
      otherProp,
      targetProp,
      nesting: {
        otherProp,
        targetProp: {
          otherProp,
        },
        thirdProp,
      },
    },
  };

  const expectedExclude = {
    nesting: { otherProp, nesting: { otherProp } },
  };
  const expectedInclude = {
    targetProp,
    nesting: { targetProp, nesting: { targetProp: { otherProp } } },
  };
  const [excludeArgs, includeArgs] = [
    ["thirdProp", "targetProp"],
    ["targetProp", "nesting"],
  ];

  it("Should recursively remove targeted props", () => {
    [
      {
        filterType: "exclude" as const,
        filters: excludeArgs,
        expected: expectedExclude,
      },
      {
        filterType: "include" as const,
        filters: includeArgs,
        expected: expectedInclude,
      },
    ].forEach(config => {
      const { filterType, filters, expected } = config;
      const filteredObj = objectFilter({
        targetObject,
        filterType,
        filters,
        recursive: true,
      });

      expect(filteredObj).toStrictEqual(expected);
    });
  });
  //! REDUNDANT? Can be covered with mock variations?
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
      recursive: true,
      filters: targetProp,
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

describe("Variation mock testing", () => {
  // Mock objects will need adjustments after "include" filterType upgrade.
  it("Should return expected objects", () => {
    mockTestObjects.forEach((mockObject, index) => {
      const {
        expected,
        targetObject,
        filterType,
        filters,
        recursive,
        regexFilters,
      } = mockObject;
      const filtered = objectFilter({
        targetObject,
        filterType,
        filters,
        recursive,
        regexFilters,
      });
      expect(filtered).toStrictEqual(expected);
      /* if (JSON.stringify(filtered) !== JSON.stringify(expected)) {
        console.log(mockObject.tag, filtered, mockObject.expected);
      } */
    });
  });
});
