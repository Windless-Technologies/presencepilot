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

## Table Structure (Minimum Viable)

- `users`
  - `id` (uuid, primary key)
  - `name`
  - `email`
  - `role` (enum: user, admin)
  - `created_at` (timestamp)

- `reviews`
  - `id`
  - `user_id`
  - `platform` (google, yelp)
  - `rating`
  - `content`
  - `responded` (boolean)
  - `created_at`

- `posts`
  - `id`
  - `user_id`
  - `content`
  - `platform`
  - `scheduled_time`
  - `status` (enum: scheduled, posted, failed)
  - `created_at`

---

## Seeding (Optional)

For local testing, you can use:

```bash
psql presencepilot < scripts/seed.sql
```

Or create a JS/TS script in `/scripts/seed.ts` with dummy data.

---

## Supabase Usage

If you're using Supabase:

- RLS (Row Level Security) must be enabled
- Policies for authenticated reads/writes by user_id
- Supabase Studio can be used to view or manually update records

---

## Notes

- Schema should be source-controlled via `.sql` or Prisma schema
- Do **not** commit real `.env.local` or actual secrets
- Use `pgAdmin` or Supabase Studio for manual inspection/debugging
