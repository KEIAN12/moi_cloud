-- Migration: Add assignee_user_id to tasks table
-- Run this migration in your Supabase SQL editor

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS assignee_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_user_id);

-- Add comment
COMMENT ON COLUMN tasks.assignee_user_id IS 'User assigned to this task (nullable)';
