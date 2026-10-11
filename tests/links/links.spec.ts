import {
  test,
  expect,
  type APIRequestContext,
  type APIResponse,
  type Page
} from '@playwright/test'
import fs from 'fs'
import path from 'path'
import {
  classifyLink,
  describeLoop,
  isRedirectStatus,
  isResolvingStatus,
  fetchExternalLinks,
  linkCheckTarget,
  nestedSitemap,
  parseSitemap,
  redactUrls,
  RedirectGraph,
  reportable,
  sitemapRedirect,
  validatePolicy,
  type LinkVerdict
} from '../support/links'
import { LINK_POLICY } from './links.config'

/**
 * Every link and call to action resolves (STANDARDS.md, section 8).
 *
 * Crawls every page reachable from the home page and from the sitemap, and
 * fails on:
 *   - an internal link that does not answer 2xx or 3xx (a redirect's target
 *     is then checked as a link of its own, so a redirect to a 404 fails),
 *   - a redirect loop, internal or through other sites, or a chain of more
 *     than five redirects,
 *   - a sitemap nested deeper than the reader follows (MAX_SITEMAP_DEPTH),
 *   - a link with a scheme other than http, https, mailto:, tel:, sms:,
 *     javascript:, data: or blob:,
 *   - a link to localhost, a vercel.app address, or a domain the product
 *     does not own and has not listed in links.config.ts,
 *   - a link to a repository that standards.config.json does not list as public,
 *   - an external link that does not answer 2xx or 3xx, unless links.config.ts
 *     lists it, with a reason, as refusing automated requests. External sites
 *     are requested only when LINK_CHECK_EXTERNAL is true, which is the
 *     default in production only, so a third-party outage never turns a pull
 *     request red. The rules above apply to every link in every run.
 *
 * Where it runs (LINK_CHECK_TARGET):
 *   fresh       CI, against a production build whose database has the schema
 *               and no seed data (templates/workflows/link-check.yml). A link
 *               that only works when a seeded row exists, such as a demo page,
 *               fails here, before it can 404 on the live site.
 *   production  SITE_URL, daily and after each production deployment. Read
 *               only: every request is a GET, and the browser refuses to send
 *               anything else.
 *   (unset)     a local run against whatever database is configured. Useful,
 *               but only the fresh run proves the rule.
 *
 * Pages whose outbound links users write (a creator's profile, say) are
 * listed in links.config.ts under userContent. There a link to an unlisted
 * outside domain is counted, not failed or requested; every other rule holds.
 *
 * Results are written to test-results/links/report.json, paths only, never
 * query strings, email addresses or long numbers, for the job summary and the
 * error tracker.
 */

const TARGET = linkCheckTarget(process.env.LINK_CHECK_TARGET)
const FETCH_EXTERNAL = fetchExternalLinks(
  process.env.LINK_CHECK_EXTERNAL,
  TARGET
)
// A crawl that stops early would pass on the pages it never reached, so
// reaching the limit fails the check instead. Raise it for a large site.
const MAX_PAGES = Number(process.env.LINK_CHECK_MAX_PAGES) || 500
const REQUEST_TIMEOUT = 15_000
// An external link that redirects more often than this is reported, not followed.
const MAX_EXTERNAL_REDIRECTS = 5
// The same for the site's own redirects, so a chain that never repeats a URL
// is reported instead of followed until MAX_PAGES.
const MAX_INTERNAL_REDIRECTS = 5
const REPORT = path.resolve(__dirname, '../../test-results/links/report.json')

/** Where a link was found: a page, or a label such as "(sitemap)". */
const where = (from: string) => (from.startsWith('(') ? from : reportable(from))

interface Problem {
  page: string
  link: string
  problem: string
}

