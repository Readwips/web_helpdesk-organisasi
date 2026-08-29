DO $$ BEGIN
  CREATE TYPE "ImportJobStatus" AS ENUM ('VALIDATED', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_secret_encrypted" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_totp_step" BIGINT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pending_totp_secret_encrypted" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pending_totp_created_at" TIMESTAMP(3);
ALTER TYPE "ImportJobStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" TEXT PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" VARCHAR(64) NOT NULL UNIQUE,
  "csrf_hash" VARCHAR(64) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");

CREATE TABLE IF NOT EXISTS "mfa_challenges" (
  "id" TEXT PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "token_hash" VARCHAR(64) NOT NULL UNIQUE,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "mfa_challenges_user_id_idx" ON "mfa_challenges"("user_id");
DO $$ BEGIN
  ALTER TABLE "mfa_challenges" ADD CONSTRAINT "mfa_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "id" TEXT PRIMARY KEY,
  "employee_id" INTEGER NOT NULL,
  "token_hash" VARCHAR(64) NOT NULL UNIQUE,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "verification_tokens_employee_id_idx" ON "verification_tokens"("employee_id");
DO $$ BEGIN
  ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "import_jobs" (
  "id" TEXT PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" "ImportJobStatus" NOT NULL DEFAULT 'VALIDATED',
  "payload" JSONB NOT NULL,
  "summary" JSONB NOT NULL,
  "imported" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processing_at" TIMESTAMP(3),
  "executed_at" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "import_jobs_user_id_idx" ON "import_jobs"("user_id");
