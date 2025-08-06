'use client'
import { signOut } from 'next-auth/react'

export default function SignOutBtn() {
  return (
    <button
      className="bg-red-600 text-white py-2 px-4"
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      Sign out
    </button>
  )
}