test('every internal link and call to action resolves', async ({
  page,
  request,
  baseURL
}) => {
  test.setTimeout(15 * 60_000)
  const base = baseURL ?? ''
  expect(base, 'the Playwright config sets baseURL').not.toBe('')
  expect(validatePolicy(LINK_POLICY), 'tests/links/links.config.ts').toEqual([])
  if (TARGET === 'production') {
    expect(new URL(base).origin, 'production checks run against SITE_URL').toBe(
      new URL(LINK_POLICY.siteUrl).origin
    )
  }

  // Read only, everywhere: the page may run its own scripts, but nothing it
  // sends other than a GET leaves the browser.
  await page.route('**/*', (route) =>
    route.request().method() === 'GET'
      ? route.continue()
      : route.abort('blockedbyclient')
  )

  const problems: Problem[] = []
  const queue: Array<{ url: string; from: string }> = []
  const seen = new Set<string>()
  const checkedExternal = new Map<string, string | null>()
  // Every redirect followed in either phase, so a loop is reported once found.
  const redirects = new RedirectGraph()
  let pagesCrawled = 0
  let userWrittenLinks = 0

  const consider = (verdict: LinkVerdict, from: string) => {
    if (verdict.kind === 'forbidden') {
      problems.push({
        page: where(from),
        link: reportable(verdict.url),
        problem: verdict.problem
      })
    } else if (verdict.kind === 'internal' && !seen.has(verdict.url)) {
      seen.add(verdict.url)
      queue.push({ url: verdict.url, from })
    } else if (
      verdict.kind === 'external' &&
      verdict.checkStatus &&
      !checkedExternal.has(verdict.url)
    ) {
      checkedExternal.set(verdict.url, from)
    } else if (verdict.kind === 'user-written') {
      userWrittenLinks++
    }
  }
  const options = (pageUrl: string, fromServer = false) => ({
    baseUrl: base,
    pageUrl,
    target: TARGET,
    fromServer
  })

  // Start from the home page and every page the sitemap names.
  consider(classifyLink('/', LINK_POLICY, options(base)), '(start)')
  await readSitemap(
    request,
    new URL('/sitemap.xml', base).toString(),
    problems,
    (loc) => {
      const verdict = classifyLink(loc, LINK_POLICY, options(base))
      consider(verdict, '(sitemap)')
      return verdict
    },
    // A nested sitemap is read as a sitemap, not queued as a page: judged by
    // the same rules, reported if forbidden, never crawled or counted.
    (loc) => {
      const verdict = classifyLink(loc, LINK_POLICY, options(base))
      if (verdict.kind === 'forbidden')
        problems.push({
          page: '(sitemap)',
          link: reportable(verdict.url),
          problem: verdict.problem
        })
      return verdict
    },
    (location, sitemapUrl) =>
      sitemapRedirect(location, LINK_POLICY, {
        baseUrl: base,
        pageUrl: sitemapUrl,
        target: TARGET
      })
  )

  // The site's own pages: request each, follow its redirect, and crawl it
  // when it is HTML. Run again after each round of external checks, since an
  // external link can redirect back to a page not reached yet.
  let stopped = false
  const crawl = async () => {
    while (queue.length && !stopped) {
      const { url, from } = queue.shift()!
      if (++pagesCrawled > MAX_PAGES) {
        problems.push({
          page: '(crawl)',
          link: reportable(url),
          problem: `more than ${MAX_PAGES} pages; raise LINK_CHECK_MAX_PAGES`
        })
        stopped = true
        break
      }
      const response = await get(request, url)
      if (typeof response === 'string') {
        problems.push({
          page: where(from),
          link: reportable(url),
          problem: response
        })
        continue
      }
      if (!isResolvingStatus(response.status)) {
        problems.push({
          page: where(from),
          link: reportable(url),
          problem: `answers ${response.status}`
        })
        continue
      }
      if (response.location !== null) {
        const verdict = classifyLink(
          response.location,
          LINK_POLICY,
          options(url, true)
        )
        const loop = 'url' in verdict ? redirects.add(url, verdict.url) : null
        if (loop) {
          problems.push({
            page: where(from),
            link: reportable(url),
            problem: describeLoop(loop)
          })
          continue
        }
        if (
          'url' in verdict &&
          redirects.longestChain(verdict.url) > MAX_INTERNAL_REDIRECTS
        ) {
          problems.push({
            page: where(from),
            link: reportable(url),
            problem: `redirects more than ${MAX_INTERNAL_REDIRECTS} times`
          })
          continue
        }
        consider(verdict, url)
        continue
      }
      if (!response.html) continue
      const hrefs = await linksOn(page, url)
      if (typeof hrefs === 'string') {
        problems.push({
          page: where(from),
          link: reportable(url),
          problem: hrefs
        })
        continue
      }
      for (const href of hrefs) {
        consider(classifyLink(href, LINK_POLICY, options(url)), url)
      }
    }
  }
  await crawl()

  // External links already met the static rules above. Their status is
  // requested only when FETCH_EXTERNAL is on (production, by default).
  // A redirect is followed one hop at a time, and each target meets the same
  // rules, so an allowed link that redirects to a 404, an unlisted domain,
  // localhost or a vercel.app address still fails.
  // A redirect back to one of the site's own pages goes to the crawl above,
  // which crawls it when it is HTML; this loop only asks external sites for
  // their status. Rounds alternate until neither has work left.
  const external: Array<{ url: string; from: string }> = []
  const requested = new Set<string>()
  for (;;) {
    if (!FETCH_EXTERNAL || stopped) break
    for (const [url, from] of checkedExternal) {
      if (!requested.has(url)) external.push({ url, from: from ?? '' })
    }
    if (!external.length) break
    while (external.length) {
      const { url, from } = external.shift()!
      if (requested.has(url)) continue
      requested.add(url)
      const response = await get(request, url)
      if (typeof response === 'string') {
        problems.push({
          page: where(from),
          link: reportable(url),
          problem: response
        })
        continue
      }
      if (!isResolvingStatus(response.status)) {
        problems.push({
          page: where(from),
          link: reportable(url),
          problem: `answers ${response.status}`
        })
        continue
      }
      if (response.location === null) continue
      // Resolved against the external page first, so a relative Location stays
      // on that site instead of being read as one of the product's own paths.
      const target = new URL(response.location, url).toString()
      const verdict = classifyLink(target, LINK_POLICY, options(url))
      const loop = 'url' in verdict ? redirects.add(url, verdict.url) : null
      if (loop) {
        problems.push({
          page: where(from),
          link: reportable(url),
          problem: describeLoop(loop)
        })
      } else if (
        'url' in verdict &&
        redirects.longestChain(verdict.url) > MAX_EXTERNAL_REDIRECTS
      ) {
        // Measured on the shared graph, not a count carried with each queued
        // URL: a URL in the middle of a chain may also be linked directly and
        // requested first, which restarted such a count and let a longer
        // chain pass, depending on the order the links were found.
        problems.push({
          page: where(from),
          link: reportable(url),
          problem: `redirects more than ${MAX_EXTERNAL_REDIRECTS} times`
        })
      } else if (verdict.kind === 'forbidden') {
        problems.push({
          page: where(url),
          link: reportable(verdict.url),
          problem: `is a redirect target that ${verdict.problem}`
        })
      } else if (verdict.kind === 'internal') {
        consider(verdict, url)
      } else if (verdict.kind === 'external' && verdict.checkStatus) {
        external.push({ url: verdict.url, from: url })
      }
    }
    await crawl()
  }

  // Error messages can quote the URL they failed on, query string included.
  // Nothing leaves this run with a token, an email address or a long number in it.
  const reported = problems.map((p) => ({
    ...p,
    problem: redactUrls(p.problem)
  }))

  fs.mkdirSync(path.dirname(REPORT), { recursive: true })
  fs.writeFileSync(
    REPORT,
    JSON.stringify(
      {
        target: TARGET,
        site: reportable(base),
        pagesCrawled,
        externalLinks: requested.size,
        externalLinksNotFetched: FETCH_EXTERNAL ? 0 : checkedExternal.size,
        userWrittenLinks,
        problems: reported
      },
      null,
      2
    )
  )

  const summary = reported
    .map((p) => `${p.link} (on ${p.page}) ${p.problem}`)
    .join('\n')
  expect(reported, `broken or forbidden links:\n${summary}`).toEqual([])
})

