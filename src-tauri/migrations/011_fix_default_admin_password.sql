-- 011_fix_default_admin_password.sql
-- Repairs the default admin account on existing databases that have the invalid
-- placeholder password hash inserted by migration 010_seed_defaults.sql.
--
-- Password: admin123
-- Hash algorithm: bcrypt cost 10 ($2b$ format, bcrypt crate v0.14)
-- This hash was generated and verified by the project's own bcrypt dependency.
--
-- Safety: Only replaces the known placeholder hash. Any admin password that has
-- already been changed by a user will NOT be overwritten.
-- Idempotent: safe to run multiple times (WHERE clause prevents redundant updates).

UPDATE users
SET
    password_hash = '$2b$10$0VhA9Hg.jTBd/bzmenZFAu5ghEAQdUzozRiYH2G4PWICK5ZIvlTee',
    active = 1,
    updated_at = datetime('now')
WHERE
    username = 'admin'
    AND password_hash = '$2a$10$placeholder_hash_replace_on_first_run';
