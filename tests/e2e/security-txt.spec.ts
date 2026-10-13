import { expect, test } from '@playwright/test'

// /.well-known/security.txt (RFC 9116) points researchers at the address in
// SECURITY.md (LIFECYCLE_AND_FUNNEL_STANDARDS.md Section 10.3).
test('security.txt is served with a contact and an expiry under a year away', async ({
  request
}) => {
  const res = await request.get('/.well-known/security.txt')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('text/plain')
  const body = await res.text()
  expect(body).toContain('Contact: mailto:hr@bravehaven.io')
  expect(body).toContain('Preferred-Languages: en')
  expect(body).toContain(
    'Policy: https://github.com/Windless-Technologies/presencepilot/blob/main/SECURITY.md'
  )

  const expires = body.match(/^Expires: (.+)$/m)?.[1]
  expect(expires).toBeTruthy()
  const days = (Date.parse(expires!) - Date.now()) / 86_400_000
  // RFC 9116 asks for less than a year; under 30 days left means renew now.
  expect(days).toBeGreaterThan(30)
  expect(days).toBeLessThanOrEqual(366)
})
