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

const [
  firstProp,
  secondProp,
  thirdProp,
  firstName,
  surname,
  details,
  address,
  city,
  street,
  streetNumber,
  country,
  favorites,
  food,
  sport,
  book,
  order,
  price,
] = [
  "firstProp",
  "secondProp",
  "thirdProp",
  "firstName",
  "surname",
  "details",
  "address",
  "city",
  "street",
  "streetNumber",
  "country",
  "favorites",
  "food",
  "sport",
  "book",
  "order",
  "price",
];

const flatObjectExample = { firstProp, secondProp, thirdProp },
  flatObjectMock1: TestObject = {
    targetObject: flatObjectExample,
    filters: "secondProp",
    recursive: false,
    filterType: "exclude",
    expected: { firstProp, thirdProp },
    tag: "flatObjectMock1",
  },
  flatObjectMock2: TestObject = {
    ...flatObjectMock1,
    filters: "invalid",
    regexFilters: /invalid/,
    expected: flatObjectExample,
    tag: "flatObjectMock2",
  },
  flatObjectMock3: TestObject = {
    ...flatObjectMock1,
    filterType: "include",
    expected: { secondProp },
    tag: "flatObjectMock3",
  },
  flatObjectMock4: TestObject = {
    ...flatObjectMock1,
    filters: undefined,
    regexFilters: /prop/i,
    expected: {},
    tag: "flatObjectMock4",
  },
  flatObjectMock5: TestObject = {
    ...flatObjectMock3,
    filterType: "include",
    filters: undefined,
    regexFilters: /ir/i,
    expected: { firstProp, thirdProp },
    tag: "flatObjectMock5",
  };

const nestedFavoritesExample = {
    firstName,
    surname,
    favorites: { food, sport, book, person: { firstName, surname } },
  },
  nestedFavoritesMock1: TestObject = {
    targetObject: nestedFavoritesExample,
    recursive: false,
    filterType: "exclude",
    filters: ["firstName", "surname", "sport"],
    expected: {
      favorites: { food, sport, book, person: { firstName, surname } },
    },
    tag: "nestedFavoritesMock1",
  },
  nestedFavoritesMock2: TestObject = {
    targetObject: nestedFavoritesExample,
    recursive: true,
    filterType: "exclude",
    filters: ["firstName", "surname", "sport"],
    expected: { favorites: { food, book, person: {} } },
    tag: "nestedFavoritesMock2",
  },
  nestedFavoritesMock3: TestObject = {
    ...nestedFavoritesMock2,
    filters: undefined,
    regexFilters: [/oo[^k]/, /name/i],
    expected: { favorites: { sport, book, person: {} } },
    tag: "nestedFavoritesMock3",
  },
  nestedFavoritesMock4: TestObject = {
    ...nestedFavoritesMock3,
    filters: "favorites",
    filterType: "include",
    expected: {
      firstName,
      surname,
      favorites: { food, person: { firstName, surname } },
    },
    tag: "nestedFavoritesMock4",
  };

const mapAddress = new Map([
  ["address", "address"],
  ["city", "city"],
]);
const arrDetails = [{ favorites: { food, sport, book } }];

const nestedWithExcludedType = {
    firstName,
    surname,
    objDetails: { favorites: { food, sport, book } },
    arrDetails,
    objAddress: { address, city },
    mapAddress,
  },
  nestedWithExcludedTypeMock1: TestObject = {
    targetObject: nestedWithExcludedType,
    filterType: "exclude",
    filters: ["address", "city"],
    regexFilters: /oo[a-z]$/,
    recursive: true,
    expected: {
      firstName,
      surname,
      objDetails: { favorites: { sport } },
      arrDetails,
      objAddress: {},
      mapAddress,
    },
    tag: "nestedWithExcludedTypesMock1",
  };

const mockTestObjects: MockTestObjects = [
  flatObjectMock1,
  flatObjectMock2,
  flatObjectMock3,
  flatObjectMock4,
  flatObjectMock5,
  nestedFavoritesMock1,
  nestedFavoritesMock2,
  nestedFavoritesMock3,
  nestedFavoritesMock4,
  nestedWithExcludedTypeMock1,
];
export default mockTestObjects;
