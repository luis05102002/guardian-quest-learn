import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres CyberMentor, un asistente experto en ciberseguridad Y secretario académico inteligente de CyberAcademy. Tienes dos roles principales:

## ROL 1: EXPERTO EN CIBERSEGURIDAD
Áreas de expertise:
- Conceptos fundamentales, amenazas (ransomware, phishing, APTs, DDoS, malware)
- Marcos normativos: ISO 27001/27002, ENS, NIST CSF, CIS, CMMI, MAGERIT
- Infraestructuras TI, redes, protocolos, cloud, virtualización
- Linux/Unix, terminal Bash, scripting
- Seguridad ofensiva: pentesting, OSINT, red teaming, NMAP, Metasploit
- Desarrollo seguro: OWASP Top 10, SSDLC, DevSecOps
- Protección: Zero Trust, SASE, endpoint, SIEM, SOC, MITRE ATT&CK
- Continuidad de negocio, gobierno, CISO, análisis forense

## ROL 2: SECRETARIO ACADÉMICO
Funciones de secretario:
- **Registrar dudas**: Cada pregunta del alumno se registra automáticamente para análisis
- **Resumen de progreso**: Si el alumno pregunta por su progreso, le das un resumen
- **Agendar tutorías**: Si el alumno quiere tutoría, le indicas que vaya a /tutorias
- **Contactar profesor**: Si pide hablar con el profesor, le indicas el chat (/chat) o WhatsApp
- **Identificar patrones**: Si detectas que el alumno tiene dificultades recurrentes en un tema, sugiérele recursos adicionales y recomiéndale pedir tutoría
- **Motivación**: Anima al estudiante, celebra logros, sugiere próximos pasos

## ACCIONES ESPECIALES
Cuando el alumno pida ciertas cosas, responde con etiquetas especiales que el frontend interpretará:

- Si pide agendar tutoría o hablar con profesor: incluye [ACTION:TUTORING] en tu respuesta
- Si pide ver su progreso o notas: incluye [ACTION:PROGRESS] en tu respuesta  
- Si pide hablar por chat con el profesor: incluye [ACTION:CHAT] en tu respuesta
- Si pide ver herramientas: incluye [ACTION:TOOLS] en tu respuesta
- Si pide certificados: incluye [ACTION:CERTIFICATES] en tu respuesta

## REGLAS
- Responde SIEMPRE en español
- Usa markdown para estructurar respuestas
- Sé conciso pero completo
- Si preguntan fuera de ciberseguridad, redirige amablemente
- Detecta frustración y ofrece ayuda extra
- Cuando el alumno tenga muchas dudas sobre un tema, sugiérele solicitar una tutoría
- Si recibes contexto del alumno (progreso, módulo actual), úsalo para personalizar respuestas`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, action, userId, studentContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // If action is "save_doubt", save to database and return
    if (action === "save_doubt" && userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const question = messages[messages.length - 1]?.content || "";
      const topic = detectTopic(question);

      await supabase.from("student_doubts").insert({
        user_id: userId,
        question: question.slice(0, 500),
        topic,
        module_context: studentContext?.currentModule || "",
      });

      // Check if this student has many doubts on same topic
      const { data: recentDoubts } = await supabase
        .from("student_doubts")
        .select("topic")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const topicCounts: Record<string, number> = {};
      (recentDoubts || []).forEach((d: any) => {
        topicCounts[d.topic] = (topicCounts[d.topic] || 0) + 1;
      });

      // If 3+ doubts on same topic in a week, notify teacher
      const frequentTopics = Object.entries(topicCounts).filter(([, c]) => c >= 3);
      if (frequentTopics.length > 0) {
        // Get admin/teacher IDs
        const { data: teachers } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "teacher"]);

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();

        for (const teacher of (teachers || [])) {
          for (const [topicName, count] of frequentTopics) {
            await supabase.from("notifications").insert({
              user_id: teacher.user_id,
              type: "doubt_pattern",
              title: "Patrón de dudas detectado",
              message: `${profile?.full_name || "Un alumno"} tiene ${count} dudas sobre "${topicName}" esta semana. Considera programar una tutoría.`,
              link: "/admin",
            });
          }
        }
      }

      return new Response(JSON.stringify({ saved: true, topicCounts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context-enriched system prompt
    let enrichedPrompt = SYSTEM_PROMPT;
    if (studentContext) {
      enrichedPrompt += `\n\n## CONTEXTO DEL ALUMNO\n`;
      if (studentContext.name) enrichedPrompt += `- Nombre: ${studentContext.name}\n`;
      if (studentContext.currentModule) enrichedPrompt += `- Módulo actual: ${studentContext.currentModule}\n`;
      if (studentContext.completedLessons !== undefined) enrichedPrompt += `- Lecciones completadas: ${studentContext.completedLessons}\n`;
      if (studentContext.totalLessons !== undefined) enrichedPrompt += `- Total de lecciones: ${studentContext.totalLessons}\n`;
      if (studentContext.quizAvg !== undefined) enrichedPrompt += `- Nota media en quizzes: ${studentContext.quizAvg}%\n`;
      if (studentContext.recentDoubts) enrichedPrompt += `- Dudas recientes: ${studentContext.recentDoubts}\n`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: enrichedPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Espera un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Contacta al administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function detectTopic(question: string): string {
  const q = question.toLowerCase();
  const topics: [string, string[]][] = [
    ["phishing", ["phishing", "spear", "smishing", "vishing", "suplant"]],
    ["redes", ["red", "tcp", "udp", "dns", "dhcp", "firewall", "router", "switch", "vlan", "vpn", "proxy"]],
    ["malware", ["malware", "virus", "troyano", "ransomware", "gusano", "rootkit", "spyware"]],
    ["pentesting", ["pentest", "metasploit", "nmap", "burp", "exploit", "vulnerabilidad", "kali"]],
    ["normativa", ["iso", "ens", "nist", "rgpd", "lopd", "cumplimiento", "normativ", "regulaci"]],
    ["criptografía", ["cifr", "hash", "criptogr", "ssl", "tls", "certificado", "aes", "rsa"]],
    ["SIEM/SOC", ["siem", "soc", "log", "monitoriz", "detección", "alerta", "splunk", "elastic"]],
    ["desarrollo seguro", ["owasp", "xss", "sql injection", "inyección", "devsecops", "ssdlc", "código seguro"]],
    ["incidentes", ["incidente", "respuesta", "forense", "investigación", "evidencia", "cadena de custodia"]],
    ["gestión riesgos", ["riesgo", "amenaza", "impacto", "probabilidad", "magerit", "control", "mitig"]],
    ["cloud", ["cloud", "aws", "azure", "gcp", "contenedor", "docker", "kubernetes"]],
    ["identidad", ["identidad", "autenticación", "autorización", "mfa", "sso", "ldap", "active directory", "zero trust"]],
  ];

  for (const [topic, keywords] of topics) {
    if (keywords.some(k => q.includes(k))) return topic;
  }
  return "general";
}
