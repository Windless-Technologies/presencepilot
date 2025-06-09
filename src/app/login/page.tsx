import styles from '../../styles/login.module.css'
import Image from 'next/image'
import { GoogleLoginButton } from '../../components/button'

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.loginIllustration}>
        <Image
          src="../images/login-illustration.svg"
          alt="Login Illustration"
          width={953.63}
          height={500}
        />
      </div>
      <div className={styles.formSection}>
        <h1>Welcome Back to PresencePilot</h1>
        <form className={styles.form}>
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
        <GoogleLoginButton />
      </div>
    </div>
  )
}
