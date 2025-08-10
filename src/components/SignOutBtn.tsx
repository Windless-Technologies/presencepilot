'use client'
import { signOut } from 'next-auth/react'

export default function SignOutBtn() {
  return (
    <button
      className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 focus:ring-offset-2"
      aria-label="Sign out of your account"
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      Sign out
    </button>
  )
}
