-- Migration: add index to optimize revoking sessions by accountId when revokedAt IS NULL
-- Run this SQL against your database (psql) or include in your migration tooling.

CREATE INDEX IF NOT EXISTS idx_sessions_accountid_active ON sessions ("accountId")
WHERE "revokedAt" IS NULL;

-- Optional composite index covering both columns (if your DB/ORM prefers):
CREATE INDEX IF NOT EXISTS idx_sessions_accountid_revokedat ON sessions ("accountId", "revokedAt");
