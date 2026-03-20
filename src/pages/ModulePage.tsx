import { useParams, Link } from "react-router-dom";
import { curriculum, getTotalLessons } from "@/data/curriculum";
import { useProgress } from "@/hooks/useProgress";
import { iconMap } from "@/lib/icons";
import ProgressBar from "@/components/ProgressBar";
import LessonItem from "@/components/LessonItem";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function ModulePage() {
  const { id } = useParams();
  const module = curriculum.find(m => m.id === Number(id));
  const { toggle, isCompleted, getModuleProgress } = useProgress();
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(module?.sections.map(s => s.id) || []));

  if (!module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Módulo no encontrado</p>
          <Link to="/" className="text-primary hover:underline text-sm">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const Icon = iconMap[module.icon];
  const total = getTotalLessons(module);
  const progress = getModuleProgress(module.id, total);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const prevModule = curriculum.find(m => m.id === module.id - 1);
  const nextModule = curriculum.find(m => m.id === module.id + 1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Módulos</span>
          </Link>
          <div className="flex-1 min-w-0">
            <span className="font-mono-cyber text-xs text-muted-foreground">
              Módulo {String(module.id).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-cyber text-xs text-primary tabular-nums">{progress.percent}%</span>
            <div className="w-16">
              <ProgressBar percent={progress.percent} size="sm" />
            </div>
          </div>
        </div>
      </header>

      {/* Module Header */}
      <section className="px-4 sm:px-6 pt-8 pb-6">
        <div className="max-w-4xl mx-auto space-y-4 animate-fade-in-up">
          <div className={`${module.gradientClass} rounded-xl p-6 flex items-start gap-4`}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {Icon && <Icon className="w-6 h-6 text-primary" />}
            </div>
            <div className="space-y-2 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight" style={{ lineHeight: '1.15' }}>
                {module.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{module.sections.length} {module.sections.length === 1 ? "sección" : "secciones"}</span>
                <span className="font-mono-cyber tabular-nums">{total} lecciones</span>
                <span className="font-mono-cyber tabular-nums text-primary">{progress.count} completadas</span>
              </div>
              <ProgressBar percent={progress.percent} />
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="px-4 sm:px-6 pb-12">
        <div className="max-w-4xl mx-auto space-y-4">
          {module.sections.map((section, sIdx) => {
            const isOpen = openSections.has(section.id);
            const sectionCompleted = section.lessons.filter(l => isCompleted(`m${module.id}-${l.id}`)).length;

            return (
              <div key={section.id} className="bg-card rounded-xl card-glow overflow-hidden animate-fade-in-up" style={{ animationDelay: `${sIdx * 100}ms` }}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors active:scale-[0.995]"
                >
                  <div className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                  </div>
                  <span className="font-mono-cyber text-xs text-muted-foreground tabular-nums">
                    {sectionCompleted}/{section.lessons.length}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-3 border-t border-border/50">
                    <div className="pt-2 space-y-0.5">
                      {section.lessons.map((lesson, lIdx) => (
                        <LessonItem
                          key={lesson.id}
                          lesson={lesson}
                          moduleId={module.id}
                          completed={isCompleted(`m${module.id}-${lesson.id}`)}
                          onToggle={() => toggle(`m${module.id}-${lesson.id}`)}
                          index={lIdx}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Navigation */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-4xl mx-auto flex justify-between">
          {prevModule ? (
            <Link to={`/modulo/${prevModule.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{prevModule.shortTitle}</span>
              <span className="sm:hidden">Anterior</span>
            </Link>
          ) : <div />}
          {nextModule ? (
            <Link to={`/modulo/${nextModule.id}`} className="flex items-center gap-2 text-sm text-primary hover:text-foreground transition-colors active:scale-95">
              <span className="hidden sm:inline">{nextModule.shortTitle}</span>
              <span className="sm:hidden">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : <div />}
        </div>
      </section>
    </div>
  );
}
