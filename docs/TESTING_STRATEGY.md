## Overview

PresencePilot uses a layered testing approach to ensure quality, prevent regressions, and support scalable development. This page says what runs today and what is planned.

---

## Tools

- **Unit Testing:** Jest (in use). React Testing Library is installed for component tests (none yet)
- **Accessibility and E2E Testing:** Playwright with axe-core, against a production build (in use)
- **Linting & Formatting:** ESLint, Prettier
- **CI:** GitHub Actions
- Cypress is installed but has no specs; new flows are written in Playwright

---

## Unit Tests

- Run with:
```bash
npm test
```

- Test focus today: sign-in rules (`src/lib/sign-in.ts`), the Sentry setup and scrubber, the resilience helper, security headers and BotID test mode, the local database guard, and that the privacy policy names every processor in the data inventory
- Planned: hooks (`useReviews`, `useScheduledPosts`) and component logic as those features are built
- Every bug fix comes with the test that would have caught it, and every security fix with a test that attempts the attack

---

## Accessibility and End-to-End Tests

- Run with:
```bash
npx playwright install chromium   # once
npm run test:a11y
```
- `tests/a11y/pages.spec.ts` scans every page with axe-core, passing the WCAG 2.1 A and AA and WCAG 2.2 AA tags explicitly, at desktop and phone widths, and fails a page wider than a phone screen. Add every new page to it
- `tests/e2e/` covers the sign-in page (all three provider buttons, unconfigured providers, a configured provider's start, refusals and BotID), security headers, and the legal footer
- Planned flows as they are built: dashboard navigation, review responses, post scheduling
- Tests take their port from `PLAYWRIGHT_PORT` (default 3100) and never retry: a test that passes on a retry is flaky, and a flaky test is a bug to fix

---

## Test Coverage

- Track coverage % via `npx jest --coverage`

---

## CI Enforcement

GitHub Actions runs, in order:
- Standards check (`scripts/check-standards.mjs`)
- Lint
- Typecheck
- Jest unit tests
- Playwright accessibility scan and end-to-end tests
- Build check (Next.js)
- Dependency audit (production advisories block the merge)

Alongside: the TruffleHog secret scan and CodeQL static analysis.
