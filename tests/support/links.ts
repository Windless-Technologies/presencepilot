// The rules the link check applies (STANDARDS.md, section 8). Pure functions
// with no Playwright import, so the template's own tests run them directly and
// a project can unit test its policy the same way. tests/links/links.spec.ts
// does the crawling and calls these to decide what each link means.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** What a product declares about the links it is allowed to have. */
export interface LinkPolicy {
  /** The production address (SITE_URL). Its host is always owned. */
  siteUrl: string
  /** Other hosts the product owns, such as `www.` or an app subdomain. */
  ownedHosts: readonly string[]
  /**
   * Every outside domain the product links to on purpose. A subdomain of a
   * listed domain is included. Any other domain fails: a typo, a lapsed domain
   * or a hosting address in a link sends visitors to whoever holds it.
   */
  thirdPartyHosts: readonly string[]
  /**
   * External links whose status is not checked, because the site refuses
   * automated requests (LinkedIn answers 999, for one). Each entry is a URL
   * prefix with the reason. Its domain must still be in thirdPartyHosts, and
   * internal links can never be listed: they must always resolve.
   */
  uncheckable: ReadonlyArray<{ readonly url: string; readonly reason: string }>
  /**
   * Pages whose outbound links the product's users write, such as a creator's
   * profile page. A link there to an outside domain that is not in
   * thirdPartyHosts is the user's choice, not the product's link to fix, so it
   * is counted but neither failed nor requested. Every other rule still
   * applies on those pages: links into the site are followed, and localhost,
   * vercel.app, private repository and unknown scheme links still fail.
   * Empty unless the product has such pages; each entry says why.
   */
  userContent: readonly UserContentPages[]
  /** From standards.config.json: links to this owner's repositories must be public. */
  githubOwner: string | null
  /** From standards.config.json: the repositories that are deliberately public. */
  publicRepos: readonly string[]
}

/** One group of pages whose outbound links users write (LinkPolicy.userContent). */
export interface UserContentPages {
  /** Matches the page's path, for example /^\/[^/.]+\/?$/ for /<handle>. No g or y flag. */
  readonly pages: RegExp
  /** Paths the pattern matches that are the product's own pages, such as /pricing. */
  readonly except?: readonly string[]
  /** Why users, not the product, write the links on these pages. */
  readonly reason: string
}

/** Where the check runs. A fresh build has the schema and no rows; production is SITE_URL. */
export type LinkCheckTarget = 'fresh' | 'production' | 'local'

export type LinkVerdict =
  /** A mailto:, tel:, sms:, javascript:, data: or blob: link, or a fragment on the same page. Nothing to request. Any other non-http scheme is forbidden. */
  | { kind: 'skip'; reason: string }
  /** A page of the build under test: request it, and crawl it when it is HTML. */
  | { kind: 'internal'; url: string }
  /** Somewhere else. Request it unless the policy marks it uncheckable. */
  | { kind: 'external'; url: string; checkStatus: boolean }
  /**
   * A link a user wrote on a userContent page, to an outside domain the
   * product has not listed. Counted, not requested and not failed.
   */
  | { kind: 'user-written'; url: string }
  /** A link that must not exist, whatever it returns. */
  | { kind: 'forbidden'; url: string; problem: string }

export interface ClassifyOptions {
  /** The origin of the build being crawled (PLAYWRIGHT_BASE_URL or the local server). */
  baseUrl: string
  /** The page the link was found on, to resolve relative links. */
  pageUrl: string
  target: LinkCheckTarget
  /**
   * True for a redirect's Location header. A server that builds an absolute
   * redirect from the request names the address it was reached on, which is
   * the local server in CI, so that one address is not a localhost link.
   */
  fromServer?: boolean
}

const LOOPBACK =
  /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1?\])$|\.localhost$|\.local$/i
const HOSTING_SUBDOMAIN = /(^|\.)vercel\.app$/i
// A scheme, or a network-path reference: two slashes, where the URL parser
// reads a backslash as a slash (\\host, /\host and \/host all name another
// host). Tabs and line breaks are removed first, as the parser does.
const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i
const SKIPPED_SCHEMES = new Set([
  'mailto:',
  'tel:',
  'sms:',
  'javascript:',
  'data:',
  'blob:'
])

const hostOf = (url: string) => new URL(url).hostname.toLowerCase()
const matchesDomain = (host: string, domain: string) => {
  const d = domain.toLowerCase().replace(/^\.+/, '')
  return host === d || host.endsWith(`.${d}`)
}

