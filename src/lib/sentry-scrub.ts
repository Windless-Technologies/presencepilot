// Copied from engineering-standards, templates/monitoring/sentry-scrub.ts
// (PR #23). Change it there first. The repo's Prettier (pre-commit hook)
// changed quotes and semicolons; the logic is not changed.
// Removes personal data and secrets from an error report before it leaves
// the server (STANDARDS.md, section 13: no secrets or personal data in error
// tracking). instrumentation.ts passes every event through it as Sentry's
// beforeSend. Copy it verbatim next to instrumentation.ts.

/**
 * The parts of a Sentry event this touches. Structural, so Sentry's own
 * ErrorEvent is accepted without importing its types here.
 */
export interface ScrubbableEvent {
  message?: string | undefined
  transaction?: string | undefined
  user?: unknown
  breadcrumbs?: unknown
  request?:
    | {
        url?: string | undefined
        query_string?: unknown
        headers?: unknown
        cookies?: unknown
        data?: unknown
        env?: unknown
      }
    | undefined
  exception?:
    | { values?: Array<{ value?: string | undefined }> | undefined }
    | undefined
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
// Phone and card numbers: nine or more digits, allowing spaces and dashes
// between them (so a date such as 2026-10-05 is kept).
const LONG_NUMBER = /\b\d(?:[ -]?\d){8,}\b/g
// A path segment that looks like a token (confirmation, reset or share links).
const TOKEN_SEGMENT = /^[A-Za-z0-9_-]{24,}$/

/** Replaces email addresses and long numbers in free text. */
export function redactText(text: string): string {
  return text.replace(EMAIL, '[email]').replace(LONG_NUMBER, '[number]')
}

/** Drops the query string and fragment, and replaces token-like path segments. */
export function redactUrl(url: string): string {
  const [withoutQuery = ''] = url.split(/[?#]/)
  const match = /^([a-z][a-z0-9+.-]*:\/\/[^/]*)?(.*)$/i.exec(withoutQuery)
  const origin = match?.[1] ?? ''
  const path = (match?.[2] ?? '')
    .split('/')
    .map((segment) => (TOKEN_SEGMENT.test(segment) ? ':token' : segment))
    .join('/')
  return redactText(origin + path)
}

/**
 * Returns the event with request headers, cookies, bodies, query strings,
 * the user and breadcrumbs removed, and personal data redacted from the
 * message, exception values, URL and transaction name.
 */
export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  delete event.user
  delete event.breadcrumbs
  if (event.request) {
    delete event.request.headers
    delete event.request.cookies
    delete event.request.data
    delete event.request.query_string
    delete event.request.env
    if (event.request.url) event.request.url = redactUrl(event.request.url)
  }
  if (event.message) event.message = redactText(event.message)
  if (event.transaction) event.transaction = redactUrl(event.transaction)
  for (const value of event.exception?.values ?? []) {
    if (value.value) value.value = redactText(value.value)
  }
  return event
}
