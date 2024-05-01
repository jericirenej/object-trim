import objectFilter from "../index";
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
});

describe("Variation mock testing", () => {
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
    });
  });
});