/** One GET without following redirects, so a 3xx is seen and its target checked separately. */
async function get(
  request: APIRequestContext,
  url: string
): Promise<
  { status: number; location: string | null; html: boolean } | string
> {
  try {
    const response = await request.get(url, {
      maxRedirects: 0,
      failOnStatusCode: false,
      timeout: REQUEST_TIMEOUT
    })
    const status = response.status()
    const headers = response.headers()
    const redirect = isRedirectStatus(status)
    const location = redirect ? (headers['location'] ?? null) : null
    await response.dispose()
    if (redirect && location === null)
      return `answers ${status} with no Location`
    return {
      status,
      location,
      html: (headers['content-type'] ?? '').includes('text/html')
    }
  } catch (error) {
    // The message names the cause (DNS, TLS, timeout), never a response body.
    return `could not be reached (${error instanceof Error ? error.message.split('\n')[0] : 'unknown error'})`
  }
}

/** Every link on the rendered page, as written in the markup, including the canonical URL. */
async function linksOn(page: Page, url: string): Promise<string[] | string> {
  try {
    await page.goto(url, { waitUntil: 'load' })
  } catch (error) {
    return `did not load in a browser (${error instanceof Error ? error.message.split('\n')[0] : 'unknown error'})`
  }
  return page.evaluate(() => [
    ...Array.from(
      document.querySelectorAll('a[href], area[href]'),
      (a) => a.getAttribute('href') ?? ''
    ),
    ...Array.from(
      document.querySelectorAll('link[rel="canonical"][href]'),
      (l) => l.getAttribute('href') ?? ''
    )
  ])
}

