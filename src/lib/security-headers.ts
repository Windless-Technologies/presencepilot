// Security headers on every response (engineering standards, section 3).
// Kept in their own file so a unit test reads exactly what next.config.ts
// sends.
//
// The Content Security Policy lists only this site's own origin. Fonts are
// self-hosted, and the Vercel BotID challenge is served from this origin
// (withBotId in next.config.ts rewrites its paths here). Scripts keep
// 'unsafe-inline' and eval because Next.js inlines its bootstrap scripts and
// BotID's challenge evaluates code; the policy still guarantees that no
// script, style, font, image, frame or request comes from another origin,
// that forms post only here, and that nobody can frame the site.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'"
].join('; ')

export const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  // Two years, on every subdomain: the product is served over HTTPS only.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains'
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Nothing on the site uses these, so no page, or anything injected into
  // one, can ask for them.
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()'
  }
]
