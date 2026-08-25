import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { SchoolCalendar, CalendarEventType } from "@/lib/types";

const EVENT_COLORS: Record<CalendarEventType, string> = {
  holiday: "bg-red-100 text-red-700 border-red-200",
  closure:  "bg-orange-100 text-orange-700 border-orange-200",
  event:    "bg-orange-100 text-orange-600 border-orange-200",
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const { profile } = useAuth();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<SchoolCalendar[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ event_date: "", event_type: "event" as CalendarEventType, title: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;
    fetchEvents();
  }, [profile?.school_id, viewYear, viewMonth]);

  async function fetchEvents() {
    const from = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
    const to   = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${daysInMonth(viewYear, viewMonth)}`;
    const { data } = await supabase
      .from("school_calendar")
      .select("*")
      .eq("school_id", profile!.school_id!)
      .gte("event_date", from)
      .lte("event_date", to);
    setEvents(data ?? []);
  }

  async function addEvent() {
    if (!form.title || !form.event_date) return;
    setSaving(true);
    await supabase.from("school_calendar").insert({ ...form, school_id: profile!.school_id! });
    setShowAdd(false);
    setForm({ event_date: "", event_type: "event", title: "", notes: "" });
    fetchEvents();
    setSaving(false);
  }

  async function deleteEvent(id: string) {
    await supabase.from("school_calendar").delete().eq("id", id);
    fetchEvents();
  }

  const eventsByDay: Record<number, SchoolCalendar[]> = {};
  events.forEach(e => {
    const day = parseInt(e.event_date.split("-")[2], 10);
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  const firstDay  = firstDayOfMonth(viewYear, viewMonth);
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells     = Array.from({ length: firstDay + totalDays }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Event
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-4">
          <button onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }} className="p-1 rounded hover:bg-gray-100"><ChevronLeft size={18} /></button>
          <span className="text-base font-semibold text-gray-900 w-44 text-center">{monthLabel}</span>
          <button onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }} className="p-1 rounded hover:bg-gray-100"><ChevronRight size={18} /></button>
          <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }} className="text-xs text-orange-500 hover:underline ml-2">Today</button>
        </div>

        {/* Grid */}
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              const dayEvents = day ? (eventsByDay[day] ?? []) : [];
              return (
                <div key={i} className={`min-h-[90px] p-1.5 border-r border-b border-gray-100 ${day === null ? "bg-gray-50" : ""}`}>
                  {day !== null && (
                    <>
                      <span className={`inline-flex w-6 h-6 items-center justify-center text-xs font-medium rounded-full mb-1 ${isToday ? "bg-orange-500 text-white" : "text-gray-700"}`}>{day}</span>
                      <div className="space-y-0.5">
                        {dayEvents.map(e => (
                          <div key={e.id} className={`text-xs px-1.5 py-0.5 rounded border flex items-start justify-between gap-1 ${EVENT_COLORS[e.event_type as CalendarEventType] ?? ""}`}>
                            <span className="truncate leading-tight">{e.title}</span>
                            <button onClick={() => deleteEvent(e.id)} className="shrink-0 opacity-50 hover:opacity-100"><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add event modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
              <h2 className="font-bold text-gray-900 text-lg">Add Calendar Event</h2>
              <div className="space-y-3">
                <input className="input w-full" type="date" value={form.event_date} onChange={e => setForm(f => ({...f, event_date: e.target.value}))} />
                <select className="input w-full" value={form.event_type} onChange={e => setForm(f => ({...f, event_type: e.target.value as CalendarEventType}))}>
                  <option value="event">Event</option>
                  <option value="holiday">Holiday (Closed)</option>
                  <option value="closure">Closure</option>
                </select>
                <input className="input w-full" placeholder="Title" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
                <textarea className="input w-full h-20 resize-none" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button onClick={addEvent} disabled={saving} className="btn-primary">{saving ? "Saving..." : "Add Event"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
