ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS concept_mockup jsonb,
  ADD COLUMN IF NOT EXISTS concept_mockup_version integer,
  ADD COLUMN IF NOT EXISTS concept_mockup_generated_at timestamptz;

ALTER TABLE opportunities
  DROP CONSTRAINT IF EXISTS opportunities_concept_mockup_version_check;

ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_concept_mockup_version_check
  CHECK (concept_mockup_version IS NULL OR concept_mockup_version = 1);
