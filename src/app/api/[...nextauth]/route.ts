import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,
    secret:
      process.env.NEXTAUTH_SECRET ||
      (() => {
        throw new Error('NEXTAUTH_SECRET environment variable is required')
      })()
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],

  callbacks: {
    async jwt({ token, account, user }) {
      try {
        if (account) {
          token.accessToken = account.access_token
          token.id = user.id
        }
        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        session.accessToken = token.accessToken as string
        session.user.id = token.id
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    }
  }
})

export { handler as GET, handler as POST }
