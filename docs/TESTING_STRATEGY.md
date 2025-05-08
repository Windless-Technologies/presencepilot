## Overview

PresencePilot uses a multi-layered testing approach to ensure quality, prevent regressions, and support scalable development.

---

## Tools

- **Unit Testing:** Jest, React Testing Library
- **E2E Testing:** Cypress
- **Accessibility Testing:** jest-axe, cypress-axe
- **Linting & Formatting:** ESLint, Prettier
- **CI:** GitHub Actions

---

## Unit Tests

- Run with:
```bash
npm run test:unit
```

- Test Focus:
  - Hooks (`useReviews`, `useScheduledPosts`)
  - Utility functions
  - Pure logic inside components

---

## Integration & E2E Tests

- Tool: Cypress
- Run headless:
```bash
npm run test:e2e
```
- Open Cypress GUI:
```bash
npx cypress open
```

Test flows include:
- Auth login/ Google login → dashboard redirect
- Review fetch → display → respond
- Schedule → view → delete post

---

## Accessibility Tests

### Unit
```bash
npm run test:unit
```
- Uses `jest-axe` to check common a11y violations on components

### E2E
- Uses `cypress-axe` in flows like:
  - Login
  - Dashboard navigation
  - Review responses

---

## Test Coverage

- Track coverage % via `jest --coverage`
- Smoke tests via Cypress for:
- Unit tests
  - E2E smoke flows
  - a11y violations
  - Auth flow
  - Dashboard loading
  - Post scheduling

---

## CI Enforcement

GitHub Actions runs:
- Lint
- Type-check
- Jest Unit tests
- Cypress E2E (smoke test)
- Build check (Next.js)
