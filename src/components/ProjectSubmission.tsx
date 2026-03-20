import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Github, Loader2, CheckCircle2, ExternalLink, Edit3 } from "lucide-react";
import ProjectFeedback from "./ProjectFeedback";

interface ProjectSubmissionProps {
  moduleId: number;
  moduleTitle: string;
}

export default function ProjectSubmission({ moduleId, moduleTitle }: ProjectSubmissionProps) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const isTeacher = isAdmin; // admins act as teachers
  const [githubUrl, setGithubUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<{ github_url: string; description: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("project_submissions")
      .select("github_url, description")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExisting(data);
          setGithubUrl(data.github_url);
          setDescription(data.description || "");
        }
      });
  }, [user, moduleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!githubUrl.match(/^https:\/\/github\.com\/.+\/.+/)) {
      setError("Introduce una URL de repositorio de GitHub válida (https://github.com/usuario/repo)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (existing) {
        const { error } = await supabase
          .from("project_submissions")
          .update({ github_url: githubUrl, description, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("module_id", moduleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("project_submissions")
          .insert({ user_id: user.id, module_id: moduleId, github_url: githubUrl, description });
        if (error) throw error;
      }

      setExisting({ github_url: githubUrl, description });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Show saved state
  if (existing && !editing) {
    return (
      <div className="bg-card rounded-xl card-glow p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Proyecto del módulo</h3>
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors active:scale-95">
            <Edit3 className="w-3 h-3" /> Editar
          </button>
        </div>
        <a
          href={existing.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {existing.github_url.replace("https://github.com/", "")}
        </a>
        {existing.description && (
          <p className="text-xs text-muted-foreground">{existing.description}</p>
        )}
        {saved && (
          <p className="text-xs text-primary flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Guardado
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl card-glow p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Github className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Proyecto del módulo</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Sube tu repositorio de GitHub con el proyecto práctico de este módulo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="url"
          placeholder="https://github.com/tu-usuario/tu-proyecto"
          value={githubUrl}
          onChange={e => setGithubUrl(e.target.value)}
          required
          className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <textarea
          placeholder="Descripción breve del proyecto (opcional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}
            {existing ? "Actualizar" : "Enviar proyecto"}
          </button>
          {editing && (
            <button type="button" onClick={() => setEditing(false)}
              className="px-4 py-2.5 rounded-lg bg-secondary text-muted-foreground text-xs hover:bg-secondary/80 transition-colors active:scale-95">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
