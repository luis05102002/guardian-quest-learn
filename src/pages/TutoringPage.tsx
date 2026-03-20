import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Calendar, Clock, Plus, Trash2, Loader2, CheckCircle2, XCircle, Phone, Save } from "lucide-react";
import { toast } from "sonner";

interface Slot {
  id: string;
  teacher_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Booking {
  id: string;
  slot_id: string;
  student_id: string;
  status: string;
  notes: string;
  whatsapp_phone: string;
  created_at: string;
  cancelled_at: string | null;
}

const TEACHER_WHATSAPP_KEY = "cyberacademy_teacher_whatsapp";

export default function TutoringPage() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newSlotStart, setNewSlotStart] = useState("10:00");
  const [newSlotEnd, setNewSlotEnd] = useState("11:00");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [whatsappTeacher, setWhatsappTeacher] = useState(() => localStorage.getItem(TEACHER_WHATSAPP_KEY) || "");
  const [editingWhatsapp, setEditingWhatsapp] = useState(false);
  const [tempWhatsapp, setTempWhatsapp] = useState("");

  useEffect(() => { fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [slotsRes, bookingsRes, profilesRes] = await Promise.all([
      supabase.from("tutoring_slots").select("*").order("slot_date").order("start_time"),
      supabase.from("tutoring_bookings").select("*"),
      supabase.from("profiles").select("id, full_name"),
    ]);
    setSlots((slotsRes.data || []) as Slot[]);
    setBookings((bookingsRes.data || []) as Booking[]);
    const pMap: Record<string, string> = {};
    (profilesRes.data || []).forEach(p => { pMap[p.id] = p.full_name || "Sin nombre"; });
    setProfiles(pMap);
    setLoading(false);
  };

  const addSlot = async () => {
    if (!user) return;
    const { error } = await supabase.from("tutoring_slots").insert({
      teacher_id: user.id,
      slot_date: newSlotDate,
      start_time: newSlotStart,
      end_time: newSlotEnd,
    } as any);
    if (error) { toast.error("Error al crear horario"); return; }
    toast.success("Horario añadido");
    setShowAddSlot(false);
    fetchData();
  };

  const deleteSlot = async (slotId: string) => {
    await supabase.from("tutoring_slots").delete().eq("id", slotId);
    toast.success("Horario eliminado");
    fetchData();
  };

  const bookSlot = async (slotId: string) => {
    if (!user) return;
    const { error } = await supabase.from("tutoring_bookings").insert({
      slot_id: slotId,
      student_id: user.id,
      notes: bookingNotes,
      whatsapp_phone: bookingPhone,
    } as any);
    if (error) { toast.error("Error al reservar"); return; }
    await supabase.from("tutoring_slots").update({ is_available: false } as any).eq("id", slotId);
    const slot = slots.find(s => s.id === slotId);
    if (slot) {
      await supabase.from("notifications").insert({
        user_id: slot.teacher_id,
        type: "booking",
        title: "Nueva tutoría reservada",
        message: `${profiles[user.id] || "Un alumno"} ha reservado una tutoría para el ${slot.slot_date} a las ${slot.start_time}`,
        link: "/tutorias",
      } as any);
    }
    toast.success("Tutoría reservada");
    setBookingNotes("");
    setBookingPhone("");
    fetchData();
  };

  const cancelBooking = async (bookingId: string, slotId: string) => {
    await supabase.from("tutoring_bookings").update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    } as any).eq("id", bookingId);
    await supabase.from("tutoring_slots").update({ is_available: true } as any).eq("id", slotId);
    toast.success("Tutoría cancelada");
    fetchData();
  };

  const saveWhatsapp = () => {
    localStorage.setItem(TEACHER_WHATSAPP_KEY, tempWhatsapp);
    setWhatsappTeacher(tempWhatsapp);
    setEditingWhatsapp(false);
    toast.success("Número de WhatsApp guardado");
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const slotsForDate = (date: Date) =>
    slots.filter(s => s.slot_date === format(date, "yyyy-MM-dd"));

  const getBookingForSlot = (slotId: string) =>
    bookings.find(b => b.slot_id === slotId && b.status === "confirmed");

  const myBookings = bookings.filter(b => b.student_id === user?.id && b.status === "confirmed");

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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm active:scale-95">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-foreground">Tutorías</span>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button onClick={() => { setTempWhatsapp(whatsappTeacher); setEditingWhatsapp(!editingWhatsapp); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,45%)]/20 transition-colors active:scale-95"
                title="Configurar WhatsApp">
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              <button onClick={() => setShowAddSlot(!showAddSlot)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Horario</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* WhatsApp config (admin) */}
        {editingWhatsapp && isAdmin && (
          <div className="bg-card rounded-xl card-glow p-5 space-y-3 animate-fade-in">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4 text-[hsl(142,70%,45%)]" />
              Número de WhatsApp del profesor
            </h3>
            <p className="text-xs text-muted-foreground">Los alumnos podrán contactarte directamente. Usa formato internacional (ej: 34612345678)</p>
            <div className="flex gap-2">
              <input type="tel" value={tempWhatsapp} onChange={e => setTempWhatsapp(e.target.value)}
                placeholder="34612345678" maxLength={20}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none font-mono-cyber" />
              <button onClick={saveWhatsapp}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[hsl(142,70%,45%)] text-white text-xs font-medium hover:bg-[hsl(142,70%,40%)] transition-colors active:scale-95">
                <Save className="w-3.5 h-3.5" />
                Guardar
              </button>
            </div>
            {whatsappTeacher && (
              <p className="text-xs text-muted-foreground">
                Número actual: <span className="font-mono-cyber text-foreground">{whatsappTeacher}</span>
              </p>
            )}
          </div>
        )}

        {/* Add slot form */}
        {showAddSlot && isAdmin && (
          <div className="bg-card rounded-xl card-glow p-5 space-y-4 animate-fade-in">
            <h3 className="text-sm font-semibold text-foreground">Nuevo horario disponible</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Fecha</label>
                <input type="date" value={newSlotDate} onChange={e => setNewSlotDate(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Hora inicio</label>
                <input type="time" value={newSlotStart} onChange={e => setNewSlotStart(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Hora fin</label>
                <input type="time" value={newSlotEnd} onChange={e => setNewSlotEnd(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addSlot} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors active:scale-95">
                Guardar
              </button>
              <button onClick={() => setShowAddSlot(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs hover:bg-secondary/80 transition-colors active:scale-95">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95">
            ← Semana anterior
          </button>
          <span className="text-sm font-medium text-foreground">
            {format(weekDays[0], "d MMM", { locale: es })} – {format(weekDays[6], "d MMM yyyy", { locale: es })}
          </span>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95">
            Semana siguiente →
          </button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const daySlots = slotsForDate(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={`bg-card rounded-xl p-3 min-h-[140px] ${isToday ? 'ring-1 ring-primary/50' : ''}`}>
                <div className="text-center mb-2">
                  <div className="text-[10px] uppercase text-muted-foreground font-mono-cyber">
                    {format(day, "EEE", { locale: es })}
                  </div>
                  <div className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, "d")}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {daySlots.map(slot => {
                    const booking = getBookingForSlot(slot.id);
                    const isMyBooking = booking?.student_id === user?.id;
                    return (
                      <div key={slot.id} className={`text-[10px] rounded-lg p-1.5 ${
                        booking ? (isMyBooking ? 'bg-primary/20 text-primary' : 'bg-destructive/10 text-muted-foreground')
                               : 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'
                      } transition-colors`}>
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span className="font-mono-cyber">{slot.start_time.slice(0,5)}</span>
                        </div>
                        {isAdmin && !booking && (
                          <button onClick={() => deleteSlot(slot.id)} className="text-destructive hover:text-foreground mt-0.5">
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                        {booking ? (
                          <span className="text-[9px] block mt-0.5 truncate">
                            {isMyBooking ? "Tu tutoría" : profiles[booking.student_id] || "Reservado"}
                          </span>
                        ) : (
                          <span className="text-[9px] block mt-0.5">Disponible</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Available slots (students) */}
        {!isAdmin && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Horarios disponibles
            </h3>
            {slots.filter(s => s.is_available && new Date(s.slot_date) >= new Date()).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No hay horarios disponibles actualmente</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {slots.filter(s => s.is_available && new Date(s.slot_date) >= new Date()).map(slot => (
                  <div key={slot.id} className="bg-card rounded-xl card-glow p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {format(new Date(slot.slot_date), "EEEE d 'de' MMMM", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono-cyber">
                          {slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}
                        </p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <input type="text" value={bookingNotes} onChange={e => setBookingNotes(e.target.value)}
                        placeholder="Tema o duda (opcional)" maxLength={200}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none" />
                      <input type="tel" value={bookingPhone} onChange={e => setBookingPhone(e.target.value)}
                        placeholder="Tu WhatsApp (ej: 34612345678)" maxLength={20}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none font-mono-cyber" />
                    </div>
                    <button onClick={() => bookSlot(slot.id)}
                      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors active:scale-95">
                      Reservar tutoría
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My bookings */}
        {myBookings.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Mis tutorías reservadas
            </h3>
            <div className="space-y-3">
              {myBookings.map(b => {
                const slot = slots.find(s => s.id === b.slot_id);
                if (!slot) return null;
                return (
                  <div key={b.id} className="bg-card rounded-xl card-glow p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(slot.slot_date), "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono-cyber">
                        {slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}
                      </p>
                      {b.notes && <p className="text-xs text-muted-foreground mt-1">📝 {b.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {whatsappTeacher && (
                        <a
                          href={`https://wa.me/${whatsappTeacher}?text=${encodeURIComponent(`Hola, tengo una tutoría reservada para el ${format(new Date(slot.slot_date), "d/MM/yyyy")} a las ${slot.start_time.slice(0,5)}. ${b.notes ? `Tema: ${b.notes}` : ""}`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,45%)]/20 transition-colors active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      )}
                      <button onClick={() => cancelBooking(b.id, b.slot_id)}
                        className="flex items-center gap-1.5 text-xs text-destructive hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 active:scale-95">
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin: bookings */}
        {isAdmin && bookings.filter(b => b.status === "confirmed").length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Reservas de alumnos
            </h3>
            <div className="space-y-3">
              {bookings.filter(b => b.status === "confirmed").map(b => {
                const slot = slots.find(s => s.id === b.slot_id);
                if (!slot) return null;
                return (
                  <div key={b.id} className="bg-card rounded-xl card-glow p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{profiles[b.student_id] || "Alumno"}</p>
                        <p className="text-xs text-muted-foreground font-mono-cyber">
                          {format(new Date(slot.slot_date), "d/MM/yyyy", { locale: es })} · {slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}
                        </p>
                        {b.notes && <p className="text-xs text-muted-foreground mt-1">📝 {b.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {b.whatsapp_phone && (
                          <a
                            href={`https://wa.me/${b.whatsapp_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${profiles[b.student_id] || ""}, sobre tu tutoría del ${format(new Date(slot.slot_date), "d/MM/yyyy")}...`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,45%)]/20 transition-colors active:scale-95"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        )}
                        <button onClick={() => cancelBooking(b.id, b.slot_id)}
                          className="flex items-center gap-1.5 text-xs text-destructive px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors active:scale-95">
                          <XCircle className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
