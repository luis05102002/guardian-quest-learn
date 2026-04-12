-- CTF Challenges table
CREATE TABLE IF NOT EXISTS public.ctf_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('osint', 'crypto', 'web', 'forensics', 'network', 'misc')),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points integer NOT NULL CHECK (points > 0),
  flag text NOT NULL,
  hint text DEFAULT '',
  module_id integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ctf_challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "All authenticated can view active challenges" ON public.ctf_challenges
    FOR SELECT TO authenticated USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage challenges" ON public.ctf_challenges
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CTF Submissions
CREATE TABLE IF NOT EXISTS public.ctf_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.ctf_challenges(id) ON DELETE CASCADE,
  submitted_flag text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id, is_correct)
);

ALTER TABLE public.ctf_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can insert own submissions" ON public.ctf_submissions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own submissions" ON public.ctf_submissions
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "All can view correct submissions for ranking" ON public.ctf_submissions
    FOR SELECT TO authenticated USING (is_correct = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Lab completions
CREATE TABLE IF NOT EXISTS public.lab_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_key text NOT NULL,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lab_key)
);

ALTER TABLE public.lab_completions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can insert own lab completions" ON public.lab_completions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own completions" ON public.lab_completions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "All authenticated can view lab completions for ranking" ON public.lab_completions
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Legal documents
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view active legal docs" ON public.legal_documents
    FOR SELECT TO authenticated USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage legal docs" ON public.legal_documents
    FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Insert legal documents (only if not exists)
INSERT INTO public.legal_documents (slug, title, content, version) VALUES
('aviso-legal', 'Aviso Legal', '## Aviso Legal

**Última actualización:** Abril 2026

### 1. Datos Identificativos

En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, a continuación se reflejan los datos de la plataforma:

- **Denominación:** CyberAcademy - Guardian Quest Learn
- **Finalidad:** Plataforma educativa de ciberseguridad

### 2. Objeto

CyberAcademy pone a disposición de los usuarios esta plataforma educativa de ciberseguridad con el objetivo de formar profesionales en materia de seguridad informática, cumplimiento normativo y gestión de riesgos.

### 3. Condiciones de Uso

El uso de esta plataforma atribuye la condición de usuario e implica la aceptación de todas las condiciones incluidas en este Aviso Legal.

### 4. Propiedad Intelectual e Industrial

Todos los contenidos de la plataforma son propiedad de CyberAcademy o de sus legítimos titulares.

### 5. Exclusión de Responsabilidad

CyberAcademy no se hace responsable de los daños y perjuicios derivados del uso de la plataforma.

### 6. Modificaciones

CyberAcademy se reserva el derecho de modificar las condiciones de este Aviso Legal en cualquier momento.', '1.0'),
('privacidad', 'Política de Privacidad', '## Política de Privacidad

**Última actualización:** Abril 2026

### 1. Responsable del Tratamiento

- **Responsable:** CyberAcademy
- **Plataforma:** Guardian Quest Learn

### 2. Datos Personales Recogidos

- **Datos de registro:** Nombre completo y correo electrónico.
- **Datos de progreso:** Lecciones completadas, resultados de quizzes, puntuaciones en retos CTF.
- **Datos de interacción:** Consultas al chatbot, dudas registradas.

### 3. Finalidad del Tratamiento

Gestionar cuentas, registrar progreso académico, personalizar la experiencia, responder consultas y enviar notificaciones.

### 4. Base Legal

Consentimiento (art. 6.1.a RGPD), ejecución de contrato (art. 6.1.b RGPD) e interés legítimo (art. 6.1.f RGPD).

### 5. Derechos del Usuario

Acceso (art. 15), rectificación (art. 16), supresión (art. 17), limitación (art. 18), portabilidad (art. 20), oposición (art. 21) RGPD.

### 6. Seguridad

Medidas técnicas y organizativas conforme al RGPD y LOPDGDD.

### 7. Transferencias Internacionales

Datos procesados a través de Supabase (EE.UU.) bajo cláusulas contractuales tipo CE.', '1.0'),
('cookies', 'Política de Cookies', '## Política de Cookies

**Última actualización:** Abril 2026

### 1. ¿Qué son las Cookies?

Las cookies son pequeños archivos de texto almacenados en el dispositivo del usuario.

### 2. Tipos de Cookies

**Cookies Técnicas (Necesarias):** session, csrf
**Cookies de Funcionalidad:** theme, language
**Cookies Analíticas:** _ga, _ga_*

### 3. Gestión de Cookies

Puedes configurar tu navegador para bloquear, aceptar o eliminar cookies.

### 4. Consentimiento

Al acceder a la plataforma se solicita consentimiento para cookies no esenciales.', '1.0')
ON CONFLICT (slug) DO NOTHING;