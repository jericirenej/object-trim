import { VALID_FILTER_TYPES } from "./constants";
import type { ValidTypes } from "./types";
/** Filter an object based on its keys that are checked against a string array.
 *  Supply a configuration object, that has the targetObject, filterType, and filters properties.
 * Two types of filtering available in filterType:
 *  * *include*: will return an object that includes **only the filter keys** (excludes all others).
 *  * *exclude*: will return an object that **excludes the filter keys** (includes all others).
 */
const objectTrim = (config: {
  targetObject: Record<string, any>;
  filterType: ValidTypes;
  filters: string | string[];
}) => {
  const {
    targetObject,
    filterType,
    filters
  } = config;
  const returnObj: Record<string, any> = {};

  if (!VALID_FILTER_TYPES.includes(filterType)) return targetObject;

  const objKeys = Object.keys(targetObject);
  const filterKeys = Array.isArray(filters)
    ? [...filters]
    : [filters];

  const checkedFilterKeys = filterKeys.filter((key: string) =>
    objKeys.includes(key)
  );

  if (!(objKeys.length && filterKeys.length && checkedFilterKeys.length))
    return targetObject;

  const targetKeys = objKeys.filter(key => {
    const isAmongCheckedKeys = checkedFilterKeys.includes(key);
    return filterType === "include" ? isAmongCheckedKeys : !isAmongCheckedKeys;
  });

  targetKeys.forEach(key => (returnObj[key] = targetObject[key]));

  return returnObj;
};

export default objectTrim;
