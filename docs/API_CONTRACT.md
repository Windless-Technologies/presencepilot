# API Contract - PresencePilot

## Overview
This document defines the backend API endpoints for PresencePilot. These endpoints are structured for consistency, RESTful semantics, and integration with Google Reviews, Yelp, and Facebook post scheduling.

---

## Authentication

| Method | Endpoint             | Description                     | Auth Required |
|--------|----------------------|---------------------------------|----------------|
| POST   | /api/auth/login      | Authenticate user               | No             |
| POST   | /api/auth/register   | Create new user account         | No             |
| POST   | /api/auth/logout     | Logout the current session      | Yes            |

---

## Reviews

| Method | Endpoint           | Description                          | Auth Required |
|--------|--------------------|--------------------------------------|----------------|
| GET    | /api/reviews       | Fetch all synced reviews             | Yes            |
| POST   | /api/reviews/sync  | Trigger fetch from external sources  | Yes            |
| POST   | /api/reviews/respond | Submit a response to a review       | Yes            |

---

## Posts

| Method | Endpoint               | Description                          | Auth Required |
|--------|------------------------|--------------------------------------|----------------|
| GET    | /api/posts             | Retrieve scheduled posts             | Yes            |
| POST   | /api/posts/schedule    | Schedule a new social media post     | Yes            |
| DELETE | /api/posts/:postId     | Cancel a scheduled post              | Yes            |

---

## WebSockets

| Event Name     | Payload                                | Description                   |
|----------------|----------------------------------------|-------------------------------|
| review:new     | { id, platform, rating, content }      | New review alert              |
| post:status    | { id, status }                         | Status update for a post      |

---

## Response Format

All responses will be in the following format:

```json
{
  "success": true,
  "data": {},
  "message": "Optional contextual message"
}
```
