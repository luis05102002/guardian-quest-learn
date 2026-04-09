
-- Fix: Restrict teachers to only see bookings for their own slots
DROP POLICY IF EXISTS "Users can view own bookings" ON public.tutoring_bookings;

CREATE POLICY "Users can view own bookings"
ON public.tutoring_bookings FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id
  OR (
    (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'))
    AND slot_id IN (SELECT id FROM public.tutoring_slots WHERE teacher_id = auth.uid())
  )
);

-- Fix: Add delete policy for avatars storage
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
