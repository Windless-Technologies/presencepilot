# API_CONTRACT.md – PresencePilot

## Overview

This document defines the backend API endpoints used by PresencePilot. These APIs enable secure authentication, review aggregation, post scheduling, platform integrations, analytics reporting, and billing — all following consistent RESTful semantics.

---

## Authentication

| Method | Endpoint                  | Description                            | Auth Required |
|--------|---------------------------|----------------------------------------|----------------|
| GET/POST | /api/auth/[...nextauth] | Handle Google OAuth via NextAuth       | No             |
| GET    | /api/auth/session         | Check current user session             | Yes            |

---

## Reviews

| Method | Endpoint             | Description                            | Auth Required |
|--------|----------------------|----------------------------------------|----------------|
| GET    | /api/reviews         | Fetch all synced reviews               | Yes            |
| POST   | /api/reviews/sync    | Fetch latest reviews from platforms    | Yes            |
| POST   | /api/reviews/respond | Submit a response to a specific review | Yes            |

---

## Posts

| Method | Endpoint               | Description                             | Auth Required |
|--------|------------------------|-----------------------------------------|----------------|
| GET    | /api/posts             | Retrieve scheduled posts                | Yes            |
| POST   | /api/posts/schedule    | Schedule a new social media post        | Yes            |
| DELETE | /api/posts/:postId     | Cancel a scheduled post                 | Yes            |

---

## Analytics

| Method | Endpoint               | Description                              | Auth Required |
|--------|------------------------|------------------------------------------|----------------|
| GET    | /api/analytics         | Retrieve dashboard-level engagement stats| Yes            |
| GET    | /api/analytics/posts   | Get post performance metrics             | Yes            |

---

## Integrations

| Method | Endpoint                    | Description                          | Auth Required |
|--------|-----------------------------|--------------------------------------|----------------|
| POST   | /api/integrations/google    | Connect Google account               | Yes            |
| POST   | /api/integrations/yelp      | Connect Yelp account                 | Yes            |
| POST   | /api/integrations/facebook  | Connect Facebook account             | Yes            |
| GET    | /api/integrations/status    | Get connection status for all platforms | Yes         |

---

## Payments

| Method | Endpoint               | Description                             | Auth Required |
|--------|------------------------|-----------------------------------------|----------------|
| POST   | /api/billing/checkout  | Create Stripe checkout session          | No             |
| POST   | /api/billing/webhook   | Stripe webhook listener (internal use)  | No             |
| GET    | /api/billing/portal    | Redirect to Stripe billing portal       | Yes            |

---

## Settings

| Method | Endpoint          | Description                    | Auth Required |
|--------|-------------------|--------------------------------|----------------|
| GET    | /api/settings     | Fetch current user settings    | Yes            |
| POST   | /api/settings     | Update user preferences        | Yes            |

---

## WebSockets

| Event Name     | Payload                                | Description                   |
|----------------|----------------------------------------|-------------------------------|
| review:new     | { id, platform, rating, content }      | New review received           |
| post:status    | { id, status }                         | Post published or failed      |

---

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "message": "Optional contextual message"
}
```

---

## Notes

- All routes requiring authentication use secure session middleware (NextAuth + JWT)
- POST and DELETE routes validate body content and user roles
- Stripe webhooks use signature validation
- Platform integrations use access tokens scoped per business
