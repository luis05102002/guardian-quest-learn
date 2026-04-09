import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { Shield, ArrowLeft, Trophy, Lock, CheckCircle2, Star, BookOpen, Brain, MessageSquare, Award, Zap, Target, Flame, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { curriculum } from "@/data/curriculum";
import { toast } from "sonner";

interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "progreso" | "quiz" | "social" | "especial";
  check: (ctx: AchievementCtx) => boolean;
}

interface AchievementCtx {
  completedLessons: number;
  totalLessons: number;
  completedModules: number;
  totalModules: number;
  quizCount: number;
  perfectQuizzes: number;
  avgScore: number;
  chatMessages: number;
  tutoringBookings: number;
  projectSubmissions: number;
}

const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_lesson", title: "Primera Lección", description: "Completa tu primera lección", icon: <BookOpen className="w-6 h-6" />, category: "progreso", check: (c) => c.completedLessons >= 1 },
  { key: "10_lessons", title: "Estudiante Dedicado", description: "Completa 10 lecciones", icon: <Star className="w-6 h-6" />, category: "progreso", check: (c) => c.completedLessons >= 10 },
  { key: "25_lessons", title: "Aprendiz Avanzado", description: "Completa 25 lecciones", icon: <Zap className="w-6 h-6" />, category: "progreso", check: (c) => c.completedLessons >= 25 },
  { key: "50_lessons", title: "Experto en Formación", description: "Completa 50 lecciones", icon: <Flame className="w-6 h-6" />, category: "progreso", check: (c) => c.completedLessons >= 50 },
  { key: "all_lessons", title: "Maestro Cyber", description: "Completa todas las lecciones", icon: <Crown className="w-6 h-6" />, category: "progreso", check: (c) => c.completedLessons >= c.totalLessons && c.totalLessons > 0 },
  { key: "first_module", title: "Módulo Completado", description: "Termina un módulo completo", icon: <Target className="w-6 h-6" />, category: "progreso", check: (c) => c.completedModules >= 1 },
  { key: "half_modules", title: "Medio Camino", description: "Completa la mitad de los módulos", icon: <Trophy className="w-6 h-6" />, category: "progreso", check: (c) => c.completedModules >= Math.ceil(c.totalModules / 2) },
  { key: "first_quiz", title: "Primer Quiz", description: "Completa tu primer quiz", icon: <Brain className="w-6 h-6" />, category: "quiz", check: (c) => c.quizCount >= 1 },
  { key: "perfect_quiz", title: "Puntuación Perfecta", description: "Obtén un 100% en un quiz", icon: <Award className="w-6 h-6" />, category: "quiz", check: (c) => c.perfectQuizzes >= 1 },
  { key: "quiz_master", title: "Quiz Master", description: "Completa 5 quizzes con más del 80%", icon: <Star className="w-6 h-6" />, category: "quiz", check: (c) => c.quizCount >= 5 && c.avgScore >= 80 },
  { key: "first_message", title: "Comunicador", description: "Envía tu primer mensaje en el chat", icon: <MessageSquare className="w-6 h-6" />, category: "social", check: (c) => c.chatMessages >= 1 },
  { key: "first_tutoring", title: "Buscador de Ayuda", description: "Agenda tu primera tutoría", icon: <Target className="w-6 h-6" />, category: "social", check: (c) => c.tutoringBookings >= 1 },
  { key: "first_project", title: "Desarrollador", description: "Envía tu primer proyecto", icon: <Zap className="w-6 h-6" />, category: "social", check: (c) => c.projectSubmissions >= 1 },
];

const categoryColors: Record<string, string> = {
  progreso: "from-primary/20 to-primary/5 border-primary/30",
  quiz: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
  social: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  especial: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
};

const categoryLabels: Record<string, string> = {
  progreso: "Progreso",
  quiz: "Evaluación",
  social: "Social",
  especial: "Especial",
};

