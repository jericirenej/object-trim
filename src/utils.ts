import type { ObjectFilterArgs, ValidTypes } from "./index.js";

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
  filterKeys = filterKeys.filter(filterKey => !regexKeys.some(regexKey => regexKey.test(filterKey)));
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

/* interface ExtractRecursiveArgs {
  filterKeys: string[];
  regexKeys: RegExp[];
  sourceObject: Record<string, any>;
  filteredObject: Record<string, any>;
  arrBuffer: string[];
}

type ExtractProperty = (
  args: Omit<ExtractRecursiveArgs, ["arrBuffer", "filteredObject"]>
) => Record<string, any>;

const extractFunction = (
  {sourceObject, filterKeys, regexKeys, arrBuffer, filteredObject}: ExtractRecursiveArgs
): Record<string, any> => {
  const sourceObjKeys = Object.keys(sourceObject);
  
};

export const extractProperty: ExtractProperty = ({
  filterKeys,
  regexKeys,
  sourceObject,
}) => {
  let recursionStarted = false;

  let filteredObject = {};
  extractFunction({
    filterKeys,
    regexKeys,
    filteredObject,
    sourceObject,
    arrBuffer: [],
  });

  return filteredObject;
};
 */