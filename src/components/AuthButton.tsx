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
          <button
            className="bg-red-600 text-white font-bold py-2 px-4 rounded"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          className="bg-green-500 text-white font-bold py-2 px-4 rounded"
          onClick={() => signIn('google')}
        >
          Sign in with Google
        </button>
      )}
    </>
  )
}
