import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";

// Defined OUTSIDE the component to prevent re-creation on every render (causes focus loss)
function Field({ label, name, type = "text", required = false, value, onChange }: {
  label: string; name: string; type?: string; required?: boolean;
  value: string; onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input"
        required={required}
      />
    </div>
  );
}

export default function AddStudent() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    preferred_name: "",
    dob: "",
    gender: "",
    enrollment_status: "active" as const,
    allergies: "",
    medications: "",
    doctor_name: "",
    doctor_phone: "",
    meal_type: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.school_id) return;
    setError("");
    setSaving(true);

    const { error: err } = await supabase.from("students").insert({
      ...form,
      school_id: profile.school_id,
      preferred_name: form.preferred_name || null,
      dob: form.dob || null,
      gender: form.gender || null,
      allergies: form.allergies || null,
      medications: form.medications || null,
      doctor_name: form.doctor_name || null,
      doctor_phone: form.doctor_phone || null,
      meal_type: form.meal_type || null,
      notes: form.notes || null,
    });

    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      navigate("/students");
    }
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <Link to="/students" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to Students
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Student</h1>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" name="first_name" required value={form.first_name} onChange={v => set("first_name", v)} />
            <Field label="Last Name" name="last_name" required value={form.last_name} onChange={v => set("last_name", v)} />
            <Field label="Preferred Name" name="preferred_name" value={form.preferred_name} onChange={v => set("preferred_name", v)} />
            <Field label="Date of Birth" name="dob" type="date" value={form.dob} onChange={v => set("dob", v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
              <select value={form.gender} onChange={e => set("gender", e.target.value)} className="input">
                <option value="">Select...</option>
                <option>Male</option>
                <option>Female</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Enrollment Status</label>
              <select value={form.enrollment_status} onChange={e => set("enrollment_status", e.target.value)} className="input">
                <option value="active">Active</option>
                <option value="waitlist">Waitlist</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Meal Type" name="meal_type" value={form.meal_type} onChange={v => set("meal_type", v)} />
            <Field label="Doctor Name" name="doctor_name" value={form.doctor_name} onChange={v => set("doctor_name", v)} />
            <Field label="Doctor Phone" name="doctor_phone" value={form.doctor_phone} onChange={v => set("doctor_phone", v)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Allergies</label>
            <textarea value={form.allergies} onChange={e => set("allergies", e.target.value)} className="input min-h-[80px] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Medications</label>
            <textarea value={form.medications} onChange={e => set("medications", e.target.value)} className="input min-h-[80px] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} className="input min-h-[80px] resize-none" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/students" className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
