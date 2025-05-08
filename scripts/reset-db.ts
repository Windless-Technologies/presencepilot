import { execSync } from 'child_process'
import dotenv from 'dotenv'
dotenv.config()

const dbUrl = process.env.DATABASE_URL
const dbName = dbUrl?.split('/').pop()

if (!dbName) {
  console.error('❌ DATABASE_URL must end with a valid database name')
  process.exit(1)
}

try {
  console.log(`🔄 Dropping database: ${dbName}`)
  execSync(`dropdb ${dbName}`, { stdio: 'inherit' })

  console.log(`🆕 Creating database: ${dbName}`)
  execSync(`createdb ${dbName}`, { stdio: 'inherit' })

  console.log(`🌱 Seeding database using SQL file`)
  execSync(`psql ${dbName} < scripts/seed.sql`, {
    stdio: 'inherit',
    shell: '/bin/sh'
  })

  console.log('✅ Database reset complete')
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error('❌ Failed to reset database:', error.message)
  } else {
    console.error('❌ Unknown error during reset:', error)
  }
  process.exit(1)
}
