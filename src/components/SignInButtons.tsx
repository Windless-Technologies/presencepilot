'use client'

import { useState } from 'react'
import { getProviders, signIn } from 'next-auth/react'
import styles from '../styles/login.module.css'
import { PROVIDERS, notAvailableYetMessage } from '@/lib/sign-in-providers'

// Google, GitHub and LinkedIn always show (engineering standards, section 1).
// NextAuth only knows a provider once its keys are set, so pressing one that
// is not set up yet says so in place instead of leading to an error page.
export default function SignInButtons({
  callbackUrl = '/onboarding'
}: {
  callbackUrl?: string
}) {
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function start(id: string, name: string) {
    setNotice(null)
    setPending(true)
    const providers = await getProviders().catch(() => null)
    if (!providers || !(id in providers)) {
      setNotice(notAvailableYetMessage(name))
      setPending(false)
      return
    }
    await signIn(id, { callbackUrl })
  }

  return (
    <div className={styles.providers}>
      {PROVIDERS.map(({ id, name }) => (
        <button
          key={id}
          type="button"
          className={styles.button}
          disabled={pending}
          onClick={() => start(id, name)}
        >
          Continue with {name}
        </button>
      ))}
      <p role="status" aria-live="polite" className={styles.notice}>
        {notice}
      </p>
    </div>
  )
}