export function ownedHosts(policy: LinkPolicy): Set<string> {
  return new Set([
    hostOf(policy.siteUrl),
    ...policy.ownedHosts.map((h) => h.toLowerCase())
  ])
}

/** Decides what one href means. Never makes a request. */
export function classifyLink(
  href: string,
  policy: LinkPolicy,
  options: ClassifyOptions
): LinkVerdict {
  const raw = href.trim()
  if (raw === '' || raw.startsWith('#'))
    return { kind: 'skip', reason: 'same page' }

  let url: URL
  try {
    url = new URL(raw, options.pageUrl)
  } catch {
    return { kind: 'forbidden', url: raw, problem: 'is not a valid URL' }
  }
  if (SKIPPED_SCHEMES.has(url.protocol))
    return { kind: 'skip', reason: url.protocol }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    // Reported, not skipped: a scheme nobody listed (ftp:, file:, a typo such
    // as htps:) is a link no visitor can follow, and skipping it would hide it.
    return {
      kind: 'forbidden',
      url: url.toString(),
      problem: `uses the ${url.protocol} scheme, which the link check does not know; use https, or a mailto:, tel: or sms: link`
    }
  }
  url.hash = ''
  const host = url.hostname.toLowerCase()
  const base = new URL(options.baseUrl)
  const written = url.toString()

  // A relative link always means the build under test. An absolute link names
  // a host, and that host is checked even when it happens to be the local
  // server, because the same markup ships to production.
  const isAbsolute = ABSOLUTE.test(raw.replace(/[\t\n\r]/g, ''))
  const isBase = url.origin === base.origin
  if (!isAbsolute || (isBase && options.fromServer)) {
    return { kind: 'internal', url: written }
  }

  if (LOOPBACK.test(host)) {
    return {
      kind: 'forbidden',
      url: written,
      problem:
        'points at localhost, which only exists on the machine that runs it'
    }
  }
  if (HOSTING_SUBDOMAIN.test(host)) {
    return {
      kind: 'forbidden',
      url: written,
      problem:
        "points at a vercel.app address instead of the product's own domain"
    }
  }
  const repo = privateRepository(url, policy)
  if (repo) {
    return {
      kind: 'forbidden',
      url: written,
      problem: `links to the repository ${repo}, which standards.config.json does not list as public`
    }
  }

  if (isBase) return { kind: 'internal', url: written }
  if (ownedHosts(policy).has(host)) {
    // Away from production, an absolute link to the product's own domain is
    // checked against the build under test, which is what the link will
    // reach once this build ships. In production it is requested as written.
    if (options.target !== 'production' && host === hostOf(policy.siteUrl)) {
      const mapped = new URL(url.pathname + url.search, base.origin)
      return { kind: 'internal', url: mapped.toString() }
    }
    return { kind: 'external', url: written, checkStatus: true }
  }

  if (!policy.thirdPartyHosts.some((domain) => matchesDomain(host, domain))) {
    // A server's redirect is always the product's own, wherever it is.
    if (
      !options.fromServer &&
      isUserContentPage(options.pageUrl, policy, options.baseUrl)
    ) {
      return { kind: 'user-written', url: written }
    }
    return {
      kind: 'forbidden',
      url: written,
      problem: `points at ${host}, a domain the product does not own and has not listed in thirdPartyHosts`
    }
  }
  const uncheckable = policy.uncheckable.some((entry) =>
    written.startsWith(entry.url)
  )
  return { kind: 'external', url: written, checkStatus: !uncheckable }
}

/** github.com/<owner>/<repo> for the configured owner, unless the repository is public. */
export function privateRepository(url: URL, policy: LinkPolicy): string | null {
  if (!policy.githubOwner) return null
  const host = url.hostname.toLowerCase()
  if (host !== 'github.com' && host !== 'www.github.com') return null
  // Decoded first, so an escaped segment (%59ounique98) names the same
  // owner or repository it does on GitHub instead of slipping past the check.
  const [owner, repo] = url.pathname
    .split('/')
    .filter(Boolean)
    .map(decodeSegment)
  if (
    !owner ||
    !repo ||
    owner.toLowerCase() !== policy.githubOwner.toLowerCase()
  )
    return null
  const name = repo.replace(/\.git$/i, '').toLowerCase()
  const isPublic = policy.publicRepos.some((r) => r.toLowerCase() === name)
  return isPublic ? null : `${owner}/${repo}`
}

