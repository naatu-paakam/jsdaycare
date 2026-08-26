import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Printer, Plus, X } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Profile, Room, Student, StaffSchedule, StudentSchedule } from "@/lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAY_FULL   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function getWeekStart(d: Date): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtDisplay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── types ───────────────────────────────────────────────────────────────────

interface StaffDialogState {
  open: boolean;
  staffId: string | null;
  dayOfWeek: number | null;
}

interface StudentDialogState {
  open: boolean;
  studentId: string | null;
  dayOfWeek: number | null;
}

// ─── Staff Schedule Dialog ────────────────────────────────────────────────────

interface StaffDialogProps {
  state: StaffDialogState;
  staff: Profile[];
  rooms: Room[];
  weekStart: Date;
  onClose: () => void;
  onSaved: () => void;
}

function StaffScheduleDialog({ state, staff, rooms, weekStart, onClose, onSaved }: StaffDialogProps) {
  const defaultDay = state.dayOfWeek ?? 1; // default Mon
  const defaultDate = fmtDate(addDays(weekStart, defaultDay));

  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(
    state.staffId ? [state.staffId] : []
  );
  const [roomId, setRoomId] = useState<string>("");
  const [repeats, setRepeats] = useState(true);
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("07:30");
  const [endTime, setEndTime] = useState("16:30");
  const [days, setDays] = useState<number[]>([defaultDay]);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // reset when dialog opens
  useEffect(() => {
    if (state.open) {
      const d = state.dayOfWeek ?? 1;
      setSelectedStaffIds(state.staffId ? [state.staffId] : []);
      setDays([d]);
      setStartDate(fmtDate(addDays(weekStart, d)));
      setEndDate("");
      setRoomId("");
      setRepeats(true);
      setStartTime("07:30");
      setEndTime("16:30");
      setDescription("");
      setError("");
    }
  }, [state.open, state.staffId, state.dayOfWeek, weekStart]);

  function toggleDay(d: number) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  function removeStaff(id: string) {
    setSelectedStaffIds(prev => prev.filter(x => x !== id));
  }

  function addStaffById(id: string) {
    if (!selectedStaffIds.includes(id)) setSelectedStaffIds(prev => [...prev, id]);
  }

  async function handleSave() {
    if (!selectedStaffIds.length) { setError("Select at least one staff member."); return; }
    if (!roomId) { setError("Select a room."); return; }
    if (!startDate) { setError("Select a start date."); return; }
    if (!startTime || !endTime) { setError("Enter start and end time."); return; }
    if (!days.length) { setError("Select at least one day."); return; }

    setSaving(true);
    setError("");

    const rows: Omit<StaffSchedule, "id">[] = [];
    for (const sid of selectedStaffIds) {
      for (const dow of days) {
        rows.push({
          staff_id: sid,
          room_id: roomId,
          day_of_week: dow,
          start_time: startTime,
          end_time: endTime,
          effective_from: startDate || null,
          effective_to: endDate || null,
        });
      }
    }

    const { error: err } = await supabase.from("staff_schedules").insert(rows);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  if (!state.open) return null;

  const unselectedStaff = staff.filter(s => !selectedStaffIds.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-semibold text-gray-900 text-base flex-1">Add staff to schedule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        {/* hint */}
        <div className="mx-5 mt-4 px-4 py-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          Looking to add staff time off? Visit the <strong>Time Off</strong> section to manage PTO and sick time for staff.
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* staff */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Staff <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedStaffIds.map(id => {
                const s = staff.find(x => x.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                    {s?.full_name ?? id}
                    <button onClick={() => removeStaff(id)} className="hover:text-orange-900"><X size={10} /></button>
                  </span>
                );
              })}
            </div>
            {unselectedStaff.length > 0 && (
              <select
                className="input text-sm w-full"
                value=""
                onChange={e => { if (e.target.value) addStaffById(e.target.value); }}
              >
                <option value="">+ Add staff</option>
                {unselectedStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name ?? s.id}</option>
                ))}
              </select>
            )}
          </div>

          {/* room */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Room <span className="text-red-400">*</span></label>
            <select className="input text-sm w-full" value={roomId} onChange={e => setRoomId(e.target.value)}>
              <option value="">Select room…</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {/* repeats */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={repeats} onChange={e => setRepeats(e.target.checked)} className="accent-orange-500" />
            Repeats every week
          </label>

          {/* dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start date <span className="text-red-400">*</span></label>
              <input type="date" className="input text-sm w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
              <input type="date" className="input text-sm w-full" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start time <span className="text-red-400">*</span></label>
              <input type="time" className="input text-sm w-full" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End time <span className="text-red-400">*</span></label>
              <input type="time" className="input text-sm w-full" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          {/* days */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Days of the week</label>
            <div className="flex gap-1">
              {DAY_LABELS.map((lbl, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`w-9 h-9 rounded-full text-xs font-medium transition-colors
                    ${days.includes(i)
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              className="input text-sm w-full h-16 resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional notes…"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn btn-ghost text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Student Schedule Dialog ──────────────────────────────────────────────────

interface StudentDialogProps {
  state: StudentDialogState;
  students: Student[];
  weekStart: Date;
  onClose: () => void;
  onSaved: () => void;
}

const SCHEDULE_TYPES = [
  { value: "full", label: "Full day" },
  { value: "am",   label: "AM" },
  { value: "pm",   label: "PM" },
  { value: "half", label: "Half day" },
] as const;

function StudentScheduleDialog({ state, students, weekStart, onClose, onSaved }: StudentDialogProps) {
  const defaultDay = state.dayOfWeek ?? 1;
  const defaultDate = fmtDate(addDays(weekStart, defaultDay));

  const [scheduleType, setScheduleType] = useState<"full"|"am"|"pm"|"half">("full");
  const [days, setDays] = useState<number[]>([defaultDay]);
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (state.open) {
      const d = state.dayOfWeek ?? 1;
      setDays([d]);
      setStartDate(fmtDate(addDays(weekStart, d)));
      setEndDate("");
      setScheduleType("full");
      setError("");
    }
  }, [state.open, state.dayOfWeek, weekStart]);

  function toggleDay(d: number) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  async function handleSave() {
    if (!state.studentId) return;
    if (!days.length) { setError("Select at least one day."); return; }
    if (!startDate) { setError("Select a start date."); return; }

    setSaving(true);
    setError("");

    const rows: Omit<StudentSchedule, "id">[] = days.map(dow => ({
      student_id: state.studentId!,
      day_of_week: dow,
      schedule_type: scheduleType,
      effective_from: startDate || null,
      effective_to: endDate || null,
    }));

    const { error: err } = await supabase.from("student_schedules").insert(rows);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  if (!state.open) return null;

  const student = students.find(s => s.id === state.studentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><ChevronLeft size={20} /></button>
          <h2 className="font-semibold text-gray-900 text-base flex-1">Add student schedule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* student (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Student</label>
            <div className="input text-sm bg-gray-50 text-gray-700">
              {student ? `${student.first_name} ${student.last_name}` : "—"}
            </div>
          </div>

          {/* schedule type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Schedule type</label>
            <div className="flex gap-2 flex-wrap">
              {SCHEDULE_TYPES.map(t => (
                <label key={t.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="sched-type"
                    value={t.value}
                    checked={scheduleType === t.value}
                    onChange={() => setScheduleType(t.value)}
                    className="accent-orange-500"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {/* days */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Days of the week</label>
            <div className="flex gap-1">
              {DAY_LABELS.map((lbl, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`w-9 h-9 rounded-full text-xs font-medium transition-colors
                    ${days.includes(i)
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start date <span className="text-red-400">*</span></label>
              <input type="date" className="input text-sm w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
              <input type="date" className="input text-sm w-full" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn btn-ghost text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Schedules() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;

  // week navigation
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  // data
  const [staff, setStaff] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([]);
  const [studentSchedules, setStudentSchedules] = useState<StudentSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [roomFilter, setRoomFilter] = useState<string>("");

  // dialogs
  const [staffDialog, setStaffDialog] = useState<StaffDialogState>({ open: false, staffId: null, dayOfWeek: null });
  const [studentDialog, setStudentDialog] = useState<StudentDialogState>({ open: false, studentId: null, dayOfWeek: null });

  // load static data once
  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("school_id", schoolId).in("role", ["admin","staff"]).order("full_name"),
      supabase.from("students").select("*").eq("school_id", schoolId).eq("enrollment_status", "active").order("first_name"),
      supabase.from("rooms").select("*").eq("school_id", schoolId).order("name"),
    ]).then(([{ data: s }, { data: stu }, { data: r }]) => {
      setStaff(s ?? []);
      setStudents(stu ?? []);
      setRooms(r ?? []);
    });
  }, [schoolId]);

  const loadSchedules = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    const weekEnd = fmtDate(addDays(weekStart, 6));
    const ws = fmtDate(weekStart);

    const [{ data: ss }, { data: stus }] = await Promise.all([
      supabase.from("staff_schedules").select("*")
        .or(`effective_from.is.null,effective_from.lte.${weekEnd}`)
        .or(`effective_to.is.null,effective_to.gte.${ws}`),
      supabase.from("student_schedules").select("*")
        .or(`effective_from.is.null,effective_from.lte.${weekEnd}`)
        .or(`effective_to.is.null,effective_to.gte.${ws}`),
    ]);
    setStaffSchedules(ss ?? []);
    setStudentSchedules(stus ?? []);
    setLoading(false);
  }, [schoolId, weekStart]);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  // filtered staff (by room)
  const visibleStaff = roomFilter
    ? staff.filter(s => staffSchedules.some(ss => ss.staff_id === s.id && ss.room_id === roomFilter))
    : staff;

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function openStaffDialog(staffId: string | null, dayOfWeek: number | null) {
    setStaffDialog({ open: true, staffId, dayOfWeek });
  }

  function openStudentDialog(studentId: string | null, dayOfWeek: number | null) {
    setStudentDialog({ open: true, studentId, dayOfWeek });
  }

  function getStaffChips(staffId: string, dow: number) {
    return staffSchedules.filter(s => s.staff_id === staffId && s.day_of_week === dow);
  }

  function getStudentChips(studentId: string, dow: number) {
    return studentSchedules.filter(s => s.student_id === studentId && s.day_of_week === dow);
  }

  const schedTypeLabel: Record<string, string> = { full: "Full", am: "AM", pm: "PM", half: "Half" };

  return (
    <Layout>
      <div className="p-6 max-w-full mx-auto space-y-4">
        {/* page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage staff and student schedules</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openStaffDialog(null, null)}
              className="btn btn-primary text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Staff schedule
            </button>
            <button
              onClick={() => openStudentDialog(null, null)}
              className="btn btn-ghost text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Student schedule
            </button>
            <button
              onClick={() => window.print()}
              className="btn btn-ghost text-sm flex items-center gap-1"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        {/* controls row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* week nav */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
            <button
              onClick={() => setWeekStart(d => addDays(d, -7))}
              className="p-1 rounded hover:bg-gray-100 text-gray-500"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2 whitespace-nowrap">
              {fmtDisplay(weekStart)} – {fmtDisplay(addDays(weekStart, 6))}
            </span>
            <button
              onClick={() => setWeekStart(d => addDays(d, 7))}
              className="p-1 rounded hover:bg-gray-100 text-gray-500"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* room filter */}
          <select
            className="input text-sm"
            value={roomFilter}
            onChange={e => setRoomFilter(e.target.value)}
          >
            <option value="">All rooms</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="text-xs text-orange-500 hover:underline"
          >
            Today
          </button>
        </div>

        {/* ── Staff grid ── */}
        <div className="card overflow-x-auto">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">Staff Schedules</h2>
          </div>
          <div className="min-w-[700px]">
            {/* header row */}
            <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-gray-100">
              <div className="px-3 py-2 text-xs text-gray-400 font-medium">Staff</div>
              {weekDates.map((d, i) => (
                <div key={i} className="px-2 py-2 text-center border-l border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">{DAY_LABELS[i]}</p>
                  <p className="text-xs text-gray-400">{fmtDisplay(d)}</p>
                </div>
              ))}
            </div>

            {/* body */}
            {loading ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading…</div>
            ) : visibleStaff.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No staff found</div>
            ) : (
              visibleStaff.map(s => (
                <div key={s.id} className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-gray-50 hover:bg-gray-50/50">
                  {/* name cell */}
                  <div className="px-3 py-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-xs shrink-0">
                      {s.full_name?.[0] ?? "?"}
                    </div>
                    <span className="text-xs font-medium text-gray-800 truncate">{s.full_name ?? "Unnamed"}</span>
                  </div>
                  {/* day cells */}
                  {weekDates.map((_, i) => {
                    const chips = getStaffChips(s.id, i);
                    return (
                      <div
                        key={i}
                        onClick={() => openStaffDialog(s.id, i)}
                        className="border-l border-gray-100 px-1.5 py-1.5 min-h-[52px] cursor-pointer hover:bg-orange-50 transition-colors group"
                      >
                        {chips.length > 0 ? (
                          <div className="space-y-0.5">
                            {chips.map(c => (
                              <div
                                key={c.id}
                                className="px-1.5 py-0.5 bg-orange-400 text-white rounded text-[10px] font-medium truncate"
                              >
                                {c.start_time.slice(0,5)}–{c.end_time.slice(0,5)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Plus size={12} className="text-orange-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Student grid ── */}
        <div className="card overflow-x-auto">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">Student Schedules</h2>
          </div>
          <div className="min-w-[700px]">
            {/* header row */}
            <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-gray-100">
              <div className="px-3 py-2 text-xs text-gray-400 font-medium">Student</div>
              {weekDates.map((d, i) => (
                <div key={i} className="px-2 py-2 text-center border-l border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">{DAY_LABELS[i]}</p>
                  <p className="text-xs text-gray-400">{fmtDisplay(d)}</p>
                </div>
              ))}
            </div>

            {/* body */}
            {loading ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading…</div>
            ) : students.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No active students found</div>
            ) : (
              students.map(st => (
                <div key={st.id} className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-gray-50 hover:bg-gray-50/50">
                  <div className="px-3 py-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs shrink-0">
                      {st.first_name?.[0] ?? "?"}
                    </div>
                    <span className="text-xs font-medium text-gray-800 truncate">{st.first_name} {st.last_name}</span>
                  </div>
                  {weekDates.map((_, i) => {
                    const chips = getStudentChips(st.id, i);
                    return (
                      <div
                        key={i}
                        onClick={() => openStudentDialog(st.id, i)}
                        className="border-l border-gray-100 px-1.5 py-1.5 min-h-[52px] cursor-pointer hover:bg-purple-50 transition-colors group"
                      >
                        {chips.length > 0 ? (
                          <div className="space-y-0.5">
                            {chips.map(c => (
                              <div
                                key={c.id}
                                className="px-1.5 py-0.5 bg-purple-400 text-white rounded text-[10px] font-medium truncate"
                              >
                                {schedTypeLabel[c.schedule_type ?? "full"] ?? c.schedule_type}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Plus size={12} className="text-purple-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <StaffScheduleDialog
        state={staffDialog}
        staff={staff}
        rooms={rooms}
        weekStart={weekStart}
        onClose={() => setStaffDialog(s => ({ ...s, open: false }))}
        onSaved={() => { setStaffDialog(s => ({ ...s, open: false })); loadSchedules(); }}
      />
      <StudentScheduleDialog
        state={studentDialog}
        students={students}
        weekStart={weekStart}
        onClose={() => setStudentDialog(s => ({ ...s, open: false }))}
        onSaved={() => { setStudentDialog(s => ({ ...s, open: false })); loadSchedules(); }}
      />
    </Layout>
  );
}
