import { useState, useEffect, useCallback } from "react";

const CACHE_PREFIX = "lesson-content-";

function getCacheKey(moduleTitle: string, lessonTitle: string) {
  return CACHE_PREFIX + btoa(encodeURIComponent(`${moduleTitle}::${lessonTitle}`)).slice(0, 40);
}

export function useLessonContent(
  moduleTitle: string,
  sectionTitle: string,
  lessonTitle: string,
  lessonType: string
) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async (skipCache = false) => {
    if (!lessonTitle) return;

    const cacheKey = getCacheKey(moduleTitle, lessonTitle);

    // Check cache first
    if (!skipCache) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setContent(cached);
          setLoading(false);
          setError(null);
          return;
        }
      } catch { /* ignore */ }
    }

    setLoading(true);
    setError(null);
    setContent("");

    const typeInstruction = lessonType === "demo"
      ? "Esta es una lección tipo DEMO. Incluye pasos prácticos detallados, comandos ejecutables, capturas de pantalla descritas y ejemplos que el alumno pueda replicar."
      : lessonType === "case"
      ? "Este es un CASO PRÁCTICO. Plantea un escenario realista, guía al alumno paso a paso para resolverlo, incluye preguntas de reflexión y la solución detallada."
      : lessonType === "evaluation"
      ? "Esta es una EVALUACIÓN. Genera 8-10 preguntas de opción múltiple sobre los temas de esta sección. Para cada pregunta incluye 4 opciones (A, B, C, D), la respuesta correcta y una breve explicación."
      : lessonType === "feedback"
      ? "Esta es una sección de FEEDBACK. Haz un breve resumen de lo aprendido en esta sección, destaca los puntos clave y anima al estudiante a continuar."
      : "Esta es una lección teórica. Explica el tema de forma clara, completa y didáctica.";

    const prompt = `Genera contenido educativo completo y profesional para la siguiente lección de un curso de ciberseguridad:

**Módulo:** ${moduleTitle}
**Sección:** ${sectionTitle}
**Lección:** ${lessonTitle}

${typeInstruction}

Requisitos del contenido:
- Escribe en español profesional
- Usa formato Markdown con encabezados (##, ###), listas, negritas, bloques de código cuando aplique
- Incluye ejemplos prácticos y del mundo real
- Si es relevante, menciona herramientas, estándares o frameworks reales
- Extensión: entre 800 y 1500 palabras
- Incluye una sección de "Puntos clave" al final con un resumen
- Si aplica, incluye una sección "Para profundizar" con temas relacionados a investigar`;

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
      });

      if (!response.ok) throw new Error("Error al generar contenido");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

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

      // Cache the result
      try {
        localStorage.setItem(getCacheKey(moduleTitle, lessonTitle), fullContent);
      } catch { /* storage full, ignore */ }

      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el contenido");
      setLoading(false);
    }
  }, [moduleTitle, sectionTitle, lessonTitle, lessonType]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const regenerate = useCallback(() => {
    fetchContent(true);
  }, [fetchContent]);

  return { content, loading, error, regenerate };
}
