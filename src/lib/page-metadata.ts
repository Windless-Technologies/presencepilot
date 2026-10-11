import type { Metadata } from 'next'

// Title, description and the Open Graph and Twitter cards for one page
// (engineering standards, COPY_AND_CONVERSION_STANDARDS.md Section 12).
//
// Limits: the title stays under 60 characters and the description under 160,
// and no two pages share either (src/lib/__tests__/page-metadata.test.ts).
export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 160

export const SITE_NAME = 'PresencePilot'

// Drawn by src/app/share-image.png/route.tsx. Next.js makes the address
// absolute with metadataBase; until the product has a production domain it
// falls back to the deployment's own address (Vercel's production URL on a
// production deploy).
export const SHARE_IMAGE = {
  url: '/share-image.png',
  width: 1200,
  height: 630,
  alt: 'PresencePilot: one place for a local business to keep up with its online presence. In development.'
} as const

export function pageMetadata({
  title,
  description
}: {
  title: string
  description: string
}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
      images: [SHARE_IMAGE]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SHARE_IMAGE]
    }
  }
}

// Every page's title and description in one place, so the test can check
// lengths and duplicates without rendering anything.
export const PAGES = {
  home: {
    title: 'PresencePilot: online presence for local businesses',
    description:
      'One place for a local business to keep up with reviews on Google and Yelp and posts on Facebook. In development.'
  },
  login: {
    title: 'Sign in | PresencePilot',
    description:
      'Sign in to PresencePilot with Google, GitHub or LinkedIn. Email sign-in is coming soon.'
  },
  onboarding: {
    title: 'Set up your business | PresencePilot',
    description:
      'Add your business name, category and location. Step 1 of 3; the other steps are in progress and nothing is saved yet.'
  },
  privacy: {
    title: 'Privacy Policy | PresencePilot',
    description:
      'What personal data PresencePilot handles, why, and who else sees it.'
  },
  terms: {
    title: 'Terms of Use | PresencePilot',
    description: 'The terms for using PresencePilot while it is in development.'
  },
  accessibility: {
    title: 'Accessibility Statement | PresencePilot',
    description:
      'How PresencePilot works toward WCAG 2.2 AA, how it is tested, and how to report a barrier.'
  }
} as const satisfies Record<string, { title: string; description: string }>
