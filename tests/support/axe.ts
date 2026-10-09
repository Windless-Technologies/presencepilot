// Copied from engineering-standards, templates/testing/tests/support/axe.ts,
// with the WCAG 2.2 AA tag added (STANDARDS.md, section 15: pass wcag2a,
// wcag2aa, wcag21aa and wcag22aa explicitly) and the phone-width overflow
// check relay added. The YouTube exclusions are dropped: no third-party
// embed exists here, so nothing is excluded.
import type { Page, TestInfo } from '@playwright/test'
import { expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'fs'
import path from 'path'

const RESULTS_ROOT = path.resolve(__dirname, '../../test-results/axe')

/** The tags axe runs. Some WCAG 2.2 rules, such as target size, are off unless asked for. */
export const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa'
]

/**
 * Runs axe-core against the current rendered state of `page` and asserts
 * zero WCAG 2.1 A and AA and WCAG 2.2 AA violations. Writes the full JSON
 * result to test-results/axe/<name>.json so a run's findings can be read
 * afterwards, not just a pass or fail.
 */
export async function expectNoA11yViolations(
  page: Page,
  name: string,
  testInfo?: TestInfo
) {
  // Next.js can commit a route's <title> a beat after the rest of the page.
  await page.waitForFunction(() => document.title.length > 0, undefined, {
    timeout: 5_000
  })

  // axe reads computed colours, and a half-finished transition computes to a
  // blend. Scan the settled page a visitor actually sees.
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .every((a) => a.playState === 'finished'),
    undefined,
    { timeout: 5_000 }
  )

  // A page wider than the screen is broken on a phone even when nothing
  // visibly scrolls: mobile browsers zoom the whole page out to fit it.
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth - window.innerWidth,
    zoom:
      window.innerWidth - (window.visualViewport?.width ?? window.innerWidth)
  }))
  expect(
    overflow.scroll,
    `"${name}" scrolls sideways by ${overflow.scroll}px`
  ).toBeLessThanOrEqual(1)
  expect(
    overflow.zoom,
    `"${name}" is zoomed out to fit ${overflow.zoom}px of overflow`
  ).toBeLessThanOrEqual(1)

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

  fs.mkdirSync(RESULTS_ROOT, { recursive: true })
  fs.writeFileSync(
    path.join(RESULTS_ROOT, `${name}.json`),
    JSON.stringify(results, null, 2)
  )
  if (testInfo) {
    await testInfo.attach(`axe-results-${name}`, {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json'
    })
  }

  // Name the offending selectors, so whoever sees this fail knows which
  // element it was.
  const summary = results.violations.map((v) => {
    const targets = v.nodes
      .map((n) => `        ${n.target.join(' ')}`)
      .join('\n')
    return `${v.id} (${v.impact}): ${v.help} - ${v.nodes.length} node(s)\n${targets}`
  })
  expect(
    summary,
    `axe violations on "${name}":\n${summary.join('\n')}`
  ).toEqual([])
}
