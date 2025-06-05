'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status == 'loading') return <p>Loading...</p>

  return (
    <>
      {session ? (
        <div>
          <p>Hello {session.user?.name}</p>
          <p>Signed in as {session.user?.email}</p>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      ) : (
        <button onClick={() => signIn('google')}>Sign in with Google</button>
      )}
    </>
  )
}
