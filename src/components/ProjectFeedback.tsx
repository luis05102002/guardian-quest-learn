import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Star, Send, Loader2, Trash2, User } from "lucide-react";
import { toast } from "sonner";

interface Feedback {
  id: string;
  teacher_id: string;
  comment: string;
  rating: number | null;
  created_at: string;
  teacher_name?: string;
  teacher_avatar?: string | null;
}

interface ProjectFeedbackProps {
  submissionId: string;
  isTeacher: boolean;
}

export default function ProjectFeedback({ submissionId, isTeacher }: ProjectFeedbackProps) {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from("project_feedback")
      .select("id, teacher_id, comment, rating, created_at")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      // Fetch teacher profiles
      const teacherIds = [...new Set(data.map(f => f.teacher_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", teacherIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      setFeedbacks(data.map(f => ({
        ...f,
        teacher_name: profileMap.get(f.teacher_id)?.full_name || "Profesor",
        teacher_avatar: profileMap.get(f.teacher_id)?.avatar_url,
      })));
    } else {
      setFeedbacks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedback();
  }, [submissionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("project_feedback").insert({
      submission_id: submissionId,
      teacher_id: user.id,
      comment: comment.trim(),
      rating: rating > 0 ? rating : null,
    });

    if (error) {
      toast.error("Error al enviar feedback");
    } else {
      toast.success("Feedback enviado");
      setComment("");
      setRating(0);
      await fetchFeedback();
    }
    setSubmitting(false);
  };

  const handleDelete = async (feedbackId: string) => {
    const { error } = await supabase.from("project_feedback").delete().eq("id", feedbackId);
    if (error) toast.error("Error al eliminar");
    else {
      toast.success("Comentario eliminado");
      setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
    }
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Feedback ({feedbacks.length})
        </span>
      </div>

      {/* Existing feedback */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Loader2 className="w-3 h-3 animate-spin" /> Cargando...
        </div>
      ) : (
        <div className="space-y-2">
          {feedbacks.map(f => (
            <div key={f.id} className="bg-secondary/30 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden">
                    {f.teacher_avatar ? (
                      <img src={f.teacher_avatar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><User className="w-3 h-3 text-muted-foreground" /></div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground">{f.teacher_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(f.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {f.rating && (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= f.rating! ? 'text-[hsl(var(--cyber-amber))] fill-[hsl(var(--cyber-amber))]' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  )}
                  {user?.id === f.teacher_id && (
                    <button onClick={() => handleDelete(f.id)} className="text-muted-foreground hover:text-destructive transition-colors active:scale-95">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{f.comment}</p>
            </div>
          ))}

          {feedbacks.length === 0 && !isTeacher && (
            <p className="text-xs text-muted-foreground">Sin feedback todavía</p>
          )}
        </div>
      )}

      {/* Teacher form */}
      {isTeacher && (
        <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground mr-1">Nota:</span>
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s === rating ? 0 : s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                className="active:scale-90 transition-transform"
              >
                <Star className={`w-4 h-4 transition-colors ${
                  s <= (hoverRating || rating)
                    ? 'text-[hsl(var(--cyber-amber))] fill-[hsl(var(--cyber-amber))]'
                    : 'text-muted-foreground/30'
                }`} />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Escribe tu feedback..."
              required
              className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
