/**
 * @jest-environment node
 */
// The sign-in rules from the engineering standards, section 1, tested at the
// callbacks NextAuth calls. Each attack case tries what the rule refuses.
import { describe, expect, it, jest } from '@jest/globals'
import type { Account, Profile, Session, User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import {
  ABSOLUTE_TIMEOUT_SECONDS,
  IDLE_TIMEOUT_SECONDS,
  ProviderUnavailableError,
  buildAuthOptions,
  oauthProviders,
  pastAbsoluteTimeout,
  secureCookies,
  verifiedEmail
} from '../sign-in'
import { signInErrorMessage } from '../sign-in-providers'

const KEYS = {
  GOOGLE_CLIENT_ID: 'google-id',
  GOOGLE_CLIENT_SECRET: 'google-secret',
  GITHUB_CLIENT_ID: 'github-id',
  GITHUB_CLIENT_SECRET: 'github-secret',
  LINKEDIN_CLIENT_ID: 'linkedin-id',
  LINKEDIN_CLIENT_SECRET: 'linkedin-secret'
}

const noWait = { sleep: async () => {} }

/** A stand-in for GitHub's /user/emails that answers every attempt the same way. */
function github(status: number, body: unknown = []) {
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const fetchImpl = (async (
    url: string | URL | Request,
    init?: RequestInit
  ) => {
    calls.push({ url: String(url), init })
    return new Response(JSON.stringify(body), { status })
  }) as typeof fetch
  return { calls, lookup: { ...noWait, fetchImpl } }
}

const account = (provider: string, extra: Partial<Account> = {}): Account => ({
  provider,
  type: 'oauth',
  providerAccountId: '123',
  access_token: 'provider-access-token',
  ...extra
})

type Callbacks = Required<ReturnType<typeof buildAuthOptions>>['callbacks']
type SignInArgs = Parameters<NonNullable<Callbacks['signIn']>>[0]
type JwtArgs = Parameters<NonNullable<Callbacks['jwt']>>[0]
type SessionArgs = Parameters<NonNullable<Callbacks['session']>>[0]

function callbacks(deps: Parameters<typeof buildAuthOptions>[1] = {}) {
  const { callbacks } = buildAuthOptions({ ...KEYS }, deps)
  return callbacks as Required<Callbacks>
}

describe('oauthProviders', () => {
  it('registers a provider only when both of its keys are set', () => {
    expect(oauthProviders({}).map((p) => p.id)).toEqual([])
    expect(oauthProviders({ GOOGLE_CLIENT_ID: 'only-the-id' })).toEqual([])
    expect(oauthProviders(KEYS).map((p) => p.id)).toEqual([
      'google',
      'github',
      'linkedin'
    ])
  })

  it('treats a blank key as unset', () => {
    expect(
      oauthProviders({ GOOGLE_CLIENT_ID: '  ', GOOGLE_CLIENT_SECRET: 'x' })
    ).toEqual([])
  })

  it('asks GitHub for the email list and LinkedIn for OpenID Connect', () => {
    const [, gh, li] = oauthProviders(KEYS) as unknown as Array<{
      options: { authorization: { params: { scope: string } } }
    }>
    expect(gh!.options.authorization.params.scope).toContain('user:email')
    expect(li!.options.authorization.params.scope).toBe('openid profile email')
  })
})

describe('verifiedEmail', () => {
  it('accepts a Google or LinkedIn email only when it is marked verified', async () => {
    const verified = { email: 'Owner@Example.com', email_verified: true }
    expect(await verifiedEmail(account('google'), verified as Profile)).toBe(
      'owner@example.com'
    )
    expect(
      await verifiedEmail(account('linkedin'), {
        email: 'owner@example.com',
        email_verified: 'true'
      } as unknown as Profile)
    ).toBe('owner@example.com')
  })

  it('refuses an unverified, missing or merely truthy verification claim', async () => {
    for (const claim of [false, 'false', undefined, 1, 'yes']) {
      const profile = { email: 'owner@example.com', email_verified: claim }
      expect(
        await verifiedEmail(account('google'), profile as unknown as Profile)
      ).toBeNull()
    }
    expect(
      await verifiedEmail(account('google'), {
        email_verified: true
      } as unknown as Profile)
    ).toBeNull()
  })

  it("uses GitHub's verified primary address, sent with the access token", async () => {
    const { calls, lookup } = github(200, [
      { email: 'old@example.com', primary: false, verified: true },
      { email: 'Main@Example.com', primary: true, verified: true }
    ])
    expect(await verifiedEmail(account('github'), undefined, lookup)).toBe(
      'main@example.com'
    )
    expect(calls[0]!.url).toBe('https://api.github.com/user/emails')
    expect(
      (calls[0]!.init!.headers as Record<string, string>).Authorization
    ).toBe('Bearer provider-access-token')
  })

  it('attack: refuses GitHub when only a secondary address is verified', async () => {
    // Someone adds the victim's address to their own GitHub account as an
    // unverified primary, alongside a verified address of their own.
    const { lookup } = github(200, [
      { email: 'victim@example.com', primary: true, verified: false },
      { email: 'attacker@example.com', primary: false, verified: true }
    ])
    expect(await verifiedEmail(account('github'), undefined, lookup)).toBeNull()
  })

  it('refuses GitHub without an access token or with a malformed answer', async () => {
    const { calls, lookup } = github(200, { not: 'a list' })
    expect(
      await verifiedEmail(
        account('github', { access_token: undefined }),
        undefined,
        lookup
      )
    ).toBeNull()
    expect(calls).toHaveLength(0)
    expect(await verifiedEmail(account('github'), undefined, lookup)).toBeNull()
    expect(
      await verifiedEmail(account('github'), undefined, github(401).lookup)
    ).toBeNull()
  })

  it('says GitHub is unavailable, not that the email is unverified, when GitHub is down', async () => {
    await expect(
      verifiedEmail(account('github'), undefined, github(503).lookup)
    ).rejects.toBeInstanceOf(ProviderUnavailableError)
    const down = {
      ...noWait,
      fetchImpl: (async () => {
        throw new TypeError('fetch failed')
      }) as typeof fetch
    }
    await expect(
      verifiedEmail(account('github'), undefined, down)
    ).rejects.toBeInstanceOf(ProviderUnavailableError)
  })

  it('refuses a provider it does not know', async () => {
    expect(
      await verifiedEmail(account('credentials'), {
        email: 'owner@example.com',
        email_verified: true
      } as unknown as Profile)
    ).toBeNull()
  })
})

describe('signIn callback', () => {
  const user = (email: string): User => ({ id: '123', email })

  it('attack: sends an unverified Google account back to the login page', async () => {
    const result = await callbacks().signIn({
      user: user('victim@example.com'),
      account: account('google'),
      profile: { email: 'victim@example.com', email_verified: false }
    } as unknown as SignInArgs)
    expect(result).toBe('/login?error=unverified-email')
    expect(signInErrorMessage('unverified-email')).toMatch(
      /no confirmed email address/
    )
  })

  it('attack: keeps the verified GitHub address, not the profile one', async () => {
    const signedIn = user('victim@example.com')
    const result = await callbacks({
      lookup: github(200, [
        { email: 'attacker@example.com', primary: true, verified: true }
      ]).lookup
    }).signIn({
      user: signedIn,
      account: account('github'),
      profile: { email: 'victim@example.com' }
    } as unknown as SignInArgs)
    expect(result).toBe(true)
    expect(signedIn.email).toBe('attacker@example.com')
  })

  it('tells the person GitHub is down, without logging the token', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    const result = await callbacks({ lookup: github(503).lookup }).signIn({
      user: user('owner@example.com'),
      account: account('github'),
      profile: {}
    } as unknown as SignInArgs)
    expect(result).toBe('/login?error=github-unavailable')
    expect(signInErrorMessage('github-unavailable')).toMatch(
      /GitHub sign-in is temporarily unavailable/
    )
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      'provider-access-token'
    )
    log.mockRestore()
  })

  it('refuses a sign-in without a provider account', async () => {
    expect(
      await callbacks().signIn({
        user: user('owner@example.com'),
        account: null
      } as unknown as SignInArgs)
    ).toBe(false)
  })
})

