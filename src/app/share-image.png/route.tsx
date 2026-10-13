import { ImageResponse } from 'next/og'
import { SHARE_IMAGE } from '@/lib/page-metadata'

// The Open Graph and Twitter share image for every shareable page
// (src/lib/page-metadata.ts), built once at compile time with the font that
// ships inside Next.js, so nothing is requested from a font host. Its words
// come from the homepage. The colors are the light theme's --background and
// --foreground tokens in globals.css: an image cannot read CSS variables, so
// keep the two in step.
export const dynamic = 'force-static'

const BACKGROUND = '#ffffff' // --background
const FOREGROUND = '#171717' // --foreground

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: BACKGROUND,
        color: FOREGROUND
      }}
    >
      <div style={{ fontSize: 88, fontWeight: 600 }}>PresencePilot</div>
      <div style={{ fontSize: 44, marginTop: 24, lineHeight: 1.3 }}>
        One place for a local business to keep up with its online presence:
        reviews on Google and Yelp, and posts on Facebook.
      </div>
      <div style={{ fontSize: 32, marginTop: 40 }}>In development</div>
    </div>,
    { width: SHARE_IMAGE.width, height: SHARE_IMAGE.height }
  )
}
