// Error tracking (STANDARDS.md, section 13). Copied from engineering-standards,
// templates/monitoring/instrumentation.ts (PR #23). Change it there first.
// Only the scrubber import path differs: it lives in src/lib/. The repo's
// Prettier (pre-commit hook) changed quotes and semicolons; the logic is not changed.
// Error tracking for a Next.js product (STANDARDS.md, section 13).
//
// Copy this file to the project's root, or to src/ when the project uses
// src/, with sentry-scrub.ts beside it, and add @sentry/nextjs to the
// dependencies. The Sentry integration in Vercel sets SENTRY_DSN. Without it,
// or outside production, nothing is sent, so the code can ship before the
// integration is installed and previews never spend the error quota.
//
// Server only: there is no browser SDK, session replay or tracing, so no
// cookies, no consent banner change, and nothing extra in the page.
import * as Sentry from '@sentry/nextjs'
import { scrubEvent } from './lib/sentry-scrub'

export function register() {
  const dsn = process.env.SENTRY_DSN
  Sentry.init({
    dsn,
    enabled: Boolean(dsn) && process.env.VERCEL_ENV === 'production',
    environment: process.env.VERCEL_ENV ?? 'development',
    sendDefaultPii: false,
    tracesSampleRate: 0,
    maxBreadcrumbs: 0,
    beforeSend: (event) => scrubEvent(event)
  })
}

// Reports errors thrown while rendering pages and running route handlers
// and server actions.
export const onRequestError = Sentry.captureRequestError
