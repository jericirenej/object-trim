import type { ObjectFilterArgs } from "../index";

/* A collection of mockObjects for additional testing
   of objectFilter execution in different contexts after 
   after verifying it through base tests.
 */

interface TestObject extends ObjectFilterArgs {
  expected: Record<string, any>;
  tag: string;
}

type MockTestObjects = TestObject[];

const johnDoe = { name: "John", surname: "Doe" },
  juniorDoe = { name: "Junior", surname: "Doe" },
  motherDoe = { name: "Mother", surname: "Doe" },
  fatherDoe = { name: "Father", surname: "Doe" },
  grandMotherDoe = { name: "GrandMother", surname: "Doe" },
  grandFatherDoe = { name: "GrandFather", surname: "Doe" };

const familyTree = {
  ...johnDoe,
  children: juniorDoe,
  parents: {
    mother: {
      ...motherDoe,
      children: johnDoe,
      parents: {
        mother: {
          ...grandMotherDoe,
          children: motherDoe,
        },
        father: {
          ...grandFatherDoe,
          children: motherDoe,
        },
      },
    },
    father: {
      ...fatherDoe,
      children: johnDoe,
      parents: {
        mother: {
          ...grandMotherDoe,
          children: fatherDoe,
        },
        father: {
          ...grandFatherDoe,
          children: fatherDoe,
        },
      },
    },
  },
};

const familyFlatTestExclude: TestObject = {
  targetObject: familyTree,
  recursive: false,
  filterType: "exclude",
  filters: ["parents", "children"],
  expected: { name: "John", surname: "Doe" },
  tag: "familyFlatTestExclude",
};
const familyFlatTestInclude: TestObject = {
  ...familyFlatTestExclude,
  filterType: "include",
  filters: "parents",
  expected: { parents: familyTree.parents },
  tag: "familyFlatTestExclude",
};
const familyFlatWithRedundantFilter: TestObject = {
  ...familyFlatTestExclude,
  filters: ["parents", "shmarents"],
  filterType: "include",
  expected: { parents: familyTree.parents },
  tag: "familyFlatWithRedundantFilter",
};

const familyRecursiveIncludeChildren: TestObject = {
  targetObject: familyTree,
  recursive: true,
  regexFilters: /child/,
  filterType: "include",
  expected: {
    children: juniorDoe,
    parents: {
      mother: {
        children: johnDoe,
        parents: {
          mother: { children: motherDoe },
          father: { children: motherDoe },
        },
      },
      father: {
        children: johnDoe,
        parents: {
          mother: { children: fatherDoe },
          father: { children: fatherDoe },
        },
      },
    },
  },
  tag: "familyRecursiveIncludeChildren",
};

const familyRecursiveExcludeChildren: TestObject = {
  ...familyRecursiveIncludeChildren,
  filterType: "exclude",
  expected: {
    ...johnDoe,
    parents: {
      mother: {
        ...motherDoe,
        parents: {
          mother: { ...grandMotherDoe },
          father: { ...grandFatherDoe },
        },
      },
      father: {
        ...fatherDoe,
        parents: {
          mother: { ...grandMotherDoe },
          father: { ...grandFatherDoe },
        },
      },
    },
  },
  tag: "familyRecursiveExcludeChildren",
};

const familyRecursiveIncludeChildrenAndName: TestObject = {
  ...familyRecursiveIncludeChildren,
  filters: ["name"],
  expected: {
    name: johnDoe.name,
    children: { name: juniorDoe.name },
    parents: {
      mother: {
        name: motherDoe.name,
        children: { name: johnDoe.name },
        parents: {
          father: {
            name: grandFatherDoe.name,
            children: { name: motherDoe.name },
          },
          mother: {
            name: grandMotherDoe.name,
            children: { name: motherDoe.name },
          },
        },
      },
      father: {
        name: fatherDoe.name,
        children: { name: johnDoe.name },
        parents: {
          father: {
            name: grandFatherDoe.name,
            children: { name: fatherDoe.name },
          },
          mother: {
            name: grandMotherDoe.name,
            children: { name: fatherDoe.name },
          },
        },
      },
    },
  },
  tag: "familyRecursiveIncludeChildrenAndName",
};

const familyRecursiveExcludeChildrenAndName: TestObject = {
  ...familyRecursiveIncludeChildrenAndName,
  filterType: "exclude",
  expected: {
    surname: johnDoe.surname,
    parents: {
      mother: {
        surname: motherDoe.surname,
        parents: {
          father: { surname: grandFatherDoe.surname },
          mother: { surname: grandMotherDoe.surname },
        },
      },
      father: {
        surname: fatherDoe.surname,
        parents: {
          father: { surname: grandFatherDoe.surname },
          mother: { surname: grandMotherDoe.surname },
        },
      },
    },
  },
  tag: "familyRecursiveExcludeChildrenAndName",
};

const mockTestObjects: MockTestObjects = [
  familyFlatTestExclude,
  familyFlatTestInclude,
  familyFlatWithRedundantFilter,
  familyRecursiveIncludeChildren,
  familyRecursiveExcludeChildren,
  familyRecursiveIncludeChildrenAndName,
  familyRecursiveExcludeChildrenAndName,
];
export default mockTestObjects;
