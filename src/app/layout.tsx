import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import localFont from 'next/font/local'
import './globals.css'

// Every font ships with the app and is served from this site: no build-time
// or visitor request goes to a font host (engineering standards, section 14).
// Geist comes from the `geist` package; Poppins, used on the login page, is
// vendored from Fontsource under the SIL Open Font License (src/fonts/).
const poppins = localFont({
  src: [
    { path: '../fonts/poppins-latin-400-normal.woff2', weight: '400' },
    { path: '../fonts/poppins-latin-600-normal.woff2', weight: '600' }
  ],
  variable: '--font-poppins',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'PresencePilot',
  description:
    'PresencePilot helps local businesses manage their online presence in one place. In development.'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${poppins.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
