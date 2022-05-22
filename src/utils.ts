import type {
  ExtractRecursiveArgs,
  ObjectFilterArgs,
  ValidTypes
} from "./index.js";


type SingleLevelIncludeFilter = (
  args: Omit<ExtractRecursiveArgs, "sourceObject" | "filterType"|"filteredObject" | "pathArray"> & {
    sourceObjKeys: string[];
  }
) => string[];

type UpdateFilteredObject = (
  args: Omit<ExtractRecursiveArgs, "filterKeys" | "regexKeys"> & {
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
  if (regex) regexKeys.push(regex);

  // Remove those filterKeys that already match any of the regexKeys;
  filterKeys = filterKeys.filter(
    filterKey => !regexKeys.some(regexKey => regexKey.test(filterKey))
  );
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

export const orderMatchedKeys = (
  matchedKeys: string[],
  sourceObjKeys: string[]
): string[] => {
  return sourceObjKeys.filter(key => matchedKeys.includes(key));
};

export const singleLevelFilter: SingleLevelIncludeFilter = ({
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

/**Determine whether a matched sourceObject property value can be assigned to
 * the filteredObject. Primitive values and excluded object types can be assigned,
 * as they are not filtered themselves.
 */
export const isValidValue = (val: any): boolean => {
  const primitives = ["string", "number", "boolean", "bigint", "symbol"];
  if (val === null || val === undefined) return true;
  if (primitives.some(primitiveType => typeof val === primitiveType))
    return true;
  if (EXCLUDED_TYPES.some(objType => val instanceof objType)) return true;
  return false;
};

/**On the basis of the sourceObject value, return a target value to be assigned to the
 * filtered object. Inclusive filtering returns the sourceObjectValue directly, while
 * exclusive filtering returns the value, if its type passes validity checks.
 */
export const determineTargetValue = <T>(
  targetValue: T,
  filterType: ValidTypes,
  recursive = true
): T | {} => {
  // Inclusive and non-recursive exclusive filtering is greedy.
  if (filterType === "include" || !recursive) return targetValue;
  // Exclusive filtering only returns primitives and non-filterable object types
  const isTargetValid = isValidValue(targetValue);
  if (isTargetValid) return targetValue;
  return {};
};

export const updateFilterObject: UpdateFilteredObject = ({
  matchedKeys,
  pathArray,
  filteredObject,
  sourceObject,
  filterType,
  recursive,
}) => {
  if (!pathArray.length) {
    matchedKeys.forEach(key => {
      const targetVal = determineTargetValue(
        sourceObject[key],
        filterType,
        recursive
      );
      filteredObject[key] = targetVal;
    });
    return;
  }
  if (matchedKeys.length) {
    pathArray.reduce((composedObj, current, index) => {
      if (index === pathArray.length - 1) {
        // Initial empty object set to prevent access errors.
        composedObj[current] = {};
        matchedKeys.forEach(key => {
          const targetVal = determineTargetValue(sourceObject[key], filterType);
          return (composedObj[current][key] = targetVal);
        });
      }
      return composedObj[current]
        ? composedObj[current]
        : (composedObj[current] = {});
    }, filteredObject);
  }
};

export const determineSuccessorObjKeys: DetermineSuccessorObjKeys = ({
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
