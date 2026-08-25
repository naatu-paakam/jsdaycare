import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Student, Room, EnrollmentStatus } from "@/lib/types";

interface StudentRow extends Student {
  room?: Room;
}

const STATUS_COLORS: Record<EnrollmentStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  waitlist: "bg-amber-100 text-amber-700",
  withdrawn: "bg-gray-100 text-gray-600",
  graduated: "bg-blue-100 text-blue-700",
};

function age(dob: string | null) {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 24) return `${months}mo`;
  return `${Math.floor(months / 12)}y ${months % 12}mo`;
}

export default function StudentList() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterStatus, setFilterStatus] = useState<EnrollmentStatus | "">("");

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

  const filtered = students.filter(s => {
    const nameMatch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase());
    const roomMatch = filterRoom ? s.homeroom_id === filterRoom : true;
    const statusMatch = filterStatus ? s.enrollment_status === filterStatus : true;
    return nameMatch && roomMatch && statusMatch;
  });

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-sm text-gray-500 mt-0.5">{students.filter(s => s.enrollment_status === "active").length} active</p>
          </div>
          <Link to="/students/add" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Student
          </Link>
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
            <select
              value={filterRoom}
              onChange={e => setFilterRoom(e.target.value)}
              className="input w-auto"
            >
              <option value="">All Rooms</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as EnrollmentStatus | "")}
              className="input w-auto"
            >
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">Loading students...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">No students found</td>
                </tr>
              ) : (
                filtered.map(student => (
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
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[student.enrollment_status]}`}>
                        {student.enrollment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
