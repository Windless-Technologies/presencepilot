# Changelog

Notable changes to PresencePilot, newest first. Versions follow semantic versioning: major for breaking changes to users, an API, or stored data; minor for new capabilities; patch for fixes.

Every pull request adds its entry under `Unreleased`. At release time, `Unreleased` becomes the version number and date, and a GitHub release is cut from a tag on `main`.

## [Unreleased]

### Added (legal pages)
- `/privacy`, `/terms` and `/accessibility`, linked from a footer on every page. The privacy policy is written from `docs/DATA_INVENTORY.md` and names every processor in it (Google, GitHub, LinkedIn, Sentry and Vercel), with a test that fails when the inventory lists a processor the policy does not. The accessibility statement follows the engineering standards' template and says plainly that the site is partially conformant until a manual audit is done. All three pages are in the accessibility scan
- No analytics run on the site, so there is no consent banner; the privacy policy says so

### Security (headers and bot protection)
- Every response now sends a Content Security Policy that allows scripts, styles, fonts, images, frames and requests only from this site, forbids other sites from framing it, and lets forms post only here, plus `Strict-Transport-Security` (two years), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and a `Permissions-Policy` that turns off features the site does not use. The `X-Powered-By` header is gone
- Starting a Google, GitHub or LinkedIn sign-in is checked by Vercel BotID on the server before anything else, and refused with a 403 and a plain message on the login page when BotID does not confirm a person or the check itself fails. Tests choose BotID's verdict through a local test mode that cannot switch on in a Vercel deployment. The data inventory lists BotID's browser signals

### Security (database scripts)
- `scripts/seed.ts` and `scripts/reset-db.ts` refuse to run against anything but a database on this machine, and refuse to run on any Vercel deployment, so a mistyped or production `DATABASE_URL` can never be dropped or filled with fictional people. Errors say what is wrong without printing the URL, which can hold a password
- `scripts/reset-db.ts` runs `dropdb`, `createdb` and `psql` without a shell, with every value as its own argument and any password passed through the environment, instead of building shell commands from `DATABASE_URL`. The seed lookup uses a parameterized query

### Fixed (database scripts)
- The reset script reported "Database reset complete" when seeding had failed. `psql` now stops at the first error and the script fails. It currently fails every time, because `scripts/seed.sql` expects `users`, `reviews` and `posts` tables that no file in the repository creates; see the README

### Added (sign-in)
- The login page always shows Continue with Google, GitHub and LinkedIn, as the engineering standards require. A provider whose keys are not set yet says "<Provider> sign-in isn't available yet." in place when pressed, instead of disappearing or leading to an error page. GitHub and LinkedIn are new; LinkedIn uses its current OpenID Connect sign-in
- After signing in, people land on onboarding; when a sign-in is refused they come back to the login page with a plain message (for example, when the provider has not confirmed their email, or GitHub cannot be reached) rather than NextAuth's error page
- Calls to GitHub during sign-in go through the engineering standards' resilience helper (`src/lib/fetch-with-resilience.ts`, with its tests): a 5-second limit per attempt, an overall deadline, and at most two retries of a temporary failure

### Security (sign-in)
- A provider sign-in is accepted only with an email the provider marks as verified. For GitHub, only the account's verified primary address is used, so an address someone added to their GitHub account without verifying cannot be used to sign in as its owner
- The Google access token was copied into the session, where any script on the page could read it from `/api/auth/session`. Sessions now hold only the name, verified email, picture and account id
- Sessions end 30 days after sign-in however active, as well as after 7 days without a visit. Sessions issued before this change carry no sign-in time and end at once, so everyone signs in again
- Session cookies are `Secure` on every Vercel deployment as well as whenever `NEXTAUTH_URL` is HTTPS, and stay `HttpOnly` and `SameSite=Lax`
- The email and password fields on the login page never did anything. They are now labeled, switched off, and marked "Email sign-in is coming soon", so nobody types a password that goes nowhere
- `.env.example` values are blank instead of placeholders such as `your_google_client_id`: code treats a blank value as unset, but a placeholder would have switched Google on with keys that do not work

### Added (accessibility)
- Every page is scanned by axe-core through Playwright on every pull request, with the WCAG 2.1 A and AA and WCAG 2.2 AA tags passed explicitly, at desktop and phone widths, against a production build (`npm run test:a11y`, `tests/a11y/pages.spec.ts`). The scan also fails a page that is wider than a phone screen

### Fixed (accessibility)
- The homepage was the create-next-app starter, with no heading and links to Vercel's marketing pages. It now says what PresencePilot is and what is in development, with a link to sign in
- The page title was "Create Next App"; it is now "PresencePilot"
- The email and password fields on the login page had 2.1 to 1 text contrast; they now have 12.6 to 1, with a visible border. On phones the illustration sits above the form instead of squeezing beside it
- Onboarding text, step labels and the Previous button were below 4.5 to 1 contrast on their backgrounds; the green Next button and completed-step badge were 2.3 to 1 with white text. All now pass

### Changed (fonts)
- Fonts are served from this site. Geist comes from the `geist` package instead of `next/font/google`, which fetched it from Google at build time, and the login page's Poppins is vendored from Fontsource (SIL Open Font License, `src/fonts/`) instead of a stylesheet import from Google Fonts that sent every visitor's address to Google

### Added (monitoring and privacy records)
- `docs/DATA_INVENTORY.md` records what personal data PresencePilot handles today (Google sign-in in an encrypted session cookie, scrubbed Sentry error reports), what is collected only in the browser and never sent (the onboarding wizard, the placeholder email and password fields), every processor (Google, Sentry, and Vercel once deployed), the sign-in cookies, and how privacy requests are answered. The legal entity that operates PresencePilot is marked for confirmation
- A test pins what `src/instrumentation.ts` gives Sentry: reports only from production with `SENTRY_DSN` set (a blank value counts as unset), `sendDefaultPii` off, no tracing or breadcrumbs, every event scrubbed, and `onRequestError` wired. The Sentry setup itself already matched the engineering standards' monitoring template and is unchanged

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
- Production dependencies have no known vulnerabilities (`npm audit --omit=dev --audit-level=low` is clean). Next.js moves from 15.3.3 to 15.5.27 and NextAuth from 4.24.11 to 4.24.15, which between them close two critical advisories and the Preact, nanoid, sharp, source-map-js and uuid advisories they pulled in. Next.js 15 pins a PostCSS release with four published advisories, so `overrides` holds PostCSS at 8.5.28 everywhere, including inside Next.js. Development dependencies still report advisories that only a major upgrade fixes (Jest 30, Cypress 16, lint-staged 16, Vitest 5 and the Storybook test addon); they are listed in the pull request and will be fixed separately. Every upgraded package is a release at least seven days old, the same wait Dependabot uses, except Handlebars 4.7.10, a security release
