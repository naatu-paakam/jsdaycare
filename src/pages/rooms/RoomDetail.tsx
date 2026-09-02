import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, UserCheck, UserX, Image, Coffee, Moon, MessageSquare,
  SlidersHorizontal, Settings, Plus, Camera, Video, Apple, BedDouble,
  PenLine, Star, Pill, PersonStanding, Bandage, HeartPulse, ClipboardList,
  X, ChevronRight, Toilet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Room, Student, Activity, ActivityType, Attendance, FoodItem } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface StudentWithAttendance extends Student {
  attendance?: Attendance;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  photo:         <Camera size={14} />,
  video:         <Video size={14} />,
  food:          <Coffee size={14} />,
  nap:           <Moon size={14} />,
  potty:         <MessageSquare size={14} />,
  note:          <PenLine size={14} />,
  kudos:         <Star size={14} />,
  meds:          <Pill size={14} />,
  name_to_face:  <PersonStanding size={14} />,
  incident:      <Bandage size={14} />,
  health_check:  <HeartPulse size={14} />,
  observation:   <ClipboardList size={14} />,
};

const ACTIVITY_GRID: { type: ActivityType; label: string; icon: React.ReactNode }[] = [
  { type: "photo",        label: "Photo",          icon: <Camera size={28} /> },
  { type: "video",        label: "Video",          icon: <Video size={28} /> },
  { type: "food",         label: "Food",           icon: <Apple size={28} /> },
  { type: "nap",          label: "Nap",            icon: <BedDouble size={28} /> },
  { type: "potty",        label: "Potty",          icon: <Toilet size={28} /> },
  { type: "note",         label: "Note",           icon: <PenLine size={28} /> },
  { type: "kudos",        label: "Kudos",          icon: <Star size={28} /> },
  { type: "meds",         label: "Meds",           icon: <Pill size={28} /> },
  { type: "name_to_face", label: "Name to Face",   icon: <PersonStanding size={28} /> },
  { type: "incident",     label: "Incident",       icon: <Bandage size={28} /> },
  { type: "health_check", label: "Health Check",   icon: <HeartPulse size={28} /> },
  { type: "observation",  label: "Observation",    icon: <ClipboardList size={28} /> },
];

const AGE_OPTIONS = [
  { label: "0 mo",  value: 0 },
  { label: "3 mo",  value: 3 },
  { label: "6 mo",  value: 6 },
  { label: "12 mo", value: 12 },
  { label: "18 mo", value: 18 },
  { label: "24 mo", value: 24 },
  { label: "36 mo", value: 36 },
  { label: "48 mo", value: 48 },
  { label: "60 mo", value: 60 },
];

const ACTIVITY_TYPES: ActivityType[] = [
  "photo","video","food","nap","potty","note","kudos","meds","incident","health_check","observation",
];

// ─── Modal helper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Room Settings Modal ──────────────────────────────────────────────────────

