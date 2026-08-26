import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserCheck, Mail, Phone, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Profile } from "@/lib/types";
import InviteDialog from "@/components/InviteDialog";

export default function StaffList() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("school_id", profile.school_id)
      .in("role", ["admin", "staff"])
      .order("full_name")
      .then(({ data }) => {
        setStaff(data ?? []);
        setLoading(false);
      });
  }, [profile?.school_id]);

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff & Payroll</h1>
            <p className="text-sm text-gray-500 mt-0.5">{staff.length} team members</p>
          </div>
          {profile?.role === "admin" && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus size={14} /> Invite Staff
            </button>
          )}
        </div>

        {showInvite && profile?.school_id && (
          <InviteDialog
            schoolId={profile.school_id}
            schoolName="this school"
            defaultRole="staff"
            allowedRoles={["staff"]}
            onClose={() => setShowInvite(false)}
          />
        )}

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-400">No staff found</td></tr>
              ) : (
                staff.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link to={`/staff/${s.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-xs">
                          {s.full_name?.[0] ?? "?"}
                        </div>
                        <span className="font-medium text-gray-900 group-hover:text-orange-500">{s.full_name ?? "Unnamed"}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize
                        ${s.role === "admin" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-600"}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 flex items-center gap-1">
                      {s.phone ? <><Phone size={12} />{s.phone}</> : <span className="text-gray-300">—</span>}
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
