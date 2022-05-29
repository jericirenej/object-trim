# Object filtering

**Easily filter object by their properties - then get the filtered object back!**

- Two types of filtering available:
  - Exclude all of the matched properties or
  - Include only the matched properties.
- Filter by a list names or regex filters.
- Recursive filtering available.
  - Recursive filtering will not filter within arrays, sets, maps, dates, and other in-built classes.

## What's new in version 1.3

- **Improved inclusive filtering**: you no longer have to specify all the properties that lead to the target property to be included. Specify only those that you want to keep and the algorithm does the rest!
- Filtering is now recursive by default, if not specified otherwise.
- Compatibility with ES6 _and_ CommonJS module systems.
- Completely reworked filtering logic.

## Detailed usage info

For a detailed description package use, filter types specifics and other important notes, be sure to **visit the [project's wiki](https://github.com/jericirenej/object-filter/wiki)!**

## Installation and basic info

- Install the package via `npm install @jericirenej/object-filter`.
  - You can also clone the repo and transpile the files manually (`npm install`, followed by `npm run compile` which will transpile to `dist`).
- To start using the `objectFilter` function, you can either import or require the function

```ts
// ES6 import
import objectFilter from "@jericirenej/object-filter";

// CommonJS import
const objectFilter = require("@jericirenej/object.filter").default;
```

### Basic usage

`objectFilter` has the following signature:

```ts
const objectFilter = ({
  targetObject: Record<string,any>;
  filters?: string|string[];
  regexFilters?: string|RegExp|(string|RegExp)[]  // At least one filter group must be valid.
  filterType?: "exclude"|"include";               // Will default to exclude.
  recursive?: boolean;                            // Will default to true.
  }) => Record<string,any>
```
