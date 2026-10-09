import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from '../support/axe'

/**
 * axe-core (WCAG 2.1 A and AA, and WCAG 2.2 AA) against every real page, on
 * desktop and phone widths. Add a route here whenever a page is added. A page
 * that is not in this list is a page nobody checked.
 */
const PAGES: Array<[name: string, path: string]> = [
  ['homepage', '/'],
  ['login', '/login'],
  ['login-error', '/login?error=unverified-email'],
  ['onboarding', '/onboarding'],
  ['not-found', '/this-page-does-not-exist']
]

for (const [name, path] of PAGES) {
  test(name, async ({ page }, testInfo) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expectNoA11yViolations(
      page,
      `${name}-${testInfo.project.name}`,
      testInfo
    )
  })
}
