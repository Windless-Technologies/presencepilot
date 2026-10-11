import {
  linkCheckTarget,
  readStandardsConfig,
  type LinkPolicy
} from '../support/links'

// Copied from engineering-standards, templates/testing/tests/links/; only the
// address and the lists below are this product's own.

/**
 * The production address. PresencePilot has no domain yet (README,
 * Deployment), so there is no SITE_URL constant in the code to import: it
 * comes from the SITE_URL variable, and blank means unset. A production run
 * without it fails with "Set SITE_URL" rather than guessing an address.
 * Away from production no page links to the product's own domain, so the
 * fresh and local runs use a reserved documentation address (RFC 2606) that
 * no one can own, as the unit tests already do; it only names the product's
 * host to the rules.
 */
export function siteUrlFor(
  value: string | undefined,
  target: string | undefined
): string {
  const configured = (value ?? '').trim()
  if (configured) return configured
  return linkCheckTarget(target) === 'production'
    ? ''
    : 'https://presencepilot.example'
}

/**
 * What tests/links/links.spec.ts allows. Edit the lists; keep every comment
 * saying why an entry is there. The template's tests and validatePolicy()
 * fail an entry without a reason.
 */
export const LINK_POLICY: LinkPolicy = {
  siteUrl: siteUrlFor(process.env.SITE_URL, process.env.LINK_CHECK_TARGET),

  // Other hosts the product owns. The SITE_URL host is always included.
  ownedHosts: [],

  // Every outside domain the product links to on purpose. Subdomains are
  // included. A link to any other domain fails the check.
  thirdPartyHosts: [
    'ada.gov' // the accessibility statement says where to file a complaint under the ADA
  ],

  // External links that refuse automated requests, so their status cannot be
  // checked. Only the runs that request external sites read this (production,
  // by default; LINK_CHECK_EXTERNAL). Only for sites that block crawlers, never
  // for a link that is merely broken, and never for the product's own pages.
  uncheckable: [],

  // No page carries links its users write.
  userContent: [],

  ...readStandardsConfig()
}
