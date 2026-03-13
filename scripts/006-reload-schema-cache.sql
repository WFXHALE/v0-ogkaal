-- Force PostgREST schema cache reload by touching a notify event.
-- This tells PostgREST to reload its schema cache immediately.
NOTIFY pgrst, 'reload schema';
