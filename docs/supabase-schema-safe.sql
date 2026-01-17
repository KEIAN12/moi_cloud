-- moi_cloud Database Schema (Safe version - checks if tables exist)
-- Supabase PostgreSQL Schema
-- This version uses IF NOT EXISTS to avoid errors if tables already exist

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'coadmin', 'worker')),
  default_language VARCHAR(2) NOT NULL DEFAULT 'ja' CHECK (default_language IN ('ja', 'fr')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Devices table (for device-based login)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_identifier VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weeks table (week instances)
CREATE TABLE IF NOT EXISTS weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_key VARCHAR(10) NOT NULL UNIQUE, -- e.g., "2026-W04"
  business_date_default DATE NOT NULL, -- Default business day (Thursday)
  business_date_actual DATE, -- Actual business day if exception
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template tasks
CREATE TABLE IF NOT EXISTS template_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  title_ja VARCHAR(255) NOT NULL,
  body_ja TEXT,
  relative_due_rule VARCHAR(50) NOT NULL, -- e.g., "-4 days 20:00"
  tag VARCHAR(50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template checklist items
CREATE TABLE IF NOT EXISTS template_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_task_id UUID NOT NULL REFERENCES template_tasks(id) ON DELETE CASCADE,
  text_ja VARCHAR(500) NOT NULL,
  default_assignee_role_or_user VARCHAR(100) NOT NULL, -- role name or user_id
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  title_ja VARCHAR(255) NOT NULL,
  title_fr VARCHAR(255),
  body_ja TEXT,
  body_fr TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  status VARCHAR(20) NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED')),
  tag VARCHAR(50),
  assignee_user_id UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  translated_at TIMESTAMPTZ,
  needs_retranslate BOOLEAN NOT NULL DEFAULT false
);

-- Checklist items
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text_ja VARCHAR(500) NOT NULL,
  text_fr VARCHAR(500),
  assignee_user_id UUID NOT NULL REFERENCES users(id),
  due_at TIMESTAMPTZ,
  is_done BOOLEAN NOT NULL DEFAULT false,
  done_by UUID REFERENCES users(id),
  done_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  translated_at TIMESTAMPTZ,
  needs_retranslate BOOLEAN NOT NULL DEFAULT false
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES users(id),
  body_ja TEXT NOT NULL,
  body_fr TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  translated_at TIMESTAMPTZ,
  needs_retranslate BOOLEAN NOT NULL DEFAULT false
);

-- Glossary terms
CREATE TABLE IF NOT EXISTS glossary_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ja_term VARCHAR(255) NOT NULL UNIQUE,
  fr_term VARCHAR(255) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event logs
CREATE TABLE IF NOT EXISTS event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  checklist_item_id UUID REFERENCES checklist_items(id),
  payload_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(100) NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMPTZ
);

-- Indexes for performance (IF NOT EXISTS is not supported for indexes, so we use DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_week_id') THEN
    CREATE INDEX idx_tasks_week_id ON tasks(week_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_status') THEN
    CREATE INDEX idx_tasks_status ON tasks(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_due_at') THEN
    CREATE INDEX idx_tasks_due_at ON tasks(due_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_checklist_items_task_id') THEN
    CREATE INDEX idx_checklist_items_task_id ON checklist_items(task_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_checklist_items_assignee') THEN
    CREATE INDEX idx_checklist_items_assignee ON checklist_items(assignee_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_checklist_items_done') THEN
    CREATE INDEX idx_checklist_items_done ON checklist_items(is_done);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comments_task_id') THEN
    CREATE INDEX idx_comments_task_id ON comments(task_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_logs_event_type') THEN
    CREATE INDEX idx_event_logs_event_type ON event_logs(event_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_logs_created_at') THEN
    CREATE INDEX idx_event_logs_created_at ON event_logs(created_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_weeks_week_key') THEN
    CREATE INDEX idx_weeks_week_key ON weeks(week_key);
  END IF;
END $$;

-- Insert initial users (only if they don't exist)
INSERT INTO users (id, name, role, default_language)
SELECT '00000000-0000-0000-0000-000000000001', 'Kaori', 'admin', 'ja'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000001');

INSERT INTO users (id, name, role, default_language)
SELECT '00000000-0000-0000-0000-000000000002', 'Mai', 'coadmin', 'ja'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000002');

INSERT INTO users (id, name, role, default_language)
SELECT '00000000-0000-0000-0000-000000000003', 'Maxime', 'worker', 'fr'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000003');

-- Insert initial glossary terms (only if they don't exist)
INSERT INTO glossary_terms (ja_term, fr_term, note)
SELECT '仕込み', 'Préparation', '生地や材料の準備'
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms WHERE ja_term = '仕込み');

INSERT INTO glossary_terms (ja_term, fr_term, note)
SELECT '焼き', 'Cuisson', 'パンを焼く作業'
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms WHERE ja_term = '焼き');

INSERT INTO glossary_terms (ja_term, fr_term, note)
SELECT '発注', 'Commande', '材料や備品の発注'
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms WHERE ja_term = '発注');

INSERT INTO glossary_terms (ja_term, fr_term, note)
SELECT '買い込み', 'Achat', '材料の買い出し'
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms WHERE ja_term = '買い込み');

INSERT INTO glossary_terms (ja_term, fr_term, note)
SELECT '取り置き', 'Réservation', '事前予約'
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms WHERE ja_term = '取り置き');

INSERT INTO glossary_terms (ja_term, fr_term, note)
SELECT 'レジ締め', 'Fermeture de caisse', 'レジの締め作業'
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms WHERE ja_term = 'レジ締め');

INSERT INTO glossary_terms (ja_term, fr_term, note)
SELECT '開店準備', 'Préparation ouverture', '開店前の準備'
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms WHERE ja_term = '開店準備');

INSERT INTO glossary_terms (ja_term, fr_term, note)
SELECT '締め', 'Fermeture', '閉店作業'
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms WHERE ja_term = '締め');

INSERT INTO glossary_terms (ja_term, fr_term, note)
SELECT '受付完了', 'Réservation confirmée', '取り置き受付完了'
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms WHERE ja_term = '受付完了');

INSERT INTO glossary_terms (ja_term, fr_term, note)
SELECT '受付終了', 'Réservation fermée', '取り置き受付終了'
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms WHERE ja_term = '受付終了');
