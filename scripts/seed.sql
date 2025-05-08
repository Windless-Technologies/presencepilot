-- Seed users
INSERT INTO users (id, name, email, role, created_at) VALUES
(gen_random_uuid(), 'Alice Smith', 'alice@example.com', 'admin', NOW()),
(gen_random_uuid(), 'Bob Jones', 'bob@example.com', 'user', NOW());

-- Seed reviews
INSERT INTO reviews (id, user_id, platform, rating, content, responded, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM users WHERE email='alice@example.com'), 'google', 5, 'Amazing service!', false, NOW()),
(gen_random_uuid(), (SELECT id FROM users WHERE email='bob@example.com'), 'yelp', 4, 'Good experience overall.', true, NOW());

-- Seed posts
INSERT INTO posts (id, user_id, content, platform, scheduled_time, status, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM users WHERE email='alice@example.com'), 'Promo this weekend!', 'facebook', NOW() + interval '2 days', 'scheduled', NOW()),
(gen_random_uuid(), (SELECT id FROM users WHERE email='bob@example.com'), 'Thank you for 1K followers!', 'facebook', NOW() + interval '1 day', 'scheduled', NOW());