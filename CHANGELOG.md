# Changelog

Notable changes to PresencePilot, newest first. Versions follow semantic versioning: major for breaking changes to users, an API, or stored data; minor for new capabilities; patch for fixes.

Every pull request adds its entry under `Unreleased`. At release time, `Unreleased` becomes the version number and date, and a GitHub release is cut from a tag on `main`.

## [Unreleased]

### Added (engineering standards baseline)
- PresencePilot adopts the engineering standards. `scripts/check-standards.mjs` (read from `standards.config.json`) runs first in CI and fails on personal email addresses, links to private repositories, a second route tree, or error tracking that drifts from the monitoring template
- A secret scan (TruffleHog) runs on every push and pull request and over the full history weekly, and CodeQL static analysis runs on every pull request
- Dependabot proposes npm and GitHub Actions updates weekly, grouped, once a release is seven days old; security updates are not delayed
- `CLAUDE.md` tells AI coding assistants the standards and this repository's commands. `SECURITY.md` at the root says how to report a vulnerability to hr@bravehaven.io and what is in place versus planned. `.github/release.yml` groups release notes by label, and `CODEOWNERS` covers sign-in, data access and CI paths

### Changed (engineering standards baseline)
- CI runs on every pull request whatever its base branch, with every action pinned to a commit SHA and read-only permissions, in the order standards check, lint, typecheck, tests, build, then the dependency audit (production blocking, development reported). It installs with `npm ci` from the committed lockfile instead of `npm install`
- Node is pinned to 22 (`.nvmrc` and `engines`), with `@types/node` on the same major, so Vercel runs the version CI tests. The stale Yarn `packageManager` field is gone: the project installs with npm
- One pull request template, one security policy and one set of issue forms instead of duplicates. The bug form no longer asks for a contact email (GitHub already shows who filed it) or for agreement to a code of conduct the repository does not have

### Security
- Production dependencies have no known vulnerabilities (`npm audit --omit=dev --audit-level=low` is clean). Next.js moves from 15.3.3 to 15.5.27 and NextAuth from 4.24.11 to 4.24.15, which between them close two critical advisories and the Preact, nanoid, sharp, source-map-js and uuid advisories they pulled in. Next.js 15 pins a PostCSS release with four published advisories, so `overrides` holds PostCSS at 8.5.28 everywhere, including inside Next.js. Development dependencies still report advisories that only a major upgrade fixes (Jest 30, Cypress 16, lint-staged 16, Vitest 5 and the Storybook test addon); they are listed in the pull request and will be fixed separately
