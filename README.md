# PresencePilot

## Overview

PresencePilot is a web application for **local businesses** to manage their online presence across platforms like Google, Yelp and Facebook from a single dashboard.

**Status: in development, not launched.** There is no production deployment yet. This README describes what the code does today; everything else is labeled as planned.

---

## What works today

- **Homepage** (`/`) saying what PresencePilot is, with a link to sign in
- **Sign-in with Google, GitHub and LinkedIn** (`/login`), through NextAuth.js. All three buttons always show; a provider whose keys are not set yet says "<Provider> sign-in isn't available yet." when pressed. Only an email the provider has verified is accepted, starting a sign-in is checked by Vercel BotID, and the session lives only in an encrypted, `HttpOnly` cookie that ends after 7 days without a visit or 30 days after sign-in
- **Onboarding, step 1** (`/onboarding`): business name, category and location, validated in the browser with react-hook-form and yup. Nothing is submitted or stored yet
- **Privacy policy, terms and accessibility statement** (`/privacy`, `/terms`, `/accessibility`), linked from every page
- **Server error reporting** to Sentry, server only and production only, scrubbed of personal data (`src/instrumentation.ts`)
- **Security headers** on every response, including a Content Security Policy that allows only this site's own origin

## Planned (in progress, not built yet)

- Email sign-in with confirmation links, and rate limiting on sign-in
- Onboarding steps 2 and 3 (connecting platforms, preferences), and saving onboarding
- Viewing and responding to Google and Yelp reviews
- Scheduling and previewing Facebook posts
- Analytics and engagement trends
- Role-based access for teams
- Real-time review alerts
- A database schema in the repository, and the app reading and writing it

---

## Tech Stack

What is installed and used:

- **Framework:** Next.js 15 (App Router, TypeScript), React 19
- **Styling:** Tailwind CSS 4 and CSS modules; fonts served from the app (Geist, and Poppins on the login page)
- **Forms:** react-hook-form and yup (onboarding)
- **Authentication:** NextAuth.js 4 (JWT sessions) with Google, GitHub and LinkedIn; Vercel BotID
- **Error tracking:** Sentry (`@sentry/nextjs`, server only)
- **Testing:** Jest (unit), Playwright with axe-core (accessibility and end-to-end, against a production build)
- **CI:** GitHub Actions (standards check, lint, typecheck, tests, accessibility scan, build, dependency audit), TruffleHog secret scan, CodeQL
- **Developer experience:** Husky, lint-staged, Prettier, ESLint, Dependabot

Installed but not used yet: Storybook (configured, no stories), Cypress (no specs), `pg` (used only by `scripts/seed.ts`), Headless UI and Heroicons. Hosting is planned on Vercel; PostgreSQL (local or Supabase) is planned for data.

---

## Project Structure

```plaintext
src/
├── app/               // Pages and routes (App Router): home, login, onboarding,
│                      // privacy, terms, accessibility, api/auth (NextAuth)
├── components/        // UI components (sign-in buttons, login form, legal footer)
├── lib/               // Sign-in rules, BotID check, security headers, Sentry scrubber,
│                      // fetch with time limits and retries
├── styles/            // CSS modules
├── fonts/             // Self-hosted font files and their license
├── types/             // Shared types
└── instrumentation.ts // Server error reporting (Sentry)
tests/                 // Playwright: accessibility scan (a11y/) and flows (e2e/)
scripts/               // Standards check and local database scripts
docs/                  // Technical documentation
.github/               // CI, PR and issue templates, Dependabot
```

## **Installation & Setup (Local)**

Requires Node 22 (see `.nvmrc`).

### 1. Clone the Repository
```bash
git clone git@github.com:Windless-Technologies/presencepilot.git
cd presencepilot
```

