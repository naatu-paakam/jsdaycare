import { useEffect, useState, useCallback } from "react";
import { Users, DoorOpen, AlertTriangle, Cake, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";

interface RoomRatio {
  room_id: string;
  room_name: string;
  capacity: number;
  ratio_staff: number;
  ratio_children: number;
  checked_in_students: number;
  checked_in_staff: number;
}

interface DashboardStats {
  totalCheckedIn: number;
  totalExpected: number;
  totalAbsent: number;
  totalRooms: number;
}

interface UpcomingBirthday {
  name: string;
  dob: string;
  daysUntil: number;
}

export default function Home() {
  const { profile } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [stats, setStats] = useState<DashboardStats>({
    totalCheckedIn: 0,
    totalExpected: 0,
    totalAbsent: 0,
    totalRooms: 0,
  });
  const [roomRatios, setRoomRatios] = useState<RoomRatio[]>([]);
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);
  const [notCheckedOut, setNotCheckedOut] = useState<string[]>([]); // student names still checked in past closing
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    const { data: attendance } = await supabase
      .from("attendance")
      .select("status")
      .eq("date", today);

    const { data: rooms } = await supabase
      .from("rooms")
      .select("id")
      .eq("school_id", profile!.school_id!);

    if (attendance) {
      setStats({
        totalCheckedIn: attendance.filter(a => a.status === "checked_in").length,
        totalExpected: attendance.filter(a => a.status === "expected").length,
        totalAbsent: attendance.filter(a => a.status === "absent").length,
        totalRooms: rooms?.length ?? 0,
      });
    }
  }, [profile?.school_id, today]);

  const fetchRoomRatios = useCallback(async () => {
    const { data: rooms } = await supabase
      .from("rooms")
      .select("id, name, capacity, ratio_staff, ratio_children")
      .eq("school_id", profile!.school_id!);

    if (!rooms) return;

    const ratios: RoomRatio[] = await Promise.all(
      rooms.map(async room => {
        const { count: studentCount } = await supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .eq("room_id", room.id)
          .eq("date", today)
          .eq("status", "checked_in");

        const { count: staffCount } = await supabase
          .from("staff_checkins")
          .select("id", { count: "exact", head: true })
          .eq("date", today)
          .is("checkout_time", null);

        return {
          room_id: room.id,
          room_name: room.name,
          capacity: room.capacity ?? 0,
          ratio_staff: room.ratio_staff ?? 1,
          ratio_children: room.ratio_children ?? 4,
          checked_in_students: studentCount ?? 0,
          checked_in_staff: staffCount ?? 0,
        };
      })
    );

    setRoomRatios(ratios);
  }, [profile?.school_id, today]);

  useEffect(() => {
    if (!profile?.school_id) return;
    Promise.all([fetchStats(), fetchRoomRatios(), fetchBirthdays(), fetchNotCheckedOut()]).finally(() =>
      setLoading(false)
    );
  }, [profile?.school_id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!profile?.school_id) return;
    const interval = setInterval(() => {
      fetchStats();
      fetchRoomRatios();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchRoomRatios]);

  async function handleManualRefresh() {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchRoomRatios(), fetchNotCheckedOut()]);
    setRefreshing(false);
  }

  async function fetchBirthdays() {
    const { data: students } = await supabase
      .from("students")
      .select("first_name, last_name, dob")
      .eq("school_id", profile!.school_id!)
      .eq("enrollment_status", "active")
      .not("dob", "is", null);

    if (!students) return;

    const now = new Date();
    const upcoming: UpcomingBirthday[] = students
      .map(s => {
        const dob = new Date(s.dob!);
        const thisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
        if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
        const daysUntil = Math.ceil((thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { name: `${s.first_name} ${s.last_name}`, dob: s.dob!, daysUntil };
      })
      .filter(b => b.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);

    setBirthdays(upcoming);
  }

  async function fetchNotCheckedOut() {
    if (!profile?.school_id) return;
    // Get today's closing time from school operating_hours
    const { data: school } = await supabase
      .from("schools")
      .select("operating_hours")
      .eq("id", profile.school_id)
      .single();

    if (!school?.operating_hours) return;

    const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const todayName = dayNames[new Date().getDay()];
    const hoursStr: string = (school.operating_hours as Record<string, string>)[todayName] ?? "";

    // Parse closing time — format: "8:30 AM - 5:30 PM" or "Closed"
    if (!hoursStr || hoursStr.toLowerCase() === "closed") return;
    const parts = hoursStr.split("-").map(s => s.trim());
    if (parts.length < 2) return;
    const closingStr = parts[1]; // e.g. "5:30 PM"

    // Parse closing time into today's Date
    const [timePart, meridiem] = closingStr.split(" ");
    const [hrs, mins] = timePart.split(":").map(Number);
    const closing = new Date();
    closing.setHours(
      meridiem === "PM" && hrs !== 12 ? hrs + 12 : meridiem === "AM" && hrs === 12 ? 0 : hrs,
      mins, 0, 0
    );

    // Only check if we're past closing time
    if (new Date() < closing) { setNotCheckedOut([]); return; }

    // Fetch students still checked_in (not checked_out) today
    const { data: attendance } = await supabase
      .from("attendance")
      .select("student_id, students(first_name, last_name)")
      .eq("date", today)
      .eq("status", "checked_in");

    if (!attendance?.length) { setNotCheckedOut([]); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = (attendance as any[])
      .map((a: any) => {
        const s = Array.isArray(a.students) ? a.students[0] : a.students;
        return s ? `${s.first_name} ${s.last_name}` : null;
      })
      .filter(Boolean) as string[];

    setNotCheckedOut(names);
  }

  function ratioOk(room: RoomRatio) {
    if (room.checked_in_students === 0) return true;
    const required = Math.ceil(room.checked_in_students / room.ratio_children);
    return room.checked_in_staff >= required;
  }

  const statCards = [
    { label: "Checked In Today", value: stats.totalCheckedIn, icon: <Users size={20} />, color: "text-emerald-600 bg-emerald-50" },
    { label: "Expected", value: stats.totalExpected, icon: <Users size={20} />, color: "text-blue-600 bg-blue-50" },
    { label: "Absent", value: stats.totalAbsent, icon: <Users size={20} />, color: "text-orange-600 bg-orange-50" },
    { label: "Rooms", value: stats.totalRooms, icon: <DoorOpen size={20} />, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Good {new Date().getHours() < 12 ? "morning" : "afternoon"},{" "}
              {profile?.full_name?.split(" ")[0] ?? "Admin"} 👋
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-500 text-sm">
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
                title="Refresh stats"
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.label} className="card p-5">
              <div className={`inline-flex p-2.5 rounded-lg ${card.color} mb-3`}>
                {card.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? "—" : card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room Ratios */}
          <div className="lg:col-span-2 card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <DoorOpen size={16} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Current Room Ratios</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="px-5 py-3 font-medium">Room</th>
                    <th className="px-5 py-3 font-medium">Students In</th>
                    <th className="px-5 py-3 font-medium">Staff In</th>
                    <th className="px-5 py-3 font-medium">Ratio</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-400">Loading...</td>
                    </tr>
                  ) : roomRatios.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-400">No rooms found</td>
                    </tr>
                  ) : (
                    [...roomRatios].sort((a, b) => a.room_name.localeCompare(b.room_name)).map(room => (
                      <tr key={room.room_id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{room.room_name}</td>
                        <td className="px-5 py-3 text-gray-600">{room.checked_in_students}</td>
                        <td className="px-5 py-3 text-gray-600">{room.checked_in_staff}</td>
                        <td className="px-5 py-3 text-gray-500">1:{room.ratio_children}</td>
                        <td className="px-5 py-3">
                          {ratioOk(room) ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">OK</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <AlertTriangle size={10} /> Under
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Birthdays */}
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Cake size={16} className="text-pink-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Upcoming Birthdays</h2>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                <p className="text-gray-400 text-sm text-center py-4">Loading...</p>
              ) : birthdays.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No upcoming birthdays</p>
              ) : (
                birthdays.map(b => (
                  <div key={b.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-bold">
                        {b.name[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{b.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {b.daysUntil === 0 ? "Today! 🎂" : `${b.daysUntil}d`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Compliance Alerts */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Compliance Alerts</h2>
          </div>
          <div className="px-5 py-4 space-y-2">
            {roomRatios.filter(r => !ratioOk(r)).length === 0 && notCheckedOut.length === 0 ? (
              <p className="text-sm text-emerald-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                All ratios are compliant
              </p>
            ) : (
              <ul className="space-y-2">
                {/* Ratio violations */}
                {roomRatios.filter(r => !ratioOk(r)).map(r => (
                  <li key={r.room_id} className="text-sm text-red-600 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span><strong>{r.room_name}</strong> is under ratio ({r.checked_in_students} students, {r.checked_in_staff} staff)</span>
                  </li>
                ))}
                {/* Students not checked out after school closing */}
                {notCheckedOut.length > 0 && (
                  <li className="text-sm text-amber-700 flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                    <span>
                      <strong>Past closing time — not checked out:</strong>{" "}
                      {notCheckedOut.join(", ")}
                    </span>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
