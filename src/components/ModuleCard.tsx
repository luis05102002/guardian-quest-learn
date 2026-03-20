import { Link } from "react-router-dom";
import { getTotalLessons, type Module } from "@/data/curriculum";
import { iconMap } from "@/lib/icons";
import ProgressBar from "./ProgressBar";

interface ModuleCardProps {
  module: Module;
  progress: { count: number; total: number; percent: number };
  index: number;
}

export default function ModuleCard({ module, progress, index }: ModuleCardProps) {
  const Icon = iconMap[module.icon];
  const total = getTotalLessons(module);
  const sectionCount = module.sections.length;

  return (
    <Link
      to={`/modulo/${module.id}`}
      className="group block rounded-xl card-glow hover:card-glow-hover bg-card transition-all duration-300 ease-out overflow-hidden animate-fade-in-up active:scale-[0.98]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={`${module.gradientClass} p-5 flex items-start justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {Icon && <Icon className="w-5 h-5 text-primary" />}
          </div>
          <span className="font-mono-cyber text-xs text-muted-foreground">
            Módulo {String(module.id).padStart(2, "0")}
          </span>
        </div>
        <span className="font-mono-cyber text-xs text-muted-foreground tabular-nums">
          {total} lecciones
        </span>
      </div>

      <div className="p-5 space-y-3">
        <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors duration-200">
          {module.title}
        </h3>

        <p className="text-sm text-muted-foreground">
          {sectionCount} {sectionCount === 1 ? "sección" : "secciones"}
        </p>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Progreso</span>
            <span className="font-mono-cyber text-xs text-primary tabular-nums">
              {progress.percent}%
            </span>
          </div>
          <ProgressBar percent={progress.percent} size="sm" />
        </div>
      </div>
    </Link>
  );
}
