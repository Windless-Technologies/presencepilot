import { expect, test } from '@playwright/test'

// Security headers on real responses, and Vercel BotID on starting a
// provider sign-in. The production build under test reads BotID's verdict
// from a cookie (BOTID_LOCAL_TEST in playwright.config.ts, ignored on
// Vercel), so a test can play the part of a bot.

for (const path of ['/', '/login', '/onboarding', '/api/auth/providers']) {
  test(`${path} carries the security headers`, async ({ request }) => {
    const res = await request.get(path)
    const h = res.headers()
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(h['strict-transport-security']).toMatch(/max-age=\d+/)
    expect(h['x-frame-options']).toBe('DENY')
    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(h['permissions-policy']).toContain('camera=()')
    expect(h['x-powered-by']).toBeUndefined()
  })
}

test('the login page runs with no Content Security Policy violations', async ({
  page
}) => {
  const violations: string[] = []
  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text()))
      violations.push(message.text())
  })
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continue with Google' }).click()
  await expect(page.getByRole('main').getByRole('status')).toHaveText(
    "Google sign-in isn't available yet."
  )
  await page.waitForLoadState('networkidle')
  expect(violations).toEqual([])
})

test('attack: a sign-in start BotID flags as a bot is refused before it reaches the provider', async ({
  page,
  context,
  baseURL
}) => {
  await context.addCookies([
    { name: 'botid-test', value: 'bot', url: baseURL! }
  ])
  let reachedGitHub = false
  await page.route('https://github.com/**', async (route) => {
    reachedGitHub = true
    await route.abort()
  })
  await page.goto('/login')
  const start = page.waitForResponse('**/api/auth/signin/github')
  await page.getByRole('button', { name: 'Continue with GitHub' }).click()
  expect((await start).status()).toBe(403)
  await expect(page).toHaveURL(/\/login\?error=bot-check$/)
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'We could not confirm a person started this sign-in. Reload the page and try again.'
  )
  expect(reachedGitHub).toBe(false)
  // No sign-in state was created for the refused start.
  const state = (await context.cookies()).find((c) =>
    c.name.endsWith('next-auth.state')
  )
  expect(state).toBeUndefined()
})
