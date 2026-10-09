import Link from 'next/link'

// The homepage says what PresencePilot is and what works today. It replaces
// the create-next-app starter, which had no heading and linked visitors to
// Vercel's marketing pages.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl font-semibold tracking-tight">PresencePilot</h1>
      <p className="text-lg">
        One place for a local business to keep up with its online presence:
        reviews on Google and Yelp, and posts on Facebook.
      </p>
      <p>
        PresencePilot is in development. Sign-in and the first step of business
        onboarding are being built; reviews, posts and analytics are planned.
      </p>
      <p>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center rounded-md bg-foreground px-5 font-medium text-background underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </main>
  )
}
