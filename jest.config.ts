import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const customConfig: Config = {
  coverageProvider: "v8",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/app/api/**/*.ts",
    "middleware.ts",
    "!**/*.d.ts",
  ],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
  ],
};

export default createJestConfig(customConfig);
