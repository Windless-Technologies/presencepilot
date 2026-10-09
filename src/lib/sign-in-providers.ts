// The sign-in providers and what the login page says about them. Shared by
// the server (src/lib/sign-in.ts) and the login page, so it stays free of
// server-only imports.
//
// Google, GitHub and LinkedIn are all required (engineering standards,
// section 1), so their buttons always show. A provider whose keys are not set
// yet is a setup task, not a reason to hide its button: pressing it says so.
export const PROVIDERS = [
  { id: 'google', name: 'Google' },
  { id: 'github', name: 'GitHub' },
  { id: 'linkedin', name: 'LinkedIn' }
] as const

export type ProviderId = (typeof PROVIDERS)[number]['id']

export function providerName(id: string): string | null {
  return PROVIDERS.find((p) => p.id === id)?.name ?? null
}

export function notAvailableYetMessage(name: string): string {
  return `${name} sign-in isn't available yet.`
}

/** The `error` value the login page receives when a provider could not be reached. */
export function unavailableReason(id: string): string {
  return `${id}-unavailable`
}

export const UNVERIFIED_EMAIL = 'unverified-email'

/**
 * What the login page says for the `error` value NextAuth or the sign-in
 * callback sends back. Never the internal detail: only what the person can do.
 */
export function signInErrorMessage(error: string | undefined): string | null {
  if (!error) return null
  if (error === UNVERIFIED_EMAIL) {
    return 'That account has no confirmed email address. Confirm your email with the provider, or sign in another way.'
  }
  const match = /^([a-z]+)-unavailable$/.exec(error)
  const name = match ? providerName(match[1]!) : null
  if (name) {
    return `${name} sign-in is temporarily unavailable. Try again in a minute, or sign in another way.`
  }
  return "We couldn't sign you in. Try again, or sign in another way."
}
