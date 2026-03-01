-- Safe legacy cleanup plan
-- Strategy: archive legacy tables by moving them from public to legacy_archive schema
-- This is reversible and avoids hard deletion.
BEGIN;
CREATE SCHEMA IF NOT EXISTS legacy_archive;
ALTER TABLE public."Account" SET SCHEMA legacy_archive;
ALTER TABLE public."LiteratureReview" SET SCHEMA legacy_archive;
ALTER TABLE public."Paper" SET SCHEMA legacy_archive;
ALTER TABLE public."SearchQuery" SET SCHEMA legacy_archive;
ALTER TABLE public."Session" SET SCHEMA legacy_archive;
ALTER TABLE public."User" SET SCHEMA legacy_archive;
ALTER TABLE public."VerificationToken" SET SCHEMA legacy_archive;
COMMIT;
