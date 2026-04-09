import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Trophy, Medal, Loader2, User } from "lucide-react";

interface RankedStudent {
  id: string;
  full_name: string;
  avatar_url: string | null;
  lessonsCompleted: number;
  quizAvg: number;
  score: number;
}

export default function RankingPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      const [profilesRes, progressRes, quizRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url"),
        supabase.from("user_progress").select("user_id, id"),
        supabase.from("quiz_scores" as any).select("user_id, score, total"),
      ]);

      const profiles = profilesRes.data || [];
      const progress = progressRes.data || [];
      const quizzes = quizRes.data || [];

      const ranked: RankedStudent[] = profiles.map(p => {
        const lessons = progress.filter(pr => pr.user_id === p.id).length;
        const userQuizzes = quizzes.filter(q => q.user_id === p.id);
        const totalScore = userQuizzes.reduce((a, q) => a + q.score, 0);
        const totalQuestions = userQuizzes.reduce((a, q) => a + q.total, 0);
        const quizAvg = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
        const score = lessons * 10 + quizAvg * userQuizzes.length;

        return { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, lessonsCompleted: lessons, quizAvg, score };
      });

      ranked.sort((a, b) => b.score - a.score);
      setStudents(ranked);
      setLoading(false);
    };

    fetchRanking();
  }, []);

  const getMedalColor = (i: number) => {
    if (i === 0) return "text-yellow-400";
    if (i === 1) return "text-gray-300";
    if (i === 2) return "text-amber-600";
    return "text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-foreground">Ranking de Alumnos</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Top 3 podium */}
        {students.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-10 animate-fade-in-up">
            {[1, 0, 2].map(pos => {
              const s = students[pos];
              const heights = ["h-28", "h-36", "h-24"];
              const order = [1, 0, 2];
              return (
                <div key={s.id} className="flex flex-col items-center gap-2" style={{ order: order[pos] }}>
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-full bg-secondary overflow-hidden ring-2 ${pos === 0 ? 'ring-yellow-400' : pos === 1 ? 'ring-gray-300' : 'ring-amber-600'}`}>
                      {s.avatar_url ? (
                        <img src={s.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pos === 0 ? 'bg-yellow-400 text-black' : pos === 1 ? 'bg-gray-300 text-black' : 'bg-amber-600 text-white'}`}>
                      {pos + 1}
                    </div>
                  </div>
                  <span className="text-xs text-foreground font-medium truncate max-w-[80px] text-center">{s.full_name || "Anónimo"}</span>
                  <span className="font-mono-cyber text-xs text-primary tabular-nums">{s.score} pts</span>
                  <div className={`${heights[pos]} w-20 rounded-t-lg ${pos === 0 ? 'bg-yellow-400/20' : pos === 1 ? 'bg-gray-300/20' : 'bg-amber-600/20'}`} />
                </div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        <div className="space-y-2">
          {students.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors animate-fade-in-up ${s.id === user?.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-card card-glow'}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-8 text-center">
                {i < 3 ? (
                  <Trophy className={`w-4 h-4 mx-auto ${getMedalColor(i)}`} />
                ) : (
                  <span className="font-mono-cyber text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                )}
              </div>

              <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden shrink-0">
                {s.avatar_url ? (
                  <img src={s.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.full_name || "Anónimo"}</p>
                <p className="text-[10px] text-muted-foreground font-mono-cyber">
                  {s.lessonsCompleted} lecciones · {s.quizAvg}% media quiz
                </p>
              </div>

              <span className="font-mono-cyber text-sm text-primary font-semibold tabular-nums">{s.score}</span>
            </div>
          ))}

          {students.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No hay alumnos registrados aún
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
