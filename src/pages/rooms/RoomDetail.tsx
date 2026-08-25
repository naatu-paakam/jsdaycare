import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, UserCheck, UserX, Image, Coffee, Moon, MessageSquare, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Room, Student, StudentContact, Activity, ActivityType, Attendance } from "@/lib/types";

interface StudentWithAttendance extends Student {
  attendance?: Attendance;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  photo: <Image size={14} />,
  video: <Image size={14} />,
  food: <Coffee size={14} />,
  nap: <Moon size={14} />,
  potty: <MessageSquare size={14} />,
  note: <MessageSquare size={14} />,
  kudos: <MessageSquare size={14} />,
  meds: <MessageSquare size={14} />,
  name_to_face: <MessageSquare size={14} />,
  incident: <MessageSquare size={14} />,
  health_check: <MessageSquare size={14} />,
  observation: <MessageSquare size={14} />,
};

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const today = new Date().toISOString().split("T")[0];
  const [room, setRoom] = useState<Room | null>(null);
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [contacts, setContacts] = useState<StudentContact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tab, setTab] = useState<"students" | "parents" | "feed">("students");
  const [loading, setLoading] = useState(true);
  const [feedDate, setFeedDate] = useState(today);
  const [feedTypeFilter, setFeedTypeFilter] = useState<ActivityType | "">("");

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
      .from("students")
      .select("*")
      .eq("homeroom_id", id!)
      .eq("enrollment_status", "active")
      .order("last_name");

    if (!studs) return;

    // Fetch today's attendance for each student
    const { data: att } = await supabase
      .from("attendance")
      .select("*")
      .eq("room_id", id!)
      .eq("date", today);

    const attMap: Record<string, Attendance> = {};
    (att ?? []).forEach(a => { attMap[a.student_id] = a; });

    const withAtt = studs.map(s => ({ ...s, attendance: attMap[s.id] }));
    setStudents(withAtt);

    // Fetch contacts for parents tab
    const studentIds = studs.map(s => s.id);
    if (studentIds.length > 0) {
      const { data: c } = await supabase
        .from("student_contacts")
        .select("*")
        .in("student_id", studentIds)
        .order("is_primary", { ascending: false });
      setContacts(c ?? []);
    }
  }

  async function fetchActivities() {
    let q = supabase
      .from("activities")
      .select("*")
      .eq("room_id", id!)
      .eq("activity_date", feedDate)
      .order("created_at", { ascending: false });

    if (feedTypeFilter) q = q.eq("activity_type", feedTypeFilter);

    const { data } = await q;
    setActivities(data ?? []);
  }

  async function checkin(studentId: string) {
    const existing = students.find(s => s.id === studentId)?.attendance;
    if (existing) {
      await supabase.from("attendance").update({ status: "checked_in", checkin_time: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({
        student_id: studentId, room_id: id!, date: today,
        status: "checked_in", checkin_time: new Date().toISOString(),
      });
    }
    fetchStudents();
  }

  async function markAbsent(studentId: string) {
    const existing = students.find(s => s.id === studentId)?.attendance;
    if (existing) {
      await supabase.from("attendance").update({ status: "absent" }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({
        student_id: studentId, room_id: id!, date: today, status: "absent",
      });
    }
    fetchStudents();
  }

  if (loading) return <Layout><div className="p-10 text-center text-gray-400">Loading...</div></Layout>;
  if (!room) return <Layout><div className="p-10 text-center text-gray-400">Room not found</div></Layout>;

  const tabs = [
    { id: "students" as const, label: `Students (${students.length})` },
    { id: "parents" as const, label: "Parents" },
    { id: "feed" as const, label: "Feed" },
  ];

  const ACTIVITY_TYPES: ActivityType[] = ["photo", "video", "food", "nap", "potty", "note", "kudos", "meds", "incident", "health_check", "observation"];

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <Link to="/rooms" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to Rooms
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Capacity: {room.capacity ?? "—"} · Ratio: 1:{room.ratio_children ?? "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{students.filter(s => s.attendance?.status === "checked_in").length} in</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-500">{students.length} enrolled</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                ${tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
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
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs">
                              {s.first_name[0]}{s.last_name[0]}
                            </div>
                            <span className="font-medium text-gray-900 group-hover:text-indigo-600">{s.first_name} {s.last_name}</span>
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          {status ? (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize
                              ${status === "checked_in" ? "bg-emerald-100 text-emerald-700" :
                                status === "absent" ? "bg-red-100 text-red-600" :
                                "bg-gray-100 text-gray-500"}`}>
                              {status.replace("_", " ")}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">Not recorded</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {status !== "checked_in" && (
                              <button
                                onClick={() => checkin(s.id)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                              >
                                <UserCheck size={12} /> Check In
                              </button>
                            )}
                            {status !== "absent" && (
                              <button
                                onClick={() => markAbsent(s.id)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium"
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

        {/* Parents tab */}
        {tab === "parents" && (
          <div className="space-y-3">
            {contacts.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">No parent contacts found</div>
            ) : (
              contacts.map(c => (
                <div key={c.id} className="card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                    {c.full_name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{c.full_name}</p>
                    <p className="text-sm text-gray-500">{c.email} · {c.phone}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${c.portal_status === "signed_up" ? "bg-emerald-100 text-emerald-700" :
                      c.portal_status === "invited" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-500"}`}>
                    {c.portal_status.replace("_", " ")}
                  </span>
                </div>
              ))
            )}
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
                      <span className="text-indigo-500">{ACTIVITY_ICONS[a.activity_type]}</span>
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
    </Layout>
  );
}
