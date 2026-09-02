import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, LogOut, ChevronRight, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Student, Activity as ActivityType } from "@/lib/types";

interface ChildInfo extends Student {
  contactId: string | null;
  checkedIn: boolean;
  lastCheckTime: string | null;
}

// Friendly label for activity types in parent view
function activityLabel(a: ActivityType): string {
  const d = (a.data ?? {}) as Record<string, unknown>;
  switch (a.activity_type) {
    case "name_to_face": return "Check-in via QR code";
    case "food":         return `${String(d.meal_type ?? "Meal").replace(/_/g, " ")} — ate ${String(d.quantity ?? "—")}`;
    case "nap":          return d.nap_status === "started" ? "Nap started" : "Nap ended";
    case "potty":        return `Potty — ${String(d.potty_type ?? "").replace(/_/g, " ")}`;
    case "meds":         return `Meds: ${String(d.medication ?? "")} ${String(d.dose ?? "")}`.trim();
    case "health_check": return d.temperature ? `Temp: ${d.temperature}°F` : "Health check";
    case "observation":  return `Observation — ${String(d.area ?? "")}`;
    case "incident":     return "Incident report";
    case "kudos":        return a.notes ?? "Kudos";
    case "note":         return a.notes ?? "Note";
    default:             return a.activity_type.replace(/_/g, " ");
  }
}

// ─── Student card ─────────────────────────────────────────────────────────────
function StudentCard({ child, onCheckToggle }: {
  child: ChildInfo;
  onCheckToggle: (childId: string, contactId: string | null, currentlyIn: boolean) => Promise<void>;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [activities, setActivities]   = useState<ActivityType[]>([]);
  const [showFeed, setShowFeed]       = useState(false);
  const [actLoading, setActLoading]   = useState(false);
  const [toggling, setToggling]       = useState(false);

  async function loadFeed() {
    setActLoading(true);
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("student_id", child.id)
      .eq("activity_date", today)
      .eq("staff_only", false)
      .order("created_at", { ascending: false });
    setActivities(data ?? []);
    setActLoading(false);
  }

  function toggleFeed() {
    if (!showFeed) loadFeed();
    setShowFeed(s => !s);
  }

  async function handleCheckToggle() {
    setToggling(true);
    await onCheckToggle(child.id, child.contactId, child.checkedIn);
    setToggling(false);
    if (showFeed) loadFeed();
  }

  return (
    <div className="card overflow-hidden">
      {/* Header row */}
      <div className="p-5 flex items-center gap-4">
        {child.photo_url ? (
          <img src={child.photo_url} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-xl shrink-0">
            {child.first_name[0]}{child.last_name[0]}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-gray-900">{child.first_name} {child.last_name}</h2>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
              ${child.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
              {child.checkedIn ? "✓ Checked In" : "Not checked in"}
            </span>
          </div>
          {child.dob && (
            <p className="text-sm text-gray-500">{new Date(child.dob).toLocaleDateString()} · {child.enrollment_status}</p>
          )}
          {child.checkedIn && child.lastCheckTime && (
            <p className="text-xs text-gray-400 mt-0.5">Since {child.lastCheckTime.slice(0,5)}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick check-in/out */}
          <button
            onClick={handleCheckToggle}
            disabled={toggling}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${child.checkedIn
                ? "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600"
                : "bg-orange-500 text-white hover:bg-orange-600"
              } disabled:opacity-50`}
          >
            {child.checkedIn
              ? <><LogOut size={14} /> {toggling ? "…" : "Check Out"}</>
              : <><LogIn  size={14} /> {toggling ? "…" : "Check In"}</>
            }
          </button>

          {/* Link to full profile */}
          <Link to={`/students/${child.id}`}
            className="p-2 text-gray-400 hover:text-orange-500 rounded-lg hover:bg-gray-50"
            title="View full profile">
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {/* Today's Feed toggle */}
      <div className="border-t border-gray-100">
        <button
          onClick={toggleFeed}
          className="w-full flex items-center gap-2 px-5 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Activity size={14} className="text-orange-400" />
          <span>Today's Activities</span>
          <span className="ml-auto text-xs text-gray-400">{showFeed ? "▲ hide" : "▼ show"}</span>
        </button>

        {showFeed && (
          <div className="px-5 pb-4 space-y-2">
            {actLoading ? (
              <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
            ) : activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activities recorded yet today</p>
            ) : activities.map(a => (
              <div key={a.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-orange-500 capitalize">{activityLabel(a)}</span>
                  <span className="text-xs text-gray-400">
                    {a.activity_time?.slice(0,5) ?? new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {a.notes && a.activity_type !== "note" && a.activity_type !== "kudos" && (
                  <p className="text-xs text-gray-600">{a.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Parent Portal main page ──────────────────────────────────────────────────
export default function ParentPortal() {
  const { user, school } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!user?.email) return;
    fetchChildren();
  }, [user?.email]);

  async function fetchChildren() {
    setLoading(true);

    // Find contacts for this parent
    const { data: contacts } = await supabase
      .from("student_contacts")
      .select("id, student_id")
      .eq("email", user!.email!);

    if (!contacts || contacts.length === 0) { setLoading(false); return; }

    const studentIds = contacts.map(c => c.student_id);
    const contactMap: Record<string, string> = {};
    contacts.forEach(c => { contactMap[c.student_id] = c.id; });

    // Fetch students
    const { data: students } = await supabase
      .from("students")
      .select("*")
      .in("id", studentIds);

    if (!students) { setLoading(false); return; }

    // Fetch today's attendance for check-in status
    const { data: attendance } = await supabase
      .from("attendance")
      .select("student_id, status, checkin_time")
      .in("student_id", studentIds)
      .eq("date", today);

    const attendMap: Record<string, { checkedIn: boolean; time: string | null }> = {};
    (attendance ?? []).forEach(a => {
      attendMap[a.student_id] = {
        checkedIn: a.status === "checked_in",
        time: a.checkin_time ? new Date(a.checkin_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
      };
    });

    setChildren(students.map(s => ({
      ...s,
      contactId: contactMap[s.id] ?? null,
      checkedIn: attendMap[s.id]?.checkedIn ?? false,
      lastCheckTime: attendMap[s.id]?.time ?? null,
    })));
    setLoading(false);
  }

  async function handleCheckToggle(childId: string, contactId: string | null, _currentlyIn: boolean) {
    setError("");
    // Look up the student's room_id for the RPC
    const { data: student } = await supabase.from("students").select("homeroom_id").eq("id", childId).single();
    const { error: err } = await supabase.rpc("checkin_student", {
      p_student_id: childId,
      p_room_id: student?.homeroom_id ?? null,
      p_contact_id: contactId,
      p_date: today,
    });
    if (err) { setError(err.message); return; }
    await fetchChildren();
  }

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{dateLabel}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        {loading ? (
          <div className="card p-10 text-center text-gray-400">Loading your children's info...</div>
        ) : children.length === 0 ? (
          <div className="card p-10 text-center space-y-2">
            <p className="text-gray-500 font-medium">No children linked to your account</p>
            <p className="text-gray-400 text-sm">Contact your daycare administrator to link your child's profile.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map(child => (
              <StudentCard
                key={child.id}
                child={child}
                onCheckToggle={handleCheckToggle}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
