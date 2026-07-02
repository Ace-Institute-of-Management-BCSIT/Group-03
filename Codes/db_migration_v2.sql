-- ============================================================
-- db_migration_v2.sql
-- Run this AFTER db.sql. Adds email verification + makes
-- existing/seeded accounts usable without breaking login.
-- ============================================================
USE careconnect_db;
SET SQL_SAFE_UPDATES = 0;

-- ── Email verification columns ──
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token   VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_expires DATETIME     DEFAULT NULL;

-- Every account that already existed before this migration (admin + seeded
-- NGOs) is grandfathered in as verified so you don't get locked out of demo data.
UPDATE users SET email_verified = 1 WHERE email_verified = 0;

SET SQL_SAFE_UPDATES = 1;

-- Quick sanity check
SELECT id, email, role, email_verified FROM users;