/** A path segment with every layer of percent-encoding undone; a malformed escape is left as written. */
function decodeSegment(segment: string): string {
  let current = segment
  for (let i = 0; i < 5 && current.includes('%'); i++) {
    let next: string
    try {
      next = decodeURIComponent(current)
    } catch {
      break
    }
    if (next === current) break
    current = next
  }
  return current
}

/** 2xx and 3xx resolve. A redirect's target is then checked as a link of its own. */
export function isResolvingStatus(status: number): boolean {
  return status >= 200 && status < 400
}

/** The pages and nested sitemaps a sitemap or sitemap index names. */
export function parseSitemap(xml: string): {
  pages: string[]
  sitemaps: string[]
} {
  const decode = (text: string) =>
    text
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .trim()
  const locs = (block: string) =>
    [...block.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
      .map((m) => decode(m[1] ?? ''))
      .filter(Boolean)
  const sitemaps = [
    ...xml.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/gi)
  ].flatMap((m) => locs(m[1] ?? ''))
  const pages = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)].flatMap((m) =>
    locs(m[1] ?? '')
  )
  return { pages, sitemaps }
}

// An email address. Percent-encoded ones are decoded first (redactEmails).
// Any character outside ASCII counts except a space or a control, format or
// unassigned character, as in an internationalized (SMTPUTF8) address, so
// josé@example.com or jo👍@example.com is caught whole. A top-level domain
// is letters or punycode (xn--).
const EMAIL =
  /(?:[a-z0-9._%+-]|[^\p{ASCII}\p{Z}\p{C}])+(?:@|%40)(?:[a-z0-9-]|[^\p{ASCII}\p{Z}\p{C}])+(?:\.(?:[a-z0-9-]|[^\p{ASCII}\p{Z}\p{C}])+)*\.(?:xn--[a-z0-9-]+|[\p{L}\p{M}]{2,})/giu
// One percent escape of an ASCII byte, or the escapes of one UTF-8 encoded
// character (a lead byte and its continuation bytes).
const ESCAPED_CHAR =
  /%(?:[0-7][0-9a-f]|[cd][0-9a-f]%[89ab][0-9a-f]|e[0-9a-f](?:%[89ab][0-9a-f]){2}|f[0-7](?:%[89ab][0-9a-f]){3})/gi
// A character an email address can be written with.
const ADDRESS_CHAR = /^[\p{L}\p{M}\p{N}@._%+-]$/u
// Seven or more digits, optionally grouped by single spaces or hyphens: a
// phone, card, account or order number. Status codes, ports and page counts
// are shorter, and dots are not separators, so an IP address is kept.
const LONG_NUMBER = /\d(?:[ -]?\d){6,}/g

// Percent escapes of a digit, a space or a hyphen, the characters a long
// number is written with, however many times the % itself was encoded
// (%34, %2534). URL paths keep their escapes, so /orders/%34%38%31%35%31%36%32
// would otherwise reach a report with the number readable.
const NUMBER_ESCAPE = /%(?:25)*(?:3[0-9]|20|2d)/gi
const NUMBER_RUN = /(?:[0-9 -]|%(?:25)*(?:3[0-9]|20|2d))+/gi

/**
 * Every long number replaced, plain or percent-encoded. Each run of digits,
 * spaces, hyphens and their escapes is decoded on its own, and only a run
 * whose decoded form holds a long number changes, so an encoded path such as
 * /a%20b or /%31%32 reads as it did.
 */
function redactNumbers(text: string): string {
  return text.replace(NUMBER_RUN, (run: string) => {
    const decoded = run.replace(NUMBER_ESCAPE, (escape: string) =>
      decodeURIComponent(escape.replace(/^%(?:25)*/, '%'))
    )
    const redacted = decoded.replace(LONG_NUMBER, '[number]')
    return redacted === decoded ? run : redacted
  })
}

/**
 * Removes what could identify a person from text that leaves the run (a
 * report, an error tracker, a job summary): email addresses and long numbers
 * (STANDARDS.md, section 10). A path such as /u/person@example.com or
 * /orders/48151623 is still recognisable with the value replaced.
 */
export function redactPersonalData(text: string): string {
  return redactNumbers(redactEmails(text))
}

/**
 * Every email address replaced, plain or percent-encoded. Each run of the
 * characters an address can be written with is decoded on its own, and only
 * a run whose decoded form holds an address changes, so an encoded path
 * such as /a%20b or /%31%32 reads as it did.
 */
