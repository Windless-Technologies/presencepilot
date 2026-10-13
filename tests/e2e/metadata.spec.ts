import { expect, test } from '@playwright/test'
import { PAGES } from '../../src/lib/page-metadata'

// What a search engine or a link preview reads from each shareable page:
// its own title and description, and an Open Graph and Twitter card with an
// image that loads (COPY_AND_CONVERSION_STANDARDS.md Section 12).
const PATHS: Record<keyof typeof PAGES, string> = {
  home: '/',
  login: '/login',
  onboarding: '/onboarding',
  privacy: '/privacy',
  terms: '/terms',
  accessibility: '/accessibility'
}

for (const [name, path] of Object.entries(PATHS)) {
  const { title, description } = PAGES[name as keyof typeof PAGES]

  test(`${path} has its own title, description and share card`, async ({
    page,
    request
  }) => {
    await page.goto(path)
    await expect(page).toHaveTitle(title)
    const meta = (selector: string) =>
      page.locator(selector).first().getAttribute('content')
    expect(await meta('meta[name="description"]')).toBe(description)
    expect(await meta('meta[property="og:title"]')).toBe(title)
    expect(await meta('meta[property="og:description"]')).toBe(description)
    expect(await meta('meta[name="twitter:title"]')).toBe(title)
    expect(await meta('meta[name="twitter:description"]')).toBe(description)
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image')

    for (const selector of [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]'
    ]) {
      const image = await meta(selector)
      expect(image, selector).toBeTruthy()
      expect(new URL(image!).pathname, selector).toBe('/share-image.png')
      const res = await request.get(new URL(image!).pathname)
      expect(res.status(), selector).toBe(200)
      expect(res.headers()['content-type']).toBe('image/png')
    }
  })
}

test('onboarding says which steps work and that nothing is saved', async ({
  page
}) => {
  await page.goto('/onboarding')
  await expect(
    page.getByText(
      'In progress: only step 1 works today. Steps 2 and 3 are not built yet, and nothing you enter is sent or saved.'
    )
  ).toBeVisible()
  await expect(page.getByText(/!/)).toHaveCount(0)
})
