#TODO ET Add danger.js or REviewPad rules
## Purpose

Track remaining scoped tasks for MVP and Phase 2.  
Interns should reference this and break large items into GitHub issues.

---

## Initial Setup (Infrastructure)

- [ ] Configure Supabase or local PostgreSQL connection
- [ ] Set up .env.local with valid keys
- [ ] Create first migration/schema (users, reviews, posts)
- [ ] Set up WebSocket server (Socket.io)
- [ ] Connect Vercel to GitHub and set up deployment previews

---

## Feature Development - MVP

### Authentication

- [ ] Implement login with NextAuth.js
- [ ] Support Google OAuth
- [ ] Restrict pages by auth state (middleware or wrapper)

### Review Aggregation

- [ ] Integrate Google Reviews API (mock first)
- [ ] Integrate Yelp API
- [ ] Normalize review schema
- [ ] Store in `reviews` table
- [ ] Display in UI
- [ ] Enable response submission

### Social Media Scheduling

- [ ] Create `ScheduledPostForm`
- [ ] Schedule post API route
- [ ] Store post with timestamp/status
- [ ] Show upcoming posts
- [ ] Handle failure/success state

### Realtime Features

- [ ] Connect dashboard to WebSocket server
- [ ] Broadcast new review events
- [ ] Show toast alert on new incoming review

---

## Testing

- [ ] Add sanity check test for CI to pass
- [ ] Write Jest test for `useReviews.ts`
- [ ] Add Cypress test: login → dashboard
- [ ] Run jest-axe a11y check on ReviewCard

---

## Docs

- [ ] Complete `API_CONTRACT.md` with response samples
- [ ] Document all hooks in `/hooks`
- [ ] Add visual screenshots to README once MVP is staged

// PLan
Dev writes code → 
Local Husky pre-commit hook runs (lint, typecheck, format) → 
Only clean commits allowed →
Push to GitHub →
PR triggers GitHub Actions (full CI checks) →
PR triggers CodeRabbit AI review →
If package.json touched, install guard demands manual approval →
PR merged only if everything passes →
Auto-deploy to Vercel
