import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, XCircle, Loader2, RotateCcw, Trophy } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number; // 0-3
  explanation: string;
}

interface ModuleQuizProps {
  moduleId: number;
  moduleTitle: string;
  sectionTitles: string[];
}

export default function ModuleQuiz({ moduleId, moduleTitle, sectionTitles }: ModuleQuizProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const [savedResult, setSavedResult] = useState<{ score: number; total: number } | null>(null);

  // Check for existing result
  useEffect(() => {
    if (!user) return;
    supabase
      .from("quiz_results")
      .select("score, total")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSavedResult(data);
      });
  }, [user, moduleId]);

  const generateQuiz = useCallback(async () => {
    setLoading(true);
    setError("");
    setQuestions([]);
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setFinished(false);
    setSavedResult(null);

    const prompt = `Genera exactamente 10 preguntas tipo test para evaluar el conocimiento del siguiente módulo de ciberseguridad:

**Módulo:** ${moduleTitle}
**Secciones cubiertas:** ${sectionTitles.join(", ")}

FORMATO OBLIGATORIO: Responde SOLO con un array JSON válido, sin texto adicional ni bloques de código. Cada objeto debe tener:
- "question": string con la pregunta
- "options": array de exactamente 4 strings (A, B, C, D)
- "correct": número 0-3 indicando la respuesta correcta
- "explanation": string breve explicando por qué es correcta

Las preguntas deben:
- Cubrir los temas principales del módulo
- Tener dificultad media-alta
- Incluir preguntas conceptuales y prácticas
- Ser claras y sin ambigüedad

Responde SOLO el JSON array, nada más.`;

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

      if (!response.ok) throw new Error("Error generando quiz");

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
            if (delta) fullContent += delta;
          } catch { /* skip */ }
        }
      }

      // Extract JSON from response
      const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No se pudo parsear el quiz");

      const parsed = JSON.parse(jsonMatch[0]) as QuizQuestion[];
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Quiz vacío");

      setQuestions(parsed.slice(0, 10));
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generando quiz");
      setLoading(false);
    }
  }, [moduleTitle, sectionTitles]);

  const handleAnswer = (optionIndex: number) => {
    if (answered) return;
    setSelected(optionIndex);
    setAnswered(true);
    if (optionIndex === questions[currentQ].correct) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = async () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
      // Save result
      if (user) {
        const finalScore = selected === questions[currentQ].correct ? score : score;
        await supabase.from("quiz_results").upsert({
          user_id: user.id,
          module_id: moduleId,
          score: score,
          total: questions.length,
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,module_id" });
        setSavedResult({ score, total: questions.length });
      }
    } else {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  if (!user) return null;

  // Show previous result
  if (savedResult && questions.length === 0 && !loading) {
    return (
      <div className="bg-card rounded-xl card-glow p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Evaluación del módulo</h3>
        </div>
        <div className="text-center space-y-2">
          <div className="font-mono-cyber text-3xl font-bold text-primary tabular-nums">
            {savedResult.score}/{savedResult.total}
          </div>
          <p className="text-xs text-muted-foreground">
            {savedResult.score >= savedResult.total * 0.7 ? "¡Buen resultado! 🎉" : "Puedes mejorar, ¡inténtalo de nuevo!"}
          </p>
        </div>
        <button
          onClick={generateQuiz}
          className="w-full py-2.5 rounded-lg bg-secondary text-foreground font-medium text-xs hover:bg-secondary/80 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Repetir evaluación
        </button>
      </div>
    );
  }

  // Initial state
  if (questions.length === 0 && !loading) {
    return (
      <div className="bg-card rounded-xl card-glow p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Evaluación del módulo</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Pon a prueba tus conocimientos con un test de 10 preguntas sobre este módulo.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          onClick={generateQuiz}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Comenzar evaluación
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl card-glow p-5 space-y-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Generando evaluación...</span>
        </div>
      </div>
    );
  }

  // Finished
  if (finished) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="bg-card rounded-xl card-glow p-5 space-y-4 animate-fade-in-up">
        <div className="text-center space-y-3">
          <Trophy className={`w-10 h-10 mx-auto ${percent >= 70 ? "text-primary" : "text-muted-foreground"}`} />
          <div className="font-mono-cyber text-4xl font-bold text-primary tabular-nums">{percent}%</div>
          <p className="text-sm text-foreground font-semibold">
            {score}/{questions.length} respuestas correctas
          </p>
          <p className="text-xs text-muted-foreground">
            {percent >= 90 ? "¡Excelente! Dominas este módulo 🏆" :
             percent >= 70 ? "¡Buen trabajo! Has aprobado 🎉" :
             percent >= 50 ? "Repasa algunos temas e inténtalo de nuevo 📖" :
             "Necesitas repasar este módulo antes de continuar 📚"}
          </p>
        </div>
        <button
          onClick={generateQuiz}
          className="w-full py-2.5 rounded-lg bg-secondary text-foreground font-medium text-xs hover:bg-secondary/80 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Repetir evaluación
        </button>
      </div>
    );
  }

  // Active quiz
  const q = questions[currentQ];
  return (
    <div className="bg-card rounded-xl card-glow p-5 space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <span className="font-mono-cyber text-xs text-muted-foreground tabular-nums">
          Pregunta {currentQ + 1}/{questions.length}
        </span>
        <span className="font-mono-cyber text-xs text-primary tabular-nums">{score} correctas</span>
      </div>

      {/* Progress */}
      <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
        <div className="h-1 rounded-full progress-bar-fill transition-all duration-300" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>

      <p className="text-sm font-medium text-foreground leading-relaxed">{q.question}</p>

      <div className="space-y-2">
        {q.options.map((option, i) => {
          const letter = ["A", "B", "C", "D"][i];
          let classes = "w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 text-sm ";

          if (!answered) {
            classes += selected === i
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/30 hover:bg-secondary/30";
          } else if (i === q.correct) {
            classes += "border-primary bg-primary/10 text-foreground";
          } else if (i === selected) {
            classes += "border-destructive bg-destructive/10 text-foreground";
          } else {
            classes += "border-border/50 opacity-50";
          }

          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={answered} className={classes}>
              <span className="font-mono-cyber text-xs font-bold shrink-0 w-5 h-5 rounded flex items-center justify-center bg-secondary/80">
                {letter}
              </span>
              <span className="flex-1">{option}</span>
              {answered && i === q.correct && <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
              {answered && i === selected && i !== q.correct && <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="space-y-3 animate-fade-in-up">
          <div className={`text-xs p-3 rounded-lg ${selected === q.correct ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
            {selected === q.correct ? "¡Correcto! " : "Incorrecto. "}
            {q.explanation}
          </div>
          <button
            onClick={nextQuestion}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors active:scale-[0.98]"
          >
            {currentQ + 1 >= questions.length ? "Ver resultados" : "Siguiente pregunta"}
          </button>
        </div>
      )}
    </div>
  );
}
