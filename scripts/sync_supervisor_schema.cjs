const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function getEnvVar(filePath, key) {
  const content = fs.readFileSync(filePath, 'utf8');
  const line = content.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : null;
}

const SQL = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectStatus') THEN
    CREATE TYPE "ProjectStatus" AS ENUM ('PENDING','SEARCHING','DOWNLOADING','ANALYZING','COMPLETED','FAILED','STOPPED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExtractionStatus') THEN
    CREATE TYPE "ExtractionStatus" AS ENUM ('PENDING','ABSTRACT_ONLY','COMPLETED','FAILED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "avatar_url" TEXT,
  "plan" TEXT NOT NULL DEFAULT 'free',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "year_from" INTEGER NOT NULL,
  "year_to" INTEGER NOT NULL,
  "max_papers" INTEGER NOT NULL DEFAULT 100,
  "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING',
  "total_papers" INTEGER NOT NULL DEFAULT 0,
  "processed_papers" INTEGER NOT NULL DEFAULT 0,
  "failed_papers" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "job_id" TEXT,
  "stop_requested" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "papers" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "doi" TEXT UNIQUE,
  "title" TEXT NOT NULL,
  "authors" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "year" INTEGER,
  "journal" TEXT,
  "abstract" TEXT,
  "citation_count" INTEGER,
  "is_open_access" BOOLEAN NOT NULL DEFAULT false,
  "pdf_url" TEXT,
  "s3_key" TEXT,
  "quartile" TEXT,
  "source_api" TEXT,
  "external_ids" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "project_papers" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "project_id" TEXT NOT NULL,
  "paper_id" TEXT NOT NULL,
  "extraction_status" "ExtractionStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "project_papers_project_id_paper_id_key" UNIQUE ("project_id", "paper_id")
);

CREATE TABLE IF NOT EXISTS "extractions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "paper_id" TEXT NOT NULL UNIQUE,
  "methodology" TEXT,
  "findings" TEXT,
  "limitations" TEXT,
  "future_work" TEXT,
  "study_type" TEXT,
  "keywords" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "raw_json" JSONB,
  "model" TEXT,
  "is_abstract_only" BOOLEAN NOT NULL DEFAULT false,
  "extracted_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_user_id_fkey'
  ) THEN
    ALTER TABLE "projects"
      ADD CONSTRAINT "projects_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'project_papers_project_id_fkey'
  ) THEN
    ALTER TABLE "project_papers"
      ADD CONSTRAINT "project_papers_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'project_papers_paper_id_fkey'
  ) THEN
    ALTER TABLE "project_papers"
      ADD CONSTRAINT "project_papers_paper_id_fkey"
      FOREIGN KEY ("paper_id") REFERENCES "papers"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'extractions_paper_id_fkey'
  ) THEN
    ALTER TABLE "extractions"
      ADD CONSTRAINT "extractions_paper_id_fkey"
      FOREIGN KEY ("paper_id") REFERENCES "papers"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
`;

(async () => {
  const envPath = path.join(process.cwd(), '.env.local');
  const dbUrl = getEnvVar(envPath, 'DATABASE_URL');
  if (!dbUrl) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 20000,
  });

  await client.connect();
  await client.query('BEGIN');
  await client.query(SQL);
  await client.query('COMMIT');
  await client.end();

  console.log('Schema sync complete.');
})().catch(async (error) => {
  console.error('SCHEMA_SYNC_ERROR:', error.message);
  process.exit(1);
});
