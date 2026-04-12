import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { curriculum, getAllLessonsCount, getTotalLessons } from "@/data/curriculum";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import ModuleCard from "@/components/ModuleCard";
import ProgressBar from "@/components/ProgressBar";
import NotificationBell from "@/components/NotificationBell";
import { Shield, ChevronRight, LogOut, User, Trophy, Award, Settings, Calendar, MessageSquare, Wrench, Star, Flag, Scale } from "lucide-react";

export default function Index() {
  const { getModuleProgress, totalCompleted } = useProgress();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const totalLessons = getAllLessonsCount();
  const overallPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">CyberAcademy</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono-cyber tabular-nums">
                {totalCompleted}/{totalLessons}
              </span>
              <div className="w-24">
                <ProgressBar percent={overallPercent} size="sm" />
              </div>
              <span className="font-mono-cyber text-xs text-primary tabular-nums">{overallPercent}%</span>
            </div>

            {user && (
              <div className="flex items-center gap-1">
                <NotificationBell />
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="p-2 rounded-lg hover:bg-secondary/50 text-[hsl(var(--cyber-amber))] hover:text-foreground transition-colors active:scale-95"
                    title="Admin"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                )}
                <Link
                  to="/tutorias"
                  className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                  title="Tutorías"
                >
                  <Calendar className="w-4 h-4" />
                </Link>
                <Link
                  to="/chat"
                  className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                  title="Mensajes"
                >
                  <MessageSquare className="w-4 h-4" />
                </Link>
                <Link
                  to="/herramientas"
                  className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                  title="Herramientas"
                >
                  <Wrench className="w-4 h-4" />
                </Link>
                <Link
                  to="/logros"
                  className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                  title="Logros"
                >
                  <Star className="w-4 h-4" />
                </Link>
                <Link
                  to="/ctf"
                  className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                  title="CTF"
                >
                  <Flag className="w-4 h-4" />
                </Link>
                <Link
                  to="/ranking"
                  className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                  title="Ranking"
                >
                  <Trophy className="w-4 h-4" />
                </Link>
                <Link
                  to="/certificados"
                  className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                  title="Certificados"
                >
                  <Award className="w-4 h-4" />
                </Link>
                <Link
                  to="/perfil"
                  className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                  title="Mi perfil"
                >
                  <User className="w-4 h-4" />
                </Link>
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={`py-16 sm:py-24 px-4 sm:px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-mono-cyber">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            13 módulos · {totalLessons} lecciones
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-tight tracking-tight" style={{ lineHeight: '1.1' }}>
            Domina la Ciberseguridad
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Desde conceptos fundamentales hasta respuesta ante incidentes. 
            Un recorrido completo para convertirte en profesional de ciberseguridad.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Módulos", value: "13" },
            { label: "Lecciones", value: String(totalLessons) },
            { label: "Demos prácticas", value: String(curriculum.flatMap(m => m.sections.flatMap(s => s.lessons.filter(l => l.type === 'demo'))).length) },
            { label: "Casos prácticos", value: String(curriculum.flatMap(m => m.sections.flatMap(s => s.lessons.filter(l => l.type === 'case'))).length) },
          ].map((stat, i) => (
            <div key={stat.label} className="bg-card rounded-xl p-4 card-glow animate-fade-in-up text-center" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="font-mono-cyber text-2xl font-bold text-primary tabular-nums">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Module Grid */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-primary" />
            Plan de estudios
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {curriculum.map((mod, i) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                progress={getModuleProgress(mod.id, getTotalLessons(mod))}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Legal footer */}
      <footer className="border-t border-border/50 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/legal/aviso-legal" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Scale className="w-3 h-3" /> Aviso Legal
          </Link>
          <Link to="/legal/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
          <Link to="/legal/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          <span>© {new Date().getFullYear()} CyberAcademy</span>
        </div>
      </footer>
    </div>
  );
}
