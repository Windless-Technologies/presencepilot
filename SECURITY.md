# Security Policy

## Reporting a vulnerability

Email **hr@bravehaven.io** with "Security: PresencePilot" in the subject line. Please do not open a public issue.

Include what you found, how to reproduce it, and the impact you expect. You will get an acknowledgement within three business days and a plan for a fix after triage.

## Supported versions

Only the current production deployment is supported. Fixes ship to `main` and deploy from there.

## Commitments

- Zero known vulnerabilities in production dependencies, checked in CI on every pull request
- Dependencies updated weekly through Dependabot, once a release is a week old
- Every push and pull request scanned for secrets, and the full history scanned weekly
- Static analysis (CodeQL) on every pull request
- GitHub Actions pinned to commit SHAs, and every workflow limited to reading the repository unless it says why it needs more
- Secrets never stored in the repository; every required variable is listed in `.env.example` with a placeholder

## How PresencePilot is protected today

PresencePilot will hold review data, platform access tokens and business account details. This section says what is in place now and what is planned, so nobody relies on a control that does not exist yet.

### In place

- Sign-in uses NextAuth.js with Google. The session is a JSON Web Token in an `HttpOnly` cookie, signed and encrypted with `NEXTAUTH_SECRET`, and marked `Secure` when the site is served over HTTPS
- `.env` and `.env*.local` are gitignored; production keys live only in the host's environment variables
- Server errors are reported to Sentry from the server only, in production only, with headers, cookies, bodies, query strings and the user removed and email addresses and long numbers redacted (`src/instrumentation.ts`, `src/lib/sentry-scrub.ts`)
- CI runs the standards check, lint, typecheck, unit tests, the production build and the dependency audit; the secret scan and CodeQL run alongside

### Planned (in progress, not built yet)

- Role-based access (admin, user), checked on the server for every request and every record
- Field-level encryption for stored platform access and refresh tokens
- Rate limiting on sign-in and on every route that sends email
- Bot protection on every form a visitor submits
- An audit log of sensitive operations (deletes, publishing, staff access)
- Secret rotation on a schedule and when someone with access leaves
