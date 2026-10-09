// Copied from engineering-standards, templates/resilience/fetch-with-resilience.ts.
// Change it there first. The repo's Prettier (pre-commit hook) changes quotes
// and semicolons; the logic is not changed.
/**
 * fetch with a time limit, safe retries and an overall deadline.
 *
 * STANDARDS.md, section 14 (Performance and resilience). Copy into the
 * project (for example `src/lib/fetch-with-resilience.ts`) and use it for
 * every call to a service outside the project.
 *
 * What it does:
 * - Every attempt has a time limit, and the whole call (attempts plus waits)
 *   has a deadline, so a slow service cannot hold a request open until the
 *   host kills it.
 * - Retries only methods that are safe to repeat (GET, HEAD, OPTIONS, PUT,
 *   DELETE), or a POST or PATCH the caller marks `idempotent` because it
 *   carries an idempotency key.
 * - Retries only failures that can pass: network errors, attempt timeouts,
 *   and 408, 429, 500, 502, 503 and 504. Any other status is returned at once.
 * - Waits between attempts with exponential backoff and full jitter, and
 *   honors `Retry-After`. If the wait would pass the deadline, it stops and
 *   returns what it has instead of waiting.
 * - Never more than two retries, whatever the caller asks for, so a copied
 *   default cannot multiply calls to a metered service.
 * - Stops at once when the caller cancels, including during a wait.
 *
 * What it leaves to the caller: checking `res.ok`, and the fallback when the
 * service stays down (a cached copy, a reduced page, or failing closed and
 * escalating to a person).
 *
 * Sources: AWS Builders' Library, "Timeouts, retries, and backoff with
 * jitter"; Google SRE book, "Addressing cascading failures"; RFC 9110,
 * section 10.2.3 (Retry-After).
 *
 * Runs on Node 22 and the edge runtime. The request body must be a string,
 * URLSearchParams or similar value that can be sent twice, not a stream.
 */

export interface ResilienceOptions {
  /** Time limit for one attempt. Default 5000 ms. */
  timeoutMs?: number
  /** Deadline for the whole call, including waits. Keep it under the host's function limit. Default 10000 ms. */
  totalTimeoutMs?: number
  /** Retries after the first attempt: 0, 1 or 2 (the maximum). Default 2. Metered services count every attempt against their cap. */
  retries?: number
  /** First backoff step. Default 200 ms. */
  baseDelayMs?: number
  /** Longest single wait, including a Retry-After the service asks for. Default 2000 ms. */
  maxDelayMs?: number
  /** Set to true only when a POST or PATCH carries an idempotency key, so a repeat cannot act twice. */
  idempotent?: boolean
  /** Injected in tests. */
  fetchImpl?: typeof fetch
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>
  random?: () => number
  now?: () => number
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'])
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504])
const MAX_RETRIES = 2

export async function fetchWithResilience(
  url: string | URL,
  init: RequestInit = {},
  options: ResilienceOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 5_000,
    totalTimeoutMs = 10_000,
    retries = 2,
    baseDelayMs = 200,
    maxDelayMs = 2_000,
    idempotent = false,
    fetchImpl = fetch,
    sleep = abortableSleep,
    random = Math.random,
    now = Date.now
  } = options

  const method = (init.method ?? 'GET').toUpperCase()
  const allowedRetries = Math.min(
    MAX_RETRIES,
    Math.max(0, Math.floor(retries) || 0)
  )
  const maxAttempts =
    SAFE_METHODS.has(method) || idempotent ? allowedRetries + 1 : 1
  const deadline = now() + totalTimeoutMs

  for (let attempt = 1; ; attempt++) {
    const remaining = deadline - now()
    const signals = [
      AbortSignal.timeout(Math.max(1, Math.min(timeoutMs, remaining)))
    ]
    if (init.signal) signals.push(init.signal)

    let response: Response | undefined
    let error: unknown
    try {
      response = await fetchImpl(url, {
        ...init,
        signal: AbortSignal.any(signals)
      })
    } catch (caught) {
      // The caller cancelled: stop at once, never retry.
      if (init.signal?.aborted) throw caught
      error = caught
    }

    if (response && !RETRYABLE_STATUSES.has(response.status)) return response

    const wait = response
      ? retryAfterMs(response.headers.get('retry-after'), now())
      : undefined
    const delay =
      wait ?? random() * Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1))
    const canRetry =
      attempt < maxAttempts && delay <= maxDelayMs && now() + delay < deadline

    if (!canRetry) {
      if (response) return response
      throw error
    }

    try {
      init.signal?.throwIfAborted()
      await sleep(delay, init.signal ?? undefined)
      init.signal?.throwIfAborted()
    } catch (cancelled) {
      // The caller cancelled while waiting: release the previous response
      // too, or each cancelled call would leave a connection open.
      void response?.body?.cancel().catch(() => {})
      throw cancelled
    }

    // A wait can run long (a busy event loop, a suspended function). Never
    // start an attempt after the deadline: return what we have instead.
    if (now() >= deadline) {
      if (response) return response
      throw error
    }

    // Free the connection, but never wait for it: a body that is slow or
    // never finishes cancelling must not hold the call past its deadline.
    void response?.body?.cancel().catch(() => {})
  }
}

