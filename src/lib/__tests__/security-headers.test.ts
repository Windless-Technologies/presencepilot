/**
 * @jest-environment node
 */
import { describe, expect, it } from '@jest/globals'
import { localTestMode } from '../bot'
import { CONTENT_SECURITY_POLICY, SECURITY_HEADERS } from '../security-headers'

const header = (key: string) =>
  SECURITY_HEADERS.find((h) => h.key === key)?.value

describe('security headers', () => {
  it('sends every header the standards list', () => {
    expect(header('Strict-Transport-Security')).toMatch(/max-age=6307200\d/)
    expect(header('X-Frame-Options')).toBe('DENY')
    expect(header('X-Content-Type-Options')).toBe('nosniff')
    expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(header('Permissions-Policy')).toContain('camera=()')
    expect(header('Content-Security-Policy')).toBe(CONTENT_SECURITY_POLICY)
  })

  it('lets no other site frame the pages, run scripts or receive form posts', () => {
    const directives = Object.fromEntries(
      CONTENT_SECURITY_POLICY.split('; ').map((d) => {
        const [name, ...values] = d.split(' ')
        return [name, values]
      })
    )
    expect(directives['frame-ancestors']).toEqual(["'none'"])
    expect(directives['form-action']).toEqual(["'self'"])
    expect(directives['object-src']).toEqual(["'none'"])
    // Only keywords and local schemes: no host or https: wildcard anywhere.
    for (const values of Object.values(directives) as string[][]) {
      for (const value of values) {
        expect(value).toMatch(/^('[a-z-]+'|data:|blob:)$/)
      }
    }
  })
})

describe('BotID local test mode', () => {
  it('switches on only when asked for, outside Vercel', () => {
    expect(localTestMode({ BOTID_LOCAL_TEST: '1' })).toBe(true)
    expect(localTestMode({})).toBe(false)
    expect(localTestMode({ BOTID_LOCAL_TEST: 'true' })).toBe(false)
  })

  it('attack: can never switch on in a Vercel deployment', () => {
    expect(localTestMode({ BOTID_LOCAL_TEST: '1', VERCEL: '1' })).toBe(false)
    expect(
      localTestMode({ BOTID_LOCAL_TEST: '1', VERCEL_ENV: 'production' })
    ).toBe(false)
  })
})
