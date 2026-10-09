import { expect, test } from '@playwright/test'

// Every page links the privacy policy, terms and accessibility statement
// (engineering standards, section 10).
for (const path of ['/', '/login', '/onboarding', '/privacy']) {
  test(`${path} links privacy, terms and accessibility`, async ({ page }) => {
    await page.goto(path)
    const legal = page.getByRole('navigation', { name: 'Legal' })
    for (const [name, href, heading] of [
      ['Privacy', '/privacy', 'Privacy Policy'],
      ['Terms', '/terms', 'Terms of Use'],
      ['Accessibility', '/accessibility', 'Accessibility Statement']
    ]) {
      await expect(legal.getByRole('link', { name })).toHaveAttribute(
        'href',
        href
      )
      const res = await page.request.get(href)
      expect(res.status()).toBe(200)
      expect(await res.text()).toContain(heading)
    }
  })
}
