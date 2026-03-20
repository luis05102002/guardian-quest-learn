import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Camera, Save, Loader2, User, Mail, Calendar, Award } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  full_name: string;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({ full_name: "", avatar_url: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quizStats, setQuizStats] = useState({ total: 0, avgScore: 0 });
  const [progressCount, setProgressCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      const [profileRes, quizRes, progressRes] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
        supabase.from("quiz_results").select("score, total").eq("user_id", user.id),
        supabase.from("user_progress").select("id").eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        setProfile({ full_name: profileRes.data.full_name, avatar_url: profileRes.data.avatar_url });
      }

      if (quizRes.data && quizRes.data.length > 0) {
        const totalScore = quizRes.data.reduce((a, q) => a + q.score, 0);
        const totalQuestions = quizRes.data.reduce((a, q) => a + q.total, 0);
        setQuizStats({ total: quizRes.data.length, avgScore: totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0 });
      }

      if (progressRes.data) setProgressCount(progressRes.data.length);
      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) toast.error("Error al guardar");
    else toast.success("Perfil actualizado");
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Error al subir imagen"); setUploading(false); return; }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = data.publicUrl + "?t=" + Date.now();

    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    setProfile(p => ({ ...p, avatar_url: avatarUrl }));
    toast.success("Avatar actualizado");
    setUploading(false);
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
            <span className="text-sm font-semibold text-foreground">Mi Perfil</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-2 ring-border">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-card rounded-xl card-glow p-6 space-y-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre completo</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Correo electrónico</label>
            <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-4 py-2.5">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Miembro desde</label>
            <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-4 py-2.5">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : "—"}
              </span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {[
            { icon: Award, label: "Lecciones completadas", value: progressCount },
            { icon: Award, label: "Quizzes realizados", value: quizStats.total },
            { icon: Award, label: "Nota media", value: `${quizStats.avgScore}%` },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-xl card-glow p-4 text-center">
              <div className="font-mono-cyber text-xl font-bold text-primary tabular-nums">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
