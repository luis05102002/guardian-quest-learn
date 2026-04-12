-- CTF Challenges table
CREATE TABLE public.ctf_challenges (
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

CREATE POLICY "All authenticated can view active challenges" ON public.ctf_challenges
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage challenges" ON public.ctf_challenges
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- CTF Submissions (flag attempts)
CREATE TABLE public.ctf_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.ctf_challenges(id) ON DELETE CASCADE,
  submitted_flag text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id, is_correct) -- Prevent duplicate correct submissions scoring
);

ALTER TABLE public.ctf_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own submissions" ON public.ctf_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own submissions" ON public.ctf_submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

CREATE POLICY "All can view correct submissions for ranking" ON public.ctf_submissions
  FOR SELECT TO authenticated
  USING (is_correct = true);

-- Lab completions table (for practical exercises scoring)
CREATE TABLE public.lab_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_key text NOT NULL,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lab_key)
);

ALTER TABLE public.lab_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own lab completions" ON public.lab_completions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own completions" ON public.lab_completions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "All authenticated can view lab completions for ranking" ON public.lab_completions
  FOR SELECT TO authenticated
  USING (true);

-- Legal documents table
CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active legal docs" ON public.legal_documents
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage legal docs" ON public.legal_documents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Insert default legal documents
INSERT INTO public.legal_documents (slug, title, content, version) VALUES
('aviso-legal', 'Aviso Legal', E'## Aviso Legal

**Última actualización:** Abril 2026

### 1. Datos Identificativos

En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, a continuación se reflejan los datos de la plataforma:

- **Denominación:** CyberAcademy - Guardian Quest Learn
- **Finalidad:** Plataforma educativa de ciberseguridad

### 2. Objeto

CyberAcademy pone a disposición de los usuarios esta plataforma educativa de ciberseguridad con el objetivo de formar profesionales en materia de seguridad informática, cumplimiento normativo y gestión de riesgos.

### 3. Condiciones de Uso

El uso de esta plataforma atribuye la condición de usuario e implica la aceptación de todas las condiciones incluidas en este Aviso Legal. El usuario se compromete a hacer un uso adecuado de los contenidos y servicios que CyberAcademy pone a su disposición.

### 4. Propiedad Intelectual e Industrial

Todos los contenidos de la plataforma (textos, imágenes, logos, diseños, software) son propiedad de CyberAcademy o de sus legítimos titulares, quedando protegidos por las leyes de propiedad intelectual e industrial.

### 5. Exclusión de Responsabilidad

CyberAcademy no se hace responsable de:
- Los daños y perjuicios de toda naturaleza que pudieran derivar del uso de la plataforma.
- Los errores o interrupciones que se produzcan en la plataforma.
- La falta de disponibilidad de la plataforma.

### 6. Modificaciones

CyberAcademy se reserva el derecho de modificar las condiciones de este Aviso Legal en cualquier momento sin previo aviso.', '1.0'),

('privacidad', 'Política de Privacidad', E'## Política de Privacidad

**Última actualización:** Abril 2026

### 1. Responsable del Tratamiento

- **Responsable:** CyberAcademy
- **Plataforma:** Guardian Quest Learn

### 2. Datos Personales Recogidos

Recogemos los siguientes datos personales:
- **Datos de registro:** Nombre completo y correo electrónico.
- **Datos de progreso:** Lecciones completadas, resultados de quizzes, puntuaciones en retos CTF.
- **Datos de interacción:** Consultas al chatbot de ciberseguridad, dudas registradas.

### 3. Finalidad del Tratamiento

Los datos personales se tratan con las siguientes finalidades:
- Gestionar la cuenta del usuario y su acceso a la plataforma.
- Registrar el progreso académico y generar ranking de alumnos.
- Personalizar la experiencia de aprendizaje.
- Responder consultas del alumno a través del chatbot.
- Enviar notificaciones relacionadas con la formación.

### 4. Base Legal

El tratamiento de los datos se fundamenta en:
- **Consentimiento del interesado** (art. 6.1.a RGPD).
- **Ejecución de un contrato** de formación (art. 6.1.b RGPD).
- **Interés legítimo** del responsable para mejorar la plataforma (art. 6.1.f RGPD).

### 5. Conservación de Datos

Los datos personales se conservarán mientras el usuario mantenga su cuenta activa y durante los plazos legalmente exigibles.

### 6. Derechos del Usuario

El usuario puede ejercer los siguientes derechos ante el responsable:
- Derecho de acceso (art. 15 RGPD).
- Derecho de rectificación (art. 16 RGPD).
- Derecho de supresión (art. 17 RGPD).
- Derecho a la limitación del tratamiento (art. 18 RGPD).
- Derecho a la portabilidad (art. 20 RGPD).
- Derecho de oposición (art. 21 RGPD).

### 7. Seguridad

CyberAcademy aplica las medidas técnicas y organizativas necesarias para proteger los datos personales, conforme al Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica de Protección de Datos (LOPDGDD).

### 8. Transferencias Internacionales

Los datos se procesan a través de Supabase (EE.UU.), bajo las cláusulas contractuales tipo aprobadas por la Comisión Europea.

### 9. Cambios en la Política

Cualquier modificación será publicada en esta página con la fecha de actualización.', '1.0'),

('cookies', 'Política de Cookies', E'## Política de Cookies

**Última actualización:** Abril 2026

### 1. ¿Qué son las Cookies?

Las cookies son pequeños archivos de texto que se almacenan en el dispositivo del usuario cuando visita una página web. Permiten a la plataforma recordar preferencias y mejorar la experiencia del usuario.

### 2. Tip de Cookies Utilizadas

#### Cookies Técnicas (Necesarias)
Estas cookies son indispensables para el funcionamiento de la plataforma:
- **session:** Mantiene la sesión del usuario autenticado.
- **csrf:** Token de protección contra ataques CSRF.

#### Cookies de Funcionalidad
Permiten recordar preferencias del usuario:
- **theme:** Preferencias de tema visual.
- **language:** Idioma seleccionado.

#### Cookies Analíticas
Nos ayudan a comprender cómo los usuarios interactúan con la plataforma:
- **_ga, _ga_*:** Google Analytics - seguimiento de visitas y comportamiento.

### 3. ¿Cómo Gestionar las Cookies?

Puedes configurar tu navegador para:
- Bloquear todas las cookies.
- Aceptar solo cookies de origen.
- Eliminar cookies existentes.
- Configurar preferencias por sitio web.

### 4. Consentimiento

Al acceder a la plataforma por primera vez, se solicita el consentimiento para el uso de cookies no esenciales. El usuario puede revocar este consentimiento en cualquier momento.

### 5. Actualización

Esta política se actualiza periódicamente para reflejar cambios en la plataforma.', '1.0');