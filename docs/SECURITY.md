## Overview

PresencePilot handles sensitive review data, OAuth tokens, and user metadata. This file documents the security posture of the app, including how data is protected in transit, at rest, and during session-based interaction.

---

## Goals

- Authenticate securely (OAuth-based)
- Encrypt and limit access to sensitive data
- Prevent privilege escalation
- Prevent secrets from being leaked or exposed
- Enforce CI and pre-commit safety gates

---

## Authentication

- Uses **NextAuth.js** with Google as the primary OAuth provider
- Auth tokens stored in secure, signed cookies
- Refresh tokens (if any) encrypted at rest
- Session tokens validated server-side with secure fallback

---

## Authorization

- RBAC system (admin, user)
- API endpoints checked for role using middleware
- Critical operations (delete, publish) require elevated roles

---

## Secrets & Tokens

- `.env.local` is always in `.gitignore`
- OAuth tokens stored in memory or encrypted database fields
- Stripe API keys, webhook secrets stored in Vercel env vars
- Access tokens scoped to minimum permissions

---

## Source Control & CI

- Husky prevents PRs with secrets or unsafe commits
- GitHub Actions run:
  - Type check
  - ESLint
  - Unit + integration tests
- Branch protection prevents direct merges to `main`

---

## Rate Limiting & Abuse

- WIP: plan to implement rate limiting with middleware (e.g. `express-rate-limit` or `next-rate-limit`)
- Admin routes to be IP-restricted or protected by CAPTCHA (future)

---

## Future Enhancements

- Rotate secrets every 90 days
- Add detailed audit logs on sensitive operations
- Add IP-based or behavior-based access throttling
- Security scan CI jobs (e.g. npm audit, Snyk)
