import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Profile, StaffProfile as StaffProfileType } from "@/lib/types";

// ─── Inline editable field ────────────────────────────────────────────────────
function EditField({ label, value, onSave, type = "text" }: {
  label: string;
  value: string | null | undefined;
  onSave: (val: string) => Promise<void>;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value ?? "");
  const [saving, setSaving]   = useState(false);

  async function save() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  function cancel() {
    setDraft(value ?? "");
    setEditing(false);
  }

  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="input text-sm flex-1"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          />
          <button onClick={save} disabled={saving} className="p-1 text-emerald-500 hover:text-emerald-700" title="Save">
            <Check size={15} />
          </button>
          <button onClick={cancel} className="p-1 text-gray-400 hover:text-gray-600" title="Cancel">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <p className="text-sm text-gray-900">{value || "—"}</p>
          <button
            onClick={() => { setDraft(value ?? ""); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-orange-500 transition-opacity"
            title={`Edit ${label}`}
          >
            <Pencil size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Number editable field ────────────────────────────────────────────────────
function EditNumber({ label, value, onSave }: {
  label: string;
  value: number | null | undefined;
  onSave: (val: number | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(value ?? ""));
  const [saving, setSaving]   = useState(false);

  async function save() {
    setSaving(true);
    await onSave(draft === "" ? null : Number(draft));
    setSaving(false);
    setEditing(false);
  }

  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
      {editing ? (
        <div className="flex items-center gap-2">
          <input type="number" value={draft} onChange={e => setDraft(e.target.value)}
            className="input text-sm w-24" autoFocus
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setDraft(String(value ?? "")); } }}
          />
          <button onClick={save} disabled={saving} className="p-1 text-emerald-500 hover:text-emerald-700"><Check size={15} /></button>
          <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={15} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <p className="text-sm text-gray-900">{value ?? "—"}</p>
          <button onClick={() => { setDraft(String(value ?? "")); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-orange-500 transition-opacity">
            <Pencil size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Editable select ──────────────────────────────────────────────────────────
function EditSelect({ label, value, options, onSave }: {
  label: string;
  value: string | null | undefined;
  options: { value: string; label: string }[];
  onSave: (val: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value ?? "");
  const [saving, setSaving]   = useState(false);

  async function save() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  const displayLabel = options.find(o => o.value === value)?.label ?? value ?? "—";

  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
      {editing ? (
        <div className="flex items-center gap-2">
          <select value={draft} onChange={e => setDraft(e.target.value)} className="input text-sm flex-1">
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={save} disabled={saving} className="p-1 text-emerald-500 hover:text-emerald-700"><Check size={15} /></button>
          <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={15} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <p className="text-sm text-gray-900 capitalize">{displayLabel}</p>
          <button onClick={() => { setDraft(value ?? ""); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-orange-500 transition-opacity">
            <Pencil size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StaffProfile() {
  const { id } = useParams<{ id: string }>();
  const { profile: authProfile } = useAuth();
  const [person, setPerson]         = useState<Profile | null>(null);
  const [staffDetail, setStaffDetail] = useState<StaffProfileType | null>(null);
  const [loading, setLoading]       = useState(true);

  const isAdmin = authProfile?.role === "admin";

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase.from("staff_profiles").select("*").eq("id", id).single(),
    ]).then(([{ data: p }, { data: s }]) => {
      setPerson(p);
      setStaffDetail(s);
      setLoading(false);
    });
  }, [id]);

  async function saveProfile(field: keyof Profile, value: string) {
    if (!id) return;
    await supabase.from("profiles").update({ [field]: value || null }).eq("id", id);
    setPerson(prev => prev ? { ...prev, [field]: value || null } : prev);
  }

  async function saveDetail(field: keyof StaffProfileType, value: string | number | null) {
    if (!id) return;
    if (staffDetail) {
      await supabase.from("staff_profiles").update({ [field]: value }).eq("id", id);
      setStaffDetail(prev => prev ? { ...prev, [field]: value } : prev);
    } else {
      // Create row if it doesn't exist
      const { data } = await supabase.from("staff_profiles")
        .insert({ id, school_id: authProfile!.school_id!, [field]: value })
        .select().single();
      setStaffDetail(data);
    }
  }

  if (loading) return <Layout><div className="p-10 text-center text-gray-400">Loading...</div></Layout>;
  if (!person) return <Layout><div className="p-10 text-center text-gray-400">Staff member not found</div></Layout>;

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <Link to="/staff" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to Staff
        </Link>

        {/* Header card */}
        <div className="card p-6 flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-2xl shrink-0">
            {person.full_name?.[0] ?? "?"}
          </div>
          <div className="flex-1 space-y-3">
            {isAdmin ? (
              <>
                <EditField label="Full Name" value={person.full_name} onSave={v => saveProfile("full_name", v)} />
                <div className="grid grid-cols-2 gap-4">
                  <EditSelect label="Role" value={person.role}
                    options={[{ value: "staff", label: "Staff" }, { value: "admin", label: "Admin" }]}
                    onSave={v => saveProfile("role", v)} />
                  <EditField label="Phone" value={person.phone} onSave={v => saveProfile("phone", v)} />
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900">{person.full_name ?? "Unnamed"}</h1>
                <p className="text-gray-500 text-sm capitalize">{person.role} · {person.phone ?? "No phone"}</p>
              </>
            )}
          </div>
        </div>

        {/* Staff Details card */}
        <div className="card p-6 space-y-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Staff Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {isAdmin ? (
              <>
                <EditField label="Hire Date" value={staffDetail?.hire_date} type="date" onSave={v => saveDetail("hire_date", v)} />
                <EditField label="Birthday" value={staffDetail?.birthday} type="date" onSave={v => saveDetail("birthday", v)} />
                <EditField label="Degree" value={staffDetail?.degree} onSave={v => saveDetail("degree", v)} />
                <EditField label="Certification" value={staffDetail?.certification} onSave={v => saveDetail("certification", v)} />
                <EditNumber label="ECE Credits" value={staffDetail?.ece_credits} onSave={v => saveDetail("ece_credits", v)} />
                <EditNumber label="Infant/Toddler Credits" value={staffDetail?.infant_toddler_credits} onSave={v => saveDetail("infant_toddler_credits", v)} />
                <EditField label="Address" value={staffDetail?.address} onSave={v => saveDetail("address", v)} />
                <EditField label="Allergies" value={staffDetail?.allergies} onSave={v => saveDetail("allergies", v)} />
                <EditField label="Emergency Contact" value={staffDetail?.emergency_contact_name} onSave={v => saveDetail("emergency_contact_name", v)} />
                <EditField label="Emergency Phone" value={staffDetail?.emergency_contact_phone} onSave={v => saveDetail("emergency_contact_phone", v)} />
                <EditField label="Doctor" value={staffDetail?.doctor} onSave={v => saveDetail("doctor", v)} />
                <EditField label="Doctor Phone" value={staffDetail?.doctor_phone} onSave={v => saveDetail("doctor_phone", v)} />
                <div className="col-span-2">
                  <EditField label="Notes" value={staffDetail?.notes} onSave={v => saveDetail("notes", v)} />
                </div>
              </>
            ) : (
              // Read-only view for non-admins
              [
                ["Hire Date", staffDetail?.hire_date],
                ["Birthday", staffDetail?.birthday],
                ["Degree", staffDetail?.degree],
                ["Certification", staffDetail?.certification],
                ["ECE Credits", staffDetail?.ece_credits],
                ["Infant/Toddler Credits", staffDetail?.infant_toddler_credits],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
                  <p className="text-sm text-gray-900 mt-0.5">{val ?? "—"}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