### 2. Install Dependencies
```bash
npm ci
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```
Then fill in what you need. `.env.example` describes each value:
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET` for sign-in
- `GOOGLE_*`, `GITHUB_*`, `LINKEDIN_*` for each provider you want to try locally (leave them blank to see the "isn't available yet" state)
- `DATABASE_URL` only for the seed scripts

Never paste a key into an issue, a pull request or a chat; production keys go straight into the Vercel project's environment variables.

---

## **PostgreSQL Setup (Mac – Homebrew)**

> **In progress:** the app does not use a database yet, and the schema is not in the repository. `scripts/seed.sql` and `scripts/seed.ts` expect `users`, `reviews` and `posts` tables (described in [Database Setup](docs/SETUP_DATABASE.md)) that you create by hand for now. The seed and reset scripts only run against a database on your own machine and refuse a remote `DATABASE_URL`.

1. **Install PostgreSQL**
```bash
brew install postgresql
```

2. **Start Postgres Service**
```bash
brew services start postgresql
```

3. **Create the Database**
```bash
createdb presencepilot
```

4. **Set DATABASE_URL**
In your `.env.local`:
```bash
DATABASE_URL=postgresql://localhost/presencepilot
```

Then, once the tables exist, seed the database with fictional data. The scripts are TypeScript; `npx tsx` runs them without adding a dependency:

```bash
npx tsx scripts/seed.ts
```

Or use the reset script to drop, create and seed (it stops at the first SQL error):

```bash
npx tsx scripts/reset-db.ts
```

You can also use the raw SQL fallback:

```bash
psql presencepilot < scripts/seed.sql
```

---

## **PostgreSQL Setup (Windows – Git Bash / PowerShell)**
1. Install PostgreSQL
Download and install PostgreSQL from <https://www.postgresql.org/download/windows/>
The installer typically adds PostgreSQL’s bin folder to your system PATH.

2. Start PostgreSQL
It usually runs as a Windows service automatically.
If needed, open the Services console (Windows + R → services.msc) and start the PostgreSQL service.

3. Create the Database
Open Git Bash or PowerShell and run:

```bash
createdb -h <host> -p <port> -U postgres presencepilot
```
⚠️ If you see command not found, try the full path:

```bash
"/c/Program Files/PostgreSQL/17/bin/createdb.exe" -U postgres presencepilot
```
🔁 If you see the message `database "presencepilot" already exists`, you can skip this step.

4. Set the DATABASE_URL
Add this to your `.env.local` file:

```bash
DATABASE_URL=postgresql://localhost/presencepilot
```

5. Seed the Database (once the tables exist)

```bash
npx tsx scripts/seed.ts
```

Or reset (drop, create, seed):
```bash
npx tsx scripts/reset-db.ts
```

6. Seed Using Raw SQL (Fallback)
```bash
psql -U postgres -d presencepilot -f scripts/seed.sql
```

If psql is not recognized, use the full path:
```bash
"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -d presencepilot -f scripts/seed.sql
```

---
⚠️ **Troubleshooting (Windows)**

- **`createdb: command not found`**
Use the full path (Git Bash):
```bash
/c/Program\ Files/PostgreSQL/17/bin/createdb.exe -U postgres presencepilot
```

- **No tables after seeding?**
The schema is not in the repository yet; create the tables from [Database Setup](docs/SETUP_DATABASE.md) first.

- **Open psql session**
```bash
psql -U postgres -d presencepilot
```

- **Exit psql**
```bash
\q
```

## **Development Scripts**

| Script | Description |
|--------|-------------|
| `npm run dev` | Run local dev server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type check (same as `npx tsc --noEmit`) |
| `npm test` | Run Jest unit tests |
| `npm run test:a11y` | Build the site, then run the Playwright accessibility scan and end-to-end tests against `next start` |
| `npm run build` | Production build |
| `npm run storybook` | Start Storybook (no stories yet) |
| `npm run test:e2e` | Cypress (no specs yet) |

---

## **Testing Locally**

### Unit Tests
```bash
npm test
```

### Accessibility and End-to-End Tests (Playwright)
```bash
npx playwright install chromium   # once
npm run test:a11y
```
axe-core scans every page with the WCAG 2.1 A and AA and WCAG 2.2 AA rules, at desktop and phone widths. The test server uses port 3100; set `PLAYWRIGHT_PORT` if it is taken.

### Before you push
Run the full list in [`CLAUDE.md`](CLAUDE.md#before-you-push), in order: the standards check, the secret scan, Semgrep, lint, typecheck, tests, the accessibility scan, the build and the dependency audit. CI runs the same checks.

---

## **Documentation**

The planning documents describe where PresencePilot is headed; where they differ from the code, this README and the code are current.

- [Security Policy](SECURITY.md) (how to report a vulnerability, and what is in place versus planned)
- [Personal Data Inventory](docs/DATA_INVENTORY.md)
- [Changelog](CHANGELOG.md)
- [API Contract](docs/API_CONTRACT.md) (planned)
- [Architecture & Tech Design](docs/TECH_DESIGN.md) (planned)
- [Feature Brief](docs/FEATURE_BRIEF.md)
- [Testing Strategy](docs/TESTING_STRATEGY.md)
- [Database Setup](docs/SETUP_DATABASE.md)
- [UX Guidelines](docs/UX_GUIDELINES.md)
- [User Stories](docs/USER_STORIES.md)
- [Performance Notes](docs/PERFORMANCE_NOTES.md)
- [Future Considerations](docs/FUTURE_CONSIDERATIONS.md)
- [Contributing](docs/CONTRIBUTING.md)

---

## **Contributing**

1. Create a branch from `main` and link an issue.
2. Follow the pull request template and the issue forms.
3. Run the checks in [`CLAUDE.md`](CLAUDE.md#before-you-push) before pushing.
4. Open a pull request whose title is the final commit message (pull requests are squash merged), with a `CHANGELOG.md` entry under `Unreleased`.

---

## **Deployment**

Not deployed yet. Hosting is planned on Vercel, on the product's own domain once one is chosen.

## **License**

MIT
