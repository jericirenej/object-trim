# Object filtering

**Easily filter object by their properties - then get the filtered object back!**
- Two types of filtering available: 1) exclude all of the supplied property names, 2) include only the supplied property names.
- Recursive filtering available.
  - Recursive filtering will not inspect arrays, sets, and maps.

## Usage

- Install the package via `npm install @jericirenej/object-filter`.
  - You can also clone the repo and transpile the files manually, by first running `npm install` and then `npx tsc`. The files will be located in the `dist` folder.
- Import the objectFilter function (ES6 import), then supply it with the appropriate config object to get the result.

```ts
import objectFilter from "object-filter";

/*
configObjectType: {
  targetObject: Record<string,any>,
  filters: string|string[],
  filterType: "include"|"exclude",  --- will default to exclude, if not provided
  recursive?:boolean,               --- by default, recursive filtering is off.

}
*/

const employeeInfo = {
  name: "John",
  surname: "Doe",
  personalInfo: {
    age: 30,
    sensitiveInfo1: "secret",
  },
  sensitiveInfo2: "secret",
};

const excludeSensitive = {
  targetObject: employeeInfo,
  filters: ["sensitiveInfo1", "sensitiveInfo2"],
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
  filters: ["personalInfo", "sensitiveInfo1", "sensitiveInfo2"],
  filterType: "include",
  recursive: true,
}

const sensitiveEmployeeInfo = objectFilter(includeSensitive);

//Will return
{
  sensitiveInfo2: "secret",
  personalInfo: {
    sensitiveInfo1: "secret,
  }
}

```

### Things to note

- The function will default to `exclude` if no `filterType` is supplied.
- If an _invalid_ `filterType` is supplied, the original object will be returned unmodified.
- If you are using the `include` filterType, together with the `recursive` option, please note, that if one of the filters refers to a nested property, you will have to specify their parent as well, as it will be filtered out otherwise, before the nested property could be reached (the case of including the "personalInfo" filter in the example above).
- If you are working with `TypeScript`, make sure to type cast the returned object, as its type will be `Record<string,any>` by default.

## Planned additional features
* Regex matching of properties.