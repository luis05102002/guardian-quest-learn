import { CheckCircle2, Circle, Play, FlaskConical, Briefcase, MessageSquare } from "lucide-react";
import type { Lesson } from "@/data/curriculum";

interface LessonItemProps {
  lesson: Lesson;
  moduleId: number;
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

export default function LessonItem({ lesson, completed, onToggle, index }: LessonItemProps) {
  const TypeIcon = typeIcons[lesson.type];
  const label = typeLabels[lesson.type];

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors duration-150 text-left group active:scale-[0.99] animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="mt-0.5 shrink-0">
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          <TypeIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </div>

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
    </button>
  );
}
