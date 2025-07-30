'use client'

import styles from '../../styles/login.module.css'

type GoogleLoginButtonProps = {
  onClick: () => void
}

export default function GoogleLoginButton({ onClick }: GoogleLoginButtonProps) {
  return (
    <button type="button" className={styles.googleButton} onClick={onClick}>
      Sign in with Google
    </button>
  )
}
