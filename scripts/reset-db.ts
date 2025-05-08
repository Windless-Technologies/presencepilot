import { execSync } from 'child_process'
import dotenv from 'dotenv'
dotenv.config()

const dbUrl = process.env.DATABASE_URL
// Extract database name using URL parsing
let dbName: string | undefined
if (dbUrl) {
  try {
    // Handle URLs with or without query parameters
    const url = new URL(dbUrl)
    dbName = url.pathname.split('/').pop()
  } catch (e) {
    console.error('❌ Invalid DATABASE_URL format', e)
    process.exit(1)
  }
}

if (!dbName) {
  console.error('❌ DATABASE_URL must end with a valid database name')
  process.exit(1)
}

// Validate DB name for safety (alphanumeric and underscores only)
if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
  console.error('❌ Database name contains invalid characters')
  process.exit(1)
}

try {
  console.log(`🔄 Dropping database: ${dbName}`)
  execSync(`dropdb ${dbName}`, { stdio: 'inherit' })
} catch {
  console.log(`⚠️ Database ${dbName} doesn't exist, skipping drop`)
}

try {
  console.log(`🆕 Creating database: ${dbName}`)
  execSync(`createdb ${dbName}`, { stdio: 'inherit' })

  console.log(`🌱 Seeding database using SQL file`)
  execSync(`psql ${dbName} < scripts/seed.sql`, {
    stdio: 'inherit'
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
