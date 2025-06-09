'use client'

import styles from '../../styles/login.module.css'

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    // placeholder function for GOogle login
    console.log('Google login clicked')
  }

  return (
    <button className={styles.googleButton} onClick={handleGoogleLogin}>
      Sign in with Google
    </button>
  )
}
