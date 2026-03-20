import { useParams, Link, useNavigate } from "react-router-dom";
import { curriculum } from "@/data/curriculum";
import { useProgress } from "@/hooks/useProgress";
import { useLessonContent } from "@/hooks/useLessonContent";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Circle, Loader2, RefreshCw, BookOpen, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef } from "react";

export default function LessonPage() {
  const { moduleId, sectionId, lessonId } = useParams();
  const navigate = useNavigate();
  const { toggle, isCompleted } = useProgress();
  const contentRef = useRef<HTMLDivElement>(null);

  const module = curriculum.find(m => m.id === Number(moduleId));
  const section = module?.sections.find(s => s.id === sectionId);
  const lessonIndex = section?.lessons.findIndex(l => l.id === lessonId) ?? -1;
  const lesson = section?.lessons[lessonIndex];

  const progressKey = module && lesson ? `m${module.id}-${lesson.id}` : "";
  const completed = isCompleted(progressKey);

  const moduleTitle = module?.title || "";
  const sectionTitle = section?.title || "";
  const lessonTitle = lesson?.title || "";
  const lessonType = lesson?.type || "lesson";

  const { content, loading, error, generated, generate, regenerate, reset } = useLessonContent(
    moduleTitle, sectionTitle, lessonTitle, lessonType
  );

  // Reset when lesson changes
  const prevLessonId = useRef(lessonId);
  useEffect(() => {
    if (prevLessonId.current !== lessonId) {
      reset();
      prevLessonId.current = lessonId;
    }
  }, [lessonId, reset]);

  // Find prev/next lessons across sections
  const allLessons = module?.sections.flatMap(s =>
    s.lessons.map(l => ({ lesson: l, section: s }))
  ) || [];
  const currentGlobalIndex = allLessons.findIndex(
    item => item.section.id === sectionId && item.lesson.id === lessonId
  );
  const prevLesson = currentGlobalIndex > 0 ? allLessons[currentGlobalIndex - 1] : null;
  const nextLesson = currentGlobalIndex < allLessons.length - 1 ? allLessons[currentGlobalIndex + 1] : null;

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [lessonId]);

  if (!module || !section || !lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Lección no encontrada</p>
          <Link to="/" className="text-primary hover:underline text-sm">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            to={`/modulo/${module.id}`}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{module.shortTitle}</span>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate font-mono-cyber">
              {section.title}
            </p>
          </div>
          <button
            onClick={() => toggle(progressKey)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95 ${
              completed
                ? "bg-primary/15 text-primary"
                : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Completada</span>
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Marcar completada</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main ref={contentRef} className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Lesson title */}
          <div className="mb-8 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className={`text-[10px] font-mono-cyber uppercase tracking-wider px-1.5 py-0.5 rounded ${
                lessonType === "demo" ? "bg-primary/10 text-primary" :
                lessonType === "case" ? "bg-[hsl(var(--cyber-amber))]/10 text-[hsl(var(--cyber-amber))]" :
                lessonType === "evaluation" ? "bg-[hsl(var(--cyber-blue))]/10 text-[hsl(var(--cyber-blue))]" :
                lessonType === "feedback" ? "bg-secondary text-muted-foreground" :
                "bg-primary/10 text-primary"
              }`}>
                {lessonType === "demo" ? "Demo" :
                 lessonType === "case" ? "Caso práctico" :
                 lessonType === "evaluation" ? "Evaluación" :
                 lessonType === "feedback" ? "Feedback" :
                 "Lección"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight" style={{ lineHeight: '1.15' }}>
              {lesson.title}
            </h1>
          </div>

          {/* Generate button or content */}
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {!generated && !loading && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Contenido listo para generar</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Pulsa el botón para generar el contenido educativo de esta lección con IA.
                  </p>
                </div>
                <button
                  onClick={() => generate()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors active:scale-[0.97]"
                >
                  <Sparkles className="w-4 h-4" />
                  Generar contenido
                </button>
              </div>
            )}

            {loading && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generando contenido educativo...</span>
                </div>
                {!content && (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-secondary/60 rounded w-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                        <div className="h-4 bg-secondary/40 rounded w-3/4 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center space-y-3">
                <p className="text-sm text-destructive">{error}</p>
                <button
                  onClick={() => generate()}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-foreground transition-colors active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reintentar
                </button>
              </div>
            )}

            {content && (
              <article className="prose-cyber">
                <ReactMarkdown>{content}</ReactMarkdown>
              </article>
            )}
          </div>

          {/* Regenerate button */}
          {!loading && content && (
            <div className="mt-8 pt-6 border-t border-border/50 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <button
                onClick={regenerate}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerar contenido
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom navigation */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-md sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {prevLesson ? (
            <Link
              to={`/modulo/${module.id}/seccion/${prevLesson.section.id}/leccion/${prevLesson.lesson.id}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{prevLesson.lesson.title}</span>
            </Link>
          ) : <div />}
          {nextLesson ? (
            <Link
              to={`/modulo/${module.id}/seccion/${nextLesson.section.id}/leccion/${nextLesson.lesson.id}`}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-foreground transition-colors active:scale-95"
            >
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{nextLesson.lesson.title}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={() => {
                if (!completed) toggle(progressKey);
                navigate(`/modulo/${module.id}`);
              }}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-foreground transition-colors active:scale-95"
            >
              <span>Finalizar módulo</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
