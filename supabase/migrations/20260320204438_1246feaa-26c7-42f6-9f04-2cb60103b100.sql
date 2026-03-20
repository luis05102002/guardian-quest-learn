-- Allow all authenticated users to see roles (needed for chat to find teachers)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Authenticated can view roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);