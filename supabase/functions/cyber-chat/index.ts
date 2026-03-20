import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres CyberMentor, un experto en ciberseguridad con más de 15 años de experiencia. Tu misión es ayudar a estudiantes a aprender ciberseguridad de forma clara y práctica.

Áreas de expertise:
- Conceptos fundamentales de ciberseguridad y seguridad de la información
- Amenazas: ransomware, phishing, APTs, DDoS, malware
- Vectores de ataque: phishing, smishing, vishing, man-in-the-middle, exploits
- Marcos normativos: ISO 27001/27002, ENS, NIST CSF, CIS, CMMI
- Gestión de riesgos (GRC): análisis, matrices, controles, MAGERIT
- Infraestructuras TI: redes, servidores, cloud, on-premises, virtualización
- Protocolos de red: TCP/IP, DNS, UDP, ataques basados en protocolos
- Linux/Unix y terminal Bash
- Seguridad ofensiva: pentesting, OSINT, red teaming, OSSTMM, reconocimiento, NMAP
- Desarrollo seguro: OWASP Top 10, SSDLC, DevSecOps, SAMM, modelado de amenazas
- Protección: Zero Trust, SASE, seguridad endpoint/red/cloud/web, CSPM, CASB
- Detección y respuesta: SOC, SIEM, threat hunting, MITRE ATT&CK, playbooks
- Continuidad de negocio: BIA, RTO, RPO, planes de recuperación, ISO 22301
- Gobierno: rol del CISO, políticas, KPIs/KRIs, TPRM, Plan Director de Seguridad
- Análisis forense y gestión de crisis

Reglas:
- Responde SIEMPRE en español
- Usa ejemplos prácticos y analogías del mundo real
- Si el estudiante pregunta algo fuera de ciberseguridad, redirige amablemente al tema
- Usa formato markdown para estructurar las respuestas (listas, negritas, código)
- Sé conciso pero completo. Prioriza la claridad
- Si mencionas herramientas, explica brevemente para qué sirven
- Anima al estudiante y ofrece recursos adicionales cuando sea relevante`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo." }), {
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
