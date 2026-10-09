import type { NextConfig } from 'next'
import { withBotId } from 'botid/next/config'
import { SECURITY_HEADERS } from './src/lib/security-headers'

const nextConfig: NextConfig = {
  // Next.js would otherwise announce itself in an X-Powered-By header.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  }
}

// withBotId serves Vercel BotID's challenge from this site's own origin, so
// the Content Security Policy needs no other origin.
export default withBotId(nextConfig)
