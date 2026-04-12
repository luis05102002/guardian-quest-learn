import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Flag, Trophy, Lock, CheckCircle2, XCircle, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  hint: string;
  module_id: number | null;
};

type SolvedChallenge = {
  challenge_id: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  osint: "🔍 OSINT",
  crypto: "🔐 Criptografía",
  web: "🌐 Web",
  forensics: "🔎 Forense",
  network: "📡 Redes",
  misc: "🎲 Misc",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function CTFPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [flagInput, setFlagInput] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { correct: boolean; message: string }>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    const [chRes, subRes] = await Promise.all([
      supabase.from("ctf_challenges").select("*").eq("is_active", true).order("points", { ascending: true }).then(r => r.error ? { data: null as any } : r),
      supabase.from("ctf_submissions").select("challenge_id").eq("user_id", user?.id || "").eq("is_correct", true).then(r => r.error ? { data: null as any } : r),
    ]);
    setChallenges((chRes.data as Challenge[]) || []);
    setSolved(new Set((subRes.data as SolvedChallenge[])?.map(s => s.challenge_id) || []));
    setLoading(false);
  }

  async function submitFlag(challengeId: string) {
    const flag = flagInput[challengeId]?.trim();
    if (!flag) return;

    // Check locally first
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const isCorrect = flag === challenge.flag;

    // Save to DB
    await supabase.from("ctf_submissions").insert({
      user_id: user!.id,
      challenge_id: challengeId,
      submitted_flag: flag,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      setSolved(prev => new Set([...prev, challengeId]));
      setFeedback(prev => ({ ...prev, [challengeId]: { correct: true, message: `¡Correcto! +${challenge.points} pts` } }));
      // Unlock achievement
      await supabase.from("achievements").insert({
        user_id: user!.id,
        achievement_key: `ctf_${challenge.id.slice(0, 8)}`,
      }).select().single().catch(() => {}); // Ignore if duplicate
    } else {
      setFeedback(prev => ({ ...prev, [challengeId]: { correct: false, message: "Flag incorrecto. ¡Sigue intentando!" } }));
    }
    setFlagInput(prev => ({ ...prev, [challengeId]: "" }));
  }

  const totalPoints = solved.size > 0
    ? challenges.filter(c => solved.has(c.id)).reduce((a, c) => a + c.points, 0)
    : 0;

  const filteredChallenges = challenges.filter(c =>
    (filterCategory === "all" || c.category === filterCategory) &&
    (filterDifficulty === "all" || c.difficulty === filterDifficulty)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-foreground">🏴 CTF — Capture The Flag</span>
          </div>
          <div className="flex items-center gap-2 font-mono-cyber text-xs text-primary tabular-nums">
            <Trophy className="w-4 h-4" />
            {totalPoints} pts
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Score card */}
        <div className="bg-card rounded-xl p-6 card-glow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Tu puntuación</h2>
              <p className="text-sm text-muted-foreground">
                {solved.size} de {challenges.length} retos resueltos
              </p>
            </div>
            <div className="text-3xl font-bold text-primary font-mono-cyber tabular-nums">{totalPoints}</div>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${challenges.length > 0 ? (solved.size / challenges.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-card border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground font-mono-cyber"
          >
            <option value="all">Todas las categorías</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value)}
            className="bg-card border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground font-mono-cyber"
          >
            <option value="all">Todas las dificultades</option>
            <option value="easy">🟢 Fácil</option>
            <option value="medium">🟡 Medio</option>
            <option value="hard">🔴 Difícil</option>
          </select>
        </div>

        {/* Challenges */}
        <div className="space-y-4">
          {filteredChallenges.map(ch => {
            const isSolved = solved.has(ch.id);
            const fb = feedback[ch.id];
            return (
              <div key={ch.id} className={`bg-card rounded-xl p-5 card-glow border ${isSolved ? 'border-green-500/30' : 'border-border/50'} transition-all`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-mono-cyber px-2 py-0.5 rounded border ${DIFFICULTY_COLORS[ch.difficulty] || ''}`}>
                        {ch.difficulty === 'easy' ? '🟢 Fácil' : ch.difficulty === 'medium' ? '🟡 Medio' : '🔴 Difícil'}
                      </span>
                      <span className="text-xs font-mono-cyber text-muted-foreground">{CATEGORY_LABELS[ch.category] || ch.category}</span>
                      <span className="text-xs font-mono-cyber text-primary">{ch.points} pts</span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      {isSolved ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Flag className="w-4 h-4 text-primary" />}
                      {ch.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{ch.description}</p>
                  </div>
                </div>

                {/* Input */}
                {!isSolved ? (
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={flagInput[ch.id] || ""}
                      onChange={e => setFlagInput(prev => ({ ...prev, [ch.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && submitFlag(ch.id)}
                      placeholder="flag{...}"
                      className="flex-1 bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm font-mono-cyber text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => submitFlag(ch.id)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors active:scale-95"
                    >
                      Enviar
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 text-green-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Reto completado — {ch.points} pts
                  </div>
                )}

                {/* Feedback */}
                {fb && !fb.correct && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                    <XCircle className="w-4 h-4" />
                    {fb.message}
                  </div>
                )}

                {/* Hint toggle */}
                {ch.hint && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowHint(prev => ({ ...prev, [ch.id]: !prev[ch.id] }))}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Lightbulb className="w-3 h-3" />
                      Pista
                      {showHint[ch.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {showHint[ch.id] && (
                      <p className="mt-1 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2">{ch.hint}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {challenges.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Lock className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
              Aún no hay retos CTF disponibles. ¡Pronto se añadirán!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}