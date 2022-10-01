import type { ObjectFilterArgs, ValidTypes } from "./index.js";

type SingleLevelIncludeFilter = (args: {
  filterKeys: string[];
  regexKeys: RegExp[];
  sourceObjKeys: string[];
}) => string[];

type UpdateFilteredObject = (args: {
  keysToInclude: string[];
  pathArray: string[];
  filteredObject: Record<string, any>;
  sourceObject: Record<string, any>;
  filterType: ValidTypes;
  recursive: boolean;
}) => void;

type DetermineSuccessorObjKeys = (args: {
  matchedKeys: string[];
  sourceObjKeys: string[];
  sourceObject: Record<string, any>;
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
  Int8Array,
  Int16Array,
  Int32Array,
  Uint8Array,
  Uint16Array,
  Uint32Array,
  Uint8ClampedArray,
  BigInt64Array,
  BigUint64Array,
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
  const regexKeys: RegExp[] = [];

  if (Array.isArray(regexFilters) && regexFilters.length) {
    regexFilters.forEach(regexFilter => {
      const regex = singleRegexHandler(regexFilter);
      if (regex) regexKeys.push(regex);
    });
  } else {
    const regex = singleRegexHandler(regexFilters as string | RegExp);
    if (regex) regexKeys.push(regex);
  }

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
  const result: string[] = [];
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

/**Filter a single level of object properties.
 * Filters by regex filters first, if available.
 */
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
  const orderedKeys = orderMatchedKeys(matchedKeys, sourceObjKeys);
  return orderedKeys;
};

/**Determine whether a matched sourceObject property value can be assigned to
 * the filteredObject. Primitive values and excluded object types can be assigned,
 * as they are not filtered.
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
 * filtered object.*/
export const determineTargetValue = <T>(
  targetValue: T,
  filterType: ValidTypes,
  recursive = true
): T | Record<string,unknown> => {
   if (filterType === "include" || !recursive) return targetValue;
  /* For exclusive filtering with recursion only primitives and non-filterable types can be assigned.
     Otherwise, it will return an empty object. REASON: in updateFilteredObject, only keys that
     should be included are specifically assigned.  So, if an included property  itself contains 
     excluded properties, these would be kept in the next iteration of updateFilteredObject. */
  const isTargetValid = isValidValue(targetValue);
  if (isTargetValid) return targetValue;
  return {};
};

/**Update the filteredObject with includedKeys. 
 * Filtered object is updated as a side-effect. */
export const updateFilteredObject: UpdateFilteredObject = ({
  keysToInclude,
  pathArray,
  filteredObject,
  sourceObject,
  filterType,
  recursive,
}) => {
  if (!pathArray.length) {
    keysToInclude.forEach(key => {
      const targetVal = determineTargetValue(
        sourceObject[key],
        filterType,
        recursive
      );
      filteredObject[key] = targetVal;
    });
    return;
  }
  if (keysToInclude.length) {
    pathArray.reduce((composedObj, current, index) => {
      if (index === pathArray.length - 1) {
        // Initial empty object set to prevent access errors and clear previous values.
        composedObj[current] = {};
        keysToInclude.forEach(key => {
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
    const isDefined = sourceObjValue !== null;
    const isObj = typeof sourceObjValue === "object";
    const isValidType = EXCLUDED_TYPES.every(
      instanceType => !(sourceObjValue instanceof instanceType)
    );
    if (filterType === "include") {
      return isObj && isValidType;
    }
    const isMatched = matchedKeys.includes(key);
    return isDefined && isObj && isValidType && !isMatched;
  });
};
