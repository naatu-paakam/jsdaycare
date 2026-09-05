import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Filter, Clock, CheckCircle, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Student, Room, EnrollmentStatus } from "@/lib/types";

interface StudentRow extends Student {
  room?: Room;
}

const STATUS_COLORS: Record<EnrollmentStatus, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  waitlist:  "bg-amber-100 text-amber-700",
  withdrawn: "bg-gray-100 text-gray-600",
  graduated: "bg-blue-100 text-blue-700",
};

const STATUS_STYLES: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  waitlist:  { icon: <Clock size={13} />,        color: "bg-amber-100 text-amber-700",     label: "Waitlist" },
  active:    { icon: <CheckCircle size={13} />,  color: "bg-emerald-100 text-emerald-700", label: "Enrolled" },
  withdrawn: { icon: <span>—</span>,              color: "bg-gray-100 text-gray-500",       label: "Withdrawn" },
  graduated: { icon: <span>🎓</span>,             color: "bg-blue-100 text-blue-700",       label: "Graduated" },
};

function age(dob: string | null) {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 24) return `${months}mo`;
  return `${Math.floor(months / 12)}y ${months % 12}mo`;
}

// ─── Inline Edit Admission Modal ──────────────────────────────────────────────
function EditAdmissionModal({ student, rooms, onClose, onSaved }: {
  student: StudentRow;
  rooms: Room[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { allSchools } = useAuth();
  const [schoolId, setSchoolId] = useState(student.school_id ?? "");
  const [roomId, setRoomId]     = useState(student.homeroom_id ?? "");
  const [status, setStatus]   = useState(student.enrollment_status ?? "active");
  const [startDate, setStart] = useState(student.start_date ?? "");
  const [endDate, setEnd]     = useState(student.end_date ?? "");
  const [notes, setNotes]     = useState(student.notes ?? "");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const schoolChanged = schoolId !== (student.school_id ?? "");

  async function save() {
    setSaving(true); setError("");
    // Always update status/dates/room first (student still in current school → passes RLS)
    const { error: err } = await supabase.from("students").update({
      enrollment_status: status,
      start_date: startDate || null,
      end_date: endDate || null,
      notes: notes || null,
      homeroom_id: schoolChanged ? null : (roomId || null),
    }).eq("id", student.id);
    if (err) { setError(err.message); setSaving(false); return; }

    // Then move school via security-definer RPC (bypasses cross-school RLS)
    if (schoolChanged) {
      const { error: rpcErr } = await supabase.rpc("move_student_to_school", {
        p_student_id: student.id,
        p_target_school_id: schoolId,
      });
      if (rpcErr) { setError(rpcErr.message); setSaving(false); return; }
    }

    setSaving(false);
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
          {allSchools.length > 1 && (
            <div>
              <label className="label">School</label>
              <select className="input" value={schoolId} onChange={e => setSchoolId(e.target.value)}>
                {allSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {schoolChanged && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠ Moving to a different school will unassign the student from their current room.
                </p>
              )}
            </div>
          )}
          <div>
            <label className="label">Room Assignment</label>
            <select className="input" value={roomId} onChange={e => setRoomId(e.target.value)} disabled={schoolChanged}>
              <option value="">— Not assigned —</option>
              {rooms.filter(r => r.school_id === (schoolChanged ? schoolId : student.school_id)).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {schoolChanged && <p className="text-xs text-gray-400 mt-1">Room will be cleared when moving to a different school.</p>}
          </div>

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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StudentList() {
  const { profile } = useAuth();
  const [students, setStudents]   = useState<StudentRow[]>([]);
  const [rooms, setRooms]         = useState<Room[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterStatus, setFilterStatus] = useState<EnrollmentStatus | "">("");
  const [editing, setEditing]     = useState<StudentRow | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!profile?.school_id) return;
    Promise.all([fetchStudents(), fetchRooms()]).finally(() => setLoading(false));
  }, [profile?.school_id]);

  async function fetchStudents() {
    const { data } = await supabase
      .from("students")
      .select("*, room:homeroom_id(id, name)")
      .eq("school_id", profile!.school_id!)
      .order("last_name");
    setStudents((data as StudentRow[]) ?? []);
  }

  async function fetchRooms() {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("school_id", profile!.school_id!)
      .order("name");
    setRooms(data ?? []);
  }

  async function deleteStudent(id: string) {
    setDeleting(true);
    // Use security-definer RPC: nullifies loose FK refs (form_submissions, shared_files)
    // before deleting. Student cascade removes contacts, immunizations, activities, etc.
    await supabase.rpc("delete_student_safe", { p_student_id: id });
    setDeleting(false);
    setConfirmDel(null);
    fetchStudents();
  }

  const filtered = students.filter(s => {
    const nameMatch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase());
    const roomMatch = filterRoom ? s.homeroom_id === filterRoom : true;
    const statusMatch = filterStatus ? s.enrollment_status === filterStatus : true;
    return nameMatch && roomMatch && statusMatch;
  });

  const activeCount    = students.filter(s => s.enrollment_status === "active").length;
  const waitlistCount  = students.filter(s => s.enrollment_status === "waitlist").length;
  const withdrawnCount = students.filter(s => s.enrollment_status === "withdrawn").length;
  const graduatedCount = students.filter(s => s.enrollment_status === "graduated").length;

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-sm text-gray-500 mt-0.5">{activeCount} active · {waitlistCount} on waitlist</p>
          </div>
          {isAdmin && (
            <Link to="/students/add" className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Student
            </Link>
          )}
        </div>

        {/* Admissions summary bar */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Active",    count: activeCount,    color: "text-emerald-600", status: "active" as const },
            { label: "Waitlist",  count: waitlistCount,  color: "text-amber-600",   status: "waitlist" as const },
            { label: "Withdrawn", count: withdrawnCount, color: "text-gray-500",    status: "withdrawn" as const },
            { label: "Graduated", count: graduatedCount, color: "text-blue-600",    status: "graduated" as const },
          ].map(({ label, count, color, status }) => (
            <button
              key={label}
              onClick={() => setFilterStatus(filterStatus === status ? "" : status)}
              className={`card p-4 text-center transition-all hover:shadow-md ${filterStatus === status ? "ring-2 ring-orange-400" : ""}`}
            >
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              className="input pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400" />
            <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} className="input w-auto">
              <option value="">All Rooms</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as EnrollmentStatus | "")} className="input w-auto">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="waitlist">Waitlist</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Room</th>
                <th className="px-5 py-3 font-medium">Age</th>
                <th className="px-5 py-3 font-medium">DOB</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {isAdmin && <th className="px-5 py-3 font-medium w-24">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 6 : 5} className="px-5 py-10 text-center text-gray-400">Loading students...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 6 : 5} className="px-5 py-10 text-center text-gray-400">No students found</td></tr>
              ) : filtered.map(student => {
                const st = STATUS_STYLES[student.enrollment_status];
                const isConfirming = confirmDel === student.id;
                return (
                  <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/students/${student.id}`} className="flex items-center gap-3 group">
                        {student.photo_url ? (
                          <img src={student.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-semibold text-xs">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                        )}
                        <span className="font-medium text-gray-900 group-hover:text-orange-500 transition-colors">
                          {student.first_name} {student.last_name}
                          {student.preferred_name && <span className="text-gray-400 font-normal ml-1">"{student.preferred_name}"</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {(student.room as unknown as Room)?.name ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{age(student.dob)}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {student.dob ? new Date(student.dob).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                        {st.icon}{st.label}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        {isConfirming ? (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-red-600 font-medium">Delete?</span>
                            <button onClick={() => deleteStudent(student.id)} disabled={deleting}
                              className="text-red-600 font-medium hover:underline">Yes</button>
                            <button onClick={() => setConfirmDel(null)} className="text-gray-400 hover:underline">No</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditing(student)} title="Edit enrollment"
                              className="p-1 text-gray-400 hover:text-orange-500 rounded transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setConfirmDel(student.id)} title="Delete student"
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
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
          rooms={rooms}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchStudents(); }}
        />
      )}
    </Layout>
  );
}
