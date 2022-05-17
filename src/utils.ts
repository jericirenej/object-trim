import type { ObjectFilterArgs, ValidTypes } from "./index.js";
interface ExtractRecursiveArgs {
  filterKeys: string[];
  regexKeys: RegExp[];
  sourceObject: Record<string, any>;
  filteredObject: Record<string, any>;
  pathArray: string[];
  filterType: ValidTypes;
}

type ExtractPropertyArgs = Omit<
  ExtractRecursiveArgs,
  "filteredObject" | "pathArray"
>;

type ExtractProperty = (args: ExtractPropertyArgs) => Record<string, any>;

type SingleLevelIncludeFilter = (
  args: Omit<ExtractPropertyArgs, "sourceObject" | "filterType"> & {
    sourceObjKeys: string[];
  }
) => string[];

type UpdateFilteredObject = (
  args: Omit<
    ExtractRecursiveArgs,
    "filterKeys" | "regexKeys" | "filterType"
  > & {
    matchedKeys: string[];
    sourceObjKeys: string[];
  }
) => void;

type DetermineSuccessorObjKeys = (args: {
  sourceObjKeys: string[];
  sourceObject: Record<string, any>;
  matchedKeys: string[];
  filterType: ValidTypes;
}) => string[];

const VALID_FILTER_TYPES: ValidTypes[] = ["exclude", "include"];
export const EXCLUDED_TYPES = [
  Array,
  Map,
  Set,
  Date,
  WeakMap,
  WeakSet,
  Int16Array,
  Int32Array,
  Int8Array,
  BigInt64Array,
  BigUint64Array,
  Uint16Array,
  Uint32Array,
  Uint8Array,
  Uint8ClampedArray,
  ArrayBuffer,
  SharedArrayBuffer,
] as const;

/** Sanity check parameters so that function works as expected in non-TS environments.
 * If it returns true, function will perform an early return of the targetObject.
 */
export const earlyReturnChecks = (
  args: Omit<ObjectFilterArgs, "recursive">
): boolean => {
  const { targetObject, filterType, regexFilters, filters } = args;
  if (filterType !== undefined && !VALID_FILTER_TYPES.includes(filterType))
    return true;

  if (!targetObject || !Object.keys(targetObject).length) return true;

  // Check filters. If an array is provided, check
  // that the length is truthy, once invalid values are filtered outs.
  const areFiltersTruthy =
    typeof filters === "string" ||
    (Array.isArray(filters) &&
      filters.filter(strFilter => typeof strFilter === "string").length > 0);
  const areRegexFiltersTruthy =
    typeof regexFilters === "string" ||
    regexFilters instanceof RegExp ||
    (Array.isArray(regexFilters) &&
      regexFilters.filter(
        regexFilter =>
          typeof regexFilter === "string" || regexFilter instanceof RegExp
      ).length > 0);

  if (!(areFiltersTruthy || areRegexFiltersTruthy)) return true;
  return false;
};

/** Return properly formatted string and regex filters. */
export const formatFilters = (
  filters: string | string[] | undefined,
  regexFilters: string | RegExp | (string | RegExp)[] | undefined
): { filterKeys: string[]; regexKeys: RegExp[] } => {
  let filterKeys = !filters
    ? []
    : Array.isArray(filters)
    ? [...filters]
    : [filters];

  // General handler used for each instance of a supplied regexKey
  const singleRegexHandler = (regex: string | RegExp): RegExp | void => {
    if (regex instanceof RegExp) return regex;
    if (typeof regex === "string") return new RegExp(regex);
  };
  let regexKeys: RegExp[] = [];

  if (Array.isArray(regexFilters) && regexFilters.length) {
    regexFilters.forEach(regexFilter => {
      const regex = singleRegexHandler(regexFilter);
      if (regex) regexKeys.push(regex);
    });
  }
  // If regexFilters is not an array
  const regex = singleRegexHandler(regexFilters as string | RegExp);

  // Remove those filterKeys that already match any of the regexKeys;
  filterKeys = filterKeys.filter(
    filterKey => !regexKeys.some(regexKey => regexKey.test(filterKey))
  );
  if (regex) regexKeys.push(regex);
  return { filterKeys, regexKeys };
};

