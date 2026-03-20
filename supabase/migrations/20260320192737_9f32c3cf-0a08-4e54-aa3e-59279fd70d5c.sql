-- Create project_feedback table for teacher comments
CREATE TABLE public.project_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.project_submissions(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  comment text NOT NULL DEFAULT '',
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_feedback ENABLE ROW LEVEL SECURITY;

-- Teachers/admins can insert feedback
CREATE POLICY "Teachers can insert feedback"
ON public.project_feedback FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = teacher_id
  AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
);

-- Teachers/admins can update own feedback
CREATE POLICY "Teachers can update own feedback"
ON public.project_feedback FOR UPDATE TO authenticated
USING (auth.uid() = teacher_id AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')));

-- Teachers/admins can delete own feedback
CREATE POLICY "Teachers can delete own feedback"
ON public.project_feedback FOR DELETE TO authenticated
USING (auth.uid() = teacher_id AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')));

-- All authenticated can read feedback (students see their own project feedback)
CREATE POLICY "All users can view feedback"
ON public.project_feedback FOR SELECT TO authenticated
USING (true);

-- Allow all authenticated users to view project submissions (for teachers to see student projects)
CREATE POLICY "All users can view all submissions"
ON public.project_submissions FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can view own submissions" ON public.project_submissions;