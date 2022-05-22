"use strict";

import {
  earlyReturnChecks, formatFilters,
  recursiveFilter
} from "./utils.js";

// Type declarations
export type ValidTypes = "exclude" | "include";
export interface ObjectFilterArgs {
  targetObject: Record<string, any>;
  filters?: string | string[];
  regexFilters?: string | RegExp | (RegExp | string)[];
  filterType?: ValidTypes;
  recursive?: boolean;
}

/** Filter an object based on matching its key against the provided filters.
 * Filtering can be *flat* or *recursive* (default).
 * Two types of filtering available:
 *  * *include*: includes only the properties that match the filter keys.
 *  * *exclude*: excludes the properties that match filter keys.
 */
const objectFilter = ({
  targetObject,
  filters,
  regexFilters,
  filterType = "exclude",
  recursive = true,
}: ObjectFilterArgs): Record<string, any> => {
  const args = { targetObject, filters, regexFilters, filterType };
  if (earlyReturnChecks(args)) return targetObject;
  const { filterKeys, regexKeys } = formatFilters(filters, regexFilters);
  return recursiveFilter({
    sourceObject: targetObject,
    filterType,
    filterKeys,
    regexKeys,
    recursive,
  });
};

export default objectFilter;
