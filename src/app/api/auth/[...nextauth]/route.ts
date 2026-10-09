import NextAuth from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { isConfirmedHuman } from '@/lib/bot'
import { authOptions } from '@/lib/sign-in'
import { BOT_REFUSAL } from '@/lib/sign-in-providers'

// Sign-in rules and session settings live in src/lib/sign-in.ts, where they
// are tested.
const handler = NextAuth(authOptions)

// Starting a provider sign-in is checked by Vercel BotID before anything
// else. The provider's callback cannot carry BotID's signal, but it only
// completes a flow that began here (NextAuth checks the state cookie set at
// this step), so gating the start gates the whole flow.
const PROVIDER_START = /^\/api\/auth\/signin\/[^/]+$/

async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  if (
    PROVIDER_START.test(request.nextUrl.pathname) &&
    !(await isConfirmedHuman())
  ) {
    // Refused with 403. NextAuth's client follows the url it is given, so
    // the person lands on the login page with a message.
    return NextResponse.json(
      { url: `/login?error=${BOT_REFUSAL}` },
      { status: 403 }
    )
  }
  return handler(request, context)
}

export { handler as GET, POST }
