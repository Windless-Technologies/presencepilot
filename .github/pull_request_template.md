## Summary

<!-- What this pull request does and why, in two or three sentences. Before and after examples help. -->

## Changes

-

## Why this approach

<!-- The problem this solves, the alternatives considered, and the tradeoff accepted. -->

## Acceptance criteria

- [ ] The feature or fix works as intended
- [ ] Data is correctly rendered or passed
- [ ] Styling and spacing match the expected layout
- [ ] No new lint or runtime errors

## How it was verified

- [ ] `node scripts/check-standards.mjs`: Standards checks
- [ ] `trufflehog git file://. --since-commit origin/main --results=verified,unknown --fail`: No secrets in the new commits
- [ ] `semgrep scan --config p/default --error --metrics=off`: No static analysis findings
- [ ] `npm run lint`: Lint
- [ ] `npx tsc --noEmit`: Typecheck
- [ ] `npm test`: Unit tests
- [ ] `npm run test:a11y`: Accessibility scan of every page, desktop and phone, against a production build
- [ ] `npm run build`: Production build
- [ ] `npm audit --omit=dev --audit-level=low`: No known vulnerabilities in production dependencies
- [ ] New behavior has a test; a bug fix has the test that would have caught it; a security fix has a test that attempts the attack; new pages are in `tests/a11y/pages.spec.ts`
- [ ] Clicked through the change in a running build, in Chrome and Firefox, and at phone width

## Screenshots

<!-- Required for UI changes. Before and after where useful. -->

## Documentation

- [ ] README still describes what the code actually does
- [ ] `CHANGELOG.md` updated under `Unreleased`
- [ ] `docs/DATA_INVENTORY.md` and the privacy policy updated if personal data handling changed
- [ ] `.env.example` updated if new environment variables were added

## Risk and rollback

<!-- What could break, who would notice, and how to undo it. Mention performance or security considerations. -->

## Related issue

Closes #

## Notes for reviewers

<!-- Where to look first, open questions, blockers, edge cases, follow-ups. -->
