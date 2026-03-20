-- Table to track student questions/doubts for pattern detection
CREATE TABLE public.student_doubts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question text NOT NULL,
  topic text NOT NULL DEFAULT 'general',
  module_context text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_doubts ENABLE ROW LEVEL SECURITY;

-- Students can insert their own doubts
CREATE POLICY "Students can insert own doubts"
  ON public.student_doubts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Students can view own doubts
CREATE POLICY "Students can view own doubts"
  ON public.student_doubts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- Enable realtime for notifications about common doubts
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_doubts;