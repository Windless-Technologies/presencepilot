import NextAuth from 'next-auth'
import { authOptions } from '@/lib/sign-in'

// Sign-in rules and session settings live in src/lib/sign-in.ts, where they
// are tested.
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
