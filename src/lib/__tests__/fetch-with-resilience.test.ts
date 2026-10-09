/**
 * @jest-environment node
 */
// Ported from engineering-standards, templates/resilience/fetch-with-resilience.test.ts.
// Every case is kept; only the imports changed: describe and it come from Jest
// (@jest/globals), the module is imported without its .ts extension, and the
// one per-test time limit is Jest's third argument instead of an options object.
import { describe, it } from '@jest/globals'
import assert from 'node:assert/strict'
import {
  fetchWithResilience,
  retryAfterMs,
  type ResilienceOptions
} from '../fetch-with-resilience'

type Step = number | Error | { status: number; headers: Record<string, string> }

/** A fake service that answers each attempt from a script, and a clock that moves only when the helper waits. */
function fake(steps: Step[]) {
  let clock = 0
  const calls: RequestInit[] = []
  const waits: number[] = []
  const options: ResilienceOptions = {
    fetchImpl: async (_url, init) => {
      calls.push(init ?? {})
      const step = steps[Math.min(calls.length - 1, steps.length - 1)]
      if (step === undefined)
        throw new Error('fake service needs at least one step')
      if (step instanceof Error) throw step
      if (typeof step === 'number') return new Response(null, { status: step })
      return new Response(null, { status: step.status, headers: step.headers })
    },
    sleep: async (ms) => {
      waits.push(ms)
      clock += ms
    },
    random: () => 1,
    now: () => clock
  }
  return { calls, waits, options }
}

describe('fetchWithResilience', () => {
  it('returns the first successful answer without waiting', async () => {
    const f = fake([200])
    const res = await fetchWithResilience(
      'https://api.example.com',
      {},
      f.options
    )
    assert.equal(res.status, 200)
    assert.equal(f.calls.length, 1)
    assert.deepEqual(f.waits, [])
  })

  it('retries a temporary failure with exponential backoff', async () => {
    const f = fake([503, 502, 200])
    const res = await fetchWithResilience(
      'https://api.example.com',
      {},
      f.options
    )
    assert.equal(res.status, 200)
    assert.equal(f.calls.length, 3)
    assert.deepEqual(f.waits, [200, 400])
  })

  it('adds full jitter, so waits fall anywhere up to the backoff step', async () => {
    const f = fake([503, 200])
    await fetchWithResilience(
      'https://api.example.com',
      {},
      { ...f.options, random: () => 0.25 }
    )
    assert.deepEqual(f.waits, [50])
  })

  it('returns the last answer when every retry fails', async () => {
    const f = fake([503])
    const res = await fetchWithResilience(
      'https://api.example.com',
      {},
      f.options
    )
    assert.equal(res.status, 503)
    assert.equal(f.calls.length, 3)
  })

  for (const status of [400, 401, 403, 404, 409, 422]) {
    it(`never retries a ${status}, which will fail the same way again`, async () => {
      const f = fake([status, 200])
      const res = await fetchWithResilience(
        'https://api.example.com',
        {},
        f.options
      )
      assert.equal(res.status, status)
      assert.equal(f.calls.length, 1)
    })
  }

  it('never retries a POST unless the caller marks it idempotent', async () => {
    const plain = fake([503, 200])
    const res = await fetchWithResilience(
      'https://api.example.com',
      { method: 'POST', body: '{}' },
      plain.options
    )
    assert.equal(res.status, 503)
    assert.equal(plain.calls.length, 1)

    const keyed = fake([503, 200])
    const ok = await fetchWithResilience(
      'https://api.example.com',
      {
        method: 'POST',
        body: '{}',
        headers: { 'Idempotency-Key': 'order-42' }
      },
      { ...keyed.options, idempotent: true }
    )
    assert.equal(ok.status, 200)
    assert.equal(keyed.calls.length, 2)
  })

  it('waits as long as Retry-After asks when that fits', async () => {
    const f = fake([{ status: 429, headers: { 'Retry-After': '1' } }, 200])
    const res = await fetchWithResilience(
      'https://api.example.com',
      {},
      f.options
    )
    assert.equal(res.status, 200)
    assert.deepEqual(f.waits, [1000])
  })

  it('gives up rather than wait longer than the longest allowed wait', async () => {
    const f = fake([{ status: 429, headers: { 'Retry-After': '120' } }, 200])
    const res = await fetchWithResilience(
      'https://api.example.com',
      {},
      f.options
    )
    assert.equal(res.status, 429)
    assert.equal(f.calls.length, 1)
    assert.deepEqual(f.waits, [])
  })

  it('stops at the overall deadline even with retries left', async () => {
    const f = fake([503])
    const res = await fetchWithResilience(
      'https://api.example.com',
      {},
      { ...f.options, totalTimeoutMs: 500 }
    )
    assert.equal(res.status, 503)
    // The first wait (200) fits in half a second; the second (400) would pass it.
    assert.deepEqual(f.waits, [200])
    assert.equal(f.calls.length, 2)
  })

  it('never starts an attempt after the deadline, even when a wait runs long', async () => {
    const f = fake([503, 200])
    let clock = 0
    // The wait asks for 200 ms, but the clock lands at 900 ms, past the 500 ms deadline.
    const oversleep = async (ms: number) => {
      f.waits.push(ms)
      clock = 900
    }
    const res = await fetchWithResilience(
      'https://api.example.com',
      {},
      { ...f.options, sleep: oversleep, now: () => clock, totalTimeoutMs: 500 }
    )
    assert.equal(res.status, 503)
    assert.equal(f.calls.length, 1)
  })

  for (const [asked, attempts] of [
    [10, 3],
    [3, 3],
    [1, 2],
    [1.7, 2],
    [0, 1],
    [-1, 1],
    [Number.NaN, 1]
  ] as const) {
    it(`makes ${attempts} attempt(s) when asked for ${asked} retries, never more than two retries`, async () => {
      const f = fake([503])
      await fetchWithResilience(
        'https://api.example.com',
        {},
        { ...f.options, retries: asked }
      )
      assert.equal(f.calls.length, attempts)
    })
  }

  it('retries a network error, then throws it when retries run out', async () => {
    const f = fake([new TypeError('fetch failed')])
    await assert.rejects(
      fetchWithResilience('https://api.example.com', {}, f.options),
      /fetch failed/
    )
    assert.equal(f.calls.length, 3)
  })

  it('stops at once when the caller cancels', async () => {
    const controller = new AbortController()
    const f = fake([new TypeError('unused')])
    f.options.fetchImpl = async () => {
      controller.abort()
      throw new DOMException('aborted', 'AbortError')
    }
    await assert.rejects(
      fetchWithResilience(
        'https://api.example.com',
        { signal: controller.signal },
        f.options
      ),
      { name: 'AbortError' }
    )
    assert.deepEqual(f.waits, [])
  })

  it('stops at once when the caller cancels during a wait', async () => {
    const controller = new AbortController()
    let attempts = 0
    const busy: typeof fetch = async () => {
      attempts++
      setTimeout(() => controller.abort(), 20)
      return new Response(null, { status: 503 })
    }
    const started = Date.now()
    await assert.rejects(
      fetchWithResilience(
        'https://api.example.com',
        { signal: controller.signal },
        { fetchImpl: busy, baseDelayMs: 1_000, random: () => 1 }
      ),
      { name: 'AbortError' }
    )
    assert.equal(attempts, 1)
    assert.ok(
      Date.now() - started < 500,
      'a cancelled request must not finish its wait'
    )
  })

  it('never waits on a response body that will not finish cancelling', async () => {
    let attempts = 0
    const stuck: typeof fetch = async () => {
      attempts++
      if (attempts > 1) return new Response(null, { status: 200 })
      // The body's cancel never settles, like a stalled connection.
      const body = new ReadableStream({
        cancel: () => new Promise<void>(() => {})
      })
      return new Response(body, { status: 503 })
    }
    const f = fake([200])
    const res = await fetchWithResilience(
      'https://api.example.com',
      {},
      { ...f.options, fetchImpl: stuck }
    )
    assert.equal(res.status, 200)
    assert.equal(attempts, 2)
  }, 2_000)

  it('releases the previous response when the caller cancels during a wait', async () => {
    const controller = new AbortController()
    let cancelled = false
    const busy: typeof fetch = async () => {
      setTimeout(() => controller.abort(), 20)
      const body = new ReadableStream({
        cancel: () => {
          cancelled = true
        }
      })
      return new Response(body, { status: 503 })
    }
    await assert.rejects(
      fetchWithResilience(
        'https://api.example.com',
        { signal: controller.signal },
        { fetchImpl: busy, baseDelayMs: 1_000, random: () => 1 }
      ),
      { name: 'AbortError' }
    )
    assert.equal(
      cancelled,
      true,
      'a cancelled call must not leave the response open'
    )
  })

  it('ends a hung attempt at its time limit', async () => {
    let attempts = 0
    // Holds a timer open the way a real hung connection holds a socket open.
    const hang: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        attempts++
        const socket = setTimeout(
          () => reject(new Error('still hung after 2 seconds')),
          2_000
        )
        init?.signal?.addEventListener('abort', () => {
          clearTimeout(socket)
          reject(init.signal?.reason)
        })
      })
    const started = Date.now()
    await assert.rejects(
      fetchWithResilience(
        'https://api.example.com',
        {},
        { fetchImpl: hang, timeoutMs: 30, retries: 1, baseDelayMs: 1 }
      ),
      { name: 'TimeoutError' }
    )
    assert.equal(attempts, 2)
    assert.ok(
      Date.now() - started < 1_000,
      'a hung service must not hold the request open'
    )
  })
})

