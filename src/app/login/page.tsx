import styles from '../../styles/login.module.css'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.loginIllustration}>
        <Image
          src="/images/login-illustration.svg"
          alt="Login Illustration"
          width={953.63}
          height={500}
        />
      </div>
      <div className={styles.formSection}>
        <form className={styles.form}>
          <h1 className={styles.welcomeMessage}>
            Welcome Back to PresencePilot
          </h1>

          <button type="submit" className={styles.button}>
            Continue with Google
          </button>

          <input
            type="email"
            placeholder="Email"
            className={styles.input}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className={styles.input}
            required
          />

          <button type="submit" className={styles.button}>
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
