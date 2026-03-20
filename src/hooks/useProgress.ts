import { useEffect, useState } from "react";

const STORAGE_KEY = "cyber-progress";

export function useProgress() {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  }, [completed]);

  const toggle = (lessonId: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const isCompleted = (lessonId: string) => completed.has(lessonId);

  const getModuleProgress = (moduleId: number, totalLessons: number) => {
    const count = [...completed].filter(id => id.startsWith(`m${moduleId}-`)).length;
    return { count, total: totalLessons, percent: totalLessons > 0 ? Math.round((count / totalLessons) * 100) : 0 };
  };

  const totalCompleted = completed.size;

  return { toggle, isCompleted, getModuleProgress, totalCompleted };
}
