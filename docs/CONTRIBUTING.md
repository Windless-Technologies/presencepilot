Thanks for your interest in contributing to PresencePilot!

This project is structured like a real-world engineering org. Follow these steps to contribute efficiently.

---

## Project Setup

1. Clone the repo:
   ```bash
   git clone git@github.com:Windless-Technologies/presencepilot.git
   cd presencepilot
   ```

2. Install dependencies:
   ```bash
   npm install
   cp .env.example .env.local
   ```

3. Start local dev server:
   ```bash
   npm run dev
   ```

4. Optional: Start Storybook
   ```bash
   npm run storybook
   ```

---

## Workflow

1. **Create a branch** from `main`
   ```bash
   git checkout -b feature/<your-feature-name>
   ```

2. **Open or claim a GitHub Issue**
   - Every PR must link to an open issue

3. **Write code + tests**
   - Linting and pre-commit hooks will run automatically

4. **Open a PR**
   - Follow the PR template
   - Fill out summary, changes made, reasoning, and acceptance criteria

5. **CI must pass**
   - Your PR will not be merged if:
     - Type errors
     - Failing tests
     - Lint violations

---

## Pre-PR Checklist

- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm test` runs successfully
- [ ] New components have Storybook stories (if visual)

---

## Need Help?

Tag `@ericathompson` in a GitHub comment or message in the Windless Discord under `#presencepilot-dev`.

We're here to help you grow