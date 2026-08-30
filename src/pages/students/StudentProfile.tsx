import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Eye, EyeOff, Plus, Shield, AlertTriangle,
  Pencil, X, Check, Coffee, Moon, MessageSquare, Image,
  Pill, Heart, Activity as ActivityIcon, Star, UserCheck, Trash2, Settings2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import {
  Student, StudentContact, StudentEmergencyContact,
  StudentImmunization, StudentEnrollmentDetails, Room,
  Activity, ActivityType, ContactType, PortalStatus,
} from "@/lib/types";

// ─── CDC Vaccine schedule ─────────────────────────────────────────────────────
const CDC_VACCINES = [
  { name: "Hep B — Hepatitis B",                  doses: 3, schedule: ["Birth","1-2 mos","6-18 mos"] },
  { name: "DTaP — Diphtheria, Tetanus, Pertussis", doses: 5, schedule: ["2 mos","4 mos","6 mos","15-18 mos","4-6 yrs"] },
  { name: "Hib — Haemophilus Influenzae Type B",   doses: 4, schedule: ["2 mos","4 mos","6 mos","12-15 mos"] },
  { name: "PCV — Pneumococcal Conjugate",          doses: 4, schedule: ["2 mos","4 mos","6 mos","12-15 mos"] },
  { name: "Polio",                                 doses: 4, schedule: ["2 mos","4 mos","6-18 mos","4-6 yrs"] },
  { name: "Rotavirus",                             doses: 3, schedule: ["2 mos","4 mos","6 mos"] },
  { name: "Covid — Coronavirus",                   doses: 2, schedule: ["6 mos","6-8 wks later"] },
  { name: "Flu — Seasonal Influenza",              doses: 1, schedule: ["Yearly"] },
  { name: "MMR — Measles, Mumps, Rubella",         doses: 2, schedule: ["12-15 mos","4-6 yrs"] },
  { name: "VAR — Varicella",                       doses: 2, schedule: ["12-15 mos","4-6 yrs"] },
  { name: "Hep A — Hepatitis A",                   doses: 2, schedule: ["12-23 mos","6-18 mos later"] },
];