export const filterByRegex = (
  objKeys: string[],
  regexKeys: RegExp[]
): string[] => {
  let result: string[] = [];
  objKeys.filter(objKey => {
    regexKeys.forEach(regexKey => {
      if (regexKey.test(objKey)) result.push(objKey);
    });
  });
  return result;
};

const singleLevelFilter: SingleLevelIncludeFilter = ({
  filterKeys,
  regexKeys,
  sourceObjKeys,
}) => {
  let remainingKeysToFilter = [...sourceObjKeys];
  const matchedKeys: string[] = [];
  const regexLimitIndex = regexKeys.length - 1;
  const filters = [...regexKeys, ...filterKeys];
  filters.forEach((filter, index) => {
    if (!remainingKeysToFilter.length) return;
    if (index <= regexLimitIndex && filter instanceof RegExp) {
      const matched = remainingKeysToFilter.filter(key => filter.test(key));
      matchedKeys.push(...matched);
    }
    if (typeof filter === "string" && remainingKeysToFilter.includes(filter)) {
      matchedKeys.push(filter);
    }
    remainingKeysToFilter = remainingKeysToFilter.filter(
      key => !matchedKeys.includes(key)
    );
  });
  return matchedKeys;
};

const updateFilterObject: UpdateFilteredObject = ({
  matchedKeys,
  pathArray,
  filteredObject,
  sourceObject,
}) => {
  if (!pathArray.length) {
    matchedKeys.forEach(key => {
      return (filteredObject[key] = sourceObject[key]);
    });
    return;
  }
  if (matchedKeys.length) {
    pathArray.reduce((composedObj, current, index) => {
      if (index === pathArray.length - 1) {
        composedObj[current] = {};
        matchedKeys.forEach(
          key => (composedObj[current][key] = sourceObject[key])
        );
      }
      return composedObj[current]
        ? composedObj[current]
        : (composedObj[current] = {});
    }, filteredObject);
  }
};


const determineSuccessorObjKeys: DetermineSuccessorObjKeys = ({
  filterType,
  matchedKeys,
  sourceObjKeys,
  sourceObject,
}) => {
  return [...sourceObjKeys].filter(key => {
    const sourceObjValue = sourceObject[key];
    const isObj = typeof sourceObjValue === "object";
    const isValidType = EXCLUDED_TYPES.every(
      instanceType => !(sourceObjValue instanceof instanceType)
    );
    if (filterType === "include") {
      return isObj && isValidType;
    }
    const isMatched = matchedKeys.includes(key);
    return isObj && isValidType && !isMatched;
  });
};

export const recursiveFilter: ExtractProperty = ({
  filterKeys,
  regexKeys,
  sourceObject,
  filterType,
}) => {
  const extractFunction = ({
    sourceObject,
    filterKeys,
    regexKeys,
    pathArray,
    filteredObject,
  }: ExtractRecursiveArgs): Record<string, any> => {
    const sourceObjKeys = Object.keys(sourceObject);
    const matchedKeys = singleLevelFilter({
      filterKeys,
      regexKeys,
      sourceObjKeys,
    });
    const matchedToPass =
      filterType === "include"
        ? matchedKeys
        : sourceObjKeys.filter(key => !matchedKeys.includes(key));
    const updateArgs = {
      sourceObject,
      filteredObject,
      pathArray,
      matchedKeys: matchedToPass,
      sourceObjKeys,
    };

    updateFilterObject(updateArgs);

    const successorObjKeys = determineSuccessorObjKeys({
      filterType,
      matchedKeys,
      sourceObjKeys,
      sourceObject,
    });
    successorObjKeys.forEach(key => {
      const newSource = sourceObject[key];
      const newPathArray = [...pathArray, key];
      extractFunction({
        sourceObject: newSource,
        filterKeys,
        regexKeys,
        filteredObject,
        pathArray: newPathArray,
        filterType,
      });
    });
    return filteredObject;
  };
  return extractFunction({
    filterKeys,
    regexKeys,
    filteredObject: {},
    sourceObject,
    pathArray: [],
    filterType,
  });
};
