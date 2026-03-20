
-- Tutoring slots (available times set by admin/teacher)
CREATE TABLE public.tutoring_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tutoring_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available slots" ON public.tutoring_slots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers/admins can insert slots" ON public.tutoring_slots
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id AND (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Teachers/admins can update own slots" ON public.tutoring_slots
  FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id AND (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Teachers/admins can delete own slots" ON public.tutoring_slots
  FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id AND (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin')));

-- Tutoring bookings
CREATE TABLE public.tutoring_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.tutoring_slots(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  notes text DEFAULT '',
  whatsapp_phone text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz
);

ALTER TABLE public.tutoring_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON public.tutoring_bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can insert bookings" ON public.tutoring_bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own bookings" ON public.tutoring_bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_id);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  link text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Chat messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own received messages" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);

-- Enable realtime for chat and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
