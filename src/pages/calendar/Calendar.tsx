import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Star,
  BookOpen,
  Cake,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { SchoolCalendar, CalendarEventType } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OperatingHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface Policies {
  holiday_policy: string[];
  birthday_policy: string[];
}

interface SchoolRow {
  operating_hours: OperatingHours | null;
  policies: Policies | null;
}

const DEFAULT_HOURS: OperatingHours = {
  monday: "8:30 AM - 5:30 PM",
  tuesday: "8:30 AM - 5:30 PM",
  wednesday: "8:30 AM - 5:30 PM",
  thursday: "8:30 AM - 5:30 PM",
  friday: "8:30 AM - 5:30 PM",
  saturday: "Closed",
  sunday: "Closed",
};

const DEFAULT_HOLIDAY_POLICY = [
  "We are closed on all major holidays, as per states calendar",
  "Two weeks advance notice for special closures",
  "No make-up days available for planned closures",
  "Emergency closure notifications via app and email",
];

const DEFAULT_BIRTHDAY_POLICY = [
  "We love celebrating your child's special day!",
  "Parents are welcome to bring a store-bought treat to share with the group",
  "Please notify us at least 2 days in advance so we can plan accordingly",
  "We are a vegetarian facility — please ensure treats are vegetarian-friendly",
  "Note: We are NOT a nut-free or dairy-free facility",
  "Homemade treats are not permitted due to allergy and safety policies",
];

const DAYS_ORDER: (keyof OperatingHours)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<keyof OperatingHours, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const MONTH_PILL_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-yellow-100 text-yellow-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
  "bg-orange-100 text-orange-700",
  "bg-red-100 text-red-700",
  "bg-teal-100 text-teal-700",
  "bg-cyan-100 text-cyan-700",
  "bg-rose-100 text-rose-700",
  "bg-lime-100 text-lime-700",
];

const EVENT_TYPE_BADGE: Record<CalendarEventType, string> = {
  holiday: "bg-red-100 text-red-700",
  closure: "bg-orange-100 text-orange-700",
  event:   "bg-amber-100 text-amber-700",
};

