import { VALID_FILTER_TYPES } from "./constants";
import type { ObjectArgs, ValidTypes } from "./types";
/** Filter an object based on its keys that are checked against a string array.
 *  Supply a configuration object, that has the targetObject, filterType, and filters properties.
 * Two types of filtering available in filterType:
 *  * *include*: will return an object that includes **only the filter keys** (excludes all others).
 *  * *exclude*: will return an object that **excludes the filter keys** (includes all others).
 */
const objectFilter = (config: ObjectArgs): Record<string, any> => {
  const { targetObject, filterType, filters, recursive } = config;
  if (recursive) {
    return executeRecursiveFilter(config);
  }
  return executeObjectFilter(targetObject, filterType, filters);
};

const executeObjectFilter = (
  targetObject: Record<string, any>,
  filterType: ValidTypes,
  filters: string | string[]
): Record<string, any> => {
  const filteredObject: Record<string, any> = {};

  if (!VALID_FILTER_TYPES.includes(filterType)) return targetObject;

  const objKeys = Object.keys(targetObject);
  const filterKeys = Array.isArray(filters) ? [...filters] : [filters];

  const checkedFilterKeys = filterKeys.filter((key: string) =>
    objKeys.includes(key)
  );

  if (!(objKeys.length && filterKeys.length && checkedFilterKeys.length))
    return targetObject;

  const targetKeys = objKeys.filter(key => {
    const isAmongCheckedKeys = checkedFilterKeys.includes(key);
    return filterType === "include" ? isAmongCheckedKeys : !isAmongCheckedKeys;
  });

  targetKeys.forEach(key => (filteredObject[key] = targetObject[key]));

  return filteredObject;
};

const executeRecursiveFilter = (config: ObjectArgs): Record<string, any> => {
  const excludedObjectTypes = [Array, Map, Set];
  const filterAndEvaluate = (config: ObjectArgs): Record<string, any> => {
    const { targetObject, filters, filterType } = config;
    const filteredObject = executeObjectFilter(
      targetObject,
      filterType,
      filters
    );
    for (const name in filteredObject) {
      const property = filteredObject[name];
      const isObject =
        excludedObjectTypes.every(type => !(property instanceof type)) &&
        typeof property === "object";
      if (isObject) {
        const newProperties = () =>
          filterAndEvaluate({
            targetObject: property,
            filters,
            filterType,
          });
        filteredObject[name] = newProperties();
      }
    }
    return filteredObject;
  };
  return filterAndEvaluate(config);
};

export default objectFilter;