function redactEmails(text: string): string {
  return text.replace(
    /(?:[a-z0-9._%+@-]|[^\p{ASCII}\p{Z}\p{C}])+/giu,
    (run: string) => {
      const decoded = decodeEmailEscapes(run)
      const redacted = decoded.replace(EMAIL, '[email]')
      return redacted === decoded ? run : redacted
    }
  )
}

/**
 * Percent escapes of the characters an email address is written with
 * (letters, marks and digits from any script, @ . _ % + -) decoded, so
 * person%40example%2Ecom, a double-encoded person%2540example.com or
 * jos%C3%A9%40example.com (josé@example.com) is seen as the address it is. Any
 * other escape is left as written, so decoding cannot add markup, spaces or
 * line breaks to a report, and an invalid one such as %ZZ is kept.
 */
export function decodeEmailEscapes(text: string): string {
  let current = text
  // Each pass undoes one layer of encoding and shortens the text, so this
  // ends; it stops when nothing changes, however many layers there were.
  for (;;) {
    const next = current.replace(ESCAPED_CHAR, (escape: string) => {
      let char: string
      try {
        char = decodeURIComponent(escape)
      } catch {
        return escape // an overlong or surrogate encoding
      }
      return ADDRESS_CHAR.test(char) ? char : escape
    })
    if (next === current) break
    current = next
  }
  return current
}

/**
 * How a URL appears in a report, an error tracker or a job summary: scheme,
 * host and path, never a user name, password, query string or fragment,
 * which can carry a token or an email address, and with any email address or
 * long number in the path replaced (STANDARDS.md, section 10).
 */
export function reportable(url: string): string {
  try {
    const u = new URL(url)
    return redactPersonalData(
      `${u.protocol}${u.host ? `//${u.host}` : ''}${u.pathname}`
    )
  } catch {
    return '(invalid URL)'
  }
}

/**
 * Every URL inside free text (an error message, say) reduced to scheme, host
 * and path, as reportable() does for a single URL, and any email address or
 * long number elsewhere in the text replaced.
 */
