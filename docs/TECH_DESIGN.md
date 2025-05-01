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

## Tradeoffs

- Supabase makes things easier but can lock us in; fallback to raw Postgres supported
- WebSockets over polling for better UX, but requires persistent connection infra
- All logic behind API Routes keeps deployment tight (Next + Vercel)

---

## Future Considerations

- Move scheduler to background job queue (e.g., Bull or Vercel Cron)
- Support multi-tenancy for multi-location brands
