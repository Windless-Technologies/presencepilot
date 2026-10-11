// Unit tests (npm run test:unit). ts-jest compiles TypeScript; tests run in
// Node unless a file asks for another environment.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // tests/ holds the Playwright browser suites (`npm run test:a11y`).
  // *.test.mjs files use node:test and run with `node --test` (the link check
  // workflow's first step and CLAUDE.md's before-push list).
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '<rootDir>/tests/',
    '\\.test\\.mjs$'
  ]
}
