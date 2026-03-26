-- Migration: Notification Retention Policy (5 Days)
-- This ensures the notifications table stays small and fast by automatically 
-- deleting anything older than 5 days whenever a new notification is added.

-- 1. Create the cleanup function
CREATE OR REPLACE FUNCTION public.clean_old_notifications()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '5 days';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS trigger_clean_old_notifications ON public.notifications;
CREATE TRIGGER trigger_clean_old_notifications
AFTER INSERT ON public.notifications
FOR EACH STATEMENT
EXECUTE FUNCTION public.clean_old_notifications();

-- 3. Initial cleanup (one-time run for existing data)
DELETE FROM public.notifications 
WHERE created_at < NOW() - INTERVAL '5 days';
