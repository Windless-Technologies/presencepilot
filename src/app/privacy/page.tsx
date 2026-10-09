import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy | PresencePilot',
  description:
    'What personal data PresencePilot handles, why, and who else sees it.'
}

const CONTACT = 'hr@bravehaven.io'

// Written from docs/DATA_INVENTORY.md. Change both in the same pull request
// whenever a feature starts collecting, storing or sharing personal data.
export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="October 9, 2026">
      <p>
        PresencePilot is in development and has not launched. This policy
        describes what the site does today, and it will change, here first,
        before any new feature starts collecting something new.
      </p>

      <h2>What we collect and why</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th scope="col">What</th>
              <th scope="col">Why</th>
              <th scope="col">Legal basis</th>
              <th scope="col">How long</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                When you sign in with Google, GitHub or LinkedIn: your name,
                profile picture link, account id, and the email address that
                provider has verified. GitHub shares every address on your
                account; we keep only your verified primary one
              </td>
              <td>To sign you in</td>
              <td>Contract (GDPR Art. 6(1)(b))</td>
              <td>
                Kept only in your own browser, in an encrypted sign-in cookie.
                It ends when you sign out, after 7 days without a visit, or 30
                days after you signed in. We store none of it on our side
              </td>
            </tr>
            <tr>
              <td>
                When you press a sign-in button: signals from your browser that
                Vercel BotID uses to tell people from automated bots. We receive
                only a verdict, person or bot
              </td>
              <td>To protect sign-in from abuse</td>
              <td>Legitimate interests (GDPR Art. 6(1)(f))</td>
              <td>We keep nothing</td>
            </tr>
            <tr>
              <td>
                When something breaks on our server: an error report with the
                error, the page address without its query, and the time. Email
                addresses and long numbers are removed before it is sent, and it
                never includes your IP address, cookies or what you typed
              </td>
              <td>To find and fix faults</td>
              <td>Legitimate interests (GDPR Art. 6(1)(f))</td>
              <td>Deleted by Sentry at the end of its retention period</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The business details on the onboarding page stay in your browser: they
        are not sent to us or stored anywhere yet. The email and password fields
        on the login page are switched off until email sign-in is built.
      </p>
      <p>
        We do not use analytics, advertising or tracking cookies, and we do not
        sell or share personal data.
      </p>

      <h2>Who else processes it</h2>
      <ul>
        <li>
          <strong>Google, GitHub and LinkedIn</strong> sign you in, only when
          you choose them, under their own privacy policies.
        </li>
        <li>
          <strong>Sentry</strong> (Functional Software, Inc., United States)
          receives the scrubbed error reports described above, from our
          production site only.
        </li>
        <li>
          <strong>Vercel</strong> (United States) will host the site and runs
          the BotID check. Like any web host it sees the requests your browser
          makes.
        </li>
      </ul>
      <p>
        Transfers to the United States rely on the EU-U.S. Data Privacy
        Framework where the provider is certified, and on Standard Contractual
        Clauses otherwise.
      </p>

      <h2>Cookies</h2>
      <p>
        We set only the cookies sign-in needs: one that keeps you signed in, one
        that protects sign-in from cross-site request forgery, one that
        remembers where to return after sign-in, and two short-lived ones (15
        minutes) that tie a provider sign-in to the browser that started it.
        They are all strictly necessary, so there is no cookie banner.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct, export or delete your personal data, or
        object to how we use it, under the GDPR and US state privacy laws. Email{' '}
        <a href={`mailto:${CONTACT}?subject=Privacy:%20PresencePilot`}>
          {CONTACT}
        </a>{' '}
        and we will answer within one month (45 days under US state laws).
        Signing out deletes the sign-in cookie at once. You can also complain to
        your data protection authority.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy go to{' '}
        <a href={`mailto:${CONTACT}?subject=Privacy:%20PresencePilot`}>
          {CONTACT}
        </a>
        .
      </p>
    </LegalPage>
  )
}
