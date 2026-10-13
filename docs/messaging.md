# Messaging Brief

Product: PresencePilot
Owner: Erica Thompson
Rules: design/COPY_AND_CONVERSION_STANDARDS.md (engineering standards). Fill in Sections 1 to 6 before any page copy is written.
Last reviewed: 2026-10-11, against the code on `main`. Only what the code shows is filled in; everything else says "Owner input needed".

## 1. Positioning

| Component | Answer |
|-----------|--------|
| Competitive alternatives (what they do today without us) | Owner input needed |
| Unique attributes (what we have that they do not) | Owner input needed |
| Value (the outcome those attributes make possible) | Owner input needed |
| Target customers (who cares most about that value) | Owner input needed. The homepage and README name local businesses |
| Market category (what we want to be compared with) | Owner input needed |

One-line description (what it is, for whom, the outcome): the homepage says "One place for a local business to keep up with its online presence: reviews on Google and Yelp, and posts on Facebook." Reviews, posts and analytics are planned, not built (README). Owner input needed: confirm or replace once positioning is done.

## 2. Audiences

| Audience | Awareness stage | Job: When... I want to... so I can... | Where they arrive from | Primary action for them |
|----------|-----------------|---------------------------------------|------------------------|-------------------------|
| Local businesses (homepage, README) | Owner input needed | Owner input needed | Owner input needed | Sign in (`/login`) |

Second audience (buyers, investors, clients) and what they need to see: Owner input needed. The README states the status ("in development, not launched") and labels planned work.

## 3. Voice of Customer Bank

Verbatim phrases only. Source and date, never a name or contact detail. Mark phrases that recur.

| Phrase | Source (interview, support, review, forum, search) | Date | Recurs | Used where |
|--------|-----------------------------------------------------|------|--------|------------|
| Owner input needed: no research is recorded in the repository | | | | |

Pre-launch bank (no customers yet): yes. PresencePilot has not launched (README).

## 4. Objections

| Objection | Answer | Proof that supports the answer | Placed on (page, section) |
|-----------|--------|--------------------------------|---------------------------|
| Owner input needed | | | |

## 5. Proof Inventory and Claims Register

Every claim and number on a public page today, with its evidence in the code. There are no testimonials, reviews, ratings, customer counts, logos or badges anywhere in the site.

| Claim or proof | Type | Evidence or source | Date | Consent recorded | Refresh by | Appears on |
|----------------|------|--------------------|------|------------------|------------|------------|
| One place for a local business to keep up with reviews on Google and Yelp and posts on Facebook | Product description | Planned, not built. The page and share image say "in development" and that reviews, posts and analytics are planned | 2026-10-11 | Not applicable | When reviews or posts ship | Home, share image, home description |
| Sign-in and the first step of business onboarding are being built | Status | `src/app/login/page.tsx`, `src/app/onboarding/page.tsx` | 2026-10-11 | Not applicable | Each release | Home |
| Sign in with Google, GitHub or LinkedIn | Feature | `src/lib/sign-in-providers.ts`, `src/lib/sign-in.ts`, `tests/e2e/sign-in.spec.ts` | 2026-10-11 | Not applicable | Each release | Login, terms, privacy |
| Email sign-in is coming soon | Status | Fields are disabled in `src/components/LoginForm.tsx`; no email sign-in exists | 2026-10-11 | Not applicable | When email sign-in ships | Login |
| Onboarding step 1 works; steps 2 and 3 are not built; nothing entered is sent or saved | Status | `src/app/onboarding/page.tsx` has no submit handler; README lists steps 2 and 3 as planned | 2026-10-11 | Not applicable | When onboarding saves | Onboarding |
| Sign-in cookie ends after 7 days without a visit or 30 days after sign-in | Number | `IDLE_TIMEOUT_SECONDS` and `ABSOLUTE_TIMEOUT_SECONDS` in `src/lib/sign-in.ts` | 2026-10-11 | Not applicable | When either changes | Privacy |
| Two short-lived sign-in cookies last 15 minutes | Number | NextAuth 4 default (`STATE_MAX_AGE`, `PKCE_MAX_AGE` in `next-auth/core/lib/oauth/checks.js`); not set in this repository | 2026-10-11 | Not applicable | On a NextAuth upgrade | Privacy |
| Email addresses and long numbers are removed from error reports | Feature | `src/lib/sentry-scrub.ts`, `src/lib/__tests__/sentry-scrub.test.ts` | 2026-10-11 | Not applicable | Each release | Privacy |
| We do not use analytics, advertising or tracking cookies | Feature | No analytics code in `src/`; `docs/DATA_INVENTORY.md` | 2026-10-11 | Not applicable | When analytics is added | Privacy |
| Privacy requests answered within one month (45 days under US state laws) | Commitment | No evidence found in code; a process commitment only Erica can confirm | 2026-10-11 | Not applicable | Owner input needed | Privacy |
| Every page passes automated checks with the WCAG 2.1 A and AA and WCAG 2.2 AA rules, at desktop and phone sizes | Quality | `tests/a11y/pages.spec.ts`, `tests/support/axe.ts`, both Playwright projects in `playwright.config.ts` | 2026-10-11 | Not applicable | Each release | Accessibility |
| No page scrolls sideways or has to be zoomed out on a phone | Quality | Overflow check in `tests/support/axe.ts` | 2026-10-11 | Not applicable | Each release | Accessibility |
| Every color pairing meets at least 4.5 to 1 contrast for text | Number | Partial: axe's color-contrast rule fails normal text under 4.5 to 1 but allows 3 to 1 for large text, so large text is not proven to 4.5 to 1 | 2026-10-11 | Not applicable | Owner input needed | Accessibility |
| Accessibility feedback answered within 5 business days | Commitment | No evidence found in code; a process commitment only Erica can confirm | 2026-10-11 | Not applicable | Owner input needed | Accessibility |

