import SignOutBtn from '@/components/SignOutBtn'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getServerSession()
  if (!session || !session.user) {
    redirect('/login')
  }
  return (
    <div>
      <h1>Hello, {session.user.name || session.user.email || 'User'}</h1>
      <SignOutBtn />
    </div>
  )
}
