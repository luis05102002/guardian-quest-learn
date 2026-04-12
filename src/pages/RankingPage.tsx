import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Trophy, Medal, Loader2, User, FlaskConical, Flag } from "lucide-react";

interface RankedStudent {
  id: string;
  full_name: string;
  avatar_url: string | null;
  lessonsCompleted: number;
  quizAvg: number;
  labScore: number;
  ctfScore: number;
  score: number;
}

export default function RankingPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<RankedStudent[]>([]);
  const [activeTab, setActiveTab] = useState<"global" | "ctf" | "labs">("global");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  async function fetchRanking() {
    const [profilesRes, progressRes, quizRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url"),
      supabase.from("user_progress").select("user_id, id"),
      supabase.from("quiz_results" as any).select("user_id, score, total"),
    ]);

    // Fetch optional tables (may not exist yet)
    const [labRes, ctfRes] = await Promise.all([
      supabase.from("lab_completions").select("user_id, score, lab_key").then(r => r.error ? { data: null as any } : r),
      supabase.from("ctf_submissions").select("user_id, challenge_id, is_correct").eq("is_correct", true).then(r => r.error ? { data: null as any } : r),
    ]);

    const profiles = profilesRes.data || [];
    const progress = progressRes.data || [];
    const quizzes = (quizRes.data || []) as unknown as Array<{ user_id: string; score: number; total: number }>;
    const labs = (labRes.data || []) as unknown as Array<{ user_id: string; score: number; lab_key: string }>;
    const ctfSolved = (ctfRes.data || []) as unknown as Array<{ user_id: string; challenge_id: string }>;

    // Get challenge points for CTF scoring (optional)
    const { data: challenges } = await supabase.from("ctf_challenges").select("id, points").then(r => r.error ? { data: null } : r);
    const challengePoints = new Map((challenges || []).map((c: any) => [c.id, c.points]));

    const ranked: RankedStudent[] = profiles.map(p => {
      const lessons = progress.filter(pr => pr.user_id === p.id).length;
      const userQuizzes = quizzes.filter(q => q.user_id === p.id);
      const totalScore = userQuizzes.reduce((a, q) => a + q.score, 0);
      const totalQuestions = userQuizzes.reduce((a, q) => a + q.total, 0);
      const quizAvg = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

      // Lab score: average of all lab completion scores
      const userLabs = labs.filter(l => l.user_id === p.id);
      const labScore = userLabs.length > 0 ? Math.round(userLabs.reduce((acc, l) => acc + l.score, 0) / userLabs.length) : 0;

      // CTF score: sum of points from solved challenges
      const userCtfSolved = ctfSolved.filter(c => c.user_id === p.id);
      const ctfScore = userCtfSolved.reduce((acc, c) => acc + (challengePoints.get(c.challenge_id) || 0), 0);

      // Global score: lessons (10pts each) + quiz accuracy * quiz count + lab avg + CTF points
      const score = lessons * 10 + quizAvg * userQuizzes.length + labScore + ctfScore;

      return { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, lessonsCompleted: lessons, quizAvg, labScore, ctfScore, score };
    });

    ranked.sort((a, b) => b.score - a.score);
    setStudents(ranked);
    setLoading(false);
  }

  const getSortedStudents = () => {
    switch (activeTab) {
      case "ctf":
        return [...students].sort((a, b) => b.ctfScore - a.ctfScore);
      case "labs":
        return [...students].sort((a, b) => b.labScore - a.labScore);
      default:
        return students;
    }
  };

  const getScoreLabel = (s: RankedStudent) => {
    switch (activeTab) {
      case "ctf": return s.ctfScore;
      case "labs": return s.labScore;
      default: return s.score;
    }
  };

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

  const sortedStudents = getSortedStudents();

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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-card rounded-xl mb-6">
          {[
            { key: "global" as const, label: "Global", icon: <Trophy className="w-3.5 h-3.5" /> },
            { key: "ctf" as const, label: "CTF", icon: <Flag className="w-3.5 h-3.5" /> },
            { key: "labs" as const, label: "Labs", icon: <FlaskConical className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        {sortedStudents.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-10 animate-fade-in-up">
            {[1, 0, 2].map(pos => {
              const s = sortedStudents[pos];
              const heights = ["h-28", "h-36", "h-24"];
              const order = [1, 0, 2];
              return (
                <div key={s.id} className="flex flex-col items-center gap-2" style={{ order: order[pos] }}>
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-full bg-secondary overflow-hidden ring-2 ${pos === 0 ? 'ring-yellow-400' : pos === 1 ? 'ring-gray-300' : 'ring-amber-600'}`}>
                      {s.avatar_url ? (
                        <img src={s.avatar_url} className="w-full h-full object-cover" alt={s.full_name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pos === 0 ? 'bg-yellow-400 text-black' : pos === 1 ? 'bg-gray-300 text-black' : 'bg-amber-600 text-white'}`}>
                      {pos + 1}
                    </div>
                  </div>
                  <span className="text-xs text-foreground font-medium truncate max-w-[80px] text-center">{s.full_name || "Anónimo"}</span>
                  <span className="font-mono-cyber text-xs text-primary tabular-nums">{getScoreLabel(s)} pts</span>
                  <div className={`${heights[pos]} w-20 rounded-t-lg ${pos === 0 ? 'bg-yellow-400/20' : pos === 1 ? 'bg-gray-300/20' : 'bg-amber-600/20'}`} />
                </div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        <div className="space-y-2">
          {sortedStudents.map((s, i) => (
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
                  <img src={s.avatar_url} className="w-full h-full object-cover" alt={s.full_name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.full_name || "Anónimo"}</p>
                <p className="text-[10px] text-muted-foreground font-mono-cyber">
                  {s.lessonsCompleted} lecciones · {s.quizAvg}% quiz
                  {s.labScore > 0 && ` · ${s.labScore}% labs`}
                  {s.ctfScore > 0 && ` · ${s.ctfScore} CTF`}
                </p>
              </div>

              <span className="font-mono-cyber text-sm text-primary font-semibold tabular-nums">{getScoreLabel(s)}</span>
            </div>
          ))}

          {sortedStudents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No hay alumnos registrados aún
            </div>
          )}
        </div>
      </main>
    </div>
  );
}