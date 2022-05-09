import type { ObjectFilterArgs, ValidTypes } from "./index.js";

const VALID_FILTER_TYPES: ValidTypes[] = ["exclude", "include"];

/** Sanity check parameters so that function works as expected in non-TS environments.
 * If it returns true, function will perform an early return of the targetObject.
 */
export const earlyReturnChecks = (
  args: Omit<ObjectFilterArgs, "recursive">
): boolean => {
  const { targetObject, filterType, regexFilters, filters } = args;
  if (filterType !== undefined && !VALID_FILTER_TYPES.includes(filterType))
    return true;

  if (!Object.keys(targetObject).length) return true;

  // Check filters. If an array is provided, check
  // that the length is truthy, once filtered for allowed values.
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

export const filterByRegex = (
  objKeys: string[],
  regexKeys: RegExp[]
): string[] => {
  let remainingKeys = [...regexKeys];
  let result: string[] = [];
  objKeys.filter(objKey => {
    for (const [index, regexKey] of remainingKeys.entries()) {
      const match = regexKey.test(objKey);
      if (match) {
        result.push(objKey);
        remainingKeys.splice(index, 1);
        break;
      }
    }
  });
  return result;
};
