import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Use | PresencePilot',
  description: 'The terms for using PresencePilot while it is in development.'
}

const CONTACT = 'hr@bravehaven.io'

export default function Terms() {
  return (
    <LegalPage title="Terms of Use" updated="October 9, 2026">
      <p>
        By using PresencePilot you agree to these terms. If you do not agree,
        please do not use the site.
      </p>

      <h2>1. An early version</h2>
      <p>
        PresencePilot is in development. Features may change, stop working or be
        removed, and data you enter may be reset. Do not rely on it for anything
        you cannot afford to lose. Reviews, posts and analytics are planned and
        not yet available.
      </p>

      <h2>2. Your account</h2>
      <p>
        You sign in with a Google, GitHub or LinkedIn account that is yours.
        Keep that account secure, and tell us at once if you think someone else
        has used PresencePilot as you.
      </p>

      <h2>3. Acceptable use</h2>
      <ul>
        <li>
          Use PresencePilot only for a business you are allowed to act for
        </li>
        <li>Do not try to break, overload or get around its security</li>
        <li>
          Do not use automated tools to sign in or to collect content from it
        </li>
        <li>Do not use it to harass anyone or to break the law</li>
      </ul>

      <h2>4. No warranty</h2>
      <p>
        PresencePilot is provided as is, without warranties of any kind, to the
        extent the law allows.
      </p>

      <h2>5. Limitation of liability</h2>
      <p>
        To the extent the law allows, we are not liable for indirect or
        consequential loss, or for loss of data or profit, arising from your use
        of PresencePilot or from it being unavailable.
      </p>

      <h2>6. Changes</h2>
      <p>
        We may update these terms. The date at the top says when they last
        changed, and continuing to use PresencePilot after a change means you
        accept it.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about these terms go to{' '}
        <a href={`mailto:${CONTACT}?subject=Terms:%20PresencePilot`}>
          {CONTACT}
        </a>
        .
      </p>
    </LegalPage>
  )
}
