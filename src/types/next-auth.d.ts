import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
    } & DefaultSession['user']
    accessToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    accessToken?: string
  }
}
