/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
  },
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**/*.ts", "routes/**/*.ts"],
  coverageReporters: ["text", "lcov"],
};
