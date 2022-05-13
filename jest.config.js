/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  preset: "ts-jest/presets/js-with-ts-esm",
  transform: {
    "\\.[jt]sx?$": "ts-jest",
  },
  moduleNameMapper: {
    "(.+)\\.js": "$1",
  },
  testEnvironment: "node",
  maxWorkers: 1,
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};
