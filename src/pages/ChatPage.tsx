import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ArrowLeft, Send, Loader2, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface Contact {
  id: string;
  full_name: string;
  avatar_url: string | null;
  unread: number;
  lastMessage?: string;
  lastTime?: string;
  isTeacher?: boolean;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchContacts();
  }, [user, isAdmin]);

  useEffect(() => {
    if (!selectedContact || !user) return;
    fetchMessages(selectedContact);

    // Mark as read
    supabase.from("chat_messages").update({ read: true } as any)
      .eq("sender_id", selectedContact)
      .eq("receiver_id", user.id)
      .eq("read", false)
      .then(() => fetchContacts());

    // Realtime
    const channel = supabase
      .channel(`chat-${selectedContact}-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
      }, (payload) => {
        const msg = payload.new as ChatMessage;
        if (
          (msg.sender_id === user.id && msg.receiver_id === selectedContact) ||
          (msg.sender_id === selectedContact && msg.receiver_id === user.id)
        ) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_id === selectedContact) {
            supabase.from("chat_messages").update({ read: true } as any).eq("id", msg.id);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedContact, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchContacts = async () => {
    if (!user) return;

    // Fetch profiles, roles, and messages in parallel
    const [profilesRes, rolesRes, msgsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("chat_messages").select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false }),
    ]);

    const allProfiles = profilesRes.data || [];
    const allRoles = rolesRes.data || [];
    const allMsgs = (msgsRes.data || []) as ChatMessage[];

    // Build a set of teacher/admin IDs
    const teacherIds = new Set(
      allRoles
        .filter(r => r.role === "admin" || r.role === "teacher")
        .map(r => r.user_id)
    );

    // Contact IDs: from existing conversations + relevant users
    const contactIds = new Set<string>();
    allMsgs.forEach(m => {
      if (m.sender_id !== user.id) contactIds.add(m.sender_id);
      if (m.receiver_id !== user.id) contactIds.add(m.receiver_id);
    });

    if (isAdmin) {
      // Admin/teacher sees all users
      allProfiles.forEach(p => { if (p.id !== user.id) contactIds.add(p.id); });
    } else {
      // Students always see all teachers/admins
      teacherIds.forEach(tId => { if (tId !== user.id) contactIds.add(tId); });
    }

    const contactList: Contact[] = Array.from(contactIds).map(cId => {
      const profile = allProfiles.find(p => p.id === cId);
      const contactMsgs = allMsgs.filter(m =>
        (m.sender_id === cId && m.receiver_id === user.id) ||
        (m.sender_id === user.id && m.receiver_id === cId)
      );
      const unread = contactMsgs.filter(m => m.sender_id === cId && !m.read).length;
      const last = contactMsgs[0];

      return {
        id: cId,
        full_name: profile?.full_name || "Usuario",
        avatar_url: profile?.avatar_url || null,
        unread,
        lastMessage: last?.message?.slice(0, 50),
        lastTime: last?.created_at,
        isTeacher: teacherIds.has(cId),
      };
    }).sort((a, b) => {
      // Teachers first, then by unread, then by last message
      if (a.isTeacher !== b.isTeacher) return a.isTeacher ? -1 : 1;
      if (a.unread !== b.unread) return b.unread - a.unread;
      if (!a.lastTime) return 1;
      if (!b.lastTime) return -1;
      return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime();
    });

    setContacts(contactList);
    setLoading(false);
  };

  const fetchMessages = async (contactId: string) => {
    if (!user) return;
    const { data } = await supabase.from("chat_messages").select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setMessages((data || []) as ChatMessage[]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !user) return;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: selectedContact,
      message: msgText,
    } as any);

    if (!error) {
      await supabase.from("notifications").insert({
        user_id: selectedContact,
        type: "message",
        title: "Nuevo mensaje",
        message: msgText.slice(0, 80),
        link: "/chat",
      } as any);
      fetchContacts();
    } else {
      setNewMessage(msgText);
    }
    setSending(false);
  };

  const selectedContactInfo = contacts.find(c => c.id === selectedContact);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-foreground">Mensajes</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <div className="flex-1 flex max-w-5xl mx-auto w-full min-h-0">
        {/* Contacts sidebar */}
        <div className={`${selectedContact ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-72 border-r border-border/50 overflow-y-auto`}>
          <div className="p-3 border-b border-border/50">
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Todos los usuarios" : "Contactos"}
            </p>
          </div>
          {contacts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No hay contactos disponibles</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {contacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left ${
                    selectedContact === c.id ? 'bg-secondary/50' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden shrink-0">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {c.unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{c.full_name || "Sin nombre"}</p>
                      {c.isTeacher && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                          Profesor
                        </span>
                      )}
                    </div>
                    {c.lastMessage ? (
                      <p className="text-[10px] text-muted-foreground truncate">{c.lastMessage}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/50 italic">Sin mensajes</p>
                    )}
                  </div>
                  {c.lastTime && (
                    <span className="text-[9px] text-muted-foreground font-mono-cyber shrink-0">
                      {format(new Date(c.lastTime), "HH:mm")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className={`${!selectedContact ? 'hidden sm:flex' : 'flex'} flex-1 flex-col min-h-0`}>
          {selectedContact ? (
            <>
              <div className="border-b border-border/50 px-4 py-3 flex items-center gap-3 shrink-0">
                <button onClick={() => setSelectedContact(null)} className="sm:hidden text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                  {selectedContactInfo?.avatar_url ? (
                    <img src={selectedContactInfo.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {selectedContactInfo?.full_name || "Usuario"}
                  </span>
                  {selectedContactInfo?.isTeacher && (
                    <span className="text-[9px] ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      Profesor
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Envía el primer mensaje</p>
                  </div>
                )}
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                      m.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary text-foreground rounded-bl-md'
                    }`}>
                      <p className="break-words whitespace-pre-wrap">{m.message}</p>
                      <p className={`text-[9px] mt-1 ${m.sender_id === user?.id ? 'text-primary-foreground/60' : 'text-muted-foreground'} font-mono-cyber`}>
                        {format(new Date(m.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-border/50 px-4 py-3 shrink-0">
                <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    maxLength={1000}
                    className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95 disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">Selecciona un contacto para empezar</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Los profesores aparecen marcados con etiqueta</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
