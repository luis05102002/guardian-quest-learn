import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { curriculum } from "@/data/curriculum";
import { ArrowLeft, Github, ExternalLink, Loader2, User, Filter } from "lucide-react";
import ProjectFeedback from "@/components/ProjectFeedback";

interface Submission {
  id: string;
  user_id: string;
  module_id: number;
  github_url: string;
  description: string | null;
  submitted_at: string;
  student_name?: string;
  student_avatar?: string | null;
}

export default function AdminProjectsPage() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("project_submissions")
        .select("id, user_id, module_id, github_url, description, submitted_at")
        .order("submitted_at", { ascending: false });

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        setSubmissions(data.map(s => ({
          ...s,
          student_name: profileMap.get(s.user_id)?.full_name || "Sin nombre",
          student_avatar: profileMap.get(s.user_id)?.avatar_url,
        })));
      }
      setLoading(false);
    };

    fetch();
  }, [isAdmin]);

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = filterModule ? submissions.filter(s => s.module_id === filterModule) : submissions;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/admin" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-foreground">Proyectos de Alumnos</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 animate-fade-in-up">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <button
            onClick={() => setFilterModule(null)}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors active:scale-95 ${
              !filterModule ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos ({submissions.length})
          </button>
          {curriculum.map(mod => {
            const count = submissions.filter(s => s.module_id === mod.id).length;
            if (count === 0) return null;
            return (
              <button
                key={mod.id}
                onClick={() => setFilterModule(mod.id)}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors active:scale-95 ${
                  filterModule === mod.id ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                M{mod.id} ({count})
              </button>
            );
          })}
        </div>

        {/* Submissions */}
        <div className="space-y-4">
          {filtered.map((sub, i) => {
            const mod = curriculum.find(m => m.id === sub.module_id);
            return (
              <div key={sub.id} className="bg-card rounded-xl card-glow p-5 space-y-3 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0">
                      {sub.student_avatar ? (
                        <img src={sub.student_avatar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{sub.student_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono-cyber">
                        Módulo {sub.module_id}: {mod?.shortTitle} · {new Date(sub.submitted_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <a
                    href={sub.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {sub.description && (
                  <p className="text-xs text-muted-foreground">{sub.description}</p>
                )}

                <ProjectFeedback submissionId={sub.id} isTeacher={true} />
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No hay proyectos enviados{filterModule ? ` para el módulo ${filterModule}` : ""}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
