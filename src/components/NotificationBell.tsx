import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, X, Check, MessageSquare, Calendar, Award, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchNotifications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications((data || []) as Notification[]);
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true } as any).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true } as any)
      .eq("user_id", user.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message": return <MessageSquare className="w-3.5 h-3.5 text-[hsl(var(--cyber-blue))]" />;
      case "booking": return <Calendar className="w-3.5 h-3.5 text-primary" />;
      case "feedback": return <Award className="w-3.5 h-3.5 text-[hsl(var(--cyber-amber))]" />;
      default: return <Info className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        title="Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <span className="text-sm font-semibold text-foreground">Notificaciones</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-primary hover:text-foreground transition-colors">
                  Marcar todo leído
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Sin notificaciones
                </div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-secondary/30 transition-colors flex items-start gap-3 ${
                      !n.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {n.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{n.message}</p>
                      <p className="text-[9px] text-muted-foreground/70 font-mono-cyber mt-0.5">
                        {format(new Date(n.created_at), "d MMM HH:mm", { locale: es })}
                      </p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
