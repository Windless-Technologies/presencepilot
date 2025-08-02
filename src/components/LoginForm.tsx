'use client'

import styles from '../styles/login.module.css'
import GoogleLoginButton from './button/GoogleLoginButton'

export default function LoginForm() {
  const handleGoogleLogin = () => {
    console.log('Google login clicked')
  }

  return (
    <form className={styles.form}>
      <h1 className={styles.welcomeMessage}>Welcome Back to PresencePilot</h1>

      <GoogleLoginButton onClick={handleGoogleLogin} />

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
  )
}
