# Personal Data Inventory: PresencePilot

The record of what personal data PresencePilot processes, why, where it lives, and for how long, kept as GDPR Article 30 asks. The public privacy policy (`/privacy`) is written from the same facts, so update both in the same pull request whenever a feature starts collecting, storing or sharing something new.

Not legal advice. Have counsel review it before launch.

Last reviewed: 2026-10-09, against the code on `main`: the sign-in route, every page and form, `src/instrumentation.ts`, the database scripts, and every third-party call.

## What exists today

PresencePilot is in development and has no production deployment yet. The only personal data the running code handles is provider sign-in (Google, GitHub or LinkedIn) and server error reports. The review, post and analytics features described in `docs/FEATURE_BRIEF.md` are planned; each one adds its rows here, and to the privacy policy, in the pull request that builds it.

## Controller

| | |
| --- | --- |
| Controller (legal entity) | **To be confirmed by Erica Thompson.** The repository belongs to Windless Technologies; name the legal entity that will operate PresencePilot before launch |
| Contact for privacy requests | hr@bravehaven.io |
| Data protection officer | Not appointed; confirm with counsel whether one is required |
| EU representative | Needed only if the controller is not established in the EU and serves people there. Confirm with counsel |

## Processing activities

| Purpose | Data | Data subjects | Lawful basis | Stored in | Retention | Shared with |
| --- | --- | --- | --- | --- | --- | --- |
| Signing in with Google, GitHub or LinkedIn | The name, profile picture link and account id the chosen provider shares, and the email address it marks as verified. GitHub lists every address on the account; only the verified primary one is kept. The access token the provider issues is used once, on the server, to read that verified address, and is never stored | Business owners and staff who sign in | Contract (GDPR Art. 6(1)(b)): needed to provide the account | Only in the visitor's own browser, inside the session cookie, which is signed and encrypted with the server's secret. Nothing is written to a database | Until sign-out, 7 days without a visit (each visit after the first day extends it), or 30 days after sign-in, whichever comes first | The provider the person chose |
| Running and securing the site | Server error reports in Sentry: error type and message, stack trace, route, page address without its query string, and time. Email addresses and numbers of nine or more digits are redacted before sending; no IP address, cookies, headers, request body, user or breadcrumbs are sent (`src/lib/sentry-scrub.ts`). Sent only from production, and only once `SENTRY_DSN` is set | Anyone whose request causes a server error | Legitimate interests (GDPR Art. 6(1)(f)): keeping the service working | Sentry | Sentry's retention for the plan in use (record it here when the project is created) | Sentry |
| Telling people from bots when they start a sign-in (Vercel BotID) | Signals from the browser and request that BotID uses to tell people from automated bots, such as browser and device characteristics and how the request was made. We receive only a verdict: person or bot | Visitors who press a sign-in button | Legitimate interests (GDPR Art. 6(1)(f)): protecting sign-in from abuse | Nothing is kept by us; Vercel processes the signals to return the verdict | None on our side | Vercel |
| Hosting (planned) | When the site is deployed: IP address, browser, pages requested and time of request, in the host's request logs | Visitors | Legitimate interests (GDPR Art. 6(1)(f)): delivering and protecting the site | Vercel (planned host) | The host's log retention for the plan (record it here at deployment) | Vercel |

### Collected in the browser only, never sent

- **Onboarding wizard** (`/onboarding`): business name, category and location are validated in the page and are not submitted or stored anywhere yet. When they are, this table gains a row first.
- **Email and password fields on `/login`**: placeholders for planned email sign-in. They have no field names and no handler, so nothing typed there leaves the browser.

### Development data

`scripts/seed.ts` and `scripts/seed.sql` insert fictional people (example.com addresses) into a local database. Real personal data is never used outside production.

## Special category data

None.

## Processors and international transfers

| Processor | Service | Data shared | Location | Transfer safeguard | DPA |
| --- | --- | --- | --- | --- | --- |
| Google | Signs people in, only when they choose Google | The sign-in request; Google returns the name, email, picture and account id | United States | EU-U.S. Data Privacy Framework where certified, otherwise Standard Contractual Clauses | Google's standard terms; record the review date |
| GitHub | Signs people in, only when they choose GitHub | The sign-in request; GitHub returns the name, picture, account id and the account's email addresses with whether each is verified | United States | EU-U.S. Data Privacy Framework where certified, otherwise Standard Contractual Clauses | GitHub's standard terms; record the review date |
| LinkedIn | Signs people in, only when they choose LinkedIn | The sign-in request; LinkedIn returns the name, picture, account id and email with whether it is verified | United States (LinkedIn Ireland for EU members) | EU-U.S. Data Privacy Framework where certified, otherwise Standard Contractual Clauses | LinkedIn's standard terms; record the review date |
| Sentry (Functional Software, Inc.) | Server error reports, scrubbed before sending; production only | Error details as described above | United States | EU-U.S. Data Privacy Framework where certified, otherwise Standard Contractual Clauses | Sentry's standard DPA; record the review date |
| Vercel (planned) | Hosting and request logs once deployed, and BotID's person-or-bot check when a sign-in starts | Request metadata and BotID's browser signals | United States | EU-U.S. Data Privacy Framework where certified, otherwise Standard Contractual Clauses | Vercel's standard DPA; record the review date at deployment |

No analytics, email provider, database host, payment provider or AI provider is in use. Each one is added here, and to the privacy policy, before its first call reaches production.

## Cookies and device storage

| Name | Purpose | Duration | Basis |
| --- | --- | --- | --- |
| `next-auth.session-token` (`__Secure-` prefixed on HTTPS) | Keeps a person signed in | Until sign-out, 7 days without a visit, or 30 days after sign-in | Strictly necessary |
| `next-auth.csrf-token` (`__Host-` prefixed on HTTPS) | Protects sign-in from cross-site request forgery | Browser session | Strictly necessary |
| `next-auth.callback-url` (`__Secure-` prefixed on HTTPS) | Remembers where to return after sign-in | Browser session | Strictly necessary |
| `next-auth.state`, `next-auth.pkce.code_verifier` (`__Secure-` prefixed on HTTPS) | Ties a provider sign-in to the browser that started it | 15 minutes | Strictly necessary |

## Security measures

- Every connection is encrypted with HTTPS once deployed (the host serves HTTPS only)
- The session cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` on HTTPS and on every Vercel deployment, and is encrypted with `NEXTAUTH_SECRET`
- A provider sign-in is accepted only with an email the provider marks as verified, and starting one is checked by Vercel BotID on the server and refused unless confirmed as a person
- Every response carries a Content Security Policy that allows only this site's own origin, HSTS, and headers that forbid framing and content sniffing
- Error reports are scrubbed before they leave the server (see above)
- Secrets live only in the host's environment variables; the repository is scanned for secrets on every push

## Data subject requests

All requests go to hr@bravehaven.io. Target: within one month (GDPR), within 45 days (US state laws).

| Right | How it is fulfilled today |
| --- | --- |
| Access | Nothing is stored on our side beyond error reports, which carry no name or email. We confirm that in writing |
| Rectification | Update the name or picture at the provider; it applies at the next sign-in |
| Erasure | Sign out (the cookie is deleted). On request, we delete any matching error reports in Sentry |
| Portability | Nothing is stored to export |
| Objection or withdrawal of consent | Stop signing in; nothing further is processed |

Each feature that stores personal data updates this table with how its data is exported and deleted.

## Retention and deletion

Session cookies expire on their own. Sentry deletes error reports at the end of its retention period. When a database is added, scheduled deletion of expired data ships with it.
