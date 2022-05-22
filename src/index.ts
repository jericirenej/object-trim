"use strict";

import {
  determineSuccessorObjKeys,
  earlyReturnChecks,
  formatFilters,
  orderMatchedKeys,
  singleLevelFilter,
  updateFilterObject
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
interface ExtractRecursiveArgs {
  filterKeys: string[];
  regexKeys: RegExp[];
  sourceObject: Record<string, any>;
  filteredObject: Record<string, any>;
  pathArray: string[];
  filterType: ValidTypes;
  recursive?: boolean;
}
type ExtractPropertyArgs = Omit<
  ExtractRecursiveArgs,
  "filteredObject" | "pathArray"
>;
type ExtractProperty = (args: ExtractPropertyArgs) => Record<string, any>;

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

export const recursiveFilter: ExtractProperty = ({
  filterKeys,
  regexKeys,
  sourceObject,
  filterType,
  recursive = true,
}) => {
  const extractFunction = ({
    sourceObject,
    filterKeys,
    regexKeys,
    pathArray,
    filteredObject,
    recursive = true,
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
      matchedKeys: orderMatchedKeys(matchedToPass, sourceObjKeys),
      sourceObjKeys,
      filterType,
      recursive,
    };

    updateFilterObject(updateArgs);

    // Exit after first iteration, if recursive is set to false...
    if (!recursive) {
      return filteredObject;
    }

    //...Otherwise, continue with recursive execution.
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
        recursive,
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
    recursive,
  });
};

export default objectFilter;
