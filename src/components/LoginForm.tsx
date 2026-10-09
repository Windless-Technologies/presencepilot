'use client'

import styles from '../styles/login.module.css'
import SignInButtons from './SignInButtons'

export default function LoginForm({ error }: { error?: string | null }) {
  return (
    <div className={styles.form}>
      <h1 className={styles.welcomeMessage}>Welcome Back to PresencePilot</h1>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <SignInButtons />

      {/* Email sign-in needs accounts that confirm their email first
          (engineering standards, section 1). Until that is built the fields
          are shown but switched off, so nobody types a password that goes
          nowhere. */}
      <form className={styles.emailForm} onSubmit={(e) => e.preventDefault()}>
        <fieldset disabled className={styles.emailFields}>
          <legend className={styles.legend}>
            Email sign-in is coming soon
          </legend>
          <label htmlFor="login-email" className={styles.label}>
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            className={styles.input}
          />
          <label htmlFor="login-password" className={styles.label}>
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            Login
          </button>
        </fieldset>
      </form>
    </div>
  )
}
