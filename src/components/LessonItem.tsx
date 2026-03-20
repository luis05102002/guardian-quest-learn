import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Play, FlaskConical, Briefcase, MessageSquare, ChevronRight } from "lucide-react";
import type { Lesson } from "@/data/curriculum";

interface LessonItemProps {
  lesson: Lesson;
  moduleId: number;
  sectionId: string;
  completed: boolean;
  onToggle: () => void;
  index: number;
}

const typeIcons: Record<Lesson['type'], React.ComponentType<{ className?: string }>> = {
  lesson: Circle,
  demo: Play,
  case: Briefcase,
  evaluation: FlaskConical,
  feedback: MessageSquare,
};

const typeLabels: Record<Lesson['type'], string> = {
  lesson: "",
  demo: "Demo",
  case: "Caso",
  evaluation: "Evaluación",
  feedback: "Feedback",
};

export default function LessonItem({ lesson, moduleId, sectionId, completed, onToggle, index }: LessonItemProps) {
  const TypeIcon = typeIcons[lesson.type];
  const label = typeLabels[lesson.type];

  return (
    <div
      className="flex items-center gap-1 animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Toggle completion */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="shrink-0 p-1.5 rounded-md hover:bg-secondary/50 transition-colors active:scale-90"
        aria-label={completed ? "Desmarcar completada" : "Marcar completada"}
      >
        {completed ? (
          <CheckCircle2 className="w-4.5 h-4.5 text-primary" />
        ) : (
          <TypeIcon className="w-4.5 h-4.5 text-muted-foreground" />
        )}
      </button>

      {/* Navigate to lesson */}
      <Link
        to={`/modulo/${moduleId}/seccion/${sectionId}/leccion/${lesson.id}`}
        className="flex-1 flex items-center gap-2 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors duration-150 text-left group active:scale-[0.99] min-w-0"
      >
        <div className="flex-1 min-w-0">
          <span className={`text-sm leading-relaxed ${completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {lesson.title}
          </span>
          {label && (
            <span className={`ml-2 inline-block text-[10px] font-mono-cyber uppercase tracking-wider px-1.5 py-0.5 rounded ${
              lesson.type === "demo" ? "bg-primary/10 text-primary" :
              lesson.type === "case" ? "bg-[hsl(var(--cyber-amber))]/10 text-[hsl(var(--cyber-amber))]" :
              lesson.type === "evaluation" ? "bg-[hsl(var(--cyber-blue))]/10 text-[hsl(var(--cyber-blue))]" :
              "bg-secondary text-muted-foreground"
            }`}>
              {label}
            </span>
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </Link>
    </div>
  );
}
