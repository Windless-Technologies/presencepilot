import { describe, expect, it } from '@jest/globals'
import { LINK_POLICY, siteUrlFor } from '../../../tests/links/links.config'
import {
  classifyLink,
  validatePolicy,
  type ClassifyOptions
} from '../../../tests/support/links'

// The link check's product settings (tests/links/links.config.ts), which
// .github/workflows/link-check.yml crawls with on every pull request and in
// production (engineering standards, section 8).
describe('link check policy', () => {
  const fresh: ClassifyOptions = {
    baseUrl: 'http://localhost:3100',
    pageUrl: 'http://localhost:3100/',
    target: 'fresh'
  }

  it('is valid, and reads the Windless Technologies repositories from standards.config.json', () => {
    expect(validatePolicy(LINK_POLICY)).toEqual([])
    expect(LINK_POLICY.githubOwner).toBe('Windless-Technologies')
    expect(LINK_POLICY.publicRepos).toEqual(['presencepilot'])
  })

  it('takes the production address from SITE_URL, and never guesses one for production', () => {
    expect(siteUrlFor('https://presencepilot.app', 'production')).toBe(
      'https://presencepilot.app'
    )
    expect(siteUrlFor('  ', 'production')).toBe('')
    expect(siteUrlFor(undefined, 'production')).toBe('')
    // Off production, with no domain chosen yet, a reserved address no one can own.
    expect(siteUrlFor(undefined, 'fresh')).toBe('https://presencepilot.example')
    expect(siteUrlFor('', undefined)).toBe('https://presencepilot.example')
    // A production run without SITE_URL fails the policy instead of crawling anything.
    expect(
      validatePolicy({ ...LINK_POLICY, siteUrl: siteUrlFor('', 'production') })
    ).not.toEqual([])
  })

  it('fails a link to Vercel, localhost, an unlisted domain or a private repository', () => {
    for (const href of [
      'https://presencepilot.vercel.app/',
      'http://localhost:3000/',
      'https://somewhere.example.org/',
      // A repository of the configured owner that standards.config.json does not list as public.
      `https://github.com/${LINK_POLICY.githubOwner}/not-a-public-repository`
    ]) {
      expect(classifyLink(href, LINK_POLICY, fresh).kind).toBe('forbidden')
    }
  })

  it('allows the outside page the accessibility statement names', () => {
    expect(
      classifyLink('https://www.ada.gov', LINK_POLICY, fresh)
    ).toMatchObject({ kind: 'external', checkStatus: true })
  })
})
