# Technical Design - PresencePilot

## Overview
PresencePilot is a web application that consolidates local business reputation and social engagement management into a single dashboard. It uses modern web technologies for a performant, accessible, scalable system.

---

## Problem Statement
Local businesses struggle with visibility, managing customer reviews, and posting updates across multiple platforms. PresencePilot unifies this into one interface with real-time capabilities.

---

## Architecture

### Frontend
- **Framework:** Next.js (App Router + SSR)
- **UI:** TailwindCSS + Headless UI
- **State:** React Context + custom hooks
- **Component Isolation:** Storybook

### Backend
- **API Layer:** Next.js API Routes
- **Database:** PostgreSQL (Supabase optional)
- **Auth:** NextAuth.js (OAuth + JWT)
- **Realtime:** WebSockets (Socket.io)

---

## Core Modules

### Review Aggregator
- Sync reviews from Google, Yelp APIs
- Normalize and store in Postgres
- Trigger real-time notification on sync

### Social Media Scheduler
- Schedule Facebook posts
- Store with `status = scheduled`, update via cron/task runner

### Alerts & WebSocket Gateway
- Broadcast events on new reviews or post failures

---

## Folder Structure

```plaintext
src/
├── components/
├── pages/
│   └── api/
├── hooks/
├── lib/
├── utils/
├── styles/
├── types/
public/
docs/
```

---

## Tech Stack Summary

| Layer      | Tool |
|------------|------|
| Frontend   | Next.js, TailwindCSS, React, TypeScript |
| Backend    | Next.js API Routes, PostgreSQL, Supabase |
| Auth       | NextAuth.js with Google OAuth |
| CI/CD      | GitHub Actions, Vercel |
| DB Admin   | Supabase Studio or pgAdmin |
| Payments   | Stripe Checkout & Billing Portal |
| Realtime   | WebSockets (Socket.io) |
| Testing    | Jest, React Testing Library, Cypress, Storybook |
| Monitoring | Vercel Analytics (default) |

---

## Security

- Auth via **Google OAuth** with secure cookie sessions
- Backend protected by **middleware that checks role + session**
- All keys and secrets stored in **`.env.local`** and managed securely in Vercel
- Stripe webhooks validated using signature
- API endpoints rate-limited and access-checked

---

## Performance

- All views use **lazy loading + skeleton loaders**
- Post and review lists are **paginated**
- Analytics queries use indexed fields
- Uses **React.memo** and batching where needed

---

## Trade-offs & Risks

- Supabase accelerates dev but can create long-term vendor lock-in
- Facebook API permissions can be strict and brittle
- Scaling WebSockets may require Redis or third-party pub/sub
- Stripe webhook handling must be tested thoroughly in local + staging
- All logic behind API Routes keeps deployment tight (Next + Vercel)

---

## Future Considerations

- Migrate social scheduling to a background job system (e.g., BullMQ or Vercel Cron)
- Support multi-tenancy for multi-location brands
- Add AI summarization of reviews
- Cross-platform image post editor
