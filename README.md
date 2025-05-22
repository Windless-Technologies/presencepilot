# PresencePilot

## **Overview**

PresencePilot is a full-stack web application that helps **local businesses** manage their online presence across platforms like Google, Yelp, and Facebook — all from a single dashboard.

Built with best-in-class tools to ensure **scalability**, **accessibility**, and **real-world job readiness** for engineers contributing to it.

---

## **Tech Stack**

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** TailwindCSS + Tailwind UI Plus
- **State Management:** React Context API + Custom Hooks
- **Authentication:** NextAuth.js (JWT)
- **Realtime:** WebSocket (Socket.io)
- **Database:** PostgreSQL (local or Supabase)
- **Testing:** Jest, React Testing Library, Cypress, Axe (a11y)
- **Docs & Storybook:** Storybook + Markdown Docs
- **CI/CD:** GitHub Actions, Vercel Deployment
- **Developer Experience:** Husky, lint-staged, Prettier, ESLint

---

## **Project Structure**

```plaintext
src/
├── components/        // UI Components
├── hooks/             // Custom React hooks
├── pages/             // Routes and API handlers
│   └── api/           // Backend API logic
├── styles/            // Tailwind/global styles
├── utils/             // Reusable utilities
├── types/             // Shared types
├── lib/               // External services, API clients
public/                // Assets
docs/                  // Technical documentation
.github/               // CI configs, PR/issue templates
```

## **Installation & Setup (Local)**

### 1. Clone the Repository
```bash
git clone git@github.com:Windless-Technologies/presencepilot.git
cd presencepilot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```
Then fill in:
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `DATABASE_URL` (Postgres connection string)
- Any API keys you're using

---

## **PostgreSQL Setup (Mac – Homebrew)**

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

Then seed the database with dummy data:

```bash
ts-node scripts/seed.ts
```

Or use the reset script to fully drop, create, and seed:

```bash
ts-node scripts/reset-db.ts
```

You can also use the raw SQL fallback:

```bash
psql presencepilot < scripts/seed.sql
```

> ⚠️ Make sure your `.env.local` has a valid `DATABASE_URL` pointing to your local PostgreSQL instance.

---

## **Development Scripts**

| Script | Description |
|--------|-------------|
| `npm run dev` | Run local dev server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type check |
| `npm run test:unit` | Run Jest unit tests |
| `npm run test:e2e` | Run Cypress tests |
| `npm run storybook` | Start Storybook |
| `npm run build-storybook` | Build static Storybook |

---

## **Testing Locally**

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests (Cypress)
1. Open the test UI:
```bash
npx cypress open
```
2. Or run headless:
```bash
npm run test:e2e
```

### Lint + Type Check
```bash
npm run lint
npm run type-check
```

---

## **Documentation**

- [API Contract](docs/API_CONTRACT.md)
- [Architecture & Tech Design](docs/TECH_DESIGN.md)
- [Feature Brief](docs/FEATURE_BRIEF.md)
- [Testing Strategy](docs/TESTING_STRATEGY.md)
- [Security Guidelines](docs/SECURITY.md)
- [Database Setup](docs/SETUP_DATABASE.md)
- [UX Guidelines](docs/UX_GUIDELINES.md)
- [User Stories](docs/USER_STORIES.md)
- [Performance Notes](docs/PERFORMANCE_NOTES.md)
- [Future Considerations](docs/FUTURE_CONSIDERATIONS.md)
- [Contributing](docs/CONTRIBUTING.md)

---

## **Core Features**

* View & respond to aggregated reviews (Google, Yelp)
* Schedule and preview social media posts (Facebook)
* View basic analytics and engagement trends
* Role-based access for teams
* WebSocket-based real-time review alerts

## **Testing Strategy**

* **Unit Tests:** `Jest` + `React Testing Library`
* **E2E Tests:** `Cypress`
* **Accessibility:** `jest-axe`, `cypress-axe`
* **Visual UI Testing:** Storybook Test Runner


## **Contributing**

1. Fork the repository and create a new feature branch.
2. Follow all PR and issue templates.
3. Run all checks before submitting:
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```
4. Submit a pull request with a clear summary and linked issue.

---
## **Live Deployment**

Coming soon: https://presencepilot.co

## **License**

MIT
