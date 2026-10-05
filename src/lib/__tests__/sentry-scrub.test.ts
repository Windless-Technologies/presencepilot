/**
 * @jest-environment node
 */
// Ported from engineering-standards, templates/monitoring/sentry-scrub.test.ts.
// Only the imports changed: describe and it come from Jest (@jest/globals).
import { describe, it } from '@jest/globals'
import assert from 'node:assert/strict'
import {
  redactText,
  redactUrl,
  scrubEvent,
  type ScrubbableEvent
} from '../sentry-scrub'

describe('scrubEvent', () => {
  it('removes the request details that carry personal data or secrets', () => {
    const event: ScrubbableEvent = {
      user: { id: '7', email: 'person@example.com', ip_address: '203.0.113.9' },
      breadcrumbs: [{ message: 'signed in as person@example.com' }],
      request: {
        url: 'https://app.example.com/api/invite?email=person@example.com',
        query_string: 'email=person@example.com',
        headers: { authorization: 'Bearer secret', cookie: 'session=abc' },
        cookies: { session: 'abc' },
        data: { password: 'hunter2' },
        env: { REMOTE_ADDR: '203.0.113.9' }
      }
    }
    const scrubbed = scrubEvent(event)
    assert.equal(scrubbed.user, undefined)
    assert.equal(scrubbed.breadcrumbs, undefined)
    assert.deepEqual(scrubbed.request, {
      url: 'https://app.example.com/api/invite'
    })
  })

  it('redacts emails and long numbers from the message and exception values', () => {
    const scrubbed = scrubEvent({
      message: 'Reminder to person@example.com failed',
      exception: {
        values: [
          {
            value:
              'duplicate key value violates unique constraint "users_email_key": (email)=(person@example.com)'
          },
          { value: 'card 4242 4242 4242 4242 declined, call +1 555-010-0199' }
        ]
      }
    })
    assert.equal(scrubbed.message, 'Reminder to [email] failed')
    assert.equal(
      scrubbed.exception?.values?.[0]?.value,
      'duplicate key value violates unique constraint "users_email_key": (email)=([email])'
    )
    assert.equal(
      scrubbed.exception?.values?.[1]?.value,
      'card [number] declined, call +[number]'
    )
  })

  it('keeps what is needed to find the bug', () => {
    const scrubbed = scrubEvent({
      message: 'Reminder failed for asset 42 (http_503) on 2026-10-05',
      transaction: 'GET /api/cron/reminders',
      exception: {
        values: [
          { value: "Cannot read properties of undefined (reading 'id')" }
        ]
      }
    })
    assert.equal(
      scrubbed.message,
      'Reminder failed for asset 42 (http_503) on 2026-10-05'
    )
    assert.equal(scrubbed.transaction, 'GET /api/cron/reminders')
    assert.equal(
      scrubbed.exception?.values?.[0]?.value,
      "Cannot read properties of undefined (reading 'id')"
    )
  })

  it('accepts an event with nothing to scrub', () => {
    assert.deepEqual(scrubEvent({}), {})
  })
})

describe('redactUrl', () => {
  it('drops the query string and fragment', () => {
    assert.equal(
      redactUrl('https://app.example.com/reset?token=abc#top'),
      'https://app.example.com/reset'
    )
    assert.equal(redactUrl('/login?error=github-unavailable'), '/login')
  })

  it('replaces token-like path segments, and keeps ordinary ones', () => {
    assert.equal(
      redactUrl('https://app.example.com/confirm/k3J9x_Qp2LmZ8vN4rT6yW1aB'),
      'https://app.example.com/confirm/:token'
    )
    assert.equal(
      redactUrl('/share/abcdefghijklmnopqrstuvwxyz0123/view'),
      '/share/:token/view'
    )
    assert.equal(redactUrl('/dashboard/platforms'), '/dashboard/platforms')
    assert.equal(redactUrl('/assets/42'), '/assets/42')
  })

  it('redacts an email address in the path', () => {
    assert.equal(
      redactUrl('/unsubscribe/person@example.com'),
      '/unsubscribe/[email]'
    )
  })
})

describe('redactText', () => {
  it('leaves short numbers, dates and status codes alone', () => {
    assert.equal(
      redactText('503 after 2 retries on 2026-10-05, asset 1234567'),
      '503 after 2 retries on 2026-10-05, asset 1234567'
    )
  })
})
