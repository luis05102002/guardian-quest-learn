import { useState, useCallback, useRef } from "react";

const CACHE_PREFIX = "lesson-content-";

function getCacheKey(moduleTitle: string, sectionTitle: string, lessonTitle: string) {
  const raw = `${moduleTitle}::${sectionTitle}::${lessonTitle}`;
  return CACHE_PREFIX + btoa(encodeURIComponent(raw)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 60);
}

export function useLessonContent(
  moduleTitle: string,
  sectionTitle: string,
  lessonTitle: string,
  lessonType: string
) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (skipCache = false) => {
    if (!lessonTitle) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const currentRequestId = ++requestIdRef.current;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const cacheKey = getCacheKey(moduleTitle, sectionTitle, lessonTitle);

    if (!skipCache) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setContent(cached);
          setLoading(false);
          setError(null);
          setGenerated(true);
          return;
        }
      } catch { /* ignore */ }
    }

    setLoading(true);
    setError(null);
    setContent("");
    setGenerated(true);

    const typeInstruction = lessonType === "demo"
      ? "Esta es una lección tipo DEMO. Incluye pasos prácticos detallados, comandos ejecutables, capturas de pantalla descritas y ejemplos que el alumno pueda replicar."
      : lessonType === "case"
      ? "Este es un CASO PRÁCTICO. Plantea un escenario realista, guía al alumno paso a paso para resolverlo, incluye preguntas de reflexión y la solución detallada."
      : lessonType === "evaluation"
      ? "Esta es una EVALUACIÓN. Genera 8-10 preguntas de opción múltiple sobre los temas de esta sección. Para cada pregunta incluye 4 opciones (A, B, C, D), indica claramente la respuesta correcta y una breve explicación."
      : lessonType === "feedback"
      ? "Esta es una sección de FEEDBACK. Haz un breve resumen de lo aprendido en esta sección, destaca los puntos clave y anima al estudiante a continuar."
      : "Esta es una lección teórica. Explica el tema de forma clara, completa y didáctica.";

    const prompt = `Eres un profesor experto en ciberseguridad creando material educativo. Genera contenido ESPECÍFICO y ÚNICO para esta lección concreta:

**Módulo ${moduleTitle}**
**Sección: ${sectionTitle}**
**Tema exacto: ${lessonTitle}**

${typeInstruction}

INSTRUCCIONES CRÍTICAS:
- El contenido debe ser 100% específico sobre "${lessonTitle}". NO hables de otros temas del módulo
- Escribe en español profesional
- Usa Markdown: ## para títulos, ### subtítulos, listas, **negritas**, \`código\` cuando aplique
- Incluye datos reales: nombres de herramientas reales, CVEs reales, estándares con números específicos, ejemplos de empresas/incidentes reales cuando sea relevante
- Si el tema es técnico, incluye comandos, configuraciones o código real y funcional
- Si el tema es normativo, cita artículos o cláusulas específicas
- Extensión: 1000-2000 palabras. Sé profundo, no superficial
- Estructura: Introducción → Desarrollo con subsecciones → Ejemplos prácticos → Puntos clave → Para profundizar
- NO repitas información genérica sobre ciberseguridad. Ve directo al tema específico de la lección`;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/cyber-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? "Demasiadas solicitudes. Espera un momento."
            : response.status === 402
            ? "Créditos agotados. Contacta al administrador."
            : `Error al generar contenido (${response.status})`
        );
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (currentRequestId !== requestIdRef.current) return;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.replace("data: ", "").trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              setContent(fullContent);
            }
          } catch { /* skip */ }
        }
      }

      if (currentRequestId !== requestIdRef.current) return;

      try {
        localStorage.setItem(cacheKey, fullContent);
      } catch { /* storage full */ }

      setLoading(false);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (currentRequestId !== requestIdRef.current) return;
      setError(e instanceof Error ? e.message : "Error al generar el contenido");
      setLoading(false);
    }
  }, [moduleTitle, sectionTitle, lessonTitle, lessonType]);

  const regenerate = useCallback(() => {
    try {
      const cacheKey = getCacheKey(moduleTitle, sectionTitle, lessonTitle);
      localStorage.removeItem(cacheKey);
    } catch { /* ignore */ }
    generate(true);
  }, [generate, moduleTitle, sectionTitle, lessonTitle]);

  // Reset generated state when lesson changes
  const reset = useCallback(() => {
    setContent("");
    setLoading(false);
    setError(null);
    setGenerated(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { content, loading, error, generated, generate, regenerate, reset };
}