const EVENT_TYPE_LABEL: Record<CalendarEventType, string> = {
  holiday: "Holiday",
  closure: "Closure",
  event:   "Celebration",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByMonth(events: SchoolCalendar[]) {
  const map: Record<number, SchoolCalendar[]> = {};
  events.forEach((e) => {
    const month = parseInt(e.event_date.split("-")[1], 10) - 1;
    if (!map[month]) map[month] = [];
    map[month].push(e);
  });
  return map;
}

function formatEventDate(dateStr: string) {
  const [, , day] = dateStr.split("-");
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="text-orange-500">{icon}</span>
        <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const schoolId = profile?.school_id;

  // ── All school_calendar events (all year) ──
  const [allEvents, setAllEvents] = useState<SchoolCalendar[]>([]);
  // ── School settings ──
  const [hours, setHours] = useState<OperatingHours>(DEFAULT_HOURS);
  const [policies, setPolicies] = useState<Policies>({
    holiday_policy: DEFAULT_HOLIDAY_POLICY,
    birthday_policy: DEFAULT_BIRTHDAY_POLICY,
  });

  // ── Add holiday/event form ──
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    event_date: "",
    event_type: "holiday" as CalendarEventType,
    title: "",
    notes: "",
  });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    event_date: "",
    event_type: "event" as CalendarEventType,
    title: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // ── Operating hours editing ──
  const [editingDay, setEditingDay] = useState<keyof OperatingHours | null>(null);
  const [editHourVal, setEditHourVal] = useState("");

  // ── Policy editing ──
  const [editingHolidayPolicy, setEditingHolidayPolicy] = useState(false);
  const [holidayPolicyText, setHolidayPolicyText] = useState("");
  const [editingBirthdayPolicy, setEditingBirthdayPolicy] = useState(false);
  const [birthdayPolicyText, setBirthdayPolicyText] = useState("");

  // ── Load ──
  useEffect(() => {
    if (!schoolId) return;
    fetchAll();
  }, [schoolId]);

  async function fetchAll() {
    const year = new Date().getFullYear();
    const [{ data: events }, { data: school }] = await Promise.all([
      supabase
        .from("school_calendar")
        .select("*")
        .eq("school_id", schoolId!)
        .gte("event_date", `${year}-01-01`)
        .lte("event_date", `${year}-12-31`)
        .order("event_date"),
      supabase
        .from("schools")
        .select("operating_hours, policies")
        .eq("id", schoolId!)
        .single<SchoolRow>(),
    ]);
    setAllEvents(events ?? []);
    if (school?.operating_hours) setHours(school.operating_hours as OperatingHours);
    if (school?.policies) {
      const p = school.policies as Policies;
      setPolicies({
        holiday_policy: p.holiday_policy?.length ? p.holiday_policy : DEFAULT_HOLIDAY_POLICY,
        birthday_policy: p.birthday_policy?.length ? p.birthday_policy : DEFAULT_BIRTHDAY_POLICY,
      });
    }
  }

  // ── Holiday CRUD ──
  async function addHoliday() {
    if (!holidayForm.title || !holidayForm.event_date) return;
    setSaving(true);
    await supabase.from("school_calendar").insert({ ...holidayForm, school_id: schoolId! });
    setShowAddHoliday(false);
    setHolidayForm({ event_date: "", event_type: "holiday", title: "", notes: "" });
    fetchAll();
    setSaving(false);
  }

  async function addSpecialEvent() {
    if (!eventForm.title || !eventForm.event_date) return;
    setSaving(true);
    await supabase.from("school_calendar").insert({ ...eventForm, school_id: schoolId! });
    setShowAddEvent(false);
    setEventForm({ event_date: "", event_type: "event", title: "", notes: "" });
    fetchAll();
    setSaving(false);
  }

  async function deleteCalendarEntry(id: string) {
    await supabase.from("school_calendar").delete().eq("id", id);
    fetchAll();
  }

  // ── Hours CRUD ──
  function startEditDay(day: keyof OperatingHours) {
    setEditingDay(day);
    setEditHourVal(hours[day]);
  }

  async function saveHours() {
    if (!editingDay) return;
    const updated = { ...hours, [editingDay]: editHourVal };
    setHours(updated);
    setEditingDay(null);
    await supabase.from("schools").update({ operating_hours: updated }).eq("id", schoolId!);
  }

  // ── Policy CRUD ──
  function openHolidayPolicyEdit() {
    setHolidayPolicyText(policies.holiday_policy.join("\n"));
    setEditingHolidayPolicy(true);
  }

  async function saveHolidayPolicy() {
    const bullets = holidayPolicyText.split("\n").map((l) => l.trim()).filter(Boolean);
    const updated = { ...policies, holiday_policy: bullets };
    setPolicies(updated);
    setEditingHolidayPolicy(false);
    await supabase.from("schools").update({ policies: updated }).eq("id", schoolId!);
  }

  function openBirthdayPolicyEdit() {
    setBirthdayPolicyText(policies.birthday_policy.join("\n"));
    setEditingBirthdayPolicy(true);
  }

  async function saveBirthdayPolicy() {
    const bullets = birthdayPolicyText.split("\n").map((l) => l.trim()).filter(Boolean);
    const updated = { ...policies, birthday_policy: bullets };
    setPolicies(updated);
    setEditingBirthdayPolicy(false);
    await supabase.from("schools").update({ policies: updated }).eq("id", schoolId!);
  }

  // ── Derived data ──
  const holidays = allEvents.filter((e) => e.event_type === "holiday" || e.event_type === "closure");
  const specialEvents = allEvents.filter((e) => e.event_type === "event");
  const holidaysByMonth = groupByMonth(holidays);
  const eventsByMonth = groupByMonth(specialEvents);

  // Months that have either holidays or special events
  const allMonthsWithHolidays = Array.from(
    new Set([
      ...Object.keys(holidaysByMonth).map(Number),
    ])
  ).sort((a, b) => a - b);

  const allMonthsWithEvents = Array.from(
    new Set([
      ...Object.keys(eventsByMonth).map(Number),
    ])
  ).sort((a, b) => a - b);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Calendar &amp; Policies</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-5 items-start">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">
            {/* Holiday Calendar */}
            <SectionCard icon={<CalendarIcon size={18} />} title="Holiday Calendar">
              <div className="space-y-4">
                {allMonthsWithHolidays.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No holidays or closures added yet.</p>
                )}
                {allMonthsWithHolidays.map((month) => (
                  <div key={month} className="flex gap-3 items-start">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${MONTH_PILL_COLORS[month]}`}
                    >
                      {MONTH_NAMES[month]}
                    </span>
                    <ul className="space-y-1 flex-1">
                      {(holidaysByMonth[month] ?? []).map((e) => (
                        <li key={e.id} className="flex items-start justify-between gap-2 text-sm">
                          <span className="text-gray-700">
                            <span className="font-medium">{e.title}</span>
                            <span className="text-gray-400 ml-1">— {formatEventDate(e.event_date)}</span>
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => deleteCalendarEntry(e.id)}
                              className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                              title="Remove"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {isAdmin && (
                  <button
                    onClick={() => setShowAddHoliday(true)}
                    className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium mt-2"
                  >
                    <Plus size={15} /> Add Holiday / Closure
                  </button>
                )}

                <p className="text-xs text-gray-400 border-t border-gray-100 pt-3 mt-3">
                  All listed dates are closures. Emergency closure notifications sent via app and email.
                </p>
              </div>
            </SectionCard>

            {/* Special Events */}
            <SectionCard icon={<Star size={18} />} title="Special Events">
              <div className="space-y-3">
                {allMonthsWithEvents.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No special events added yet.</p>
                )}
                {allMonthsWithEvents.length > 0 && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="pb-2 font-medium">Month</th>
                        <th className="pb-2 font-medium">Event</th>
                        <th className="pb-2 font-medium">Type</th>
                        {isAdmin && <th className="pb-2" />}
                      </tr>
                    </thead>
                    <tbody>
                      {allMonthsWithEvents.flatMap((month) =>
                        (eventsByMonth[month] ?? []).map((e) => (
                          <tr key={e.id} className="border-b border-gray-50 last:border-0">
                            <td className="py-2 pr-3">
                              <span
                                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${MONTH_PILL_COLORS[month]}`}
                              >
                                {MONTH_NAMES[month]}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-gray-800 font-medium">{e.title}</td>
                            <td className="py-2 pr-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${EVENT_TYPE_BADGE[e.event_type as CalendarEventType] ?? ""}`}
                              >
                                {EVENT_TYPE_LABEL[e.event_type as CalendarEventType] ?? e.event_type}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="py-2 text-right">
                                <button
                                  onClick={() => deleteCalendarEntry(e.id)}
                                  className="text-gray-300 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {isAdmin && (
                  <button
                    onClick={() => setShowAddEvent(true)}
                    className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium mt-1"
                  >
                    <Plus size={15} /> Add Special Event
                  </button>
                )}
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">
            {/* Operating Schedule */}
            <SectionCard icon={<Clock size={18} />} title="Operating Schedule">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
                Regular Hours
              </p>
              <div className="space-y-0">
                {DAYS_ORDER.map((day) => {
                  const val = hours[day];
                  const isClosed = val === "Closed";
                  const isEditing = editingDay === day;

                  return (
                    <div
                      key={day}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-sm font-medium text-gray-700 w-28">
                        {DAY_LABELS[day]}
                      </span>
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            className="input flex-1 text-sm py-1"
                            value={editHourVal}
                            onChange={(e) => setEditHourVal(e.target.value)}
                            placeholder="e.g. 8:30 AM - 5:30 PM or Closed"
                          />
                          <button
                            onClick={saveHours}
                            className="text-green-500 hover:text-green-700"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingDay(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-sm font-medium ${
                              isClosed ? "text-red-500" : "text-green-600"
                            }`}
                          >
                            {val}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => startEditDay(day)}
                              className="text-gray-300 hover:text-orange-400 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Holiday Policy */}
            <SectionCard icon={<BookOpen size={18} />} title="Holiday Policy">
              {editingHolidayPolicy ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400">One bullet per line:</p>
                  <textarea
                    className="input w-full h-36 resize-none text-sm"
                    value={holidayPolicyText}
                    onChange={(e) => setHolidayPolicyText(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingHolidayPolicy(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button onClick={saveHolidayPolicy} className="btn-primary text-sm">
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <ul className="space-y-1.5 mb-3">
                    {policies.holiday_policy.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-orange-400 mt-0.5 shrink-0">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  {isAdmin && (
                    <button
                      onClick={openHolidayPolicyEdit}
                      className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium"
                    >
                      <Pencil size={13} /> Edit Policy
                    </button>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Birthday Policy */}
            <SectionCard icon={<Cake size={18} />} title="Birthday Policy">
              {editingBirthdayPolicy ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400">One bullet per line:</p>
                  <textarea
                    className="input w-full h-40 resize-none text-sm"
                    value={birthdayPolicyText}
                    onChange={(e) => setBirthdayPolicyText(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingBirthdayPolicy(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button onClick={saveBirthdayPolicy} className="btn-primary text-sm">
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <ul className="space-y-1.5 mb-3">
                    {policies.birthday_policy.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-orange-400 mt-0.5 shrink-0">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  {isAdmin && (
                    <button
                      onClick={openBirthdayPolicyEdit}
                      className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium"
                    >
                      <Pencil size={13} /> Edit Policy
                    </button>
                  )}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ── Add Holiday Modal ── */}
      {showAddHoliday && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Add Holiday / Closure</h2>
              <button onClick={() => setShowAddHoliday(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                className="input w-full"
                type="date"
                value={holidayForm.event_date}
                onChange={(e) => setHolidayForm((f) => ({ ...f, event_date: e.target.value }))}
              />
              <select
                className="input w-full"
                value={holidayForm.event_type}
                onChange={(e) =>
                  setHolidayForm((f) => ({ ...f, event_type: e.target.value as CalendarEventType }))
                }
              >
                <option value="holiday">Holiday (Closed)</option>
                <option value="closure">Closure</option>
              </select>
              <input
                className="input w-full"
                placeholder="Holiday name"
                value={holidayForm.title}
                onChange={(e) => setHolidayForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="input w-full h-20 resize-none"
                placeholder="Notes (optional)"
                value={holidayForm.notes}
                onChange={(e) => setHolidayForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddHoliday(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={addHoliday} disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Special Event Modal ── */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Add Special Event</h2>
              <button onClick={() => setShowAddEvent(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                className="input w-full"
                type="date"
                value={eventForm.event_date}
                onChange={(e) => setEventForm((f) => ({ ...f, event_date: e.target.value }))}
              />
              <select
                className="input w-full"
                value={eventForm.event_type}
                onChange={(e) =>
                  setEventForm((f) => ({ ...f, event_type: e.target.value as CalendarEventType }))
                }
              >
                <option value="event">Celebration</option>
                <option value="closure">Closure</option>
                <option value="holiday">Holiday</option>
              </select>
              <input
                className="input w-full"
                placeholder="Event name"
                value={eventForm.title}
                onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="input w-full h-20 resize-none"
                placeholder="Notes (optional)"
                value={eventForm.notes}
                onChange={(e) => setEventForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddEvent(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={addSpecialEvent} disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
