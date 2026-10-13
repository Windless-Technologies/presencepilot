import type { Metadata } from 'next'
import { PAGES, pageMetadata } from '@/lib/page-metadata'

// The onboarding page is a client component, which cannot export metadata,
// so its title, description and share card live here.
export const metadata: Metadata = pageMetadata(PAGES.onboarding)

export default function OnboardingLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
