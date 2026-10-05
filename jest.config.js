// Unit tests (npm run test:unit). ts-jest compiles TypeScript; tests run in
// Node unless a file asks for another environment.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/.next/']
}