describe('retryAfterMs', () => {
  it('reads seconds and HTTP dates, and ignores anything else', () => {
    const now = Date.parse('Sun, 04 Oct 2026 12:00:00 GMT')
    assert.equal(retryAfterMs('3', now), 3000)
    assert.equal(retryAfterMs('Sun, 04 Oct 2026 12:00:05 GMT', now), 5000)
    assert.equal(retryAfterMs('Sun, 04 Oct 2026 11:59:00 GMT', now), 0)
    assert.equal(retryAfterMs('soon', now), undefined)
    // The two obsolete formats RFC 9110 requires recipients to accept, read as GMT.
    assert.equal(retryAfterMs('Sunday, 04-Oct-26 12:00:05 GMT', now), 5000)
    assert.equal(retryAfterMs('Sun Oct  4 12:00:05 2026', now), 5000)
    assert.equal(
      retryAfterMs('Sun Oct 14 12:00:05 2026', now),
      10 * 24 * 3600 * 1000 + 5000
    )
    // Impossible dates are refused rather than rolled over.
    assert.equal(retryAfterMs('Sun, 31 Feb 2026 12:00:00 GMT', now), undefined)
    assert.equal(retryAfterMs('Sun, 04 Oct 2026 25:00:00 GMT', now), undefined)
    // Date.parse accepts these, but they are not HTTP dates, so backoff applies.
    assert.equal(retryAfterMs('2026-10-04', now), undefined)
    assert.equal(retryAfterMs('October 4, 2026', now), undefined)
    assert.equal(retryAfterMs('Sun, 04 Oct 2026 12:00:05', now), undefined)
    assert.equal(retryAfterMs(null, now), undefined)
  })
})
