# Changelog

Notable changes to PresencePilot, newest first. Versions follow semantic versioning: major for breaking changes to users, an API, or stored data; minor for new capabilities; patch for fixes.

Every pull request adds its entry under `Unreleased`. At release time, `Unreleased` becomes the version number and date, and a GitHub release is cut from a tag on `main`.

## [Unreleased]

### Security
- Production dependencies have no known vulnerabilities (`npm audit --omit=dev --audit-level=low` is clean). Next.js moves from 15.3.3 to 15.5.27 and NextAuth from 4.24.11 to 4.24.15, which between them close two critical advisories and the Preact, nanoid, sharp, source-map-js and uuid advisories they pulled in. Next.js 15 pins a PostCSS release with four published advisories, so `overrides` holds PostCSS at 8.5.28 everywhere, including inside Next.js. Development dependencies still report advisories that only a major upgrade fixes (Jest 30, Cypress 16, lint-staged 16, Vitest 5 and the Storybook test addon); they are listed in the pull request and will be fixed separately
