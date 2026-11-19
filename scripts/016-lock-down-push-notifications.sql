-- Dashboard push notifications are now read and updated through
-- /api/dashboard/push-notifications, which validates the signed dashboard
-- session and uses the service-role client. Do not apply until that code is
-- deployed to production.

DROP POLICY IF EXISTS push_notifications_server_only_guard ON public.push_notifications;
CREATE POLICY push_notifications_server_only_guard
  ON public.push_notifications
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

REVOKE ALL PRIVILEGES ON TABLE public.push_notifications FROM PUBLIC, anon, authenticated;
