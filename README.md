# Object filtering
**Easily filter object by their properties - then get the filtered object back!**
- Two types of filtering available: that will either 1) either exclude all of the matched properties or 2) include only the matched properties.
- Recursive filtering option.
  - Recursive filtering will not inspect arrays, sets, and maps.

## Usage
- Install the package via `npm install @jericirenej/object-filter`.
  - You can also clone the repo and transpile the files manually (`npm install`, followed by `npx tsc` which will transpile to `dist`).
- Import the objectFilter function and pass it the appropriate configuration object.

```ts
import objectFilter from "object-filter";

/*
objectFilterConfig: {
  targetObject: Record<string,any>,
  filters: string|string[],
  filterType?: "include"|"exclude",  --- defaults to exclude.
  recursive?:boolean,                --- defaults to false.

}
*/

const employeeInfo = {
  name: "John",
  surname: "Doe",
  personalInfo: {
    age: 30,
    sensitive1: "secret",
  },
  sensitive2: "secret",
};

const excludeSensitive = {
  targetObject: employeeInfo,
  filters: ["sensitive1", "sensitive2"],
  filterType: "exclude",
  recursive: true,
};

const cleanedEmployeeInfo = objectFilter(excludeSensitive);
// Will return
{
  name: "John",
  surname: "Doe",
  personalInfo: {
    age: 30,
  },
};

const includeSensitive = {
  targetObject: employeeInfo,
  filters: ["personalInfo", "sensitive1", "sensitive2"],
  filterType: "include",
  recursive: true,
}

const sensitiveEmployeeInfo = objectFilter(includeSensitive);

//Will return
{
  sensitive2: "secret",
  personalInfo: {
    sensitive1: "secret,
  }
}

```

### Things to note
- Although the filterObject function creates a new object based on the old one, **this is a shallow copy, not a clone"**. If you need to ensure immutability, use an appropriate library (`lodash`, `immer`), to clone the result.
- If an _invalid_ `filterType` is supplied, the original object will be returned unmodified.
- When using the `include` filterType together with the `recursive` option, please note, that if filters target a nested property, their parent has to be provided as well, as it will be filtered out otherwise.
- If you are working with `TypeScript`, make sure to type cast the returned object, as its type will be `Record<string,any>` by default.

## Planned additional features
* Regex matching of properties.
* Tranpoline recursive calls.