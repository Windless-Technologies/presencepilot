// Sign-in and sessions (engineering standards, section 1).
//
// - Google, GitHub and LinkedIn are registered once both of a provider's keys
//   are set; a blank value counts as unset. Their buttons always show either
//   way (src/components/SignInButtons.tsx).
// - A provider sign-in is accepted only with an email the provider marks as
//   verified. GitHub's profile email can be unverified, so its verified
//   primary address is asked for explicitly.
// - The session is a JWT in an HttpOnly, SameSite=Lax cookie, Secure on
//   HTTPS. It ends after 7 days without a visit and 30 days after sign-in
//   however active. Provider access tokens are never kept in it.
import type { Account, NextAuthOptions, Profile } from 'next-auth'
import type { Provider } from 'next-auth/providers/index'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import LinkedInProvider from 'next-auth/providers/linkedin'
import {
  fetchWithResilience,
  type ResilienceOptions
} from './fetch-with-resilience'
import { UNVERIFIED_EMAIL, unavailableReason } from './sign-in-providers'

type Env = Record<string, string | undefined>
/** What tests may replace in the GitHub email lookup. */
type LookupOptions = Pick<ResilienceOptions, 'fetchImpl' | 'sleep'>

export const IDLE_TIMEOUT_SECONDS = 7 * 24 * 60 * 60
export const ABSOLUTE_TIMEOUT_SECONDS = 30 * 24 * 60 * 60
// How often an active session's cookie is reissued with a fresh idle window.
const SESSION_REFRESH_SECONDS = 24 * 60 * 60

const isSet = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim() !== ''

export function oauthProviders(env: Env = process.env): Provider[] {
  const providers: Provider[] = []
  if (isSet(env.GOOGLE_CLIENT_ID) && isSet(env.GOOGLE_CLIENT_SECRET)) {
    providers.push(
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET
      })
    )
  }
  if (isSet(env.GITHUB_CLIENT_ID) && isSet(env.GITHUB_CLIENT_SECRET)) {
    providers.push(
      GitHubProvider({
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        authorization: { params: { scope: 'read:user user:email' } }
      })
    )
  }
  if (isSet(env.LINKEDIN_CLIENT_ID) && isSet(env.LINKEDIN_CLIENT_SECRET)) {
    // LinkedIn's current sign-in is OpenID Connect; NextAuth 4's default
    // LinkedIn settings target the retired v2 profile API.
    providers.push(
      LinkedInProvider({
        clientId: env.LINKEDIN_CLIENT_ID,
        clientSecret: env.LINKEDIN_CLIENT_SECRET,
        client: { token_endpoint_auth_method: 'client_secret_post' },
        issuer: 'https://www.linkedin.com/oauth',
        wellKnown:
          'https://www.linkedin.com/oauth/.well-known/openid-configuration',
        authorization: { params: { scope: 'openid profile email' } },
        profile: (p) => ({
          id: p.sub,
          name: p.name,
          email: p.email,
          image: p.picture
        })
      })
    )
  }
  return providers
}

/** The provider could not answer. The message is for logs only. */
export class ProviderUnavailableError extends Error {
  constructor(provider: string, detail: string) {
    super(`${provider} is unavailable: ${detail}`)
    this.name = 'ProviderUnavailableError'
  }
}

const isUnavailableStatus = (status: number) =>
  status === 408 || status === 429 || status >= 500

/**
 * The email the provider vouches for, lowercased, or null when it has not
 * confirmed one. Throws ProviderUnavailableError when GitHub cannot be
 * reached, so the person is told to try again rather than that their email
 * is unconfirmed.
 */
