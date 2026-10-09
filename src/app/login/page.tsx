import styles from '../../styles/login.module.css'
import Image from 'next/image'
import LoginForm from '@/components/LoginForm'
import { signInErrorMessage } from '@/lib/sign-in-providers'

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  // NextAuth and the sign-in callback send people back here with an error
  // code; the page turns it into what they can do, never the detail.
  const { error } = await searchParams
  const message = signInErrorMessage(
    typeof error === 'string' ? error : undefined
  )
  return (
    <main className={styles.container}>
      <div className={styles.loginIllustration}>
        <Image
          src="/images/login-illustration.svg"
          alt="Login Illustration"
          width={953.63}
          height={500}
          priority
        />
      </div>
      <div className={styles.formSection}>
        <LoginForm error={message} />
      </div>
    </main>
  )
}