export function redactUrls(text: string): string {
  const cut = text.replace(
    /\b[a-z][a-z0-9+.-]*:\/\/[^\s"'<>]+/gi,
    (match: string) => {
      const { url, trail } = splitTrailing(match)
      const end = url.search(/[?#]/)
      const bare = end === -1 ? url : url.slice(0, end)
      // A user name and password before the host never leave the run either.
      return bare.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/]*@/i, '$1') + trail
    }
  )
  return redactPersonalData(cut)
}

/**
 * A URL found in free text, without what belongs to the sentence after it.
 * Parentheses are legal in a path (/a(b)?token=x), so the URL keeps them and
 * is cut at its query string afterwards; only a closing parenthesis with no
 * opening one in the URL, as in "(see https://x.example/y)", and punctuation
 * after the URL are the sentence's.
 */
export function splitTrailing(match: string): { url: string; trail: string } {
  const count = (text: string, char: string) => text.split(char).length - 1
  let url = match
  let trail = ''
  for (;;) {
    const last = url.slice(-1)
    const unbalanced = last === ')' && count(url, ')') > count(url, '(')
    if (last === '' || !(/[.,;:!]/.test(last) || unbalanced)) break
    trail = last + trail
    url = url.slice(0, -1)
  }
  return { url, trail }
}

/** True when the page is one whose outbound links users write (LinkPolicy.userContent). */
export function isUserContentPage(
  pageUrl: string,
  policy: LinkPolicy,
  baseUrl: string
): boolean {
  let page: URL
  try {
    page = new URL(pageUrl)
  } catch {
    return false
  }
  // Only the site's own pages. An external page that redirected is never one.
  if (page.origin !== new URL(baseUrl).origin) return false
  const path = page.pathname
  const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path
  return policy.userContent.some(
    (entry) =>
      entry.pages.test(path) &&
      !(entry.except ?? []).some((own) => own === path || own === trimmed)
  )
}

/**
 * The redirects seen so far, one edge per URL, so a redirect loop is reported
 * instead of quietly stopping where the crawl's de-duplication ends it. A loop
 * can run through the site, another owned host and outside sites; every
 * redirect the check follows is added to the same graph.
 */
export class RedirectGraph {
  private readonly next = new Map<string, string>()
  /** The most redirects in a row recorded so far that end at each URL. */
  private readonly depth = new Map<string, number>()
  private readonly reported = new Set<string>()

  /**
   * Records that `from` redirects to `to`. Returns the loop as a list of URLs
   * that starts and ends with `from` when this redirect closes one, once per
   * loop, and null otherwise.
   */
  add(from: string, to: string): string[] | null {
    this.next.set(from, to)
    // Every URL has one next hop, so a longer chain into `from` can only
    // lengthen the chain from `to` onward; carry it along until it stops
    // growing, or the chain ends or loops.
    const visited = new Set([from])
    let step: string | undefined = to
    let length = (this.depth.get(from) ?? 0) + 1
    while (
      step !== undefined &&
      !visited.has(step) &&
      length > (this.depth.get(step) ?? 0)
    ) {
      this.depth.set(step, length)
      visited.add(step)
      step = this.next.get(step)
      length++
    }
    const path = [from]
    let current: string | undefined = to
    while (current !== undefined && current !== from) {
      if (path.includes(current)) return null // a loop that does not include `from`, reported when it closed
      path.push(current)
      current = this.next.get(current)
    }
    if (current === undefined) return null
    const key = [...path].sort().join('\n')
    if (this.reported.has(key)) return null
    this.reported.add(key)
    return [...path, from]
  }

  /**
   * The most redirects in a row recorded through `url`: the longest chain
   * into it, carried on through the redirects already recorded after it. A
   * chain that never repeats a URL (each hop adds to the path or the query
   * string, say) is no loop, but it may never end, so the crawl stops it at a
   * limit instead of following it until MAX_PAGES. Chains that join one
   * already crawled are measured whole, whichever was seen first.
   */
  longestChain(url: string): number {
    const visited = new Set([url])
    let longest = this.depth.get(url) ?? 0
    let current = this.next.get(url)
    while (current !== undefined && !visited.has(current)) {
      visited.add(current)
      longest = Math.max(longest, this.depth.get(current) ?? 0)
      current = this.next.get(current)
    }
    return longest
  }
}

/** How a redirect loop reads in a report. */
export function describeLoop(loop: readonly string[]): string {
  return `redirects in a loop: ${loop.map(reportable).join(' -> ')}`
}

/**
 * What to do with a sitemap that answers with a redirect: follow it only to
 * the build under test or another host the product owns, and report anything
 * else before it is fetched. The Location comes from the server, so the
 * build's own local address is not a localhost link.
 */
export function sitemapRedirect(
  location: string,
  policy: LinkPolicy,
  options: Omit<ClassifyOptions, 'fromServer'>
): { follow: string } | { problem: string } {
  const verdict = classifyLink(location, policy, {
    ...options,
    fromServer: true
  })
  if (verdict.kind === 'forbidden')
    return { problem: `redirects to a target that ${verdict.problem}` }
  if (verdict.kind === 'internal') return { follow: verdict.url }
  if (
    verdict.kind === 'external' &&
    ownedHosts(policy).has(hostOf(verdict.url))
  )
    return { follow: verdict.url }
  return {
    problem: "redirects away from the product's own domains, so it is not read"
  }
}

/** The deepest a sitemap index is read: /sitemap.xml, the sitemaps it names, and theirs. */
export const MAX_SITEMAP_DEPTH = 2

/**
 * What to do with a nested sitemap that a sitemap index at `depth` names
 * (0 is /sitemap.xml), once classifyLink has judged it: read it, or report
 * that it is nested too deep to read. Reported, not skipped, because the
 * pages inside would otherwise go unchecked while the check passed. Null for
 * anything that is not a page of the build under test; a forbidden one is
 * already reported as a link.
 */
export function nestedSitemap(
  verdict: LinkVerdict,
  depth: number
): { read: string } | { url: string; problem: string } | null {
  if (verdict.kind !== 'internal') return null
  if (depth >= MAX_SITEMAP_DEPTH) {
    return {
      url: verdict.url,
      problem: `is nested more than ${MAX_SITEMAP_DEPTH} sitemaps deep, so its pages are not read; flatten the sitemap index`
    }
  }
  return { read: verdict.url }
}

/** Mistakes in the policy itself, so an allowlist cannot quietly grow into a hole. */
export function validatePolicy(policy: LinkPolicy): string[] {
  const errors: string[] = []
  let site: URL | null = null
  try {
    site = new URL(policy.siteUrl)
  } catch {
    errors.push(`siteUrl "${policy.siteUrl}" is not a URL. Set SITE_URL.`)
  }
  if (site) {
    if (site.protocol !== 'https:')
      errors.push(`siteUrl must use https, not ${site.protocol}`)
    if (LOOPBACK.test(site.hostname) || HOSTING_SUBDOMAIN.test(site.hostname)) {
      errors.push(
        `siteUrl must be the product's own domain, not ${site.hostname}`
      )
    }
  }
  for (const host of [...policy.ownedHosts, ...policy.thirdPartyHosts]) {
    if (LOOPBACK.test(host) || HOSTING_SUBDOMAIN.test(host)) {
      errors.push(`"${host}" can never be an allowed link domain`)
    }
  }
  const owned = site ? ownedHosts(policy) : new Set<string>()
  for (const entry of policy.uncheckable) {
    let url: URL
    try {
      url = new URL(entry.url)
    } catch {
      errors.push(`uncheckable "${entry.url}" is not an absolute URL`)
      continue
    }
    const host = url.hostname.toLowerCase()
    if (entry.reason.trim().length < 10) {
      errors.push(
        `uncheckable "${entry.url}" needs a reason saying why the site refuses automated requests`
      )
    }
    if (url.protocol !== 'https:')
      errors.push(`uncheckable "${entry.url}" must use https`)
    if (owned.has(host)) {
      errors.push(
        `uncheckable "${entry.url}" is the product's own; internal links are always checked`
      )
    } else if (
      !policy.thirdPartyHosts.some((domain) => matchesDomain(host, domain))
    ) {
      errors.push(
        `uncheckable "${entry.url}" is on ${host}, which is not in thirdPartyHosts`
      )
    }
  }
  for (const entry of policy.userContent) {
    const label = String(entry.pages)
    if (!(entry.pages instanceof RegExp)) {
      errors.push(
        `userContent ${label} must be a regular expression matching page paths`
      )
      continue
    }
    // A g or y flag makes test() remember where it stopped, so the same page
    // would match on one call and not the next.
    if (entry.pages.global || entry.pages.sticky)
      errors.push(`userContent ${label} must not use the g or y flag`)
    if (entry.reason.trim().length < 10) {
      errors.push(
        `userContent ${label} needs a reason saying why users, not the product, write those links`
      )
    }
    if (entry.pages.test('/'))
      errors.push(
        `userContent ${label} matches the home page, which is the product's own`
      )
    for (const own of entry.except ?? []) {
      if (!own.startsWith('/'))
        errors.push(
          `userContent ${label} except "${own}" must be a path starting with /`
        )
    }
  }
  return errors
}

/** The GitHub owner and public repositories from the project's standards.config.json. */
export function readStandardsConfig(
  root: string = process.cwd()
): Pick<LinkPolicy, 'githubOwner' | 'publicRepos'> {
  const file = join(root, 'standards.config.json')
  if (!existsSync(file)) return { githubOwner: null, publicRepos: [] }
  const config = JSON.parse(readFileSync(file, 'utf8')) as {
    githubOwner?: unknown
    publicRepos?: unknown
  }
  const owner =
    typeof config.githubOwner === 'string' ? config.githubOwner.trim() : ''
  const repos = Array.isArray(config.publicRepos)
    ? config.publicRepos.filter((r): r is string => typeof r === 'string')
    : []
  return {
    githubOwner: owner && owner !== 'your-github-org' ? owner : null,
    publicRepos: repos
  }
}

/**
 * LINK_CHECK_EXTERNAL: whether to request external links, or only apply the
 * static rules to them. "true" or "false"; blank means unset, which fetches
 * them in production only.
 *
 * Why only there by default: a third-party outage would otherwise turn an
 * unrelated pull request red, which is a flaky test (STANDARDS.md, section 8).
 * Every internal link is still requested in every run, and every link, internal
 * or external, still meets the static rules (localhost, vercel.app, unowned or
 * unlisted domains, private repositories). The production run, daily and
 * after each deployment, is the one that requests external sites and reports
 * a broken one to the error tracker.
 */
export function fetchExternalLinks(
  value: string | undefined,
  target: LinkCheckTarget
): boolean {
  const v = (value ?? '').trim()
  if (v === '') return target === 'production'
  if (v === 'true') return true
  if (v === 'false') return false
  throw new Error(
    `LINK_CHECK_EXTERNAL must be "true", "false" or unset, not "${v}"`
  )
}

/** LINK_CHECK_TARGET, where blank means unset (a local run). */
export function linkCheckTarget(value: string | undefined): LinkCheckTarget {
  const v = (value ?? '').trim()
  if (v === '') return 'local'
  if (v === 'fresh' || v === 'production') return v
  throw new Error(
    `LINK_CHECK_TARGET must be "fresh", "production" or unset, not "${v}"`
  )
}