export async function verifiedEmail(
  account: Pick<Account, 'provider' | 'access_token'>,
  profile: Profile | undefined,
  lookup: LookupOptions = {}
): Promise<string | null> {
  const p = profile as Record<string, unknown> | undefined
  if (account.provider === 'google' || account.provider === 'linkedin') {
    // Only a literal true (or LinkedIn's "true") counts; a missing claim
    // does not.
    const verified = p?.email_verified === true || p?.email_verified === 'true'
    const email = typeof p?.email === 'string' ? p.email.trim() : ''
    return verified && email ? email.toLowerCase() : null
  }
  if (account.provider === 'github') {
    if (!account.access_token) return null
    const res = await fetchWithResilience(
      'https://api.github.com/user/emails',
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          Accept: 'application/vnd.github+json'
        }
      },
      { timeoutMs: 5000, ...lookup }
    ).catch((error: unknown) => {
      throw new ProviderUnavailableError(
        'GitHub',
        `email lookup got no answer (${error instanceof Error ? error.name : 'unknown error'})`
      )
    })
    if (isUnavailableStatus(res.status)) {
      throw new ProviderUnavailableError(
        'GitHub',
        `email lookup answered ${res.status}`
      )
    }
    if (!res.ok) return null
    const emails: unknown = await res.json().catch(() => null)
    if (!Array.isArray(emails)) return null
    // GitHub lists every address on the account; only the verified primary
    // one is used, and none of the others are kept.
    const primary = emails.find(
      (e): e is { email: string } =>
        typeof e === 'object' &&
        e !== null &&
        (e as Record<string, unknown>).primary === true &&
        (e as Record<string, unknown>).verified === true &&
        typeof (e as Record<string, unknown>).email === 'string'
    )
    return primary ? primary.email.trim().toLowerCase() : null
  }
  return null
}

/** True if a session that began at signedInAt (seconds) has outlived the absolute limit. */
export function pastAbsoluteTimeout(
  signedInAt: unknown,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  // A token from before this rule carries no sign-in time; it is treated as
  // expired, so every session already in circulation is bounded too.
  if (typeof signedInAt !== 'number') return true
  return nowSeconds - signedInAt >= ABSOLUTE_TIMEOUT_SECONDS
}

/** Secure cookies whenever the site is served over HTTPS, and always on Vercel. */
export function secureCookies(env: Env = process.env): boolean {
  return (
    (env.NEXTAUTH_URL ?? '').startsWith('https://') || isSet(env.VERCEL_ENV)
  )
}

export function buildAuthOptions(
  env: Env = process.env,
  deps: { lookup?: LookupOptions; now?: () => number } = {}
): NextAuthOptions {
  const now = deps.now ?? (() => Math.floor(Date.now() / 1000))
  return {
    secret: env.NEXTAUTH_SECRET,
    providers: oauthProviders(env),
    useSecureCookies: secureCookies(env),
    session: {
      strategy: 'jwt',
      maxAge: IDLE_TIMEOUT_SECONDS,
      updateAge: SESSION_REFRESH_SECONDS
    },
    pages: { signIn: '/login', error: '/login' },
    callbacks: {
      async signIn({ user, account, profile }) {
        if (!account) return false
        let email: string | null
        try {
          email = await verifiedEmail(account, profile, deps.lookup)
        } catch (error) {
          if (!(error instanceof ProviderUnavailableError)) throw error
          // Logged without the token or any personal data.
          console.error(`[SIGN_IN_PROVIDER_UNAVAILABLE] ${error.message}`)
          return `/login?error=${unavailableReason(account.provider)}`
        }
        if (!email) return `/login?error=${UNVERIFIED_EMAIL}`
        // The session carries the verified address, never an unverified one
        // the provider also returned.
        user.email = email
        return true
      },
      async jwt({ token, user }) {
        if (user) {
          // A fresh token at every sign-in, holding only what the app needs:
          // no provider access or refresh token.
          return {
            sub: token.sub,
            name: token.name,
            email: user.email,
            picture: token.picture,
            signedInAt: now()
          }
        }
        // Throwing ends the session: NextAuth clears the cookie and answers
        // as if signed out.
        if (pastAbsoluteTimeout(token.signedInAt, now())) {
          throw new Error('Session ended: past the 30-day sign-in limit')
        }
        return token
      },
      async session({ session, token }) {
        if (session.user && token.sub) session.user.id = token.sub
        return session
      }
    }
  }
}

export const authOptions = buildAuthOptions()
