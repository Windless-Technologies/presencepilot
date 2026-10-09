/**
 * @jest-environment node
 */
// Pins the error tracking rules of the engineering standards (section 13) to
// what src/instrumentation.ts actually passes to Sentry: server only,
// production only, nothing without SENTRY_DSN, no default personal data, and
// every event scrubbed before it leaves the server.
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

const mockInit = jest.fn()
const mockCaptureRequestError = jest.fn()
jest.mock('@sentry/nextjs', () => ({
  init: mockInit,
  captureRequestError: mockCaptureRequestError
}))

import { onRequestError, register } from '../instrumentation'

type InitOptions = {
  dsn?: string
  enabled: boolean
  environment: string
  sendDefaultPii: boolean
  tracesSampleRate: number
  maxBreadcrumbs: number
  beforeSend: (event: Record<string, unknown>) => Record<string, unknown>
}

const ORIGINAL_ENV = { ...process.env }

function optionsFor(env: Record<string, string | undefined>): InitOptions {
  process.env = { ...ORIGINAL_ENV, ...env }
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key]
  }
  mockInit.mockClear()
  register()
  expect(mockInit).toHaveBeenCalledTimes(1)
  return mockInit.mock.calls[0]![0] as InitOptions
}

describe('register', () => {
  beforeEach(() => {
    mockInit.mockClear()
  })
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('sends errors only from production with a DSN', () => {
    const dsn = 'set-by-the-sentry-integration'
    expect(
      optionsFor({ SENTRY_DSN: dsn, VERCEL_ENV: 'production' }).enabled
    ).toBe(true)
    expect(optionsFor({ SENTRY_DSN: dsn, VERCEL_ENV: 'preview' }).enabled).toBe(
      false
    )
    expect(optionsFor({ SENTRY_DSN: dsn, VERCEL_ENV: undefined }).enabled).toBe(
      false
    )
    expect(
      optionsFor({ SENTRY_DSN: undefined, VERCEL_ENV: 'production' }).enabled
    ).toBe(false)
    // A blank value is unset, not a DSN.
    expect(
      optionsFor({ SENTRY_DSN: '', VERCEL_ENV: 'production' }).enabled
    ).toBe(false)
  })

  it('keeps personal data, tracing and breadcrumbs off', () => {
    const options = optionsFor({ VERCEL_ENV: 'production' })
    expect(options.sendDefaultPii).toBe(false)
    expect(options.tracesSampleRate).toBe(0)
    expect(options.maxBreadcrumbs).toBe(0)
  })

  it('scrubs every event before it is sent', () => {
    const { beforeSend } = optionsFor({ VERCEL_ENV: 'production' })
    const event = beforeSend({
      message: 'Sign-in failed for owner@example.com',
      user: { email: 'owner@example.com' },
      request: {
        url: 'https://presencepilot.example/api/auth/callback/google?code=secret',
        headers: { cookie: 'next-auth.session-token=abc' }
      }
    })
    expect(event).toEqual({
      message: 'Sign-in failed for [email]',
      request: { url: 'https://presencepilot.example/api/auth/callback/google' }
    })
  })
})

describe('onRequestError', () => {
  it("is Sentry's request error handler, so route and page errors are reported", () => {
    expect(onRequestError).toBe(mockCaptureRequestError)
  })
})
