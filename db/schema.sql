-- Job tracker schema. Safe to run more than once.

CREATE TABLE IF NOT EXISTS applications (
  id          SERIAL PRIMARY KEY,
  company     TEXT NOT NULL,
  role        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'applied'
              CHECK (status IN ('applied', 'interview', 'offer', 'rejected')),
  applied_on  DATE NOT NULL DEFAULT CURRENT_DATE,
  link        TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);