/** Waits, but ends early with the abort reason when the signal fires. */
function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

// RFC 9110, section 5.6.7: the three HTTP date formats a recipient must accept,
// parsed strictly as GMT. Anything else falls back to backoff, because Date.parse
// accepts loose formats (and reads some as local time) that could turn into a
// zero wait.
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]
const MON = MONTHS.join('|')
// Sun, 06 Nov 1994 08:49:37 GMT (preferred)
const IMF_FIXDATE = new RegExp(
  `^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\\d{2}) (${MON}) (\\d{4}) (\\d{2}):(\\d{2}):(\\d{2}) GMT$`
)
// Sunday, 06-Nov-94 08:49:37 GMT (obsolete RFC 850)
const RFC850_DATE = new RegExp(
  `^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\\d{2})-(${MON})-(\\d{2}) (\\d{2}):(\\d{2}):(\\d{2}) GMT$`
)
// Sun Nov  6 08:49:37 1994 (obsolete asctime)
const ASCTIME_DATE = new RegExp(
  `^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (${MON}) ([ \\d]\\d) (\\d{2}):(\\d{2}):(\\d{2}) (\\d{4})$`
)

/** Milliseconds a Retry-After header asks for, from seconds or an HTTP date. */
export function retryAfterMs(
  header: string | null,
  nowMs: number
): number | undefined {
  if (!header) return undefined
  const value = header.trim()
  if (/^\d+$/.test(value)) return Number(value) * 1000
  const date = parseHttpDate(value, nowMs)
  return date === undefined ? undefined : Math.max(0, date - nowMs)
}

function parseHttpDate(value: string, nowMs: number): number | undefined {
  // Every group in these patterns is required, so a match always fills them;
  // the "" defaults only satisfy noUncheckedIndexedAccess.
  let day = '',
    month = '',
    year = 0,
    h = '',
    m = '',
    s = ''
  let match: RegExpExecArray | null
  if ((match = IMF_FIXDATE.exec(value))) {
    const [, d = '', mo = '', y = '', hh = '', mm = '', ss = ''] = match
    ;[day, month, year, h, m, s] = [d, mo, Number(y), hh, mm, ss]
  } else if ((match = RFC850_DATE.exec(value))) {
    const [, d = '', mo = '', y = '', hh = '', mm = '', ss = ''] = match
    // A two-digit year more than 50 years ahead is in the past century (RFC 9110).
    year = 2000 + Number(y)
    if (year > new Date(nowMs).getUTCFullYear() + 50) year -= 100
    ;[day, month, h, m, s] = [d, mo, hh, mm, ss]
  } else if ((match = ASCTIME_DATE.exec(value))) {
    const [, mo = '', d = '', hh = '', mm = '', ss = '', y = ''] = match
    ;[day, month, year, h, m, s] = [d, mo, Number(y), hh, mm, ss]
  } else {
    return undefined
  }
  const monthIndex = MONTHS.indexOf(month)
  const ms = Date.UTC(
    year,
    monthIndex,
    Number(day),
    Number(h),
    Number(m),
    Number(s)
  )
  const check = new Date(ms)
  // Reject impossible dates and times (31 Feb, 25:00) instead of letting them roll over.
  const valid =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === monthIndex &&
    check.getUTCDate() === Number(day) &&
    check.getUTCHours() === Number(h) &&
    check.getUTCMinutes() === Number(m) &&
    check.getUTCSeconds() === Number(s)
  return valid ? ms : undefined
}
