-- Phase 1.5: narrow direct browser access to user-owned calendar alerts
-- and make dashboard notifications server-only.
--
-- These policies are additive guards: existing permissive policies remain in
-- place, but the RESTRICTIVE policies are ANDed with them. The service role
-- continues to bypass RLS for trusted server routes.

DROP POLICY IF EXISTS calendar_alerts_owner_guard ON public.calendar_alerts;
CREATE POLICY calendar_alerts_owner_guard
  ON public.calendar_alerts
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- The alert API performs an upsert, so authenticated owners also need an
-- explicit UPDATE policy when the event already exists.
DROP POLICY IF EXISTS calendar_alerts_update_own ON public.calendar_alerts;
CREATE POLICY calendar_alerts_update_own
  ON public.calendar_alerts
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Dashboard notifications are accessed only through server routes that
-- validate the signed dashboard session and use the service-role client.
DROP POLICY IF EXISTS notifications_server_only_guard ON public.notifications;
CREATE POLICY notifications_server_only_guard
  ON public.notifications
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
