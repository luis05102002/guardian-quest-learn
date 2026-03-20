import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { curriculum, getTotalLessons } from "@/data/curriculum";
import { ArrowLeft, Award, Download, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QuizResult {
  module_id: number;
  score: number;
  total: number;
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const { getModuleProgress } = useProgress();
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("quiz_results").select("module_id, score, total").eq("user_id", user.id).then(({ data }) => {
      setQuizResults(data || []);
      setLoading(false);
    });
  }, [user]);

  const getModuleStatus = (mod: typeof curriculum[0]) => {
    const total = getTotalLessons(mod);
    const progress = getModuleProgress(mod.id, total);
    const quiz = quizResults.find(q => q.module_id === mod.id);
    const quizPercent = quiz ? Math.round((quiz.score / quiz.total) * 100) : 0;
    const isEligible = progress.percent >= 80 && quizPercent >= 70;
    return { progress, quiz, quizPercent, isEligible };
  };

  const generateCertificate = async (mod: typeof curriculum[0]) => {
    setGenerating(mod.id);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 850;

    // Background
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, 1200, 850);

    // Border
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 1140, 790);

    // Inner border
    ctx.strokeStyle = "#10b98140";
    ctx.lineWidth = 1;
    ctx.strokeRect(45, 45, 1110, 760);

    // Corner decorations
    const drawCorner = (x: number, y: number, dx: number, dy: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y + dy * 30);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * 30, y);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    drawCorner(55, 55, 1, 1);
    drawCorner(1145, 55, -1, 1);
    drawCorner(55, 795, 1, -1);
    drawCorner(1145, 795, -1, -1);

    // Title
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("CYBERACADEMY", 600, 110);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 42px 'Inter', sans-serif";
    ctx.fillText("CERTIFICADO DE FINALIZACIÓN", 600, 180);

    // Divider
    ctx.beginPath();
    ctx.moveTo(350, 210);
    ctx.lineTo(850, 210);
    ctx.strokeStyle = "#10b98140";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Body
    ctx.fillStyle = "#9ca3af";
    ctx.font = "16px 'Inter', sans-serif";
    ctx.fillText("Se certifica que", 600, 270);

    // Student name
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();
    const studentName = profile?.full_name || user?.email || "Estudiante";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px 'Inter', sans-serif";
    ctx.fillText(studentName, 600, 330);

    // Module info
    ctx.fillStyle = "#9ca3af";
    ctx.font = "16px 'Inter', sans-serif";
    ctx.fillText("ha completado satisfactoriamente el módulo", 600, 390);

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 28px 'Inter', sans-serif";

    // Wrap module title if too long
    const title = `Módulo ${mod.id}: ${mod.title}`;
    if (title.length > 50) {
      const mid = Math.floor(title.length / 2);
      const breakPoint = title.lastIndexOf(" ", mid);
      ctx.fillText(title.slice(0, breakPoint), 600, 440);
      ctx.fillText(title.slice(breakPoint + 1), 600, 478);
    } else {
      ctx.fillText(title, 600, 450);
    }

    // Quiz info
    const status = getModuleStatus(mod);
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px 'Inter', sans-serif";
    ctx.fillText(`Progreso: ${status.progress.percent}% · Evaluación: ${status.quizPercent}%`, 600, 530);

    // Date
    ctx.fillStyle = "#9ca3af";
    ctx.font = "14px 'Inter', sans-serif";
    const date = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
    ctx.fillText(`Expedido el ${date}`, 600, 580);

    // ID
    ctx.fillStyle = "#374151";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(`ID: CYBER-${mod.id}-${user!.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`, 600, 750);

    // Download
    const link = document.createElement("a");
    link.download = `certificado-modulo-${mod.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    toast.success("Certificado descargado");
    setGenerating(null);
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
      <canvas ref={canvasRef} className="hidden" />

      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-foreground">Certificados</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <div className="text-center mb-8 animate-fade-in-up">
          <Award className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground" style={{ lineHeight: '1.15' }}>Tus Certificados</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Completa al menos el 80% de las lecciones y obtén un 70% o más en el quiz para desbloquear cada certificado.
          </p>
        </div>

        {curriculum.map((mod, i) => {
          const { progress, quizPercent, isEligible, quiz } = getModuleStatus(mod);

          return (
            <div
              key={mod.id}
              className={`bg-card rounded-xl card-glow p-4 flex items-center gap-4 animate-fade-in-up ${isEligible ? '' : 'opacity-60'}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isEligible ? 'bg-primary/15' : 'bg-secondary'}`}>
                {isEligible ? <Award className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Módulo {mod.id}: {mod.shortTitle}</p>
                <p className="text-[10px] text-muted-foreground font-mono-cyber">
                  Progreso: {progress.percent}% · Quiz: {quiz ? `${quizPercent}%` : "Pendiente"}
                </p>
              </div>

              {isEligible ? (
                <button
                  onClick={() => generateCertificate(mod)}
                  disabled={generating === mod.id}
                  className="flex items-center gap-1.5 text-xs bg-primary/15 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/25 transition-colors active:scale-95 disabled:opacity-50"
                >
                  {generating === mod.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Descargar
                </button>
              ) : (
                <span className="text-[10px] text-muted-foreground">Bloqueado</span>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
