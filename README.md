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

## **Installation & Setup**

1. Clone the repository:

```bash
git clone git@github.com:Windless-Technologies/presencepilot.git
cd presencepilot
```

2. Install dependencies:

```bash
npm install
```

3. Copy environment file and configure secrets:

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

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

## **Docs & System Design**

* API Contract
* Architecture
* Testing Strategy
* Security Guidelines
* Database Setup
* UX Guidelines
* Performance Notes
* Future Considerations

## **Contributing**

1. Fork the repo and create a feature branch
2. Follow the PR template
3. Run pre-commit checks (`npm run lint`, `npm run test`)
4. Submit a PR referencing the related issue

## **Live Deployment**

Coming soon: https://presencepilot.co

## **License**

MIT
