# Instructions for AI coding assistants

PresencePilot follows Erica Thompson's engineering standards (the `engineering-standards` repository, `STANDARDS.md`). The rules below are the ones most often missed.

## Layout

- Next.js 15 App Router with one route tree: `src/app/`. Never add a root `app/` or a `pages/` directory
- `src/lib/` holds server code (sign-in, error scrubbing); `src/components/` holds UI; `scripts/` holds the standards check and the local database scripts
- The team uses npm. `package-lock.json` is committed and CI installs with `npm ci`

## Before you push

Run what CI runs, in this order, and push only when all pass:

```bash
node scripts/check-standards.mjs
trufflehog git file://. --since-commit origin/main --results=verified,unknown --fail
semgrep scan --config p/default --error --metrics=off
npm run lint
npx tsc --noEmit
npm test
npm run build
npm audit --omit=dev --audit-level=low
```

The secret scan and Semgrep need `trufflehog` and `semgrep` installed locally (`brew install trufflehog semgrep`, or `pip install semgrep`). They are the same scans CI runs (`.github/workflows/secrets.yml` and `codeql.yml`), so a finding never reaches a pull request. Run `actionlint` on any workflow you change.

`npm audit --audit-level=low` (development dependencies too) is reported in CI and still fixed where a fix exists. Husky runs lint-staged on commit and the typecheck on push; let the hooks run and fix what they flag.

## Never

- Claim a feature, technology, or number in a README or on a page that the code does not support. Label planned work as in progress
- Skip, disable, or quarantine a failing test to get CI green
- Remove a CI step because it fails. Fix the cause
- Silence an accessibility violation with an exclusion. Fix the markup
- Add a personal email address or a link to a private repository
- Commit secrets or real `.env` files, or ask for a key to be pasted into chat. Keys go straight into the Vercel project's environment variables
- Put a credential-shaped sample (a database URL with a user and password) in `.env.example`, a test or a document. Describe the value in words
- Collect personal data the product does not need
- Accept a form submission without a Vercel BotID check (`isConfirmedHuman()`), or let it pass when the check fails
- Hide or make optional the Google, GitHub or LinkedIn sign-in buttons. A provider without keys is a setup task, not a reason to hide its button
- Accept a provider sign-in whose email the provider has not verified
- Let an account sign in before its email is confirmed, or confirm an email when its link is merely opened
- Name a domain the product does not own, or `localhost`, in production URLs, metadata, sitemaps, emails or auth settings
- Connect to a database with `rejectUnauthorized: false`, or let a preview build change a database
- Return internal error details to a client, or build a query, command or HTML by joining strings
- Trust anything checked only in the browser: validate every input on the server with a schema
- Store a secret or personal data in logs, analytics, error reports or URLs
- Load fonts or other assets from a third-party network at build time
- Pin a GitHub Action to a tag instead of a commit SHA, or give a workflow more than `contents: read` without a stated reason
- Kill processes you did not start on a shared machine

## Always

- Add new pages to the accessibility scan once it exists (`tests/a11y/`), with the WCAG 2.1 AA and 2.2 AA tags passed to axe explicitly
- Add a test with every bug fix, and a test that attempts the attack with every security fix
- Check recent commits and open pull requests before starting; another session may be working in the same files
- Rate limit sign-in, registration, password reset and any route that sends email
- Check the `error` of every database call
- Add an entry to `CHANGELOG.md` under `Unreleased` for every change a user, client, or developer would notice
- Update `docs/DATA_INVENTORY.md` and the privacy policy together when a feature starts collecting, storing, or sharing personal data
- Use the pull request template. Include screenshots for UI changes
- Keep pull requests small and single-purpose
- Write the pull request title as the final commit message: pull requests are squash merged, so the title becomes the commit on `main`
- Write commit messages that explain why

## When unsure

Ask rather than guess. A wrong assumption that ships costs more than a question.
