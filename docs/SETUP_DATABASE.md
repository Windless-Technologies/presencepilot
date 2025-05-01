## Purpose
To guide local development using PostgreSQL and ensure consistent table structure for all engineers working on PresencePilot.

---

## Requirements

- PostgreSQL 14+
- Supabase CLI (optional for Supabase users)
- Prisma (if managing migrations)

---

## Installation (Mac)

```bash
brew install postgresql
brew services start postgresql
```

Create database:

```bash
createdb presencepilot
```

---

## Environment Variable

In your `.env.local`:

```env
DATABASE_URL=postgresql://localhost/presencepilot
```

---

## Table Structure (Simplified)

- `users`
  - id
  - name
  - email
  - role
  - created_at

- `reviews`
  - id
  - platform
  - rating
  - content
  - responded
  - created_at

- `posts`
  - id
  - content
  - platform
  - scheduled_time
  - status
  - created_at

---

## Seeding (Optional)

Run SQL or script-based seeding (manual or with Prisma). You can create a `seed.sql` for test accounts and mock reviews.

---

## Notes

- If using Supabase, enable RLS and assign appropriate policies for auth.
- Keep schema synced with your ORM or SQL tool to avoid drift.
