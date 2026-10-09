// The shared layout for the privacy, terms and accessibility pages.
export default function LegalPage({
  title,
  updated,
  children
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 font-[family-name:var(--font-geist-sans)] [&_a]:underline [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:leading-relaxed [&_p]:mb-4 [&_p]:leading-relaxed [&_table]:mb-4 [&_td]:border [&_td]:border-gray-400 [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:border-gray-400 [&_th]:p-2 [&_th]:text-left [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
      <h1 className="mb-2 text-4xl font-bold">{title}</h1>
      <p>Last updated: {updated}</p>
      {children}
    </main>
  )
}