Review verification statement shown next to reviews: not applicable; the site shows no reviews.

## 6. Voice

| We are | We are not |
|--------|------------|
| Owner input needed | |
| | |
| | |

Preferred words: Owner input needed
Banned words (this product only; the shared list is Section 4 of the standard): Owner input needed

## 7. Pages

Primary actions as the code shows them. Titles and descriptions live in `src/lib/page-metadata.ts`.

| Page | Audience | Awareness stage | Primary action | Conversion event | Baseline rate and date | Five-second test result |
|------|----------|-----------------|----------------|------------------|------------------------|-------------------------|
| Home (`/`) | Local businesses | Owner input needed | "Sign in" link to `/login` | None: no analytics runs | Owner input needed | Owner input needed |
| Sign in (`/login`) | Local businesses | Owner input needed | "Continue with Google", "Continue with GitHub", "Continue with LinkedIn" | None: no analytics runs | Owner input needed | Owner input needed |
| Onboarding (`/onboarding`) | Businesses after sign-in (the page itself does not require it) | Owner input needed | "Next", switched off until all three steps are complete; steps 2 and 3 are not built | None: no analytics runs | Owner input needed | Owner input needed |
| Privacy, Terms, Accessibility | Anyone | Not applicable | The contact address `hr@bravehaven.io` | None | Not applicable | Not applicable |

Page decisions (a landing page section removed, hidden pricing, or any other departure from Sections 3.2 and 3.3 of the standard):

| Page | Decision | Reason | Date | Decided by |
|------|----------|--------|------|------------|
| Home | The page is a short status page, not the full landing page in Section 3.2, and there is no pricing, about or contact page | Owner input needed | | Owner input needed |

## 8. Headline Candidates

| Page | Candidate | Five-second test | Chosen | Reason |
|------|-----------|------------------|--------|--------|
| Owner input needed | | | | |

## 9. Urgency, Scarcity, and Offers

| Offer or limit | What makes it true | Ends on | Approved by |
|----------------|--------------------|---------|-------------|
| None. The site has no offers, prices, countdowns, counters or limits | | | |

## 10. App Store Listing

Not applicable: PresencePilot is a web app with no store listing.

## 11. Test Log

Fill in every column up to and including run length before the test starts (Section 14.4 of the standard).

| Date | Page | Change | Hypothesis | Metric | Minimum effect worth detecting | Sample size planned | Run length (whole weeks) | Result | What it taught |
|------|------|--------|------------|--------|--------------------------------|---------------------|--------------------------|--------|----------------|
| | | | | | | | | | |

## Review log

| Date | Change | Reason | Reviewer |
|------|--------|--------|----------|
| 2026-10-11 | Brief created from the engineering standards template; claims register and pages filled from the code | Engineering standards #42 (copy and conversion) | Owner input needed |
