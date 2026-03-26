-- Migration: Performance Indexing
-- Adding indices to commonly queried columns to reduce CPU usage and speed up lookups.

-- 1. RFIs: Speed up project-based filtering and the sequential number trigger
CREATE INDEX IF NOT EXISTS idx_rfis_project_parent 
  ON public.rfis(project_id, parent_id);

-- 2. RFIs: Speed up date-based navigation (Daily Sheet)
CREATE INDEX IF NOT EXISTS idx_rfis_filed_date 
  ON public.rfis(filed_date);

-- 3. Notifications: Speed up the global notification tray
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON public.notifications(user_id, is_read);

-- 4. Project Members: Speed up membership checks across the app
CREATE INDEX IF NOT EXISTS idx_project_members_user_project 
  ON public.project_members(user_id, project_id);

-- 5. RFIs Status: Speed up the "Review Queue" and "Action Needed" filters
CREATE INDEX IF NOT EXISTS idx_rfis_status 
  ON public.rfis(status);

-- Analyze the tables to update statistics for the query planner
ANALYZE public.rfis;
ANALYZE public.notifications;
ANALYZE public.project_members;
ANALYZE public.profiles;
