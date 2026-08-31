import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Clock, CheckCircle, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Student, Room } from "@/lib/types";

interface AdmissionRow extends Student {
  room?: Pick<Room, "id" | "name">;
}

const STATUS_STYLES: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  waitlist:  { icon: <Clock size={13} />,        color: "bg-amber-100 text-amber-700",     label: "Waitlist" },
  active:    { icon: <CheckCircle size={13} />,  color: "bg-emerald-100 text-emerald-700", label: "Enrolled" },
  withdrawn: { icon: <span>—</span>,              color: "bg-gray-100 text-gray-500",       label: "Withdrawn" },
  graduated: { icon: <span>🎓</span>,             color: "bg-blue-100 text-blue-700",       label: "Graduated" },
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditAdmissionModal({ student, onClose, onSaved }: {
  student: AdmissionRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus]     = useState(student.enrollment_status ?? "active");
  const [startDate, setStart]   = useState(student.start_date ?? "");
  const [endDate, setEnd]       = useState(student.end_date ?? "");
  const [notes, setNotes]       = useState(student.notes ?? "");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function save() {
    setSaving(true); setError("");
    const { error: err } = await supabase.from("students").update({
      enrollment_status: status,
      start_date: startDate || null,
      end_date: endDate || null,
      notes: notes || null,
    }).eq("id", student.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Edit — {student.first_name} {student.last_name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="label">Enrollment Status</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value as typeof status)}>
              <option value="active">Active / Enrolled</option>
              <option value="waitlist">Waitlist</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={startDate} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <label className="label">End / Exit Date</label>
              <input type="date" className="input" value={endDate} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Admissions() {
  const { profile } = useAuth();
  const [students, setStudents]   = useState<AdmissionRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<"waitlist" | "all">("waitlist");
  const [editing, setEditing]     = useState<AdmissionRow | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;
    fetchStudents().finally(() => setLoading(false));
  }, [profile?.school_id]);

  async function fetchStudents() {
    const { data } = await supabase
      .from("students")
      .select("*, room:homeroom_id(id, name)")
      .eq("school_id", profile!.school_id!)
      .order("start_date", { ascending: true });
    setStudents((data as AdmissionRow[]) ?? []);
  }

  async function deleteStudent(id: string) {
    setDeleting(true);
    await supabase.from("students").delete().eq("id", id);
    setDeleting(false);
    setConfirmDel(null);
    fetchStudents();
  }

  const filtered = students.filter(s =>
    filter === "all" ? true : s.enrollment_status === "waitlist"
  );

  const waitlistCount = students.filter(s => s.enrollment_status === "waitlist").length;
  const activeCount   = students.filter(s => s.enrollment_status === "active").length;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admissions</h1>
            <p className="text-sm text-gray-500 mt-0.5">{waitlistCount} on waitlist · {activeCount} enrolled</p>
          </div>
          <Link to="/students/add" className="btn-primary flex items-center gap-2">
            <UserPlus size={16} /> Add Student
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Waitlist",  count: waitlistCount, color: "text-amber-600" },
            { label: "Active",    count: activeCount,   color: "text-emerald-600" },
            { label: "Withdrawn", count: students.filter(s=>s.enrollment_status==="withdrawn").length, color: "text-gray-500" },
            { label: "Graduated", count: students.filter(s=>s.enrollment_status==="graduated").length, color: "text-blue-600" },
          ].map(({ label, count, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter toggle */}
        <div className="flex gap-2">
          {(["waitlist","all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f === "all" ? "All Students" : "Waitlist Only"}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Room</th>
                <th className="px-5 py-3 font-medium">Start Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No students found</td></tr>
              ) : filtered.map(s => {
                const st = STATUS_STYLES[s.enrollment_status] ?? STATUS_STYLES.withdrawn;
                const isConfirming = confirmDel === s.id;
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link to={`/students/${s.id}`} className="font-medium text-gray-900 hover:text-orange-500">
                        {s.first_name} {s.last_name}
                      </Link>
                      {s.dob && <p className="text-xs text-gray-400">{new Date(s.dob).toLocaleDateString()}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{(s.room as unknown as Room)?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {s.start_date ? new Date(s.start_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                        {st.icon}{st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {isConfirming ? (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-red-600 font-medium">Delete?</span>
                          <button onClick={() => deleteStudent(s.id)} disabled={deleting}
                            className="text-red-600 font-medium hover:underline">Yes</button>
                          <button onClick={() => setConfirmDel(null)} className="text-gray-400 hover:underline">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditing(s)} title="Edit"
                            className="p-1 text-gray-400 hover:text-orange-500 rounded transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setConfirmDel(s.id)} title="Delete"
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditAdmissionModal
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchStudents(); }}
        />
      )}
    </Layout>
  );
}
