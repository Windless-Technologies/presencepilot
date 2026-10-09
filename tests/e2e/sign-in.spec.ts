import { expect, test } from '@playwright/test'

// The login page and NextAuth's routes, against a production build. The test
// server configures GitHub with test-only keys (playwright.config.ts) and
// leaves Google and LinkedIn unconfigured, so both states are covered.

test.describe('login page', () => {
  test('always shows Google, GitHub and LinkedIn', async ({ page }) => {
    await page.goto('/login')
    for (const name of ['Google', 'GitHub', 'LinkedIn']) {
      await expect(
        page.getByRole('button', { name: `Continue with ${name}` })
      ).toBeVisible()
    }
  })

  for (const name of ['Google', 'LinkedIn']) {
    test(`an unconfigured ${name} button says so in place`, async ({
      page
    }) => {
      await page.goto('/login')
      await page.getByRole('button', { name: `Continue with ${name}` }).click()
      await expect(page.getByRole('main').getByRole('status')).toHaveText(
        `${name} sign-in isn't available yet.`
      )
      await expect(page).toHaveURL(/\/login$/)
    })
  }

  test('a configured provider starts its sign-in, tied to this browser', async ({
    page,
    context
  }) => {
    // Stop at GitHub's door: nothing leaves the test machine.
    let authorize: URL | null = null
    await page.route('https://github.com/**', async (route) => {
      authorize = new URL(route.request().url())
      await route.fulfill({ status: 200, body: 'GitHub stand-in' })
    })
    await page.goto('/login')
    await page.getByRole('button', { name: 'Continue with GitHub' }).click()
    await expect(page.getByText('GitHub stand-in')).toBeVisible()
    expect(authorize).not.toBeNull()
    const url = authorize as unknown as URL
    expect(url.pathname).toBe('/login/oauth/authorize')
    expect(url.searchParams.get('scope')).toBe('read:user user:email')
    expect(url.searchParams.get('redirect_uri')).toMatch(
      /\/api\/auth\/callback\/github$/
    )
    // The state NextAuth checks on return lives in a short-lived cookie in
    // this browser, not only on the server.
    const state = (await context.cookies()).find((c) =>
      c.name.endsWith('next-auth.state')
    )
    expect(state?.httpOnly).toBe(true)
    expect(state?.sameSite).toBe('Lax')
    expect(url.searchParams.get('state')).toBeTruthy()
  })

  test('explains an unverified provider email', async ({ page }) => {
    await page.goto('/login?error=unverified-email')
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'That account has no confirmed email address.'
    )
  })

  test('attack: never echoes the error parameter back into the page', async ({
    page
  }) => {
    const probe = '<img src=x onerror=alert(1)>'
    const dialogs: string[] = []
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message())
      await dialog.dismiss()
    })
    await page.goto(`/login?error=${encodeURIComponent(probe)}`)
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      "We couldn't sign you in. Try again, or sign in another way."
    )
    // Only the fixed message renders: no element from the probe, and no
    // script ran. (Next.js keeps the raw query JSON-escaped in its own page
    // data, where it is inert.)
    await expect(page.locator('img[src="x"]')).toHaveCount(0)
    await expect(page.getByRole('main')).not.toContainText('onerror')
    expect(dialogs).toEqual([])
  })

  test('email sign-in is shown as coming soon and cannot be used', async ({
    page
  }) => {
    await page.goto('/login')
    await expect(page.getByText('Email sign-in is coming soon')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeDisabled()
    await expect(page.getByLabel('Password')).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Login' })).toBeDisabled()
  })
})

test.describe('session routes', () => {
  test('sign-in cookies are HttpOnly and SameSite=Lax', async ({ request }) => {
    const res = await request.get('/api/auth/csrf')
    expect(res.ok()).toBe(true)
    const cookies = res
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value)
    const csrf = cookies.find((c) => c.includes('next-auth.csrf-token'))
    expect(csrf).toMatch(/HttpOnly/i)
    expect(csrf).toMatch(/SameSite=Lax/i)
  })

  test('attack: a forged session cookie signs nobody in', async ({
    request
  }) => {
    const res = await request.get('/api/auth/session', {
      headers: { cookie: 'next-auth.session-token=forged-value' }
    })
    expect(await res.json()).toEqual({})
  })

  test('only the configured providers are offered to the browser', async ({
    request
  }) => {
    const providers = await (await request.get('/api/auth/providers')).json()
    expect(Object.keys(providers)).toEqual(['github'])
  })
})