function RoomSettingsModal({ room, onClose, onSaved, onDeleted }: {
  room: Room;
  onClose: () => void;
  onSaved: (r: Room) => void;
  onDeleted: () => void;
}) {
  const [name,     setName]     = useState(room.name);
  const [minAge,   setMinAge]   = useState<number | "">(room.age_range_min_months ?? "");
  const [maxAge,   setMaxAge]   = useState<number | "">(room.age_range_max_months ?? "");
  const [capacity, setCapacity] = useState<number | "">(room.capacity ?? "");
  const [ratio,    setRatio]    = useState<number | "">(room.ratio_children ?? "");
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm,  setConfirm]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("Room name is required"); return; }
    setSaving(true);
    const { data, error: err } = await supabase.from("rooms").update({
      name: name.trim(),
      age_range_min_months: minAge === "" ? null : minAge,
      age_range_max_months: maxAge === "" ? null : maxAge,
      capacity: capacity === "" ? null : capacity,
      ratio_children: ratio === "" ? null : ratio,
    }).eq("id", room.id).select().single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(data as Room);
  }

  async function handleDelete() {
    setDeleting(true);
    await supabase.from("rooms").delete().eq("id", room.id);
    setDeleting(false);
    onDeleted();
  }

  return (
    <Modal title="Room Settings" onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div>
          <label className="label">Room name *</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sunshine Room" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Min age</label>
            <select className="input" value={minAge} onChange={e => setMinAge(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">—</option>
              {AGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Max age</label>
            <select className="input" value={maxAge} onChange={e => setMaxAge(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">—</option>
              {AGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Max capacity</label>
            <input type="number" min={0} className="input" value={capacity} onChange={e => setCapacity(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 12" />
          </div>
          <div>
            <label className="label"># students per 1 staff</label>
            <input type="number" min={0} className="input" value={ratio} onChange={e => setRatio(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 4" />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
        {confirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-700">Are you sure? This cannot be undone.</span>
            <button onClick={handleDelete} disabled={deleting} className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button onClick={() => setConfirm(false)} className="text-sm px-3 py-1.5 text-gray-500 hover:text-gray-800">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-medium">
            Delete room
          </button>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Activity Type Picker ─────────────────────────────────────────────────────

function ActivityTypePicker({ onSelect, onClose }: {
  onSelect: (type: ActivityType) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Select activity" onClose={onClose}>
      <div className="p-6 grid grid-cols-4 gap-3">
        {ACTIVITY_GRID.map(a => (
          <button
            key={a.type}
            onClick={() => onSelect(a.type)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-orange-300 hover:bg-orange-50 text-gray-600 hover:text-orange-500 transition-colors"
          >
            {a.icon}
            <span className="text-xs font-medium text-center leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ─── Activity Form ─────────────────────────────────────────────────────────────

interface ActivityFormState {
  studentId: string;   // "" = all
  date: string;
  time: string;
  staffOnly: boolean;
  notes: string;
  // food
  foodType: "food" | "bottle";
  foodQty: "all" | "most" | "some" | "none";
  mealType: string;
  mealItem: string;
  // potty
  pottyType: "wet" | "bm" | "dry" | "used_potty";
  // meds
  medName: string;
  medDose: string;
  // health_check
  temperature: string;
  symptoms: string;
  // nap
  napStatus: "started" | "ended";
  // observation
  obsArea: "social" | "motor" | "language" | "emotional";
  // incident
  incidentDesc: string;
  injuryType: "none" | "bruise" | "cut" | "bite" | "fall" | "other";
  actionTaken: string;
  parentNotified: boolean;
}

function ActivityForm({ activityType, roomId, checkedInStudents, schoolId, userId, onClose, onSubmitted }: {
  activityType: ActivityType;
  roomId: string;
  checkedInStudents: StudentWithAttendance[];
  schoolId: string;
  userId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const [form, setForm] = useState<ActivityFormState>({
    studentId: "",
    date: today,
    time: currentTime,
    staffOnly: false,
    notes: "",
    foodType: "food",
    foodQty: "all",
    mealType: "breakfast",
    mealItem: "",
    pottyType: "wet",
    napStatus: "started",
    medName: "",
    medDose: "",
    temperature: "",
    symptoms: "",
    obsArea: "social",
    incidentDesc: "",
    injuryType: "none",
    actionTaken: "",
    parentNotified: false,
  });

  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activityType === "food") {
      supabase.from("food_items").select("*").eq("school_id", schoolId).order("name")
        .then(({ data }) => setFoodItems(data ?? []));
    }
  }, [activityType, schoolId]);

  function set<K extends keyof ActivityFormState>(key: K, val: ActivityFormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function buildData(): Record<string, unknown> {
    switch (activityType) {
      case "food":      return { food_type: form.foodType, quantity: form.foodQty, meal_type: form.mealType, meal_item: form.mealItem };
      case "potty":     return { potty_type: form.pottyType };
      case "meds":      return { medication: form.medName, dose: form.medDose };
      case "health_check": return { temperature: form.temperature, symptoms: form.symptoms };
      case "nap":         return { nap_status: form.napStatus };
      case "observation": return { area: form.obsArea };
      case "incident":  return { description: form.incidentDesc, injury_type: form.injuryType, action_taken: form.actionTaken, parent_notified: form.parentNotified };
      default:          return {};
    }
  }

  async function handleSubmit() {
    // Validation
    if (activityType === "note" && !form.notes.trim()) { setError("Note is required"); return; }
    if (activityType === "kudos" && !form.notes.trim()) { setError("Kudos message is required"); return; }
    if (activityType === "observation" && !form.notes.trim()) { setError("Note is required"); return; }
    if (activityType === "incident" && !form.incidentDesc.trim()) { setError("Description is required"); return; }

    setSaving(true);
    setError("");

    const targets: (string | null)[] =
      form.studentId === "" ? (checkedInStudents.length > 0 ? checkedInStudents.map(s => s.id) : [null]) : [form.studentId];

    const rows = targets.map(sid => ({
      school_id:     schoolId,
      room_id:       roomId,
      student_id:    sid,
      created_by:    userId,
      activity_type: activityType,
      activity_date: form.date,
      activity_time: form.time || null,
      staff_only:    activityType === "kudos" ? false : form.staffOnly,
      notes:         form.notes || null,
      data:          buildData(),
    }));

    const { error: err } = await supabase.from("activities").insert(rows);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSubmitted();
  }

  const label = ACTIVITY_GRID.find(a => a.type === activityType)?.label ?? activityType;

  const commonFields = (
    <>
      <div>
        <label className="label">Student</label>
        <select className="input" value={form.studentId} onChange={e => set("studentId", e.target.value)}>
          <option value="">All students</option>
          {checkedInStudents.map(s => (
            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={e => set("date", e.target.value)} />
        </div>
        <div>
          <label className="label">Time</label>
          <input type="time" className="input" value={form.time} onChange={e => set("time", e.target.value)} />
        </div>
      </div>
    </>
  );

  const notesField = (
    <div>
      <label className="label">Note</label>
      <textarea className="input" rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional note…" />
    </div>
  );

  const staffOnlyField = activityType !== "kudos" && (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
      <input type="checkbox" checked={form.staffOnly} onChange={e => set("staffOnly", e.target.checked)} className="rounded" />
      Staff only
    </label>
  );

  function typeFields() {
    switch (activityType) {
      case "food": return (
        <>
          <div>
            <label className="label">Food type</label>
            <div className="flex gap-3">
              {(["food","bottle"] as const).map(v => (
                <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" name="foodType" value={v} checked={form.foodType === v} onChange={() => set("foodType", v)} />
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Quantity</label>
            <div className="flex gap-3 flex-wrap">
              {(["all","most","some","none"] as const).map(v => (
                <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" name="foodQty" value={v} checked={form.foodQty === v} onChange={() => set("foodQty", v)} />
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Meal type</label>
            <select className="input" value={form.mealType} onChange={e => set("mealType", e.target.value)}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="am_snack">AM Snack</option>
              <option value="pm_snack">PM Snack</option>
            </select>
          </div>
          <div>
            <label className="label">Meal item</label>
            <select className="input" value={form.mealItem} onChange={e => set("mealItem", e.target.value)}>
              <option value="">— select —</option>
              {foodItems.map(fi => <option key={fi.id} value={fi.id}>{fi.name}</option>)}
            </select>
          </div>
          {notesField}
        </>
      );

      case "nap": return (
        <>
          <div>
            <label className="label">Nap status</label>
            <div className="flex gap-4 mt-1">
              {(["started", "ended"] as const).map(v => (
                <label key={v} className="flex items-center gap-2 cursor-pointer text-sm capitalize">
                  <input type="radio" name="napStatus" value={v} checked={form.napStatus === v} onChange={() => set("napStatus", v)} />
                  Nap {v}
                </label>
              ))}
            </div>
          </div>
          {notesField}
        </>
      );

      case "potty": return (
        <>
          <div>
            <label className="label">Type</label>
            <div className="flex gap-3 flex-wrap">
              {([
                { val: "wet", label: "Wet" },
                { val: "bm",  label: "BM"  },
                { val: "dry", label: "Dry" },
                { val: "used_potty", label: "Used potty" },
              ] as { val: "wet"|"bm"|"dry"|"used_potty"; label: string }[]).map(o => (
                <label key={o.val} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" name="pottyType" value={o.val} checked={form.pottyType === o.val} onChange={() => set("pottyType", o.val)} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          {notesField}
        </>
      );

      case "note": return (
        <div>
          <label className="label">Note *</label>
          <textarea className="input" rows={4} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Write your note…" />
        </div>
      );

      case "kudos": return (
        <div>
          <label className="label">Kudos message *</label>
          <textarea className="input" rows={4} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Share the shoutout…" />
        </div>
      );

      case "meds": return (
        <>
          <div>
            <label className="label">Medication name</label>
            <input className="input" value={form.medName} onChange={e => set("medName", e.target.value)} placeholder="e.g. Tylenol" />
          </div>
          <div>
            <label className="label">Dose amount</label>
            <input className="input" value={form.medDose} onChange={e => set("medDose", e.target.value)} placeholder="e.g. 5ml" />
          </div>
          {notesField}
        </>
      );

      case "health_check": return (
        <>
          <div>
            <label className="label">Temperature (°F)</label>
            <input type="number" step="0.1" className="input" value={form.temperature} onChange={e => set("temperature", e.target.value)} placeholder="e.g. 98.6" />
          </div>
          <div>
            <label className="label">Symptoms</label>
            <input className="input" value={form.symptoms} onChange={e => set("symptoms", e.target.value)} placeholder="e.g. runny nose" />
          </div>
          {notesField}
        </>
      );

      case "observation": return (
        <>
          <div>
            <label className="label">Area</label>
            <select className="input" value={form.obsArea} onChange={e => set("obsArea", e.target.value as typeof form.obsArea)}>
              <option value="social">Social</option>
              <option value="motor">Motor</option>
              <option value="language">Language</option>
              <option value="emotional">Emotional</option>
            </select>
          </div>
          <div>
            <label className="label">Note *</label>
            <textarea className="input" rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Describe the observation…" />
          </div>
        </>
      );

      case "photo":
      case "video": return (
        <>
          <div>
            <label className="label">File</label>
            <input ref={fileRef} type="file" accept={activityType === "photo" ? "image/*" : "video/*"} className="input" />
          </div>
          {notesField}
        </>
      );

      case "incident": return (
        <>
          <div>
            <label className="label">Description *</label>
            <textarea className="input" rows={3} value={form.incidentDesc} onChange={e => set("incidentDesc", e.target.value)} placeholder="What happened?" />
          </div>
          <div>
            <label className="label">Injury type</label>
            <select className="input" value={form.injuryType} onChange={e => set("injuryType", e.target.value as typeof form.injuryType)}>
              {(["none","bruise","cut","bite","fall","other"] as const).map(v => (
                <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Action taken</label>
            <input className="input" value={form.actionTaken} onChange={e => set("actionTaken", e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.parentNotified} onChange={e => set("parentNotified", e.target.checked)} className="rounded" />
            Parent notified
          </label>
          {notesField}
        </>
      );

      case "name_to_face": return <>{notesField}</>;

      default: return <>{notesField}</>;
    }
  }

  const submitLabel: Record<ActivityType, string> = {
    photo:        "Add photo",
    video:        "Add video",
    food:         "Add food",
    nap:          form.napStatus === "ended" ? "End nap" : "Start nap",
    potty:        "Add potty",
    note:         "Add note",
    kudos:        "Add kudos",
    meds:         "Add meds",
    name_to_face: "Add",
    incident:     "Add incident",
    health_check: "Add health check",
    observation:  "Add observation",
  };

  return (
    <Modal title={label} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        {commonFields}
        {typeFields()}
        {staffOnlyField}
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : submitLabel[activityType]}
        </button>
      </div>
    </Modal>
  );
}

// ─── Assign Student Modal ─────────────────────────────────────────────────────

function AssignStudentModal({ roomId, onClose, onAssigned }: {
  roomId: string;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [students, setStudents] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("students")
      .select("id,first_name,last_name")
      .neq("homeroom_id", roomId)
      .eq("enrollment_status", "active")
      .order("last_name")
      .then(({ data }) => setStudents(data ?? []));
  }, [roomId]);

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAssign() {
    if (!selected) return;
    setSaving(true);
    await supabase.from("students").update({ homeroom_id: roomId }).eq("id", selected);
    setSaving(false);
    onAssigned();
  }

  return (
    <Modal title="Add Student to Room" onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        <input
          className="input"
          placeholder="Search students…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="border border-gray-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 p-4 text-center">No students found</p>
          ) : (
            filtered.map(s => (
              <label
                key={s.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-orange-50 border-b border-gray-50 last:border-0
                  ${selected === s.id ? "bg-orange-50" : ""}`}
              >
                <input type="radio" name="assignStudent" value={s.id} checked={selected === s.id} onChange={() => setSelected(s.id)} />
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-semibold text-xs">
                  {s.first_name[0]}{s.last_name[0]}
                </div>
                <span className="text-sm font-medium text-gray-900">{s.first_name} {s.last_name}</span>
              </label>
            ))
          )}
        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleAssign} disabled={saving || !selected} className="btn-primary disabled:opacity-50">
          {saving ? "Saving…" : "Add to Room"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, school, profile: authProfile } = useAuth();
  const isAdmin = authProfile?.role === "admin";
  const today = new Date().toISOString().split("T")[0];

  const [room,       setRoom]       = useState<Room | null>(null);
  const [students,   setStudents]   = useState<StudentWithAttendance[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tab,        setTab]        = useState<"students" | "feed">("students");
  const [loading,    setLoading]    = useState(true);
  const [feedDate,   setFeedDate]   = useState(today);
  const [feedTypeFilter, setFeedTypeFilter] = useState<ActivityType | "">("");

  // Modal state
  const [showSettings,     setShowSettings]     = useState(false);
  const [showActivityPick, setShowActivityPick] = useState(false);
  const [activityType,     setActivityType]     = useState<ActivityType | null>(null);
  const [showAssign,       setShowAssign]       = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchRoom(), fetchStudents(), fetchActivities()]).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === "feed") fetchActivities();
  }, [feedDate, feedTypeFilter]);

  async function fetchRoom() {
    const { data } = await supabase.from("rooms").select("*").eq("id", id!).single();
    setRoom(data);
  }

  async function fetchStudents() {
    const { data: studs } = await supabase
      .from("students").select("*").eq("homeroom_id", id!).eq("enrollment_status", "active").order("last_name");
    if (!studs) return;
    const { data: att } = await supabase.from("attendance").select("*").eq("room_id", id!).eq("date", today);
    const attMap: Record<string, Attendance> = {};
    (att ?? []).forEach(a => { attMap[a.student_id] = a; });
    setStudents(studs.map(s => ({ ...s, attendance: attMap[s.id] })));
  }

  async function fetchActivities() {
    let q = supabase.from("activities").select("*").eq("room_id", id!).eq("activity_date", feedDate).order("created_at", { ascending: false });
    if (feedTypeFilter) q = q.eq("activity_type", feedTypeFilter);
    const { data } = await q;
    setActivities(data ?? []);
  }

  async function checkin(studentId: string) {
    const existing = students.find(s => s.id === studentId)?.attendance;
    if (existing) {
      await supabase.from("attendance").update({ status: "checked_in", checkin_time: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({ student_id: studentId, room_id: id!, date: today, status: "checked_in", checkin_time: new Date().toISOString() });
    }
    fetchStudents();
  }

  async function checkout(studentId: string) {
    const existing = students.find(s => s.id === studentId)?.attendance;
    if (existing) {
      await supabase.from("attendance").update({
        status: "checked_out",
        checkout_time: new Date().toISOString(),
      }).eq("id", existing.id);
    }
    fetchStudents();
  }

  async function markAbsent(studentId: string) {
    const existing = students.find(s => s.id === studentId)?.attendance;
    if (existing) {
      await supabase.from("attendance").update({ status: "absent" }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({ student_id: studentId, room_id: id!, date: today, status: "absent" });
    }
    fetchStudents();
  }

  if (loading) return <Layout><div className="p-10 text-center text-gray-400">Loading…</div></Layout>;
  if (!room)   return <Layout><div className="p-10 text-center text-gray-400">Room not found</div></Layout>;

  const checkedIn = students.filter(s => s.attendance?.status === "checked_in");

  const tabs = [
    { id: "students" as const, label: `Students (${students.length})` },
    { id: "feed"     as const, label: "Feed" },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <Link to="/rooms" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to Rooms
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Capacity: {room.capacity ?? "—"} · Ratio: 1:{room.ratio_children ?? "—"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">{checkedIn.length} in</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-500">{students.length} enrolled</span>

            {isAdmin && (
              <button
                onClick={() => setShowSettings(true)}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
              >
                <Settings size={14} /> Room settings
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowAssign(true)}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
              >
                <Plus size={14} /> Add Student
              </button>
            )}
            <button
              onClick={() => setShowActivityPick(true)}
              className="btn-primary inline-flex items-center gap-1.5 text-sm"
            >
              <Plus size={14} /> Add Activity
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                ${tab === t.id ? "border-orange-500 text-orange-500" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Students tab */}
        {tab === "students" && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">No students in this room</td></tr>
                ) : (
                  students.map(s => {
                    const status = s.attendance?.status;
                    return (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <Link to={`/students/${s.id}`} className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-semibold text-xs">
                              {s.first_name[0]}{s.last_name[0]}
                            </div>
                            <span className="font-medium text-gray-900 group-hover:text-orange-500">{s.first_name} {s.last_name}</span>
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          {/* Status badge */}
                          {status === "checked_in" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                              Present
                            </span>
                          )}
                          {status === "checked_out" && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              Checked out
                            </span>
                          )}
                          {status === "absent" && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                              Absent
                            </span>
                          )}
                          {!status && (
                            <span className="text-gray-300 text-xs">Not recorded</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {/* Not recorded or absent → Check In */}
                            {(!status || status === "absent" || status === "checked_out") && (
                              <button
                                onClick={() => checkin(s.id)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
                              >
                                <UserCheck size={12} /> Check In
                              </button>
                            )}
                            {/* Checked in → Check Out */}
                            {status === "checked_in" && (
                              <button
                                onClick={() => checkout(s.id)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 font-medium transition-colors"
                              >
                                <UserX size={12} /> Check Out
                              </button>
                            )}
                            {/* Mark absent — available unless already absent */}
                            {status !== "absent" && status !== "checked_out" && (
                              <button
                                onClick={() => markAbsent(s.id)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                              >
                                <UserX size={12} /> Mark Absent
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Feed tab */}
        {tab === "feed" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input type="date" value={feedDate} onChange={e => setFeedDate(e.target.value)} className="input w-auto" />
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-gray-400" />
                <select value={feedTypeFilter} onChange={e => setFeedTypeFilter(e.target.value as ActivityType | "")} className="input w-auto">
                  <option value="">All Types</option>
                  {ACTIVITY_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>

            {activities.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">No activities for this date</div>
            ) : (
              activities.map(a => (
                <div key={a.id} className={`card p-4 ${a.staff_only ? "border-l-4 border-l-amber-400" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500">{ACTIVITY_ICONS[a.activity_type]}</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide capitalize">
                        {a.activity_type.replace("_", " ")}
                      </span>
                      {a.staff_only && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Staff Only</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {a.activity_time ?? new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {a.notes && <p className="text-sm text-gray-700 mt-2">{a.notes}</p>}
                  {a.data && Object.keys(a.data).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                      {Object.entries(a.data).map(([k, v]) => (
                        <span key={k} className="mr-3"><strong>{k}:</strong> {String(v)}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showSettings && (
        <RoomSettingsModal
          room={room}
          onClose={() => setShowSettings(false)}
          onSaved={updated => { setRoom(updated); setShowSettings(false); }}
          onDeleted={() => navigate("/rooms")}
        />
      )}

      {showActivityPick && !activityType && (
        <ActivityTypePicker
          onClose={() => setShowActivityPick(false)}
          onSelect={type => setActivityType(type)}
        />
      )}

      {showActivityPick && activityType && school && user && (
        <ActivityForm
          activityType={activityType}
          roomId={id!}
          checkedInStudents={checkedIn}
          schoolId={school.id}
          userId={user.id}
          onClose={() => { setShowActivityPick(false); setActivityType(null); }}
          onSubmitted={() => {
            setShowActivityPick(false);
            setActivityType(null);
            setTab("feed");
            fetchActivities();
          }}
        />
      )}

      {showAssign && (
        <AssignStudentModal
          roomId={id!}
          onClose={() => setShowAssign(false)}
          onAssigned={() => { setShowAssign(false); fetchStudents(); }}
        />
      )}

      {/* Back button in activity form to go back to type picker */}
      {showActivityPick && activityType && (
        <button
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] inline-flex items-center gap-1.5 text-sm text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow hover:bg-gray-50"
          onClick={() => setActivityType(null)}
        >
          <ChevronRight size={13} className="rotate-180" /> Back
        </button>
      )}
    </Layout>
  );
}
