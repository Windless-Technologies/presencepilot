import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  await client.connect();

  await client.query(`INSERT INTO users (id, name, email, role, created_at) VALUES
    (gen_random_uuid(), 'Alice Smith', 'alice@example.com', 'admin', NOW()),
    (gen_random_uuid(), 'Bob Jones', 'bob@example.com', 'user', NOW())`);

  const res = await client.query(`SELECT id FROM users WHERE email='alice@example.com'`);
  const aliceId = res.rows[0]?.id;

  await client.query(`INSERT INTO reviews (id, user_id, platform, rating, content, responded, created_at) VALUES
    (gen_random_uuid(), $1, 'google', 5, 'Amazing service!', false, NOW())`, [aliceId]);

  await client.query(`INSERT INTO posts (id, user_id, content, platform, scheduled_time, status, created_at) VALUES
    (gen_random_uuid(), $1, 'Promo this weekend!', 'facebook', NOW() + interval '2 days', 'scheduled', NOW())`, [aliceId]);

  console.log('✅ Seed complete');
  await client.end();
}

seed().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});