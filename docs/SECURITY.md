## Overview

PresencePilot handles user data, 3rd-party tokens (OAuth), and sensitive business insights. This document outlines security goals, practices, and current protections.

---

## Goals

- Secure authentication
- Controlled data access (RBAC)
- Token encryption
- Safe external API usage

---

## Authentication

- Auth handled via **NextAuth.js**
- Uses secure, rotating **JWTs**
- Sessions stored with `httpOnly` cookies
- Login via Google OAuth (or custom providers)

---

## Authorization

- Role-based access control (admin, user)
- Backend checks on all API routes
- No privilege escalation via frontend controls

---

## Sensitive Data

- `.env` secrets are **never committed**
- API tokens stored encrypted (if stored at all)
- Access keys scoped and rate-limited

---

## Git & Environment

- `.env.local` is gitignored
- Husky hook blocks unsafe commits
- CI runs lint, type-check, and tests before merging

---

## Future Enhancements

- Add rate limiting middleware
- Rotate secrets every 90 days
- Audit logs for all write operations
