import styles from '../../styles/login.module.css'
import Image from 'next/image'
import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className={styles.container}>
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
        <LoginForm />
      </div>
    </div>
  )
}
