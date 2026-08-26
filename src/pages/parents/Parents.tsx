import { useEffect, useState } from "react";
import { Mail, Phone, ExternalLink, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { StudentContact, Student } from "@/lib/types";
import InviteDialog from "@/components/InviteDialog";

interface ContactRow extends StudentContact {
  student?: Pick<Student, "id" | "first_name" | "last_name" | "homeroom_id">;
}

const PORTAL_BADGE: Record<string, string> = {
  signed_up:    "bg-emerald-100 text-emerald-700",
  invited:      "bg-amber-100 text-amber-700",
  not_signed_up:"bg-gray-100 text-gray-500",
};

// /parents page = school-wide portal access overview (not per-student contact list)
export default function Parents() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;
    fetchContacts().finally(() => setLoading(false));
  }, [profile?.school_id]);

  async function fetchContacts() {
    const { data } = await supabase
      .from("student_contacts")
      .select("*, student:student_id(id, first_name, last_name, homeroom_id)")
      .eq("school_id", profile!.school_id!)
      .order("full_name");
    setContacts((data as ContactRow[]) ?? []);
  }

  const filtered = contacts.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
            <p className="text-sm text-gray-500 mt-0.5">{contacts.length} contacts across all students</p>
          </div>
          {profile?.role === "admin" && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus size={14} /> Invite Parent
            </button>
          )}
        </div>

        {showInvite && profile?.school_id && (
          <InviteDialog
            schoolId={profile.school_id}
            schoolName="this school"
            defaultRole="parent"
            allowedRoles={["parent"]}
            onClose={() => setShowInvite(false)}
          />
        )}

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="input w-80"
        />

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Can Pickup</th>
                <th className="px-5 py-3 font-medium">Portal Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No contacts found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-xs">
                        {c.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{c.full_name}</p>
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="text-xs text-orange-500 flex items-center gap-1 hover:underline">
                            <Mail size={11} />{c.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{c.type}</td>
                  <td className="px-5 py-3">
                    {c.student ? (
                      <a href={`/students/${c.student.id}`} className="text-orange-500 hover:underline flex items-center gap-1">
                        {c.student.first_name} {c.student.last_name}
                        <ExternalLink size={11} />
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {c.phone ? <span className="flex items-center gap-1"><Phone size={12} />{c.phone}</span> : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.can_pickup ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.can_pickup ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PORTAL_BADGE[c.portal_status ?? "not_signed_up"]}`}>
                      {(c.portal_status ?? "not_signed_up").replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
