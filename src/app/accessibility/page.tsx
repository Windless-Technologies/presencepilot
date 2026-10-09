import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Accessibility Statement | PresencePilot',
  description:
    'How PresencePilot works toward WCAG 2.2 AA, how it is tested, and how to report a barrier.'
}

const CONTACT = 'hr@bravehaven.io'

// Follows the engineering standards' accessibility statement template. The
// list of pages matches tests/a11y/pages.spec.ts; change both together.
export default function AccessibilityStatement() {
  return (
    <LegalPage title="Accessibility Statement" updated="October 9, 2026">
      <p>
        We want everyone to be able to use PresencePilot, including people who
        use a screen reader, magnification, voice control, or a keyboard instead
        of a mouse.
      </p>

      <h2>Conformance status</h2>
      <p>
        Our target is the Web Content Accessibility Guidelines (WCAG) 2.2 at
        Level AA. Meeting it also covers WCAG 2.1 Level AA, the measure used by
        the European Accessibility Act through EN 301 549 and, in the United
        States, under the Americans with Disabilities Act and Section 508.
      </p>
      <p>
        PresencePilot is partially conformant: every page below passes our
        automated checks, but it has not had a full manual audit with screen
        readers yet, so we do not claim full conformance.
      </p>

      <h2>How we test</h2>
      <ul>
        <li>
          Every page below is scanned with axe-core, the open-source
          accessibility engine, at desktop and phone sizes, on every code
          change, with the WCAG 2.1 A and AA and WCAG 2.2 AA rules. A failing
          scan stops the change.
        </li>
        <li>
          The same tests check that no page scrolls sideways or has to be zoomed
          out on a phone.
        </li>
        <li>
          Every color pairing on these pages meets at least 4.5 to 1 contrast
          for text.
        </li>
      </ul>
      <p>
        Pages covered: Home, Sign in, Onboarding, Privacy, Terms, Accessibility,
        and the page-not-found page.
      </p>

      <h2>Known limitations</h2>
      <ul>
        <li>
          Google, GitHub and LinkedIn sign-in screens are run by those companies
          and are outside our control; each publishes its own accessibility
          information.
        </li>
        <li>
          Keyboard-only and screen reader testing of the sign-in and onboarding
          journeys has not been done yet. It is planned before launch.
        </li>
      </ul>

      <h2>Compatibility</h2>
      <p>
        The site is built for recent versions of Chrome, Edge, Firefox and
        Safari, on desktop and mobile, and for screen readers and browser zoom
        up to 200%. Automated testing runs in Chromium at desktop and Android
        phone sizes.
      </p>

      <h2>Feedback and help</h2>
      <p>
        If something on PresencePilot does not work for you, or you need
        information in another format, email{' '}
        <a href={`mailto:${CONTACT}?subject=Accessibility:%20PresencePilot`}>
          {CONTACT}
        </a>
        . Tell us the page and what happened. We reply within 5 business days,
        and if we cannot fix it right away we will help you another way.
      </p>

      <h2>Enforcement</h2>
      <p>
        If you are not satisfied with our answer, you can contact the body
        responsible for accessibility enforcement in your country. In the United
        States, you can file a complaint under the Americans with Disabilities
        Act at <a href="https://www.ada.gov">ada.gov</a>.
      </p>
      <p>
        This statement was prepared on October 9, 2026 and will be reviewed at
        least once a year.
      </p>
    </LegalPage>
  )
}