// ─── Activity icons ───────────────────────────────────────────────────────────
const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  photo:        <Image size={14} />,
  video:        <Image size={14} />,
  food:         <Coffee size={14} />,
  nap:          <Moon size={14} />,
  potty:        <MessageSquare size={14} />,
  note:         <MessageSquare size={14} />,
  kudos:        <Star size={14} />,
  meds:         <Pill size={14} />,
  name_to_face: <UserCheck size={14} />,
  incident:     <AlertTriangle size={14} />,
  health_check: <Heart size={14} />,
  observation:  <ActivityIcon size={14} />,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  photo:        "bg-orange-100 text-orange-500",
  video:        "bg-orange-100 text-orange-500",
  food:         "bg-emerald-100 text-emerald-600",
  nap:          "bg-blue-100 text-blue-600",
  potty:        "bg-teal-100 text-teal-600",
  note:         "bg-gray-100 text-gray-600",
  kudos:        "bg-yellow-100 text-yellow-600",
  meds:         "bg-orange-100 text-orange-600",
  name_to_face: "bg-purple-100 text-purple-600",
  incident:     "bg-red-100 text-red-600",
  health_check: "bg-pink-100 text-pink-600",
  observation:  "bg-cyan-100 text-cyan-600",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function age(dob: string | null) {
  if (!dob) return "—";
  const months = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 24) return `${months} months`;
  const y = Math.floor(months / 12), m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y} years`;
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function activitySummary(a: Activity) {
  const d = a.data ?? {};
  const name = `${a.activity_type.charAt(0).toUpperCase()}${a.activity_type.slice(1).replace(/_/g, " ")}`;
  if (a.activity_type === "food")
    return `${d.meal_type ? String(d.meal_type).replace(/_/g, " ") : "Meal"} — ${d.food_quantity ?? ""} ${d.food_type === "bottle" ? "(bottle)" : ""}`.trim();
  if (a.activity_type === "nap")
    return d.nap_status === "started" ? "Nap started" : "Nap ended";
  if (a.activity_type === "potty")
    return `Potty — ${d.potty_type ?? ""}`;
  if (a.activity_type === "health_check")
    return d.health_temp ? `Temp: ${d.health_temp}°F` : "Health check";
  return a.notes ? `${name}: ${a.notes.slice(0, 60)}${a.notes.length > 60 ? "…" : ""}` : name;
}

// ─── Inline editable field ────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value || "—"}</p>
    </div>
  );
}

// ─── Section wrapper with Edit toggle ────────────────────────────────────────
function Section({
  title, badge, canEdit, editing, onEdit, onSave, onCancel, saving, children,
}: {
  title: string; badge?: string; canEdit: boolean;
  editing: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void;
  saving?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {badge && <span className="text-xs text-gray-400 flex items-center gap-1"><Shield size={10} />{badge}</span>}
        </div>
        {canEdit && !editing && (
          <button onClick={onEdit} className="text-xs text-orange-500 hover:underline flex items-center gap-1">
            <Pencil size={12} /> Edit
          </button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"><X size={12} /> Cancel</button>
            <button onClick={onSave} disabled={saving} className="text-xs text-orange-500 hover:text-orange-700 font-medium flex items-center gap-1">
              <Check size={12} />{saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="input w-full text-sm" />
    </div>
  );
}

// ─── Add Contact Modal ────────────────────────────────────────────────────────
// ─── Emergency contacts section ───────────────────────────────────────────────
function EmergencyContactsSection({
  studentId, contacts, canEdit, onChanged,
}: {
  studentId: string;
  contacts: StudentEmergencyContact[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd]   = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState({ full_name: "", relationship: "", phone: "" });
  const [saving, setSaving]     = useState(false);

  function startAdd() { setForm({ full_name: "", relationship: "", phone: "" }); setEditId(null); setShowAdd(true); }
  function startEdit(c: StudentEmergencyContact) { setForm({ full_name: c.full_name, relationship: c.relationship ?? "", phone: c.phone ?? "" }); setEditId(c.id); setShowAdd(true); }

  async function save() {
    if (!form.full_name.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from("student_emergency_contacts").update(form).eq("id", editId);
    } else {
      await supabase.from("student_emergency_contacts").insert({ student_id: studentId, ...form });
    }
    setSaving(false); setShowAdd(false); onChanged();
  }

  async function remove(id: string) {
    await supabase.from("student_emergency_contacts").delete().eq("id", id);
    onChanged();
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Emergency Contacts</h3>
          <p className="text-xs text-gray-400 mt-0.5">Minimum 2 required. Called if primary contacts are unreachable.</p>
        </div>
        {canEdit && !showAdd && (
          <button onClick={startAdd} className="text-xs text-orange-500 border border-orange-200 rounded px-2.5 py-1.5 flex items-center gap-1 hover:bg-orange-50">
            <Plus size={13} /> Add emergency contact
          </button>
        )}
      </div>

      {/* Inline add / edit form */}
      {showAdd && (
        <div className="px-5 py-4 border-b border-gray-100 bg-orange-50 space-y-3">
          <p className="text-xs font-medium text-orange-600">{editId ? "Edit emergency contact" : "Add emergency contact"}</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Full name *</label>
              <input className="input w-full text-sm" placeholder="Jane Smith" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Relationship</label>
              <input className="input w-full text-sm" placeholder="Grandmother, Aunt…" value={form.relationship} onChange={e => setForm(f => ({...f, relationship: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
              <input className="input w-full text-sm" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.full_name.trim()} className="btn-primary text-xs px-3 py-1.5">{saving ? "Saving…" : editId ? "Save changes" : "Add contact"}</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {contacts.length === 0 && !showAdd ? (
        <div className="px-5 py-6 text-center text-gray-400 text-sm">
          No emergency contacts yet. {canEdit && "Add at least 2."}
        </div>
      ) : contacts.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Relationship</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              {canEdit && <th className="px-5 py-3 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{c.full_name}</td>
                <td className="px-5 py-3 text-gray-600">{c.relationship || "—"}</td>
                <td className="px-5 py-3 text-gray-600">{c.phone || "—"}</td>
                {canEdit && (
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => startEdit(c)} className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => remove(c.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Immunization settings modal ─────────────────────────────────────────────
const VACCINE_NAMES = ["Hep B", "DTaP", "Hib", "PCV", "Polio", "Rotavirus", "Covid", "Flu", "MMR", "VAR", "Hep A"];

function ImmunizationSettingsModal({
  studentId, currentSettings, onApply, onClose,
}: {
  studentId: string;
  currentSettings: string[];
  onApply: (settings: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(currentSettings);
  const [saving, setSaving] = useState(false);

  function toggle(name: string) {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  async function apply() {
    setSaving(true);
    await supabase.from("students").update({ immunization_settings: selected }).eq("id", studentId);
    onApply(selected);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Immunization settings</h2>
            <p className="text-xs text-gray-500 mt-0.5">Which immunizations should appear on reports and student records?</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {VACCINE_NAMES.map(name => (
              <label key={name} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selected.includes(name)}
                  onChange={() => toggle(name)}
                  className="accent-orange-500 w-4 h-4"
                />
                <span className="text-sm text-gray-700">{name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button
            onClick={apply} disabled={saving}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Custom immunization section ──────────────────────────────────────────────
function CustomImmunizationSection({
  studentId, customRecords, canEdit, onChanged,
}: {
  studentId: string;
  customRecords: StudentImmunization[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ vaccine_name: "", dose_number: "1", administered_date: "", notes: "" });
  const [saving, setSaving]     = useState(false);
  const [error,  setError]      = useState("");

  // Group custom records by vaccine name
  const grouped: Record<string, StudentImmunization[]> = {};
  customRecords.forEach(r => {
    if (!grouped[r.vaccine_name]) grouped[r.vaccine_name] = [];
    grouped[r.vaccine_name].push(r);
  });

  async function addRecord() {
    if (!form.vaccine_name.trim()) { setError("Vaccine name is required."); return; }
    setSaving(true); setError("");
    const { error: err } = await supabase.from("student_immunizations").insert({
      student_id:        studentId,
      vaccine_name:      form.vaccine_name.trim(),
      dose_number:       parseInt(form.dose_number, 10),
      administered_date: form.administered_date || null,
      notes:             form.notes || null,
      exempt: false, skipped: false,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setForm({ vaccine_name: "", dose_number: "1", administered_date: "", notes: "" });
    setShowForm(false);
    onChanged();
  }

  async function deleteRecord(recId: string) {
    await supabase.from("student_immunizations").delete().eq("id", recId);
    onChanged();
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Custom / Additional Vaccines</h3>
          <p className="text-xs text-gray-400 mt-0.5">Vaccines not on the CDC schedule (e.g. travel vaccines, school-required extras)</p>
        </div>
        {canEdit && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs text-orange-500 hover:underline flex items-center gap-1">
            <Plus size={13} /> Add record
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-5 py-4 border-b border-gray-100 bg-orange-50 space-y-3">
          {error && <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Vaccine name *</label>
              <input className="input w-full text-sm" placeholder="e.g. Typhoid, Meningococcal" value={form.vaccine_name} onChange={e => setForm(f => ({...f, vaccine_name: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Dose #</label>
              <input className="input w-full text-sm" type="number" min="1" max="10" value={form.dose_number} onChange={e => setForm(f => ({...f, dose_number: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Date administered</label>
              <input className="input w-full text-sm" type="date" value={form.administered_date} onChange={e => setForm(f => ({...f, administered_date: e.target.value}))} />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Notes (optional)</label>
              <input className="input w-full text-sm" placeholder="e.g. Required for school program" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addRecord} disabled={saving} className="btn-primary text-xs px-3 py-1.5">{saving ? "Saving…" : "Add Record"}</button>
            <button onClick={() => { setShowForm(false); setError(""); }} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {/* Existing custom records */}
      {Object.keys(grouped).length === 0 && !showForm ? (
        <div className="px-5 py-6 text-center text-gray-400 text-sm">No custom records. {canEdit && 'Use "Add record" to log additional vaccines.'}</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-2 font-medium">Vaccine</th>
              <th className="px-5 py-2 font-medium">Dose</th>
              <th className="px-5 py-2 font-medium">Date</th>
              <th className="px-5 py-2 font-medium">Notes</th>
              {canEdit && <th className="px-5 py-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {customRecords.map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{r.vaccine_name}</td>
                <td className="px-5 py-3 text-gray-600">Dose {r.dose_number ?? "—"}</td>
                <td className="px-5 py-3 text-gray-600">
                  {r.administered_date
                    ? <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 font-medium">{new Date(r.administered_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"})}</span>
                    : <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">No date</span>}
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{r.notes || "—"}</td>
                {canEdit && (
                  <td className="px-5 py-3">
                    <button onClick={() => deleteRecord(r.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors" title="Delete record">
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Contact avatar ───────────────────────────────────────────────────────────
function ContactAvatar({ contact, size = 8 }: { contact: StudentContact; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full object-cover shrink-0`;
  if (contact.photo_url) return <img src={contact.photo_url} alt={contact.full_name} className={cls} />;
  return (
    <div className={`${cls} bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-xs`}>
      {contact.full_name?.[0]?.toUpperCase()}
    </div>
  );
}

