import type { ObjectTrim } from "./types.js";
/** Filter an object based on its keys that are checked against a string array.
 *  Supply a configuration object, that has the targetObject, filterType, and filterKeys present.
 * Two types of filtering available in filterType:
 *  * *include*: will return an object that includes **the filter keys only**.
 *  * *exclude*: will return an object that **excludes the filter keys**.
 */
const objectTrim: ObjectTrim = args => {
  const { filterType, filterKeys, targetObject } = args;
  const returnObj: Record<string, any> = {};
  const objKeys = Object.keys(targetObject);
  const checkedFilterKeys = filterKeys.filter((key: string) =>
    objKeys.includes(key)
  );

  if (!(objKeys.length && filterKeys.length && checkedFilterKeys.length))
    return targetObject;

  const targetKeys = objKeys.filter(key => {
    const isAmongCheckedKeys = checkedFilterKeys.includes(key);
    if (filterType === "include") {
      return isAmongCheckedKeys;
    }
    return !isAmongCheckedKeys;
  });
  targetKeys.forEach(key => (returnObj[key] = targetObject[key]));
  return returnObj;
};

export default objectTrim;