/**
 * Feeds every page in the sitemap, and in the sitemaps a sitemap index names,
 * to `onLoc`. A product without a sitemap.xml is not failed here; the
 * standards check and the SEO rules cover whether it should have one.
 *
 * A sitemap that redirects is not followed blindly: `onRedirect` classifies
 * each Location before it is requested, so a sitemap that redirects to
 * localhost, a vercel.app address or an unlisted domain is reported and never
 * fetched, and a redirect loop is reported instead of retried.
 */
async function readSitemap(
  request: APIRequestContext,
  url: string,
  problems: Problem[],
  onLoc: (loc: string) => LinkVerdict,
  onSitemap: (loc: string) => LinkVerdict,
  onRedirect: (
    location: string,
    sitemapUrl: string
  ) => { follow: string } | { problem: string },
  depth = 0
): Promise<void> {
  const chain = [url]
  let current = url
  let response: APIResponse
  for (;;) {
    try {
      response = await request.get(current, {
        maxRedirects: 0,
        failOnStatusCode: false,
        timeout: REQUEST_TIMEOUT
      })
    } catch (error) {
      problems.push({
        page: '(sitemap)',
        link: reportable(current),
        problem: `could not be reached (${error instanceof Error ? error.message.split('\n')[0] : 'unknown error'})`
      })
      return
    }
    const status = response.status()
    if (!isRedirectStatus(status)) break
    const location = response.headers()['location']
    await response.dispose()
    if (!location) {
      problems.push({
        page: '(sitemap)',
        link: reportable(current),
        problem: `answers ${status} with no Location`
      })
      return
    }
    const next = onRedirect(location, current)
    if ('problem' in next) {
      problems.push({
        page: '(sitemap)',
        link: reportable(current),
        problem: next.problem
      })
      return
    }
    if (chain.includes(next.follow)) {
      problems.push({
        page: '(sitemap)',
        link: reportable(url),
        problem: describeLoop([
          ...chain.slice(chain.indexOf(next.follow)),
          next.follow
        ])
      })
      return
    }
    if (chain.length > MAX_EXTERNAL_REDIRECTS) {
      problems.push({
        page: '(sitemap)',
        link: reportable(url),
        problem: `redirects more than ${MAX_EXTERNAL_REDIRECTS} times`
      })
      return
    }
    chain.push(next.follow)
    current = next.follow
  }
  // Only the product's own /sitemap.xml may be missing, and only when it was
  // not reached through a redirect, which would be a link to a missing page.
  if (response.status() === 404 && depth === 0 && chain.length === 1) return
  if (!response.ok()) {
    problems.push({
      page: '(sitemap)',
      link: reportable(current),
      problem: `answers ${response.status()}`
    })
    return
  }
  const { pages, sitemaps } = parseSitemap(await response.text())
  pages.forEach(onLoc)
  for (const nested of sitemaps) {
    // A nested sitemap names the production address; onSitemap maps it to the
    // build under test, and reports it if it points anywhere it must not.
    const next = nestedSitemap(onSitemap(nested), depth)
    if (next === null) continue
    if ('problem' in next) {
      problems.push({
        page: '(sitemap)',
        link: reportable(next.url),
        problem: next.problem
      })
      continue
    }
    await readSitemap(
      request,
      next.read,
      problems,
      onLoc,
      onSitemap,
      onRedirect,
      depth + 1
    )
  }
}
