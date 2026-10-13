# Lifecycle and Funnel

Product: PresencePilot
Owner: Erica Thompson
Rules: design/LIFECYCLE_AND_FUNNEL_STANDARDS.md (engineering standards). Fill in before launch. Event names follow docs/analytics.md, which does not exist yet: PresencePilot runs no analytics (`docs/DATA_INVENTORY.md`).
Last reviewed: 2026-10-11, against the code on `main`. Only what the code shows is filled in; everything else says "Owner input needed".

## 1. Funnel

No stage has an event yet, because no analytics runs. Each gap is an open item (Section 2, rule 3 of the standard).

| Stage | Event | Definition for this product | Owner | Target | Current | Date measured | Review by |
|-------|-------|-----------------------------|-------|--------|---------|---------------|-----------|
| Visit | None yet | Owner input needed | Owner input needed | Owner input needed | Not measured | | |
| Lead or sign-up | None yet | Owner input needed. Today the only way in is provider sign-in (`/login`) | Owner input needed | Owner input needed | Not measured | | |
| Activated | None yet | Owner input needed | Owner input needed | Owner input needed | Not measured | | |
| Paying | None yet | Not applicable today: there is no pricing or payment in the code | Owner input needed | Owner input needed | Not measured | | |
| Retained | None yet | Owner input needed | Owner input needed | Owner input needed | Not measured | | |
| Referring | None yet | Owner input needed | Owner input needed | Owner input needed | Not measured | | |

Biggest drop this week: not measured
Action this week: Owner input needed

## 2. UTM Register

All values lowercase. Never on internal links. No link in the site carries UTM parameters today.

| Campaign (`utm_campaign`) | Source | Medium | Landing page | Promise it makes | Start | End |
|---------------------------|--------|--------|--------------|------------------|-------|-----|
| None yet | | | | | | |

## 3. Lead Handling

PresencePilot has no contact form, booking link, demo request, quote request or sales inquiry today. The only forms are sign-in (provider buttons, and email fields that are switched off) and onboarding step 1, which stays in the browser and is not submitted. Neither is a lead form. The table is ready for the first one: when it is added, it gets a named owner in a tracked system, an on-screen acknowledgement that says what happens next, the response hours beside the form, a Sentry report when saving or notifying fails (the existing setup in `src/instrumentation.ts`), an error that names `hr@bravehaven.io` as another way to reach the team, and an end-to-end test against a database with the schema and no seed data.

| Entry point (form, booking link, demo request) | Stored in | Owner | Acknowledgement sent | Response target | Hours stated on page | Failure alert | End-to-end test |
|------------------------------------------------|-----------|-------|----------------------|-----------------|----------------------|---------------|-----------------|
| None yet | | | | | | | |

Contact addresses on the site today: `hr@bravehaven.io` (privacy, terms and accessibility pages, and `SECURITY.md`) is a mail link, not a form. Who reads it and in what hours: Owner input needed.

Acknowledgement message (what happens next and by when): Owner input needed when the first lead form is built. Response hours: Owner input needed.

Booking confirmation (agenda, length, how to reschedule): not applicable; there is no booking link.

Lead outcomes recorded as: qualified / not a fit / no response

## 4. Second Action and Follow-Up Sequence

Second action offered (useful on its own): none yet. Owner input needed.
Consent wording and opt-in method: not applicable; the site sends no marketing email and has no email provider (`docs/DATA_INVENTORY.md`).

| Email | Sent | One idea | One action | Funnel event it aims for | Stops when |
|-------|------|----------|------------|--------------------------|------------|
| 1 | | | | | Converts, replies, or unsubscribes |
| 2 | | | | | |
| 3 | | | | | |

Sequence last read and reviewed (quarterly): no sequence exists.

## 5. Activation

Activation event: Owner input needed
Why this is the first real value: Owner input needed
Expected window to activate: Owner input needed
Steps from sign-up to activation: today, sign in, then onboarding step 1 (business name, category, location). Steps 2 and 3 are not built and nothing is saved (`src/app/onboarding/page.tsx`)
Message to users who have not activated in the window: Owner input needed

## 6. Retention and Recovery

Retained means (action and period): Owner input needed
Failed payment recovery: banner / email / retry schedule: not applicable; there is no payment in the code
Cancellation question: not applicable today
Win-back message (consented users only, once): not applicable today

## 7. Proof Collection

| Success moment (trigger) | Channel | Ask wording | Reminder (one at most) | Consent scope recorded in messaging.md |
|--------------------------|---------|-------------|------------------------|----------------------------------------|
| Owner input needed | | | | |

In-app review prompt shown after: not applicable; web app only.

## 8. Offer Ladder

The code shows no prices, plans or trials.

| Level | Offer | Scope | Price | Start and end | Not included |
|-------|-------|-------|-------|---------------|--------------|
| Entry | Owner input needed | | | | |
| Core | Owner input needed | | | | |
| Expansion | Owner input needed | | | | |

Guarantee or trial terms (only what is honoured every time): none stated.

## 9. Trust Infrastructure

- [ ] Email sent from the product's domain, SPF, DKIM and DMARC verified. Not applicable yet: the code sends no email. Owner input needed: the product's own domain
- [ ] About page names the people behind the product. Owner input needed: not yet compliant, there is no about page
- [x] Security and privacy page in plain language (`/privacy`, and `SECURITY.md`)
- [x] `/.well-known/security.txt` published (`public/.well-known/security.txt`, tested in `tests/e2e/security-txt.spec.ts`). It has no `Canonical:` line because the product has no production domain yet. Owner input needed: add one when the domain is chosen, and renew `Expires:` before 2027-10-10
- [ ] Status page linked from the footer (products with accounts). Owner input needed: not yet compliant
- [x] Status labels on everything not generally available: the homepage, terms, privacy policy and share image say "in development"; the login page says email sign-in is coming soon; onboarding says only step 1 works and nothing is saved

## 10. Weekly Scoreboard

| Week of | Visits | Leads | Activated | Paying | Unanswered leads | Biggest drop | Action taken | Result |
|---------|--------|-------|-----------|--------|------------------|--------------|--------------|--------|
| | | | | | | | | |

## Review log

| Date | Change | Reason | Reviewer |
|------|--------|--------|----------|
| 2026-10-11 | Created from the engineering standards template and filled from the code | Engineering standards #43 (lifecycle and funnel) | Owner input needed |
