import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, Bot, User, Loader2, Calendar, MessageSquare, Wrench, Award, BarChart3, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cyber-chat`;

export default function CyberChatbot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { totalCompleted } = useProgress();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "¡Hola! 👋 Soy **CyberMentor**, tu asistente de ciberseguridad y secretario académico. Puedo:\n\n🔒 Resolver dudas técnicas\n📅 Ayudarte a agendar tutorías\n📊 Mostrarte tu progreso\n💬 Conectarte con tu profesor\n🛠️ Acceder a herramientas\n\n¿En qué te puedo ayudar?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [studentName, setStudentName] = useState("");
  const [quizAvg, setQuizAvg] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);

  // Fetch student context
  useEffect(() => {
    if (!user) return;
    const fetchContext = async () => {
      const [profileRes, quizRes, lessonsRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase.from("quiz_results").select("score, total").eq("user_id", user.id),
        supabase.from("user_progress").select("id"),
      ]);
      if (profileRes.data) setStudentName(profileRes.data.full_name || "");
      if (quizRes.data && quizRes.data.length > 0) {
        const ts = quizRes.data.reduce((a, q) => a + q.score, 0);
        const tq = quizRes.data.reduce((a, q) => a + q.total, 0);
        setQuizAvg(tq > 0 ? Math.round((ts / tq) * 100) : 0);
      }
      setTotalLessons(lessonsRes.data?.length || 0);
    };
    fetchContext();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // Save doubt to DB for pattern tracking
  const saveDoubt = useCallback(async (question: string) => {
    if (!user) return;
    try {
      await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "save_doubt",
          userId: user.id,
          messages: [{ role: "user", content: question }],
          studentContext: { currentModule: window.location.pathname },
        }),
      });
    } catch { /* silent */ }
  }, [user]);

  // Process action tags from AI response
  const processActions = useCallback((content: string) => {
    if (content.includes("[ACTION:TUTORING]")) {
      return content.replace(/\[ACTION:TUTORING\]/g, "");
    }
    if (content.includes("[ACTION:PROGRESS]")) {
      return content.replace(/\[ACTION:PROGRESS\]/g, "");
    }
    if (content.includes("[ACTION:CHAT]")) {
      return content.replace(/\[ACTION:CHAT\]/g, "");
    }
    if (content.includes("[ACTION:TOOLS]")) {
      return content.replace(/\[ACTION:TOOLS\]/g, "");
    }
    if (content.includes("[ACTION:CERTIFICATES]")) {
      return content.replace(/\[ACTION:CERTIFICATES\]/g, "");
    }
    return content;
  }, []);

  const getActionButtons = useCallback((content: string) => {
    const buttons: { label: string; icon: any; path: string }[] = [];
    if (content.includes("[ACTION:TUTORING]")) buttons.push({ label: "Ir a Tutorías", icon: Calendar, path: "/tutorias" });
    if (content.includes("[ACTION:PROGRESS]")) buttons.push({ label: "Ver Progreso", icon: BarChart3, path: "/perfil" });
    if (content.includes("[ACTION:CHAT]")) buttons.push({ label: "Chat con Profesor", icon: MessageSquare, path: "/chat" });
    if (content.includes("[ACTION:TOOLS]")) buttons.push({ label: "Herramientas", icon: Wrench, path: "/herramientas" });
    if (content.includes("[ACTION:CERTIFICATES]")) buttons.push({ label: "Certificados", icon: Award, path: "/certificados" });
    return buttons;
  }, []);

  const send = useCallback(async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading) return;

    const userMsg: Msg = { role: "user", content: msgText };
    if (!text) setInput("");
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setShowQuickActions(false);

    // Save doubt in background
    saveDoubt(msgText);

    let assistantSoFar = "";
    const allMessages = [...messages.filter((_, i) => i > 0), userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          studentContext: {
            name: studentName,
            currentModule: window.location.pathname,
            completedLessons: totalCompleted,
            totalLessons,
            quizAvg,
          },
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: "Error de conexión" }));
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${errData.error || "Error al conectar."}` }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const updateAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > 1) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ No se pudo conectar. Inténtalo de nuevo." }]);
    }

    setIsLoading(false);
  }, [input, isLoading, messages, saveDoubt, studentName, totalCompleted, totalLessons, quizAvg]);

  const quickActions = [
    { icon: Calendar, label: "Agendar tutoría", msg: "Quiero agendar una tutoría con el profesor" },
    { icon: BarChart3, label: "Mi progreso", msg: "¿Cómo va mi progreso en el curso?" },
    { icon: MessageSquare, label: "Hablar con profesor", msg: "Necesito hablar con el profesor" },
    { icon: Wrench, label: "Herramientas", msg: "¿Qué herramientas de ciberseguridad tengo disponibles?" },
    { icon: Award, label: "Certificados", msg: "¿Cómo puedo obtener mi certificado?" },
    { icon: Sparkles, label: "Recomiéndame", msg: "¿Qué debería estudiar a continuación según mi progreso?" },
  ];

  const suggestions = [
    "¿Qué es el phishing?",
    "Explícame MITRE ATT&CK",
    "¿Cómo funciona un SIEM?",
    "¿Qué es Zero Trust?",
    "Quiero agendar tutoría",
    "¿Cómo voy en el curso?",
  ];

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 active:scale-95"
        aria-label="Abrir chat"
      >
        {open ? <X className="w-5 h-5 text-primary-foreground" /> : <MessageCircle className="w-5 h-5 text-primary-foreground" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[min(75vh,620px)] bg-card rounded-2xl card-glow flex flex-col overflow-hidden animate-fade-in border border-border">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-secondary/30 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">CyberMentor</p>
              <p className="text-[10px] text-primary font-mono-cyber">Asistente & Secretario Académico</p>
            </div>
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
              title="Acciones rápidas"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>

          {/* Quick actions panel */}
          {showQuickActions && (
            <div className="border-b border-border/50 bg-secondary/20 px-3 py-2 grid grid-cols-3 gap-1.5 shrink-0 animate-fade-in">
              {quickActions.map(qa => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.label}
                    onClick={() => send(qa.msg)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-secondary/50 transition-colors active:scale-95 group"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[9px] text-muted-foreground group-hover:text-foreground text-center leading-tight">{qa.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((msg, i) => {
              const actionButtons = msg.role === "assistant" ? getActionButtons(msg.content) : [];
              const cleanContent = msg.role === "assistant" ? processActions(msg.content) : msg.content;

              return (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === "user" ? "bg-primary/10" : "bg-secondary"
                  }`}>
                    {msg.role === "user" ? <User className="w-3 h-3 text-primary" /> : <Bot className="w-3 h-3 text-primary" />}
                  </div>
                  <div className="max-w-[80%] space-y-2">
                    <div className={`rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_code]:bg-background/50 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-background/50 [&_pre]:rounded-lg [&_pre]:p-2 [&_strong]:text-foreground [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_a]:text-primary">
                          <ReactMarkdown>{cleanContent}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                    {/* Action buttons rendered below the message */}
                    {actionButtons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {actionButtons.map(btn => {
                          const Icon = btn.icon;
                          return (
                            <button
                              key={btn.path}
                              onClick={() => { navigate(btn.path); setOpen(false); }}
                              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-95 font-medium"
                            >
                              <Icon className="w-3 h-3" />
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-secondary/50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                    <span className="text-[10px] text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border/50 shrink-0">
            <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pregunta o pide una acción..."
                className="flex-1 bg-secondary/50 text-foreground text-sm rounded-lg px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors active:scale-95"
              >
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
