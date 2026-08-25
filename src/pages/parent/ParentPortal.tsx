import { useEffect, useState } from "react";
import { Baby, Activity, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Student, Activity as ActivityType } from "@/lib/types";

export default function ParentPortal() {
  const { user, profile, signOut } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [children, setChildren] = useState<Student[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    fetchChildren();
  }, [user?.email]);

  useEffect(() => {
    if (selectedChild) fetchActivities(selectedChild);
  }, [selectedChild]);

  async function fetchChildren() {
    // Find student contacts matching this parent's email
    const { data: contacts } = await supabase
      .from("student_contacts")
      .select("student_id")
      .eq("email", user!.email!);

    if (!contacts || contacts.length === 0) {
      setLoading(false);
      return;
    }

    const ids = contacts.map(c => c.student_id);
    const { data } = await supabase
      .from("students")
      .select("*")
      .in("id", ids);

    setChildren(data ?? []);
    if (data && data.length > 0) setSelectedChild(data[0].id);
    setLoading(false);
  }

  async function fetchActivities(childId: string) {
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("student_id", childId)
      .eq("activity_date", today)
      .eq("staff_only", false)
      .order("created_at", { ascending: false });
    setActivities(data ?? []);
  }

  const child = children.find(c => c.id === selectedChild);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Baby size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900">DayCarePortal</span>
            <span className="text-gray-400 ml-2 text-sm">Parent Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{profile?.full_name ?? user?.email}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-5">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading your children's info...</div>
        ) : children.length === 0 ? (
          <div className="card p-10 text-center">
            <Baby size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No children linked to your account</p>
            <p className="text-gray-400 text-sm mt-1">Contact your daycare to link your child's profile</p>
          </div>
        ) : (
          <>
            {/* Child selector */}
            {children.length > 1 && (
              <div className="flex gap-2">
                {children.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChild(c.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                      ${selectedChild === c.id ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
                  >
                    {c.first_name}
                  </button>
                ))}
              </div>
            )}

            {/* Child header */}
            {child && (
              <div className="card p-5 flex items-center gap-4">
                {child.photo_url ? (
                  <img src={child.photo_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-xl">
                    {child.first_name[0]}{child.last_name[0]}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{child.first_name} {child.last_name}</h2>
                  <p className="text-sm text-gray-500">
                    {child.dob ? `${new Date(child.dob).toLocaleDateString()}` : ""}
                    <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize
                      ${child.enrollment_status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {child.enrollment_status}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Today's activities */}
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Activity size={16} className="text-orange-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Today's Activity Feed</h3>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {activities.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">No activities recorded yet today</p>
                ) : (
                  activities.map(a => (
                    <div key={a.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide capitalize">
                          {a.activity_type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-gray-400">
                          {a.activity_time ?? new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {a.notes && <p className="text-sm text-gray-700">{a.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
