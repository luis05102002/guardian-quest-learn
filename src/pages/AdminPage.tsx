import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { curriculum, getTotalLessons } from "@/data/curriculum";
import { ArrowLeft, Users, BookOpen, Award, BarChart3, Loader2, User, Search, ChevronDown, ChevronUp, Github } from "lucide-react";

interface StudentData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  created_at: string;
  lessonsCompleted: number;
  quizzesCompleted: number;
  quizAvg: number;
  totalScore: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "name" | "lessons" | "quiz">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [studentModules, setStudentModules] = useState<Record<string, { moduleId: number; lessons: number; total: number; quizScore: number | null }[]>>({});

  useEffect(() => {
    if (!isAdmin) return;

    const fetchStudents = async () => {
      const [profilesRes, progressRes, quizRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, created_at"),
        supabase.from("user_progress").select("user_id, lesson_key"),
        supabase.from("quiz_results").select("user_id, module_id, score, total"),
      ]);

      const profiles = profilesRes.data || [];
      const progress = progressRes.data || [];
      const quizzes = quizRes.data || [];

      const studentList: StudentData[] = profiles.map(p => {
        const userLessons = progress.filter(pr => pr.user_id === p.id);
        const userQuizzes = quizzes.filter(q => q.user_id === p.id);
        const totalScore = userQuizzes.reduce((a, q) => a + q.score, 0);
        const totalQuestions = userQuizzes.reduce((a, q) => a + q.total, 0);
        const quizAvg = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

        // Build per-module data
        const modules = curriculum.map(mod => {
          const total = getTotalLessons(mod);
          const completedLessons = userLessons.filter(l => l.lesson_key.startsWith(`m${mod.id}-`)).length;
          const quiz = userQuizzes.find(q => q.module_id === mod.id);
          return {
            moduleId: mod.id,
            lessons: completedLessons,
            total,
            quizScore: quiz ? Math.round((quiz.score / quiz.total) * 100) : null,
          };
        });

        setStudentModules(prev => ({ ...prev, [p.id]: modules }));

        return {
          id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          email: "",
          created_at: p.created_at,
          lessonsCompleted: userLessons.length,
          quizzesCompleted: userQuizzes.length,
          quizAvg,
          totalScore: userLessons.length * 10 + quizAvg * userQuizzes.length,
        };
      });

      setStudents(studentList);
      setLoading(false);
    };

    fetchStudents();
  }, [isAdmin]);

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const totalLessonsAll = curriculum.reduce((a, m) => a + getTotalLessons(m), 0);
  const avgProgress = students.length > 0
    ? Math.round(students.reduce((a, s) => a + s.lessonsCompleted, 0) / students.length)
    : 0;
  const avgQuiz = students.length > 0
    ? Math.round(students.reduce((a, s) => a + s.quizAvg, 0) / students.length)
    : 0;

  const filtered = students
    .filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let diff = 0;
      if (sortBy === "score") diff = a.totalScore - b.totalScore;
      else if (sortBy === "name") diff = a.full_name.localeCompare(b.full_name);
      else if (sortBy === "lessons") diff = a.lessonsCompleted - b.lessonsCompleted;
      else if (sortBy === "quiz") diff = a.quizAvg - b.quizAvg;
      return sortDir === "desc" ? -diff : diff;
    });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return null;
    return sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-foreground">Panel de Administración</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up">
          {[
            { icon: Users, label: "Alumnos", value: students.length, color: "text-primary" },
            { icon: BookOpen, label: "Promedio lecciones", value: avgProgress, color: "text-[hsl(var(--cyber-blue))]" },
            { icon: Award, label: "Promedio quiz", value: `${avgQuiz}%`, color: "text-[hsl(var(--cyber-amber))]" },
            { icon: BarChart3, label: "Total lecciones", value: totalLessonsAll, color: "text-primary" },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-xl card-glow p-4 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <div className="font-mono-cyber text-xl font-bold text-foreground tabular-nums">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <Link
            to="/admin/proyectos"
            className="flex items-center gap-3 bg-card rounded-xl card-glow p-4 hover:bg-secondary/30 transition-colors active:scale-[0.995]"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Github className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Revisar proyectos</p>
              <p className="text-[10px] text-muted-foreground">Ver y dar feedback a los proyectos de los alumnos</p>
            </div>
          </Link>
        </div>

        {/* Search */}
        <div className="relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar alumno..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {/* Student table */}
        <div className="bg-card rounded-xl card-glow overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_100px_100px_100px_80px] gap-2 px-4 py-3 border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground font-mono-cyber">
            <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors text-left">
              Alumno <SortIcon col="name" />
            </button>
            <button onClick={() => toggleSort("lessons")} className="flex items-center gap-1 hover:text-foreground transition-colors">
              Lecciones <SortIcon col="lessons" />
            </button>
            <button onClick={() => toggleSort("quiz")} className="flex items-center gap-1 hover:text-foreground transition-colors">
              Media Quiz <SortIcon col="quiz" />
            </button>
            <span>Quizzes</span>
            <button onClick={() => toggleSort("score")} className="flex items-center gap-1 hover:text-foreground transition-colors">
              Puntos <SortIcon col="score" />
            </button>
          </div>

          {/* Rows */}
          {filtered.map((s, i) => (
            <div key={s.id}>
              <button
                onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}
                className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_100px_100px_100px_80px] gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors text-left items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.full_name || "Sin nombre"}</p>
                    <p className="text-[10px] text-muted-foreground font-mono-cyber">
                      Desde {new Date(s.created_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <span className="font-mono-cyber text-sm text-foreground tabular-nums">{s.lessonsCompleted}</span>
                </div>
                <div className="hidden sm:block">
                  <span className={`font-mono-cyber text-sm tabular-nums ${s.quizAvg >= 70 ? 'text-primary' : s.quizAvg > 0 ? 'text-[hsl(var(--cyber-amber))]' : 'text-muted-foreground'}`}>
                    {s.quizAvg}%
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="font-mono-cyber text-sm text-foreground tabular-nums">{s.quizzesCompleted}</span>
                </div>
                <div className="text-right sm:text-left">
                  <span className="font-mono-cyber text-sm text-primary font-semibold tabular-nums">{s.totalScore}</span>
                </div>
              </button>

              {/* Expanded module details */}
              {expandedStudent === s.id && studentModules[s.id] && (
                <div className="px-4 pb-4 border-t border-border/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                    {studentModules[s.id].map(mod => {
                      const currMod = curriculum.find(c => c.id === mod.moduleId);
                      if (!currMod) return null;
                      const pct = mod.total > 0 ? Math.round((mod.lessons / mod.total) * 100) : 0;
                      return (
                        <div key={mod.moduleId} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">M{mod.moduleId}: {currMod.shortTitle}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full progress-bar-fill rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="font-mono-cyber text-[10px] text-muted-foreground tabular-nums">{pct}%</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`font-mono-cyber text-[10px] tabular-nums ${mod.quizScore !== null ? (mod.quizScore >= 70 ? 'text-primary' : 'text-[hsl(var(--cyber-amber))]') : 'text-muted-foreground'}`}>
                              {mod.quizScore !== null ? `Quiz: ${mod.quizScore}%` : "Sin quiz"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search ? "No se encontraron alumnos" : "No hay alumnos registrados"}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
