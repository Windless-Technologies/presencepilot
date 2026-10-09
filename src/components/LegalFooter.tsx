import Link from 'next/link'

// Privacy, terms and the accessibility statement, linked from every page
// (engineering standards, section 10). Colors are inherited from the page,
// so contrast is whatever the surrounding text already has.
const LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/accessibility', label: 'Accessibility' }
]

export default function LegalFooter() {
  return (
    <footer className="border-t border-gray-400/40 px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6">
        <p>PresencePilot</p>
        <nav aria-label="Legal">
          <ul className="flex flex-wrap gap-x-4">
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center px-1 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
