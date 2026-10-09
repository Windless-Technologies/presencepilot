import { execFileSync } from 'child_process'
import dotenv from 'dotenv'
import { localDatabase } from './local-database'
dotenv.config()

// Drops, recreates and seeds the local database named by DATABASE_URL.
// Every command runs without a shell and takes its values as separate
// arguments, so nothing in DATABASE_URL can become a command.
let db
try {
  db = localDatabase(process.env.DATABASE_URL)
} catch (e) {
  console.error(`❌ ${e instanceof Error ? e.message : 'Invalid DATABASE_URL'}`)
  process.exit(1)
}

// A password in DATABASE_URL reaches the tools through the environment,
// never the command line, where other users of the machine could read it.
const password = new URL(process.env.DATABASE_URL!).password
const env = password
  ? { ...process.env, PGPASSWORD: decodeURIComponent(password) }
  : process.env
const run = (command: string, args: string[]) =>
  execFileSync(command, [...db.args, ...args], { stdio: 'inherit', env })

try {
  console.log(`🔄 Dropping database: ${db.name}`)
  run('dropdb', ['--if-exists', db.name])
} catch {
  console.log(`⚠️ Could not drop ${db.name}, continuing`)
}

try {
  console.log(`🆕 Creating database: ${db.name}`)
  run('createdb', [db.name])

  console.log(`🌱 Seeding database using SQL file`)
  run('psql', [
    '--set',
    'ON_ERROR_STOP=1',
    '--file',
    'scripts/seed.sql',
    db.name
  ])

  console.log('✅ Database reset complete')
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error('❌ Failed to reset database:', error.message)
  } else {
    console.error('❌ Unknown error during reset')
  }
  process.exit(1)
}
