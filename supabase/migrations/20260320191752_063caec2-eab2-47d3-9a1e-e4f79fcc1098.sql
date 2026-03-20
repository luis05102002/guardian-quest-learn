-- Allow all authenticated users to view profiles (for ranking)
CREATE POLICY "All users can view profiles for ranking"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Drop the restrictive select policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Allow all authenticated users to view quiz results (for ranking)
CREATE POLICY "All users can view quiz results for ranking"
ON public.quiz_results FOR SELECT TO authenticated
USING (true);

-- Drop the restrictive select policy
DROP POLICY IF EXISTS "Users can view own quiz results" ON public.quiz_results;

-- Allow all authenticated users to view progress (for ranking)
CREATE POLICY "All users can view progress for ranking"
ON public.user_progress FOR SELECT TO authenticated
USING (true);

-- Drop the restrictive select policy
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;