// ─── Add / Edit Contact Modal ─────────────────────────────────────────────────
function ContactModal({ studentId, schoolId, initial, onClose, onSaved }: {
  studentId: string; schoolId: string;
  initial?: StudentContact;   // if provided → edit mode
  onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!initial?.id;  // true only when editing an existing contact (has a real id)

  // Invite URL state — generate a /register?token link for this contact
  const [inviteLink, setInviteLink]   = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied]   = useState(false);

  async function generateInviteLink() {
    setGeneratingLink(true);
    const { data } = await supabase
      .from("invitations")
      .insert({ school_id: schoolId, role: "parent", permanent: false,
        email: form.email || null, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      .select("token").single();
    if (data?.token) setInviteLink(`${window.location.origin}/register?token=${data.token}`);
    setGeneratingLink(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  const [form, setForm] = useState({
    full_name:         initial?.full_name         ?? "",
    type:              initial?.type              ?? "parent" as ContactType,
    email:             initial?.email             ?? "",
    phone:             initial?.phone             ?? "",
    is_primary:        initial?.is_primary        ?? false,
    can_pickup:        initial?.can_pickup        ?? true,
    // PIN is auto-generated on save — only pre-fill in edit mode
    pin_code:          initial?.pin_code          ?? "",  // read-only display in edit, not shown in add
    portal_status:     initial?.portal_status     ?? "not_signed_up" as PortalStatus,
    pickup_valid_from: initial?.pickup_valid_from ?? "",
    pickup_valid_to:   initial?.pickup_valid_to   ?? "",
    photo_url:         initial?.photo_url         ?? "",
  });
  const [photoFile,  setPhotoFile]  = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initial?.photo_url ?? "");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(contactId: string): Promise<string | null> {
    if (!photoFile) return form.photo_url || null;
    const ext  = photoFile.name.split(".").pop();
    const path = `${studentId}/${contactId}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("contact-photos")
      .upload(path, photoFile, { upsert: true });
    if (upErr) { setError(`Photo upload failed: ${upErr.message}`); return null; }
    const { data } = supabase.storage.from("contact-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function save() {
    if (!form.full_name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");

    // Auto-generate a unique 6-digit PIN for new contacts
    let pin = form.pin_code || null;
    if (!isEdit && !pin) {
      const { data: pinData } = await supabase.rpc("generate_unique_pin", { p_school_id: schoolId });
      pin = pinData as string ?? null;
    }

    const payload = {
      student_id: studentId, school_id: schoolId,
      full_name:         form.full_name,
      type:              form.type,
      email:             form.email || null,
      phone:             form.phone || null,
      is_primary:        form.is_primary,
      can_pickup:        form.can_pickup,
      pin_code:          pin,
      portal_status:     form.portal_status,
      pickup_valid_from: form.can_pickup && form.pickup_valid_from ? form.pickup_valid_from : null,
      pickup_valid_to:   form.can_pickup && form.pickup_valid_to   ? form.pickup_valid_to   : null,
    };

    let contactId = initial?.id ?? "";

    if (isEdit) {
      const { error: err } = await supabase.from("student_contacts").update(payload).eq("id", contactId);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { data, error: err } = await supabase.from("student_contacts").insert(payload).select("id").single();
      if (err) { setError(err.message); setSaving(false); return; }
      contactId = data.id;
    }

    if (photoFile) {
      const url = await uploadPhoto(contactId);
      if (url) await supabase.from("student_contacts").update({ photo_url: url }).eq("id", contactId);
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{isEdit ? "Edit Contact" : "Add Contact"}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

        {/* Photo upload */}
        <div className="flex items-center gap-4">
          {photoPreview ? (
            <img src={photoPreview} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-orange-200" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-xl border-2 border-dashed border-orange-200">
              {form.full_name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Profile photo</label>
            <label className="cursor-pointer btn-secondary text-xs px-3 py-1.5">
              {photoPreview ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            {form.can_pickup && <p className="text-xs text-amber-600 mt-1">⚠ Photo required for pickup authorization</p>}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name *</label>
            <input className="input w-full" placeholder="Jane Smith" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
              <select className="input w-full" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as ContactType}))}>
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
                <option value="grandparent">Grandparent</option>
                <option value="aunt_uncle">Aunt / Uncle</option>
                <option value="babysitter">Babysitter</option>
                <option value="nanny">Nanny</option>
                <option value="family_friend">Family Friend</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Portal Status</label>
              <select className="input w-full" value={form.portal_status} onChange={e => setForm(f => ({...f, portal_status: e.target.value as PortalStatus}))}>
                <option value="not_signed_up">Not signed up</option>
                <option value="invited">Invited</option>
                <option value="signed_up">Signed up</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
              <input className="input w-full" type="email" placeholder="jane@example.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
              <input className="input w-full" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
            </div>
          </div>
          {/* PIN is auto-generated on save for new contacts. Show read-only in edit mode. */}
          {isEdit && form.pin_code && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Check-in PIN</label>
              <p className="text-sm font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-600">{form.pin_code} <span className="text-xs text-gray-400 font-sans ml-2">(auto-generated)</span></p>
            </div>
          )}

          <hr className="border-gray-100" />

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.is_primary} onChange={e => setForm(f => ({...f, is_primary: e.target.checked}))} className="rounded" />
              Primary contact
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.can_pickup} onChange={e => setForm(f => ({...f, can_pickup: e.target.checked}))} className="rounded" />
              Approved for pickup
            </label>
          </div>

          {/* Pickup date range — shown only when can_pickup is checked */}
          {form.can_pickup && (
            <div className="bg-orange-50 rounded-lg p-4 space-y-3 border border-orange-100">
              <p className="text-xs font-medium text-orange-600">Pickup Authorization Period (optional)</p>
              <p className="text-xs text-orange-500">Leave blank for permanent authorization. Set dates for temporary pickups (e.g. grandparent visiting for a week).</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Valid From</label>
                  <input type="date" className="input w-full" value={form.pickup_valid_from} onChange={e => setForm(f => ({...f, pickup_valid_from: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Valid To</label>
                  <input type="date" className="input w-full" value={form.pickup_valid_to} onChange={e => setForm(f => ({...f, pickup_valid_to: e.target.value}))} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Invite URL — only for Parent / Guardian contacts ── */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="text-xs font-medium text-gray-600">Portal Access</p>
          {(form.type === "parent" || form.type === "guardian") ? (
            <>
              {!inviteLink ? (
                <div>
                  <button
                    type="button"
                    onClick={generateInviteLink}
                    disabled={generatingLink}
                    className="flex items-center gap-2 text-xs text-orange-600 border border-orange-200 rounded-lg px-3 py-1.5 hover:bg-orange-50 disabled:opacity-50"
                  >
                    {generatingLink ? "Generating…" : "🔗 Generate Invite URL"}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">
                    Creates a 7-day registration link. Parent/guardian uses it to set up their portal login.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-600 truncate flex-1 font-mono">{inviteLink}</span>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="text-xs text-orange-600 font-medium shrink-0 flex items-center gap-1 hover:text-orange-700"
                    >
                      {linkCopied ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Link expires in 7 days. Send it directly to the contact.</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400 italic">
              Portal access is only available for Parent and Guardian contacts.
              {form.type ? ` "${form.type.replace(/_/g, " ")}" contacts cannot log in to the portal.` : ""}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? "Saving…" : isEdit ? "Save Changes" : "Add Contact"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Activity Modal ──────────────────────────────────────────────────────
function EditActivityModal({ activity, onClose, onSaved }: {
  activity: Activity;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [notes, setNotes]       = useState(activity.notes ?? "");
  const [staffOnly, setStaffOnly] = useState(activity.staff_only ?? false);
  const [data, setData]         = useState<Record<string, unknown>>(
    (activity.data as Record<string, unknown>) ?? {}
  );
  const [saving, setSaving]     = useState(false);

  function setD(key: string, value: unknown) {
    setData(d => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true);
    await supabase
      .from("activities")
      .update({ notes: notes || null, staff_only: staffOnly, data })
      .eq("id", activity.id);
    setSaving(false);
    onSaved();
  }

  const t = activity.activity_type;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 capitalize">
            Edit {t.replace(/_/g, " ")} entry
          </h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          {/* food fields */}
          {t === "food" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Food type</label>
                  <select className="input w-full text-sm" value={String(data.food_type ?? "food")} onChange={e => setD("food_type", e.target.value)}>
                    <option value="food">Food</option>
                    <option value="bottle">Bottle</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity</label>
                  <select className="input w-full text-sm" value={String(data.food_quantity ?? "")} onChange={e => setD("food_quantity", e.target.value)}>
                    <option value="">—</option>
                    <option value="All">All</option>
                    <option value="Most">Most</option>
                    <option value="Some">Some</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Meal type</label>
                  <select className="input w-full text-sm" value={String(data.meal_type ?? "")} onChange={e => setD("meal_type", e.target.value)}>
                    <option value="">—</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="am_snack">AM Snack</option>
                    <option value="lunch">Lunch</option>
                    <option value="pm_snack">PM Snack</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Items</label>
                  <input className="input w-full text-sm" value={String(data.meal_items ?? "")} onChange={e => setD("meal_items", e.target.value)} placeholder="e.g. banana, crackers" />
                </div>
              </div>
            </>
          )}

          {/* nap fields */}
          {t === "nap" && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
              <select className="input w-full text-sm" value={String(data.nap_status ?? "started")} onChange={e => setD("nap_status", e.target.value)}>
                <option value="started">Started</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          )}

          {/* potty fields */}
          {t === "potty" && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
              <select className="input w-full text-sm" value={String(data.potty_type ?? "")} onChange={e => setD("potty_type", e.target.value)}>
                <option value="">—</option>
                <option value="wet">Wet</option>
                <option value="bm">BM</option>
                <option value="dry">Dry</option>
                <option value="used potty">Used potty</option>
              </select>
            </div>
          )}

          {/* meds fields */}
          {t === "meds" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Medication name</label>
                <input className="input w-full text-sm" value={String(data.med_name ?? "")} onChange={e => setD("med_name", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Dose</label>
                <input className="input w-full text-sm" value={String(data.med_dose ?? "")} onChange={e => setD("med_dose", e.target.value)} />
              </div>
            </div>
          )}

          {/* health_check fields */}
          {t === "health_check" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Temperature (°F)</label>
                <input className="input w-full text-sm" type="number" step="0.1" value={String(data.health_temp ?? "")} onChange={e => setD("health_temp", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Symptoms</label>
                <input className="input w-full text-sm" value={String(data.symptoms ?? "")} onChange={e => setD("symptoms", e.target.value)} />
              </div>
            </div>
          )}

          {/* observation fields */}
          {t === "observation" && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Area</label>
              <input className="input w-full text-sm" value={String(data.observation_area ?? "")} onChange={e => setD("observation_area", e.target.value)} />
            </div>
          )}

          {/* incident fields */}
          {t === "incident" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Incident type</label>
                <input className="input w-full text-sm" value={String(data.incident_type ?? "")} onChange={e => setD("incident_type", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Action taken</label>
                <input className="input w-full text-sm" value={String(data.action_taken ?? "")} onChange={e => setD("action_taken", e.target.value)} />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={Boolean(data.parent_notified)} onChange={e => setD("parent_notified", e.target.checked)} className="rounded" />
                  Parent notified
                </label>
              </div>
            </div>
          )}

          {/* notes textarea — shown for all types */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
            <textarea
              className="input w-full text-sm min-h-[80px] resize-y"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes…"
            />
          </div>

          {/* staff only checkbox */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={staffOnly} onChange={e => setStaffOnly(e.target.checked)} className="rounded" />
            Staff only (hidden from parents)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type Tab = "profile" | "contacts" | "immunizations" | "daily_report" | "documents";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const { profile: authProfile, school } = useAuth();
  const isAdmin   = authProfile?.role === "admin";
  const isParent  = authProfile?.role === "parent";
  const canEdit   = isAdmin || isParent;

  const [student,      setStudent]      = useState<Student | null>(null);
  const [room,         setRoom]         = useState<Room | null>(null);
  const [allRooms,     setAllRooms]     = useState<Room[]>([]);
  const [draftRoom,    setDraftRoom]    = useState<string>("");
  const [contacts,     setContacts]     = useState<StudentContact[]>([]);
  const [emergency,    setEmergency]    = useState<StudentEmergencyContact[]>([]);
  const [enrollment,   setEnrollment]   = useState<StudentEnrollmentDetails | null>(null);
  const [immunizations,setImmunizations]= useState<StudentImmunization[]>([]);
  const [activities,   setActivities]   = useState<Activity[]>([]);
  const [tab,          setTab]          = useState<Tab>("profile");
  const [loading,      setLoading]      = useState(true);
  const [revealPin,    setRevealPin]    = useState<Record<string, boolean>>({});
  const [contactModal, setContactModal] = useState<{ open: boolean; contact?: StudentContact }>({ open: false });

  // Edit states — which section is being edited
  const [editSection, setEditSection] = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);

  // Edit draft values
  const [draftPersonal,   setDraftPersonal]   = useState<Partial<Student>>({});
  const [draftAddress,    setDraftAddress]    = useState<Record<string, string>>({});
  const [draftSchool,     setDraftSchool]     = useState<Partial<Student>>({});
  const [draftEnrollment, setDraftEnrollment] = useState<Partial<StudentEnrollmentDetails>>({});
  const [draftFinancial,  setDraftFinancial]  = useState<Partial<StudentEnrollmentDetails>>({});
  const [feedDate, setFeedDate] = useState(new Date().toISOString().split("T")[0]);
  const [immunizationSettings, setImmunizationSettings] = useState<string[]>(VACCINE_NAMES);
  const [showImmSettings, setShowImmSettings] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [confirmDelete, setConfirmDelete]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadAll();
  }, [id]);

  async function loadAll() {
    const [{ data: s }, { data: c }, { data: e }, { data: enr }, { data: imm }] = await Promise.all([
      supabase.from("students").select("*").eq("id", id!).single(),
      supabase.from("student_contacts").select("*").eq("student_id", id!).order("is_primary", { ascending: false }),
      supabase.from("student_emergency_contacts").select("*").eq("student_id", id!),
      supabase.from("student_enrollment_details").select("*").eq("student_id", id!).single(),
      supabase.from("student_immunizations").select("*").eq("student_id", id!).order("vaccine_name"),
    ]);
    setStudent(s); setContacts(c ?? []); setEmergency(e ?? []);
    setEnrollment(enr ?? null); setImmunizations(imm ?? []);
    // Load immunization settings (fall back to all vaccines)
    const settings = (s as (typeof s & { immunization_settings?: string[] }))?.immunization_settings;
    setImmunizationSettings(Array.isArray(settings) && settings.length > 0 ? settings : VACCINE_NAMES);
    // Fetch current homeroom
    if (s?.homeroom_id) {
      const { data: r } = await supabase.from("rooms").select("*").eq("id", s.homeroom_id).single();
      setRoom(r);
    } else {
      setRoom(null);
    }
    // Always fetch all rooms so admin can reassign
    if (authProfile?.school_id) {
      const { data: rooms } = await supabase.from("rooms").select("*").eq("school_id", authProfile.school_id).order("name");
      setAllRooms(rooms ?? []);
    }
    setLoading(false);
  }

  async function saveRoom() {
    setSaving(true);
    await supabase.from("students").update({ homeroom_id: draftRoom || null }).eq("id", id!);
    await loadAll();
    setEditSection(null);
    setSaving(false);
  }

  async function doDeleteActivity(actId: string) {
    await supabase.from("activities").delete().eq("id", actId);
    setConfirmDelete(null);
    loadActivities(feedDate);
  }

  async function loadActivities(date: string) {
    const { data } = await supabase.from("activities")
      .select("*")
      .eq("student_id", id!)
      .eq("activity_date", date)
      .order("activity_time", { ascending: false });
    setActivities(data ?? []);
  }

  useEffect(() => { if (tab === "daily_report") loadActivities(feedDate); }, [tab, feedDate]);

  // ── Save helpers ────────────────────────────────────────────────────────────
  async function savePersonal() {
    setSaving(true);
    await supabase.from("students").update(draftPersonal).eq("id", id!);
    await loadAll(); setEditSection(null); setSaving(false);
  }

  async function saveAddress() {
    setSaving(true);
    await supabase.from("students").update({ address: draftAddress }).eq("id", id!);
    await loadAll(); setEditSection(null); setSaving(false);
  }

  async function saveSchool() {
    setSaving(true);
    await supabase.from("students").update(draftSchool).eq("id", id!);
    await loadAll(); setEditSection(null); setSaving(false);
  }

  async function saveEnrollment() {
    setSaving(true);
    await supabase.from("student_enrollment_details").upsert({ student_id: id!, ...draftEnrollment }, { onConflict: "student_id" });
    await loadAll(); setEditSection(null); setSaving(false);
  }

  async function saveFinancial() {
    setSaving(true);
    await supabase.from("student_enrollment_details").upsert({ student_id: id!, ...draftFinancial }, { onConflict: "student_id" });
    await loadAll(); setEditSection(null); setSaving(false);
  }

  function startEdit(section: string) {
    if (!student) return;
    if (section === "personal") setDraftPersonal({
      first_name: student.first_name, last_name: student.last_name,
      preferred_name: student.preferred_name ?? "", dob: student.dob ?? "",
      gender: student.gender ?? "", race: student.race ?? "",
      ethnicity: student.ethnicity ?? "", allergies: student.allergies ?? "",
      notes: student.notes ?? "", medications: student.medications ?? "",
      doctor_name: student.doctor_name ?? "", doctor_phone: student.doctor_phone ?? "",
    });
    if (section === "address") {
      const a = (student.address as Record<string, string>) ?? {};
      setDraftAddress({ street: a.street ?? "", city: a.city ?? "", state: a.state ?? "", zip: a.zip ?? "" });
    }
    if (section === "school") setDraftSchool({
      enrollment_status: student.enrollment_status,
      meal_type: student.meal_type ?? "",
      student_id_internal: student.student_id_internal ?? "",
    });
    if (section === "enrollment") setDraftEnrollment({
      first_contact_date: enrollment?.first_contact_date ?? "",
      toured_date: enrollment?.toured_date ?? "",
      paperwork_date: enrollment?.paperwork_date ?? "",
      desired_start_date: enrollment?.desired_start_date ?? "",
      graduation_date: enrollment?.graduation_date ?? "",
      sibling_name: enrollment?.sibling_name ?? "",
      programs: enrollment?.programs ?? "",
      additional_details: enrollment?.additional_details ?? "",
    });
    if (section === "financial") setDraftFinancial({
      subsidy: enrollment?.subsidy ?? false,
      subsidy_details: enrollment?.subsidy_details ?? "",
    });
    setEditSection(section);
  }

  if (loading) return <Layout><div className="p-10 text-center text-gray-400">Loading student profile…</div></Layout>;
  if (!student) return <Layout><div className="p-10 text-center text-gray-400">Student not found</div></Layout>;

  const TABS: { id: Tab; label: string }[] = [
    { id: "profile",       label: "Profile" },
    { id: "contacts",      label: "Contacts" },
    { id: "immunizations", label: "Immunizations" },
    { id: "daily_report",  label: "Daily Report" },
    { id: "documents",     label: "Documents" },
  ];

  const immMap: Record<string, StudentImmunization> = {};
  immunizations.forEach(i => { immMap[`${i.vaccine_name}:${i.dose_number}`] = i; });

  const addr = (student.address as Record<string, string>) ?? {};

  return (
    <Layout>
      {showImmSettings && (
        <ImmunizationSettingsModal
          studentId={student.id}
          currentSettings={immunizationSettings}
          onApply={(settings) => { setImmunizationSettings(settings); setShowImmSettings(false); }}
          onClose={() => setShowImmSettings(false)}
        />
      )}

      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSaved={() => { setEditingActivity(null); loadActivities(feedDate); }}
        />
      )}

      {contactModal.open && student.school_id && (
        <ContactModal
          studentId={student.id} schoolId={student.school_id}
          initial={contactModal.contact}
          onClose={() => setContactModal({ open: false })}
          onSaved={() => { setContactModal({ open: false }); loadAll(); }}
        />
      )}

      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <Link to="/students" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to Students
        </Link>

        {/* Header */}
        <div className="card p-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-xl shrink-0">
            {student.first_name[0]}{student.last_name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                {student.first_name} {student.last_name}
                {student.preferred_name && <span className="text-gray-400 font-normal ml-2">"{student.preferred_name}"</span>}
              </h1>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize
                ${student.enrollment_status === "active"   ? "bg-emerald-100 text-emerald-700" :
                  student.enrollment_status === "waitlist" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                {student.enrollment_status}
              </span>
              {student.allergies && student.allergies !== "None" && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                  <AlertTriangle size={11} /> Allergy
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {student.dob && <>Born {fmt(student.dob)} · Age {age(student.dob)}</>}
              {room && <span className="ml-3 text-orange-500">📍 {room.name}</span>}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap
                ${tab === t.id ? "border-orange-500 text-orange-500" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ────────────────────────────────────────────────────── */}
        {tab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left column */}
            <div className="space-y-5">
              {/* Personal information */}
              <Section title="Personal information" canEdit={canEdit}
                editing={editSection === "personal"} saving={saving}
                onEdit={() => startEdit("personal")}
                onSave={savePersonal} onCancel={() => setEditSection(null)}>
                {editSection === "personal" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First name"  value={String(draftPersonal.first_name  ?? "")} onChange={v => setDraftPersonal(d => ({...d, first_name: v}))} />
                    <Input label="Last name"   value={String(draftPersonal.last_name   ?? "")} onChange={v => setDraftPersonal(d => ({...d, last_name: v}))} />
                    <Input label="Preferred name" value={String(draftPersonal.preferred_name ?? "")} onChange={v => setDraftPersonal(d => ({...d, preferred_name: v}))} />
                    <Input label="Date of birth" type="date" value={String(draftPersonal.dob ?? "")} onChange={v => setDraftPersonal(d => ({...d, dob: v}))} />
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5 block">Gender</label>
                      <select className="input w-full text-sm" value={String(draftPersonal.gender ?? "")} onChange={e => setDraftPersonal(d => ({...d, gender: e.target.value}))}>
                        <option value="">—</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    <Input label="Race"        value={String(draftPersonal.race        ?? "")} onChange={v => setDraftPersonal(d => ({...d, race: v}))} />
                    <Input label="Ethnicity"   value={String(draftPersonal.ethnicity   ?? "")} onChange={v => setDraftPersonal(d => ({...d, ethnicity: v}))} />
                    <div className="col-span-2"><Input label="Allergies"  value={String(draftPersonal.allergies  ?? "")} onChange={v => setDraftPersonal(d => ({...d, allergies: v}))} /></div>
                    <div className="col-span-2"><Input label="Notes"      value={String(draftPersonal.notes      ?? "")} onChange={v => setDraftPersonal(d => ({...d, notes: v}))} /></div>
                    <div className="col-span-2"><Input label="Medications" value={String(draftPersonal.medications ?? "")} onChange={v => setDraftPersonal(d => ({...d, medications: v}))} /></div>
                    <Input label="Doctor"       value={String(draftPersonal.doctor_name  ?? "")} onChange={v => setDraftPersonal(d => ({...d, doctor_name: v}))} />
                    <Input label="Doctor phone" value={String(draftPersonal.doctor_phone ?? "")} onChange={v => setDraftPersonal(d => ({...d, doctor_phone: v}))} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Name"       value={`${student.first_name} ${student.last_name}`} />
                    <Field label="Birthday"   value={fmt(student.dob)} />
                    <Field label="Age"        value={age(student.dob)} />
                    <Field label="Gender"     value={student.gender} />
                    <Field label="Race"       value={student.race} />
                    <Field label="Ethnicity"  value={student.ethnicity} />
                    <div className="col-span-2">
                      {student.allergies && student.allergies !== "None" ? (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Allergies</p>
                          <p className="text-sm font-medium text-red-700 bg-red-50 rounded px-2 py-1 flex items-center gap-1.5">
                            <AlertTriangle size={12} />{student.allergies}
                          </p>
                        </div>
                      ) : <Field label="Allergies" value={student.allergies} />}
                    </div>
                    <div className="col-span-2"><Field label="Notes"      value={student.notes} /></div>
                    <div className="col-span-2"><Field label="Medications" value={student.medications} /></div>
                    <Field label="Doctor"       value={student.doctor_name} />
                    <Field label="Doctor phone" value={student.doctor_phone} />
                  </div>
                )}
              </Section>

              {/* Address */}
              <Section title="Address" canEdit={canEdit}
                editing={editSection === "address"} saving={saving}
                onEdit={() => startEdit("address")}
                onSave={saveAddress} onCancel={() => setEditSection(null)}>
                {editSection === "address" ? (
                  <div className="space-y-3">
                    <Input label="Street"  value={draftAddress.street  ?? ""} onChange={v => setDraftAddress(d => ({...d, street: v}))} />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1"><Input label="City"  value={draftAddress.city  ?? ""} onChange={v => setDraftAddress(d => ({...d, city: v}))} /></div>
                      <Input label="State" value={draftAddress.state ?? ""} onChange={v => setDraftAddress(d => ({...d, state: v}))} />
                      <Input label="ZIP"   value={draftAddress.zip   ?? ""} onChange={v => setDraftAddress(d => ({...d, zip: v}))} />
                    </div>
                  </div>
                ) : (
                  addr.street
                    ? <div className="text-sm text-gray-900 space-y-0.5"><p>{addr.street}</p><p>{addr.city}, {addr.state} {addr.zip}</p></div>
                    : <p className="text-sm text-gray-400">—</p>
                )}
              </Section>

              {/* Financial — admin only */}
              {isAdmin && (
                <Section title="Financial details" badge="Not visible to parents" canEdit={isAdmin}
                  editing={editSection === "financial"} saving={saving}
                  onEdit={() => startEdit("financial")}
                  onSave={saveFinancial} onCancel={() => setEditSection(null)}>
                  {editSection === "financial" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5 block">Subsidy</label>
                        <select className="input w-full text-sm" value={draftFinancial.subsidy ? "yes" : "no"} onChange={e => setDraftFinancial(d => ({...d, subsidy: e.target.value === "yes"}))}>
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>
                      <Input label="Subsidy details" value={draftFinancial.subsidy_details ?? ""} onChange={v => setDraftFinancial(d => ({...d, subsidy_details: v}))} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Family income"  value={enrollment?.family_income ? `$${enrollment.family_income.toLocaleString()}/yr` : null} />
                      <Field label="Subsidy"        value={enrollment?.subsidy === true ? "Yes" : enrollment?.subsidy === false ? "No" : null} />
                      <div className="col-span-2"><Field label="Subsidy details" value={enrollment?.subsidy_details} /></div>
                    </div>
                  )}
                </Section>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Rooms — admin only, editable */}
              {isAdmin && (
                <Section title="Rooms" badge="Not visible to parents" canEdit={isAdmin}
                  editing={editSection === "room"} saving={saving}
                  onEdit={() => { setDraftRoom(student.homeroom_id ?? ""); setEditSection("room"); }}
                  onSave={saveRoom} onCancel={() => setEditSection(null)}>
                  {editSection === "room" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1 block">Homeroom</label>
                        <select
                          className="input w-full"
                          value={draftRoom}
                          onChange={e => setDraftRoom(e.target.value)}
                        >
                          <option value="">— No room assigned —</option>
                          {allRooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        {draftRoom && (() => {
                          const selected = allRooms.find(r => r.id === draftRoom);
                          return selected ? (
                            <p className="text-xs text-gray-500 mt-1">
                              Age {selected.age_range_min_months ?? "?"}–{selected.age_range_max_months ?? "?"} months · Capacity {selected.capacity ?? "?"} · Ratio 1:{selected.ratio_children ?? "?"}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Field label="Homeroom" value={room?.name} />
                        {room && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Age {room.age_range_min_months ?? "?"}–{room.age_range_max_months ?? "?"} mo · Cap {room.capacity ?? "?"}
                          </p>
                        )}
                      </div>
                      <Field label="Others" value="—" />
                    </div>
                  )}
                </Section>
              )}

              {/* School details — admin only */}
              {isAdmin && (
                <Section title="School details" badge="Not visible to parents" canEdit={isAdmin}
                  editing={editSection === "school"} saving={saving}
                  onEdit={() => startEdit("school")}
                  onSave={saveSchool} onCancel={() => setEditSection(null)}>
                  {editSection === "school" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5 block">Status</label>
                        <select className="input w-full text-sm" value={String(draftSchool.enrollment_status ?? "")} onChange={e => setDraftSchool(d => ({...d, enrollment_status: e.target.value as Student["enrollment_status"]}))}>
                          <option value="active">Active</option>
                          <option value="waitlist">Waitlist</option>
                          <option value="withdrawn">Withdrawn</option>
                          <option value="graduated">Graduated</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5 block">Meal type</label>
                        <select className="input w-full text-sm" value={String(draftSchool.meal_type ?? "")} onChange={e => setDraftSchool(d => ({...d, meal_type: e.target.value}))}>
                          <option value="">—</option>
                          <option value="provided">Provided</option>
                          <option value="brings_own">Brings own</option>
                          <option value="formula">Formula</option>
                          <option value="not_specified">Not specified</option>
                        </select>
                      </div>
                      <Input label="Student ID" value={String(draftSchool.student_id_internal ?? "")} onChange={v => setDraftSchool(d => ({...d, student_id_internal: v}))} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Status"     value={student.enrollment_status} />
                      <Field label="Meal type"  value={student.meal_type?.replace(/_/g, " ")} />
                      <Field label="Student ID" value={student.student_id_internal} />
                      <Field label="Schedule"   value={student.schedule_days?.join(", ")} />
                    </div>
                  )}
                </Section>
              )}

              {/* Enrollment details — admin only */}
              {isAdmin && (
                <Section title="Enrollment details" badge="Not visible to parents" canEdit={isAdmin}
                  editing={editSection === "enrollment"} saving={saving}
                  onEdit={() => startEdit("enrollment")}
                  onSave={saveEnrollment} onCancel={() => setEditSection(null)}>
                  {editSection === "enrollment" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="First contact date"  type="date" value={draftEnrollment.first_contact_date  ?? ""} onChange={v => setDraftEnrollment(d => ({...d, first_contact_date: v}))} />
                      <Input label="Toured date"         type="date" value={draftEnrollment.toured_date         ?? ""} onChange={v => setDraftEnrollment(d => ({...d, toured_date: v}))} />
                      <Input label="Paperwork date"      type="date" value={draftEnrollment.paperwork_date      ?? ""} onChange={v => setDraftEnrollment(d => ({...d, paperwork_date: v}))} />
                      <Input label="Desired start date"  type="date" value={draftEnrollment.desired_start_date  ?? ""} onChange={v => setDraftEnrollment(d => ({...d, desired_start_date: v}))} />
                      <Input label="Graduation date"     type="date" value={draftEnrollment.graduation_date     ?? ""} onChange={v => setDraftEnrollment(d => ({...d, graduation_date: v}))} />
                      <Input label="Sibling attending"   value={draftEnrollment.sibling_name    ?? ""} onChange={v => setDraftEnrollment(d => ({...d, sibling_name: v}))} />
                      <div className="col-span-2"><Input label="Programs"         value={draftEnrollment.programs         ?? ""} onChange={v => setDraftEnrollment(d => ({...d, programs: v}))} /></div>
                      <div className="col-span-2"><Input label="Additional details" value={draftEnrollment.additional_details ?? ""} onChange={v => setDraftEnrollment(d => ({...d, additional_details: v}))} /></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="First contact"   value={fmt(enrollment?.first_contact_date  ?? null)} />
                      <Field label="Toured"          value={fmt(enrollment?.toured_date         ?? null)} />
                      <Field label="Paperwork"       value={fmt(enrollment?.paperwork_date      ?? null)} />
                      <Field label="Desired start"   value={fmt(enrollment?.desired_start_date  ?? null)} />
                      <Field label="Start date"      value={fmt(student.start_date              ?? null)} />
                      <Field label="Graduation"      value={fmt(enrollment?.graduation_date     ?? null)} />
                      <Field label="Sibling"         value={enrollment?.sibling_name} />
                      <Field label="Programs"        value={enrollment?.programs} />
                      <div className="col-span-2"><Field label="Additional details" value={enrollment?.additional_details} /></div>
                    </div>
                  )}
                </Section>
              )}
            </div>
          </div>
        )}

        {/* ── CONTACTS TAB ───────────────────────────────────────────────────── */}
        {tab === "contacts" && (() => {
          const today = new Date().toISOString().split("T")[0];

          function pickupStatus(c: StudentContact): { label: string; color: string } {
            if (!c.pickup_valid_from && !c.pickup_valid_to) return { label: "Permanent", color: "bg-emerald-100 text-emerald-700" };
            if (c.pickup_valid_to && c.pickup_valid_to < today) return { label: "Expired", color: "bg-red-100 text-red-700" };
            if (c.pickup_valid_from && c.pickup_valid_from > today) return { label: "Future", color: "bg-amber-100 text-amber-700" };
            return { label: "Active", color: "bg-emerald-100 text-emerald-700" };
          }


          return (
            <div className="space-y-6">
              {/* ── All Contacts — single unified table ── */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Contacts</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Parents, guardians, and approved pickup people. Pickup rows are highlighted.</p>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <button onClick={() => setContactModal({ open: true })}
                        className="text-xs text-orange-500 border border-orange-200 rounded px-2.5 py-1.5 flex items-center gap-1 hover:bg-orange-50">
                        <Plus size={13} /> Add contact
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={() => setContactModal({ open: true, contact: { can_pickup: true } as StudentContact })}
                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                        <Plus size={13} /> Add pickup
                      </button>
                    )}
                  </div>
                </div>

                {contacts.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">No contacts yet</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-3 font-medium">Contact</th>
                        <th className="px-4 py-3 font-medium">Phone / Email</th>
                        <th className="px-4 py-3 font-medium">Pickup / Valid period</th>
                        {isAdmin && <th className="px-4 py-3 font-medium">Check-in code</th>}
                        <th className="px-4 py-3 font-medium">Portal</th>
                        {canEdit && <th className="px-4 py-3 font-medium" />}
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map(c => {
                        const ps = c.can_pickup ? pickupStatus(c) : null;
                        return (
                          <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 ${c.can_pickup ? "bg-emerald-50/40" : ""}`}>
                            {/* Name + photo */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <ContactAvatar contact={c} size={9} />
                                  {c.can_pickup && !c.photo_url && (
                                    <span title="Photo required for pickup" className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                                      <AlertTriangle size={8} className="text-white" />
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm flex items-center gap-1 flex-wrap">
                                    {c.full_name}
                                    {c.is_primary && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Primary</span>}
                                  </p>
                                  <p className="text-xs text-gray-400 capitalize">{c.type}</p>
                                </div>
                              </div>
                            </td>
                            {/* Phone / Email */}
                            <td className="px-4 py-3 text-xs text-gray-600">
                              <div>{c.phone || "—"}</div>
                              <div className="text-gray-400">{c.email || ""}</div>
                            </td>
                            {/* Pickup + valid period */}
                            <td className="px-4 py-3 text-xs">
                              {c.can_pickup ? (
                                <div className="space-y-0.5">
                                  {ps && <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${ps.color}`}>{ps.label}</span>}
                                  <div className="text-gray-500">
                                    {c.pickup_valid_from || c.pickup_valid_to
                                      ? <>{c.pickup_valid_from ? fmt(c.pickup_valid_from) : "—"} → {c.pickup_valid_to ? fmt(c.pickup_valid_to) : "ongoing"}</>
                                      : "Permanent"}
                                  </div>
                                </div>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                            {/* Check-in code (admin only) */}
                            {isAdmin && (
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-sm">{revealPin[c.id] ? (c.pin_code ?? "—") : "••••"}</span>
                                  <button onClick={() => setRevealPin(p => ({...p, [c.id]: !p[c.id]}))}
                                    className="text-xs text-orange-500 border border-orange-200 rounded px-1.5 py-0.5 flex items-center gap-1 hover:bg-orange-50 shrink-0">
                                    {revealPin[c.id] ? <><EyeOff size={9} />Hide</> : <><Eye size={9} />Reveal</>}
                                  </button>
                                </div>
                              </td>
                            )}
                            {/* Portal + Send Invite */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize w-fit
                                  ${c.portal_status === "signed_up" ? "bg-emerald-100 text-emerald-700" :
                                    c.portal_status === "invited"   ? "bg-amber-100 text-amber-700" :
                                    "bg-gray-100 text-gray-500"}`}>
                                  {(c.portal_status ?? "not_signed_up").replace(/_/g, " ")}
                                </span>
                                {/* Invite link available via Edit contact modal */}
                              </div>
                            </td>
                            {/* Edit */}
                            {canEdit && (
                              <td className="px-4 py-3">
                                <button onClick={() => setContactModal({ open: true, contact: c })}
                                  className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                                  <Pencil size={11} /> Edit
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ── Emergency Contacts (editable by admin & parent) ── */}
              <EmergencyContactsSection
                studentId={student.id}
                contacts={emergency}
                canEdit={canEdit}
                onChanged={loadAll}
              />
            </div>
          );
        })()}

        {/* ── IMMUNIZATIONS TAB ──────────────────────────────────────────────── */}
        {tab === "immunizations" && (
          <div className="space-y-4">
            {/* Legend + settings gear */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 inline-block" />Overdue</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 inline-block" />Completed</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 inline-block" />Skipped</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 inline-block" />Exempt</span>
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowImmSettings(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                  title="Immunization settings"
                >
                  <Settings2 size={14} /> Immunization settings
                </button>
              )}
            </div>

            {/* Custom immunization add form */}
            {canEdit && (() => {
              const cdcNames = new Set(CDC_VACCINES.map(v => v.name));
              const customRecs = immunizations.filter(i => !cdcNames.has(i.vaccine_name));
              return (
                <CustomImmunizationSection
                  studentId={id!}
                  customRecords={customRecs}
                  canEdit={canEdit}
                  onChanged={loadAll}
                />
              );
            })()}

            {CDC_VACCINES.filter(v => immunizationSettings.some(name => v.name.startsWith(name))).map(vaccine => {
              // Find any existing record to get vaccine-level exempt flag
              const anyRec = immunizations.find(i => i.vaccine_name === vaccine.name);
              const isExempt = anyRec?.exempt ?? false;

              async function setExempt(checked: boolean) {
                // Update all existing doses for this vaccine, or create dose 1 record
                const existing = immunizations.filter(i => i.vaccine_name === vaccine.name);
                if (existing.length > 0) {
                  await supabase.from("student_immunizations").update({ exempt: checked }).in("id", existing.map(e => e.id));
                } else {
                  await supabase.from("student_immunizations").insert({ student_id: id!, vaccine_name: vaccine.name, dose_number: 1, exempt: checked, skipped: false });
                }
                loadAll();
              }

              async function updateDose(doseNum: number, patch: Partial<{ administered_date: string | null; skipped: boolean }>) {
                const rec = immMap[`${vaccine.name}:${doseNum}`];
                if (rec) {
                  await supabase.from("student_immunizations").update(patch).eq("id", rec.id);
                } else {
                  await supabase.from("student_immunizations").insert({
                    student_id: id!, vaccine_name: vaccine.name, dose_number: doseNum,
                    administered_date: patch.administered_date ?? null,
                    skipped: patch.skipped ?? false,
                    exempt: isExempt,
                  });
                }
                loadAll();
              }

              return (
                <div key={vaccine.name} className="card overflow-hidden">
                  {/* Vaccine header */}
                  <div className={`px-5 py-3 flex items-center justify-between ${isExempt ? "bg-amber-50 border-b border-amber-100" : "bg-orange-900"}`}>
                    <span className={`text-sm font-semibold ${isExempt ? "text-amber-800" : "text-white"}`}>{vaccine.name}</span>
                    {canEdit ? (
                      <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${isExempt ? "text-amber-700" : "text-orange-200"}`}>
                        <input
                          type="checkbox"
                          checked={isExempt}
                          onChange={e => setExempt(e.target.checked)}
                          className="rounded"
                        />
                        Exempt
                      </label>
                    ) : isExempt ? (
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">Exempt</span>
                    ) : null}
                  </div>

                  {/* Dose columns */}
                  <div className={`grid text-xs ${isExempt ? "opacity-50 pointer-events-none" : ""}`}
                    style={{ gridTemplateColumns: `140px repeat(${vaccine.doses}, 1fr)` }}>

                    {/* Column headers */}
                    <div className="bg-gray-50 px-4 py-2 text-gray-400 font-medium border-b border-r border-gray-100" />
                    {Array.from({ length: vaccine.doses }, (_, i) => (
                      <div key={i} className="bg-gray-50 px-3 py-2 text-gray-400 font-medium text-center border-b border-r border-gray-100 last:border-r-0">
                        Dose {i + 1}
                      </div>
                    ))}

                    {/* Student record row — read-only status badges */}
                    <div className="px-4 py-3 font-medium text-gray-700 border-b border-r border-gray-100 flex items-center">Student record</div>
                    {Array.from({ length: vaccine.doses }, (_, i) => {
                      const rec = immMap[`${vaccine.name}:${i + 1}`];
                      let badge: React.ReactNode;
                      if (rec?.skipped) {
                        badge = <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600 font-medium">Skipped</span>;
                      } else if (rec?.administered_date) {
                        badge = <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 font-medium">{new Date(rec.administered_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"})}</span>;
                      } else {
                        badge = <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">Overdue</span>;
                      }
                      return (
                        <div key={i} className="px-3 py-3 text-center border-b border-r border-gray-100 last:border-r-0 flex items-center justify-center">
                          {badge}
                        </div>
                      );
                    })}

                    {/* Edit row — date picker + Skip checkbox (admin/parent only) */}
                    {canEdit && (
                      <>
                        <div className="px-4 py-2 text-gray-400 border-b border-r border-gray-100 flex items-center">Edit dates</div>
                        {Array.from({ length: vaccine.doses }, (_, i) => {
                          const rec = immMap[`${vaccine.name}:${i + 1}`];
                          return (
                            <div key={i} className="px-3 py-2 border-b border-r border-gray-100 last:border-r-0 space-y-1.5">
                              <input
                                type="date"
                                className="border border-gray-200 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none focus:border-orange-300 disabled:opacity-40"
                                value={rec?.administered_date ?? ""}
                                disabled={rec?.skipped}
                                onChange={e => updateDose(i + 1, { administered_date: e.target.value || null, skipped: false })}
                              />
                              <div className="flex items-center justify-between gap-1">
                                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={rec?.skipped ?? false}
                                    onChange={e => updateDose(i + 1, { skipped: e.target.checked, administered_date: e.target.checked ? null : (rec?.administered_date ?? null) })}
                                    className="rounded"
                                  />
                                  Skip
                                </label>
                                {rec && (
                                  <button
                                    title="Delete this dose record"
                                    onClick={async () => {
                                      await supabase.from("student_immunizations").delete().eq("id", rec.id);
                                      loadAll();
                                    }}
                                    className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {/* CDC recommended schedule row */}
                    <div className="px-4 py-2 text-gray-400 border-r border-gray-100 flex items-center">CDC schedule</div>
                    {vaccine.schedule.map((s, i) => (
                      <div key={i} className="px-3 py-2 text-center text-gray-400 border-r border-gray-100 last:border-r-0">{s}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DAILY REPORT TAB — inline feed ─────────────────────────────────── */}
        {tab === "daily_report" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="date" value={feedDate} onChange={e => setFeedDate(e.target.value)} className="input" />
              <span className="text-sm text-gray-500">{activities.length} {activities.length === 1 ? "entry" : "entries"}</span>
            </div>

            {activities.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                <p className="text-sm">No activities logged for {new Date(feedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map(a => {
                  const typeColor = ACTIVITY_COLORS[a.activity_type] ?? "bg-gray-100 text-gray-600";
                  const canManage = isAdmin || authProfile?.role === "staff";
                  return (
                    <div key={a.id} className="card p-4 flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${typeColor}`}>
                        {ACTIVITY_ICONS[a.activity_type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{activitySummary(a)}</p>
                            {a.notes && a.activity_type !== "note" && (
                              <p className="text-xs text-gray-500 mt-0.5">{a.notes}</p>
                            )}
                            {a.staff_only && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
                                <Shield size={10} /> Staff only
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400">
                              {a.activity_time ? a.activity_time.slice(0, 5) : ""}
                            </span>
                            {canManage && (
                              confirmDelete === a.id ? (
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-red-600">Delete?</span>
                                  <button onClick={() => doDeleteActivity(a.id)} className="text-red-600 font-medium hover:underline">Yes</button>
                                  <button onClick={() => setConfirmDelete(null)} className="text-gray-400 hover:underline">No</button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setEditingActivity(a)} className="p-1 text-gray-400 hover:text-orange-500 rounded" title="Edit">
                                    <Pencil size={13} />
                                  </button>
                                  <button onClick={() => setConfirmDelete(a.id)} className="p-1 text-gray-400 hover:text-red-500 rounded" title="Delete">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS TAB ──────────────────────────────────────────────────── */}
        {tab === "documents" && (
          <div className="card p-10 text-center text-gray-400 space-y-2">
            <p className="text-sm font-medium text-gray-600">Documents</p>
            <p className="text-sm">Immunization records, signed forms, and medical action plans.</p>
            <Link to="/paperwork" className="text-sm text-orange-500 hover:underline inline-block mt-2">
              View all forms in Paperwork →
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
