// The seed and reset scripts drop, create and fill a database with
// fictional people. They must only ever touch a developer's own machine:
// real personal data never sits beside test data, and a production database
// is never dropped by a mistyped DATABASE_URL (engineering standards,
// sections 11 and 12).

const LOCAL_HOSTS = new Set(['', 'localhost', '127.0.0.1', '[::1]', '::1'])
// Plain names only, so a name can never be read as an option or a command.
const DATABASE_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/

export type LocalDatabase = {
  name: string
  /** Connection arguments for createdb, dropdb and psql. */
  args: string[]
}

/**
 * Parses DATABASE_URL and refuses anything but a local database outside any
 * deployment. Throws with a message saying why; never prints the URL, which
 * can hold a password.
 */
export function localDatabase(
  url: string | undefined,
  env: Record<string, string | undefined> = process.env
): LocalDatabase {
  if (env.VERCEL_ENV || env.VERCEL) {
    throw new Error(
      'Refusing to run on a Vercel deployment: these scripts are for local databases only.'
    )
  }
  if (!url || url.trim() === '') {
    throw new Error(
      'DATABASE_URL is not set. Point it at a local database (see .env.example).'
    )
  }
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('DATABASE_URL is not a valid connection URL.')
  }
  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must be a postgres:// or postgresql:// URL.')
  }
  if (!LOCAL_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error(
      'DATABASE_URL names a remote host. These scripts only touch a database on this machine.'
    )
  }
  const name = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  if (!DATABASE_NAME.test(name)) {
    throw new Error(
      'DATABASE_URL must end with a plain database name (letters, digits and underscores).'
    )
  }
  const args: string[] = []
  if (parsed.hostname)
    args.push('--host', parsed.hostname.replace(/^\[|\]$/g, ''))
  if (parsed.port) args.push('--port', parsed.port)
  if (parsed.username)
    args.push('--username', decodeURIComponent(parsed.username))
  return { name, args }
}
