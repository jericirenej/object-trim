"use strict";

import { earlyReturnChecks, filterByRegex, formatFilters } from "./utils";

// Type declarations
export type ValidTypes = "include" | "exclude";
export interface ObjectFilterArgs {
  targetObject: Record<string, any>;
  filters?: string | string[];
  regexFilters?: string | RegExp | (RegExp | string)[];
  filterType?: ValidTypes;
  recursive?: boolean;
}
const EXCLUDED_TYPES = [Array, Map, Set] as const;

/** Filter an object based on matching its key against the provided filters.
 *  Supply a configuration object with *targetObject*, *filterType*, and *filters* properties.
 * Two types of filtering available:
 *  * *include*: includes only the properties that match the filter keys.
 *  * *exclude*: excludes the properties that match filter keys.
 */
const objectFilter = (config: {
  targetObject: Record<string, any>;
  filters?: string | string[];
  regexFilters?: string | RegExp | (RegExp | string)[];
  filterType?: "include" | "exclude";
  recursive?: boolean;
}): Record<string, any> => {
  if (earlyReturnChecks(config)) return config.targetObject;
  if (config.recursive) {
    return executeRecursiveFilter(config);
  }
  return executeObjectFilter(config);
};

const executeObjectFilter = (
  config: Omit<ObjectFilterArgs, "recursive">
): Record<string, any> => {
  const filteredObject: Record<string, any> = {};
  const { filters, targetObject, filterType, regexFilters } = config;
  const objKeys = Object.keys(targetObject);

  const { filterKeys, regexKeys } = formatFilters(filters, regexFilters);

  const checkedFilterKeys = filterKeys.filter((key: string) =>
    objKeys.includes(key)
  );

  const checkedRegexKeys = regexKeys.length
    ? filterByRegex(
        objKeys.filter(key => !checkedFilterKeys.includes(key)),
        regexKeys
      )
    : [];
  if (!(checkedFilterKeys.length || checkedRegexKeys.length))
    return targetObject;

  const targetKeys = objKeys.filter(key => {
    const isAmongCheckedKeys =
      checkedFilterKeys.includes(key) || checkedRegexKeys.includes(key);
    return filterType === "include" ? isAmongCheckedKeys : !isAmongCheckedKeys;
  });

  targetKeys.forEach(key => (filteredObject[key] = targetObject[key]));

  return filteredObject;
};

const executeRecursiveFilter = (
  config: ObjectFilterArgs
): Record<string, any> => {
  const filterAndEvaluate = (config: ObjectFilterArgs): Record<string, any> => {
    const filteredObject = executeObjectFilter(config);
    for (const name in filteredObject) {
      const property = filteredObject[name];
      const isValidObject =
        EXCLUDED_TYPES.every(type => !(property instanceof type)) &&
        typeof property === "object";
      if (isValidObject) {
        filteredObject[name] = filterAndEvaluate({
          ...config,
          targetObject: property,
        });
      }
    }
    return filteredObject;
  };
  return filterAndEvaluate(config);
};

export default objectFilter;
