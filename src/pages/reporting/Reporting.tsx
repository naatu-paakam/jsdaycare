import { useEffect, useState } from "react";
import { BarChart2, Users, TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";

interface AttendanceStat {
  date: string;
  checked_in: number;
  absent: number;
}

export default function Reporting() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AttendanceStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    if (!profile?.school_id) return;
    Promise.all([fetchAttendanceStats(), fetchTotalStudents()]).finally(() => setLoading(false));
  }, [profile?.school_id]);

  async function fetchAttendanceStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data } = await supabase
      .from("attendance")
      .select("date, status")
      .gte("date", sevenDaysAgo.toISOString().split("T")[0])
      .order("date");

    if (!data) return;

    const byDate: Record<string, AttendanceStat> = {};
    data.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = { date: a.date, checked_in: 0, absent: 0 };
      if (a.status === "checked_in") byDate[a.date].checked_in++;
      if (a.status === "absent") byDate[a.date].absent++;
    });

    setStats(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
  }

  async function fetchTotalStudents() {
    const { count } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("school_id", profile!.school_id!)
      .eq("enrollment_status", "active");
    setTotalStudents(count ?? 0);
  }

  const avgCheckin = stats.length > 0
    ? Math.round(stats.reduce((s, d) => s + d.checked_in, 0) / stats.length)
    : 0;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporting</h1>
          <p className="text-sm text-gray-500 mt-0.5">Attendance trends and insights</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Students", value: totalStudents, icon: <Users size={20} />, color: "text-orange-500 bg-orange-50" },
            { label: "Avg Daily Check-ins", value: avgCheckin, icon: <TrendingUp size={20} />, color: "text-emerald-600 bg-emerald-50" },
            { label: "Days Tracked", value: stats.length, icon: <Calendar size={20} />, color: "text-purple-600 bg-purple-50" },
          ].map(c => (
            <div key={c.label} className="card p-5">
              <div className={`inline-flex p-2.5 rounded-lg ${c.color} mb-3`}>{c.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{loading ? "—" : c.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart2 size={16} className="text-orange-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Attendance — Last 7 Days</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Checked In</th>
                  <th className="px-5 py-3 font-medium">Absent</th>
                  <th className="px-5 py-3 font-medium">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : stats.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No data yet</td></tr>
                ) : (
                  stats.map(s => {
                    const total = s.checked_in + s.absent;
                    const pct = total > 0 ? Math.round((s.checked_in / total) * 100) : 0;
                    return (
                      <tr key={s.date} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </td>
                        <td className="px-5 py-3 text-emerald-600 font-medium">{s.checked_in}</td>
                        <td className="px-5 py-3 text-red-500">{s.absent}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                              <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-gray-600">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