describe('jwt and session callbacks', () => {
  const start = 1_800_000_000

  it('attack: never puts the provider access token in the session', async () => {
    const cb = callbacks({ now: () => start })
    const token = (await cb.jwt({
      token: {
        sub: '123',
        name: 'Owner',
        email: 'owner@example.com',
        picture: null,
        accessToken: 'leftover-from-an-old-token'
      },
      user: { id: '123', email: 'owner@example.com' },
      account: account('google', { refresh_token: 'provider-refresh-token' }),
      trigger: 'signIn'
    } as unknown as JwtArgs)) as JWT
    expect(token).toEqual({
      sub: '123',
      name: 'Owner',
      email: 'owner@example.com',
      picture: null,
      signedInAt: start
    })
    const session = await cb.session({
      session: {
        user: { name: 'Owner', email: 'owner@example.com' },
        expires: ''
      },
      token
    } as unknown as SessionArgs)
    expect((session as Session).user.id).toBe('123')
    expect(JSON.stringify(session)).not.toMatch(/provider-|accessToken/)
  })

  it('keeps a session inside the 30-day limit', async () => {
    const token = { sub: '123', signedInAt: start }
    const later = callbacks({
      now: () => start + ABSOLUTE_TIMEOUT_SECONDS - 1
    })
    await expect(later.jwt({ token } as unknown as JwtArgs)).resolves.toBe(
      token
    )
  })

  it('attack: ends a session 30 days after sign-in however active it is', async () => {
    const late = callbacks({ now: () => start + ABSOLUTE_TIMEOUT_SECONDS })
    await expect(
      late.jwt({
        token: { sub: '123', signedInAt: start }
      } as unknown as JwtArgs)
    ).rejects.toThrow(/30-day/)
  })

  it('attack: ends a token with no sign-in time (issued before this rule)', async () => {
    await expect(
      callbacks().jwt({ token: { sub: '123' } } as unknown as JwtArgs)
    ).rejects.toThrow()
    expect(pastAbsoluteTimeout('1800000000')).toBe(true)
  })
})

describe('session and cookie settings', () => {
  it('ends a session after 7 days without a visit', () => {
    const options = buildAuthOptions(KEYS)
    expect(options.session).toMatchObject({
      strategy: 'jwt',
      maxAge: IDLE_TIMEOUT_SECONDS
    })
    expect(IDLE_TIMEOUT_SECONDS).toBe(7 * 24 * 60 * 60)
    expect(options.pages).toEqual({ signIn: '/login', error: '/login' })
  })

  it('uses Secure cookies on HTTPS and on every Vercel deployment', () => {
    expect(
      secureCookies({ NEXTAUTH_URL: 'https://presencepilot.example' })
    ).toBe(true)
    expect(secureCookies({ VERCEL_ENV: 'preview' })).toBe(true)
    expect(secureCookies({ NEXTAUTH_URL: 'http://localhost:3000' })).toBe(false)
    expect(
      buildAuthOptions({ NEXTAUTH_URL: 'https://presencepilot.example' })
        .useSecureCookies
    ).toBe(true)
  })
})