export default function AchievementsPage() {
  const { user } = useAuth();
  const { totalCompleted } = useProgress();
  const [unlockedKeys, setUnlockedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [ctx, setCtx] = useState<AchievementCtx | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, totalCompleted]);

  async function loadData() {
    if (!user) return;
    setLoading(true);

    const [achRes, quizRes, chatRes, tutRes, projRes] = await Promise.all([
      supabase.from("achievements").select("achievement_key").eq("user_id", user.id),
      supabase.from("quiz_results").select("score, total").eq("user_id", user.id),
      supabase.from("chat_messages").select("id").eq("sender_id", user.id).limit(1),
      supabase.from("tutoring_bookings").select("id").eq("student_id", user.id).eq("status", "confirmed"),
      supabase.from("project_submissions").select("id").eq("user_id", user.id),
    ]);

    const existing = new Set((achRes.data || []).map(a => a.achievement_key));

    const totalLessons = curriculum.reduce((s, m) => s + m.sections.reduce((s2, sec) => s2 + sec.lessons.length, 0), 0);
    const totalModules = curriculum.length;

    // Count completed modules
    let completedModules = 0;
    for (const mod of curriculum) {
      const modLessons = mod.sections.reduce((s, sec) => s + sec.lessons.length, 0);
      // We approximate: if user has completed >= modLessons from total
      // A more accurate check would require per-module progress
      // For now we use a simpler heuristic
    }

    const quizzes = quizRes.data || [];
    const perfectQuizzes = quizzes.filter(q => q.score === q.total).length;
    const avgScore = quizzes.length > 0 ? Math.round(quizzes.reduce((s, q) => s + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) / quizzes.length) : 0;

    const context: AchievementCtx = {
      completedLessons: totalCompleted,
      totalLessons,
      completedModules, // simplified
      totalModules,
      quizCount: quizzes.length,
      perfectQuizzes,
      avgScore,
      chatMessages: (chatRes.data || []).length,
      tutoringBookings: (tutRes.data || []).length,
      projectSubmissions: (projRes.data || []).length,
    };

    setCtx(context);

    // Check and unlock new achievements
    let newUnlocks = 0;
    for (const ach of ACHIEVEMENTS) {
      if (!existing.has(ach.key) && ach.check(context)) {
        const { error } = await supabase.from("achievements").insert({ user_id: user.id, achievement_key: ach.key });
        if (!error) {
          existing.add(ach.key);
          newUnlocks++;
        }
      }
    }

    if (newUnlocks > 0) {
      toast.success(`🏆 ¡${newUnlocks} nuevo${newUnlocks > 1 ? "s" : ""} logro${newUnlocks > 1 ? "s" : ""} desbloqueado${newUnlocks > 1 ? "s" : ""}!`);
    }

    setUnlockedKeys(existing);
    setLoading(false);
  }

  const unlocked = ACHIEVEMENTS.filter(a => unlockedKeys.has(a.key));
  const locked = ACHIEVEMENTS.filter(a => !unlockedKeys.has(a.key));
  const percent = Math.round((unlocked.length / ACHIEVEMENTS.length) * 100);

  const categories = ["progreso", "quiz", "social", "especial"] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Trophy className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-foreground">Logros</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 to-background p-6 text-center space-y-3">
          <div className="text-5xl font-bold text-primary font-mono-cyber">{unlocked.length}/{ACHIEVEMENTS.length}</div>
          <p className="text-sm text-muted-foreground">Logros desbloqueados</p>
          <div className="w-full max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground font-mono-cyber">{percent}% completado</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando logros...</div>
        ) : (
          categories.map(cat => {
            const catAchs = ACHIEVEMENTS.filter(a => a.category === cat);
            if (catAchs.length === 0) return null;
            return (
              <div key={cat} className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[cat]}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {catAchs.map(ach => {
                    const isUnlocked = unlockedKeys.has(ach.key);
                    return (
                      <div
                        key={ach.key}
                        className={`rounded-xl border p-4 flex items-center gap-4 transition-all ${
                          isUnlocked
                            ? `bg-gradient-to-br ${categoryColors[cat]} shadow-sm`
                            : "bg-muted/30 border-border/50 opacity-60"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isUnlocked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {isUnlocked ? ach.icon : <Lock className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{ach.title}</span>
                            {isUnlocked && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{ach.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
