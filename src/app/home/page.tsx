import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getServerSession()
  if (!session || !session.user) {
    redirect('/login')
  }
  return <div>This is a protected route. Only visible if authenticated.</div>
}
