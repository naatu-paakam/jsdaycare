import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { School } from "@/lib/types";
import { Building2, Users, UserCheck, Plus, X, ChevronRight, Pencil, Trash2, Mail } from "lucide-react";
import InviteDialog from "@/components/InviteDialog";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

interface SchoolAdmin {
  id: string;
  full_name: string | null;
  phone: string | null;
}

interface SchoolWithAdmins extends School {
  admins: SchoolAdmin[];
}

export default function PortalAdmin() {
  const { signOut } = useAuth();
  const [schools, setSchools] = useState<SchoolWithAdmins[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStudents: 0, totalStaff: 0 });

  // Create school modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createTz, setCreateTz] = useState("America/New_York");
  const [creating, setCreating] = useState(false);

  // Manage school panel
  const [managedSchool, setManagedSchool] = useState<SchoolWithAdmins | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [editName, setEditName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const { data: schoolData } = await supabase.from("schools").select("*").order("name");
    if (!schoolData) { setLoading(false); return; }

    // Fetch admins and stats for each school
    const enriched: SchoolWithAdmins[] = [];
    let totalStudents = 0;
    let totalStaff = 0;

    for (const s of schoolData) {
      const [{ data: admins }, { count: students }, { count: staff }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone").eq("school_id", s.id).eq("role", "admin"),
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", s.id),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", s.id).eq("role", "staff"),
      ]);
      enriched.push({ ...s, admins: admins ?? [] });
      totalStudents += students ?? 0;
      totalStaff += staff ?? 0;
    }

    setSchools(enriched);
    setStats({ totalStudents, totalStaff });
    setLoading(false);
  }

  async function createSchool() {
    if (!createName.trim()) return;
    setCreating(true);
    await supabase.from("schools").insert({ name: createName.trim(), timezone: createTz });
    setCreateName(""); setCreateTz("America/New_York");
    setShowCreate(false); setCreating(false);
    loadAll();
  }

  async function inviteAdmin() {
    if (!inviteEmail.trim() || !managedSchool) return;
    setInviting(true);
    setInviteError("");

    // Step 1: Look up user by email using a security-definer DB function
    const { data: userId, error: lookupErr } = await supabase
      .rpc("find_user_id_by_email", { p_email: inviteEmail.trim() });

    if (lookupErr || !userId) {
      setInviteError(
        `No account found for "${inviteEmail.trim()}". ` +
        `Ask them to register at the login page first, then come back to assign them here.`
      );
      setInviting(false);
      return;
    }

    // Step 2: Check if already admin of another school
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("role, school_id")
      .eq("id", userId)
      .single();

    if (existingProfile?.role === "portal_admin") {
      setInviteError("This user is a Portal Admin and cannot be assigned as a school admin.");
      setInviting(false);
      return;
    }

    // Step 3: Add to school_memberships (supports multi-school admins)
    await supabase.from("school_memberships").upsert(
      { profile_id: userId, school_id: managedSchool.id, role: "admin" },
      { onConflict: "profile_id,school_id" }
    );

    // Step 4: Update profiles.role to admin if needed.
    // IMPORTANT: Do NOT overwrite school_id — that would remove them from their current school.
    // profiles.school_id = active school (the one they last switched to).
    // If they have no school yet (new user), set it to this school.
    if (!existingProfile?.school_id) {
      await supabase.from("profiles").update(
        { school_id: managedSchool.id, role: "admin" }
      ).eq("id", userId);
    } else if (existingProfile.role !== "admin") {
      // Already has a school — just upgrade role
      await supabase.from("profiles").update({ role: "admin" }).eq("id", userId);
    }

    setInviteEmail(""); setInviting(false);
    await loadAll();
    const updated = schools.find(s => s.id === managedSchool.id);
    if (updated) setManagedSchool(updated);
  }

  async function removeAdmin(adminId: string) {
    await supabase.from("profiles").update({ school_id: null, role: "staff" }).eq("id", adminId);
    await loadAll();
    if (managedSchool) {
      setManagedSchool(prev => prev ? { ...prev, admins: prev.admins.filter(a => a.id !== adminId) } : null);
    }
  }

  async function saveSchoolName() {
    if (!managedSchool || !editName.trim()) return;
    setSavingName(true);
    await supabase.from("schools").update({ name: editName.trim() }).eq("id", managedSchool.id);
    setSavingName(false); setEditingName(false);
    await loadAll();
    setManagedSchool(prev => prev ? { ...prev, name: editName.trim() } : null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">DayCarePortal Admin</h1>
            <p className="text-xs text-gray-500">Platform management</p>
          </div>
        </div>
        <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          Sign out
        </button>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total schools", value: schools.length, icon: <Building2 size={20} className="text-orange-500" /> },
            { label: "Total students", value: stats.totalStudents, icon: <Users size={20} className="text-orange-500" /> },
            { label: "Total staff", value: stats.totalStaff, icon: <UserCheck size={20} className="text-orange-500" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Schools table */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Schools</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus size={14} /> Create school
            </button>
          </div>

          {schools.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No schools yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Timezone</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Admins</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {schools.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-5 py-3 text-gray-500">{s.timezone}</td>
                    <td className="px-5 py-3 text-gray-500">{s.admins.length}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => { setManagedSchool(s); setEditName(s.name); setEditingName(false); }}
                        className="flex items-center gap-1 text-orange-500 hover:text-orange-700 text-xs font-medium"
                      >
                        Manage <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create school modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Create school</h2>
              <button onClick={() => setShowCreate(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">School name</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={createName} onChange={e => setCreateName(e.target.value)}
                  placeholder="Sunshine Daycare"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Timezone</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={createTz} onChange={e => setCreateTz(e.target.value)}
                >
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button
                onClick={createSchool} disabled={creating || !createName.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage school panel */}
      {managedSchool && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Manage school</h2>
              <button onClick={() => setManagedSchool(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* School name */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">School name</p>
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      value={editName} onChange={e => setEditName(e.target.value)}
                    />
                    <button onClick={saveSchoolName} disabled={savingName} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-50">
                      {savingName ? "…" : "Save"}
                    </button>
                    <button onClick={() => setEditingName(false)} className="px-3 py-1.5 text-gray-500 hover:text-gray-800 text-xs">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 font-medium">{managedSchool.name}</span>
                    <button onClick={() => { setEditName(managedSchool.name); setEditingName(true); }}>
                      <Pencil size={13} className="text-gray-400 hover:text-gray-700" />
                    </button>
                  </div>
                )}
              </div>

              {/* Admins */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Admins</p>
                {managedSchool.admins.length === 0 ? (
                  <p className="text-sm text-gray-400">No admins assigned yet</p>
                ) : (
                  <ul className="space-y-2">
                    {managedSchool.admins.map(a => (
                      <li key={a.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                        <span className="text-sm text-gray-900">{a.full_name || "—"}</span>
                        <button onClick={() => removeAdmin(a.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Invite new admin */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Invite new admin</p>
                <button
                  onClick={() => setShowInviteDialog(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  <Mail size={14} /> Invite School Admin
                </button>
                <p className="text-xs text-gray-400 mt-1.5">
                  Generates a registration link you can send to the new admin.
                </p>
              </div>

              {/* Assign existing user */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Assign existing user</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="existing-user@email.com"
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setInviteError(""); }}
                  />
                  <button
                    onClick={inviteAdmin}
                    disabled={inviting || !inviteEmail.trim()}
                    className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50"
                  >
                    {inviting ? "…" : "Assign"}
                  </button>
                </div>
                {inviteError ? (
                  <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded px-2 py-1">{inviteError}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    For existing DayCarePortal users. They keep access to their other schools.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* InviteDialog — rendered AFTER manage panel with higher z-index so it appears on top */}
      {showInviteDialog && managedSchool && (
        <InviteDialog
          schoolId={managedSchool.id}
          schoolName={managedSchool.name}
          defaultRole="admin"
          allowedRoles={["admin"]}
          onClose={() => setShowInviteDialog(false)}
          zIndex="z-[60]"
        />
      )}
    </div>
  );
}
