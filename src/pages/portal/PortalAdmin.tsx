import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { School } from "@/lib/types";
import { Building2, Users, UserCheck, Plus, X, ChevronRight, Pencil, Trash2, Copy, Check, Link as LinkIcon } from "lucide-react";
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

interface Profile {
  id: string;
  full_name: string | null;
  role: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  login_id: string | null;
  role: string;
  school_id: string | null;
  phone: string | null;
}

interface Membership {
  profile_id: string;
  school_id: string;
  role: string;
  schools: { id: string; name: string } | null;
}

interface RemoveConfirm {
  profileId: string;
  profileName: string;
  schoolId: string;
  schoolName: string;
}

interface PendingInvite {
  id: string;
  email: string | null;
  role: string;
  school_id: string;
  created_at: string;
  expires_at: string | null;
  schools: { name: string } | null;
}

interface InviteTarget {
  schoolId: string;
  schoolName: string;
  role: "admin" | "staff" | "parent";
}

type TabKey = "schools" | "users";

export default function PortalAdmin() {
  const { signOut } = useAuth();
  const [schools, setSchools] = useState<SchoolWithAdmins[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStudents: 0, totalStaff: 0 });
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  // Tab
  const [activeTab, setActiveTab] = useState<TabKey>("schools");

  // Users tab state
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userSchoolFilter, setUserSchoolFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState<RemoveConfirm | null>(null);
  const [removing, setRemoving] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<InviteTarget | null>(null);
  const [showInviteUserDialog, setShowInviteUserDialog] = useState(false);
  const [inviteUserSchool, setInviteUserSchool] = useState("");
  const [inviteUserRole, setInviteUserRole] = useState<"admin"|"staff"|"parent">("admin");

  // Create school modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createTz, setCreateTz] = useState("America/New_York");
  const [creating, setCreating] = useState(false);
  const [createAssignUserId, setCreateAssignUserId] = useState("");
  const [createProfileSearch, setCreateProfileSearch] = useState("");
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createdSchoolInviteLink, setCreatedSchoolInviteLink] = useState("");
  const [createdSchoolName, setCreatedSchoolName] = useState("");
  const [createLinkCopied, setCreateLinkCopied] = useState(false);

  // Manage school panel
  const [managedSchool, setManagedSchool] = useState<SchoolWithAdmins | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [editName, setEditName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Persistent admin invite link
  const [adminInviteLink, setAdminInviteLink] = useState<string | null | undefined>(undefined);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Assign existing user dropdown
  const [assignProfileId, setAssignProfileId] = useState("");
  const [assignProfileSearch, setAssignProfileSearch] = useState("");
  const [assignProfileOpen, setAssignProfileOpen] = useState(false);
  const assignRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadAll(); loadProfiles(); }, []);

  useEffect(() => {
    if (activeTab === "users" && userProfiles.length === 0 && !usersLoading) {
      loadUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) {
        setAssignProfileOpen(false);
      }
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadProfiles() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .not("role", "eq", "portal_admin")
      .order("full_name");
    if (data) setAllProfiles(data);
  }

  async function loadUsers() {
    setUsersLoading(true);
    const [{ data: profiles }, { data: mships }, { data: pendingInvites }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, login_id, role, school_id, phone")
        .not("role", "eq", "portal_admin")
        .order("full_name"),
      supabase
        .from("school_memberships")
        .select("profile_id, school_id, role, schools(id, name)"),
      // Pending invitations — sent but not yet registered (used_at is null, non-permanent)
      supabase
        .from("invitations")
        .select("id, email, role, school_id, created_at, expires_at, schools(name)")
        .is("used_at", null)
        .eq("permanent", false)
        .order("created_at", { ascending: false }),
    ]);
    if (profiles) setUserProfiles(profiles);
    if (mships) setMemberships(mships as unknown as Membership[]);
    // Store pending invites so the table can show "Invited" rows
    if (pendingInvites) setPendingInvites(pendingInvites as unknown as PendingInvite[]);
    setUsersLoading(false);
  }

  async function loadAll() {
    const { data: schoolData } = await supabase.from("schools").select("*").order("name");
    if (!schoolData) { setLoading(false); return; }

    const enriched: SchoolWithAdmins[] = [];
    let totalStudents = 0;
    let totalStaff = 0;

    for (const s of schoolData) {
      const [{ data: memberAdmins }, { count: students }, { count: staff }] = await Promise.all([
        supabase.from("school_memberships").select("profile_id, profiles(id, full_name, phone)").eq("school_id", s.id).eq("role", "admin"),
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", s.id),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", s.id).eq("role", "staff"),
      ]);
      const admins: SchoolAdmin[] = (memberAdmins ?? []).map((m: any) => m.profiles).filter(Boolean);
      enriched.push({ ...s, admins });
      totalStudents += students ?? 0;
      totalStaff += staff ?? 0;
    }

    setSchools(enriched);
    setStats({ totalStudents, totalStaff });
    setLoading(false);
  }

  async function loadAdminInvite(schoolId: string) {
    setAdminInviteLink(undefined);
    const { data } = await supabase
      .from("invitations")
      .select("token")
      .eq("school_id", schoolId)
      .eq("role", "admin")
      .eq("permanent", true)
      .maybeSingle();
    if (data?.token) {
      setAdminInviteLink(`${window.location.origin}/register?token=${data.token}`);
    } else {
      setAdminInviteLink(null);
    }
  }

  async function generateAdminInvite(schoolId: string) {
    setGeneratingLink(true);
    const { data } = await supabase
      .from("invitations")
      .insert({ school_id: schoolId, role: "admin", permanent: true, email: null, expires_at: null })
      .select("token")
      .single();
    if (data?.token) {
      setAdminInviteLink(`${window.location.origin}/register?token=${data.token}`);
    }
    setGeneratingLink(false);
  }

  async function createSchool() {
    if (!createName.trim()) return;
    setCreating(true);

    const { data: newSchool } = await supabase
      .from("schools")
      .insert({ name: createName.trim(), timezone: createTz })
      .select("id, name")
      .single();

    if (!newSchool) { setCreating(false); return; }

    // Assign existing user if selected
    if (createAssignUserId) {
      const profile = allProfiles.find(p => p.id === createAssignUserId);
      await supabase.from("school_memberships").upsert(
        { profile_id: createAssignUserId, school_id: newSchool.id, role: "admin" },
        { onConflict: "profile_id,school_id" }
      );
      if (!profile?.role || profile.role !== "admin") {
        await supabase.from("profiles").update({ role: "admin" }).eq("id", createAssignUserId);
      }
    }

    // Generate permanent invite link
    const { data: inv } = await supabase
      .from("invitations")
      .insert({ school_id: newSchool.id, role: "admin", permanent: true, email: null, expires_at: null })
      .select("token")
      .single();

    setCreatedSchoolName(newSchool.name);
    setCreatedSchoolInviteLink(inv?.token ? `${window.location.origin}/register?token=${inv.token}` : "");
    setCreateSuccess(true);
    setCreating(false);
    loadAll();
    loadProfiles();
  }

  function closeCreateModal() {
    setShowCreate(false);
    setCreateSuccess(false);
    setCreateName("");
    setCreateTz("America/New_York");
    setCreateAssignUserId("");
    setCreateProfileSearch("");
    setCreatedSchoolInviteLink("");
    setCreatedSchoolName("");
    setCreateLinkCopied(false);
  }

  async function inviteAdmin() {
    if (!assignProfileId || !managedSchool) return;
    setInviting(true);
    setInviteError("");

    const profile = allProfiles.find(p => p.id === assignProfileId);
    if (!profile) { setInviting(false); return; }

    if (profile.role === "portal_admin") {
      setInviteError("This user is a Portal Admin and cannot be assigned as a school admin.");
      setInviting(false);
      return;
    }

    await supabase.from("school_memberships").upsert(
      { profile_id: assignProfileId, school_id: managedSchool.id, role: "admin" },
      { onConflict: "profile_id,school_id" }
    );

    if (profile.role !== "admin") {
      await supabase.from("profiles").update({ role: "admin" }).eq("id", assignProfileId);
    }

    setAssignProfileId("");
    setAssignProfileSearch("");
    setInviting(false);
    await loadAll();
    const updated = schools.find(s => s.id === managedSchool.id);
    if (updated) setManagedSchool(updated);
    loadProfiles();
  }

  async function removeAdmin(adminId: string) {
    if (!managedSchool) return;
    await supabase.from("school_memberships").delete()
      .eq("profile_id", adminId).eq("school_id", managedSchool.id);
    await loadAll();
    setManagedSchool(prev => prev ? { ...prev, admins: prev.admins.filter(a => a.id !== adminId) } : null);
  }

  async function saveSchoolName() {
    if (!managedSchool || !editName.trim()) return;
    setSavingName(true);
    await supabase.from("schools").update({ name: editName.trim() }).eq("id", managedSchool.id);
    setSavingName(false); setEditingName(false);
    await loadAll();
    setManagedSchool(prev => prev ? { ...prev, name: editName.trim() } : null);
  }

  function copyLink(link: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function removeUserFromSchool(profileId: string, schoolId: string) {
    setRemoving(true);
    await supabase.from("school_memberships")
      .delete()
      .eq("profile_id", profileId)
      .eq("school_id", schoolId);

    const { data: profile } = await supabase.from("profiles")
      .select("school_id").eq("id", profileId).single();
    if (profile?.school_id === schoolId) {
      const { data: otherMemberships } = await supabase
        .from("school_memberships")
        .select("school_id")
        .eq("profile_id", profileId)
        .neq("school_id", schoolId)
        .limit(1);
      await supabase.from("profiles")
        .update({ school_id: otherMemberships?.[0]?.school_id ?? null })
        .eq("id", profileId);
    }

    setRemoveConfirm(null);
    setRemoving(false);
    await loadUsers();
  }

  // Filter profiles for dropdowns
  const createFilteredProfiles = allProfiles.filter(p =>
    (p.full_name ?? "").toLowerCase().includes(createProfileSearch.toLowerCase())
  );

  const managedAdminIds = new Set(managedSchool?.admins.map(a => a.id) ?? []);
  const assignFilteredProfiles = allProfiles.filter(p =>
    !managedAdminIds.has(p.id) &&
    (p.full_name ?? "").toLowerCase().includes(assignProfileSearch.toLowerCase())
  );

  // Build membership map: profile_id -> Membership[]
  const membershipMap = memberships.reduce<Record<string, Membership[]>>((acc, m) => {
    if (!acc[m.profile_id]) acc[m.profile_id] = [];
    acc[m.profile_id].push(m);
    return acc;
  }, {});

  // Filter users
  const filteredUsers = userProfiles.filter(u => {
    const nameMatch = !userSearch ||
      (u.full_name ?? "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.login_id ?? "").toLowerCase().includes(userSearch.toLowerCase());
    const roleMatch = !userRoleFilter || u.role === userRoleFilter;
    const schoolMatch = !userSchoolFilter ||
      (membershipMap[u.id] ?? []).some(m => m.school_id === userSchoolFilter);
    return nameMatch && roleMatch && schoolMatch;
  });

  function getInitials(name: string | null) {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }

  function roleBadge(role: string) {
    const map: Record<string, string> = {
      admin: "bg-orange-100 text-orange-700",
      staff: "bg-blue-100 text-blue-700",
      parent: "bg-green-100 text-green-700",
    };
    const cls = map[role] ?? "bg-gray-100 text-gray-700";
    const label = role.charAt(0).toUpperCase() + role.slice(1);
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
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

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("schools")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "schools"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🏫 Schools
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            👥 Users
          </button>
        </div>

        {/* Schools tab */}
        {activeTab === "schools" && (
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
                          onClick={() => {
                            setManagedSchool(s);
                            setEditName(s.name);
                            setEditingName(false);
                            setAssignProfileId("");
                            setAssignProfileSearch("");
                            setInviteError("");
                            loadAdminInvite(s.id);
                          }}
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
        )}

        {/* Users tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Users</h2>
                <button
                  onClick={() => setShowInviteUserDialog(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus size={13} /> Invite User
                </button>
              </div>
              {/* Filters row */}
              <div className="flex gap-3 flex-wrap">
                <input
                  className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="Search by name or login ID..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
                <select
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={userSchoolFilter}
                  onChange={e => setUserSchoolFilter(e.target.value)}
                >
                  <option value="">All schools</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={userRoleFilter}
                  onChange={e => setUserRoleFilter(e.target.value)}
                >
                  <option value="">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm px-6">
                {userProfiles.length === 0
                  ? "No users found. Use the Invite School Admin button in the Manage School panel to add users."
                  : "No users match your filters."}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Schools</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const userMemberships = membershipMap[u.id] ?? [];
                    const schoolNames = userMemberships.map(m => m.schools?.name).filter(Boolean).join(", ") || "—";
                    const primarySchool = userMemberships[0];
                    const primarySchoolForInvite = schools.find(s => s.id === (u.school_id ?? primarySchool?.school_id));

                    return (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {getInitials(u.full_name)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{u.full_name || "—"}</p>
                              {u.login_id && <p className="text-xs text-gray-400">{u.login_id}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">{roleBadge(u.role)}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{schoolNames}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Active
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            {userMemberships.length > 1 ? (
                              <select
                                className="text-xs border border-gray-200 rounded px-1.5 py-1 text-red-500 focus:outline-none"
                                defaultValue=""
                                onChange={e => {
                                  const schoolId = e.target.value;
                                  if (!schoolId) return;
                                  const school = schools.find(s => s.id === schoolId);
                                  setRemoveConfirm({
                                    profileId: u.id,
                                    profileName: u.full_name ?? "User",
                                    schoolId,
                                    schoolName: school?.name ?? schoolId,
                                  });
                                  e.target.value = "";
                                }}
                              >
                                <option value="">🗑 Remove from…</option>
                                {userMemberships.map(m => (
                                  <option key={m.school_id} value={m.school_id}>{m.schools?.name ?? m.school_id}</option>
                                ))}
                              </select>
                            ) : (
                              <button
                                title="Remove from school"
                                onClick={() => {
                                  const m = userMemberships[0];
                                  if (!m) return;
                                  setRemoveConfirm({
                                    profileId: u.id,
                                    profileName: u.full_name ?? "User",
                                    schoolId: m.school_id,
                                    schoolName: m.schools?.name ?? m.school_id,
                                  });
                                }}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Pending invites — sent but not yet registered */}
                  {pendingInvites
                    .filter(inv => {
                      if (userRoleFilter && userRoleFilter !== inv.role) return false;
                      if (userSchoolFilter && inv.school_id !== userSchoolFilter) return false;
                      if (userSearch && !inv.email?.toLowerCase().includes(userSearch.toLowerCase())) return false;
                      return true;
                    })
                    .map(inv => (
                      <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold text-xs shrink-0">
                              ?
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">{inv.email ?? "—"}</p>
                              <p className="text-xs text-gray-400">Invite pending</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize
                            ${inv.role === "admin" ? "bg-orange-100 text-orange-700" :
                              inv.role === "staff" ? "bg-blue-100 text-blue-700" :
                              "bg-green-100 text-green-700"}`}>
                            {inv.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">{(inv.schools as {name:string}|null)?.name ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Invited</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400">
                          {inv.expires_at ? `Expires ${new Date(inv.expires_at).toLocaleDateString()}` : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Create school modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Create school</h2>
              <button onClick={closeCreateModal}><X size={18} className="text-gray-400" /></button>
            </div>

            {createSuccess ? (
              <div className="p-6 space-y-4">
                <div className="text-center py-2">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={24} className="text-green-500" />
                  </div>
                  <p className="font-semibold text-gray-900">School created!</p>
                  <p className="text-sm text-gray-500 mt-0.5">{createdSchoolName}</p>
                </div>

                {createdSchoolInviteLink && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon size={14} className="text-orange-500" />
                      <p className="text-xs font-medium text-orange-700">Admin Registration Link</p>
                    </div>
                    <p className="text-xs text-gray-500 break-all font-mono bg-white border border-orange-100 rounded px-2 py-1.5">
                      {createdSchoolInviteLink}
                    </p>
                    <button
                      onClick={() => copyLink(createdSchoolInviteLink, setCreateLinkCopied)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                    >
                      {createLinkCopied ? <Check size={12} /> : <Copy size={12} />}
                      {createLinkCopied ? "Copied!" : "Copy Link"}
                    </button>
                    <p className="text-xs text-gray-400">This link never expires and can be reused.</p>
                  </div>
                )}

                <button
                  onClick={closeCreateModal}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
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

                  {/* Assign existing admin */}
                  <div ref={createRef}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Assign existing admin (optional)</label>
                    <div className="relative">
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        placeholder="Search by name…"
                        value={createAssignUserId
                          ? (allProfiles.find(p => p.id === createAssignUserId)?.full_name ?? createProfileSearch)
                          : createProfileSearch}
                        onChange={e => {
                          setCreateProfileSearch(e.target.value);
                          setCreateAssignUserId("");
                          setCreateProfileOpen(true);
                        }}
                        onFocus={() => setCreateProfileOpen(true)}
                      />
                      {createAssignUserId && (
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                          onClick={() => { setCreateAssignUserId(""); setCreateProfileSearch(""); }}
                        >
                          <X size={14} />
                        </button>
                      )}
                      {createProfileOpen && !createAssignUserId && (
                        <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {createFilteredProfiles.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-gray-400">No users found</p>
                          ) : (
                            createFilteredProfiles.map(p => (
                              <button
                                key={p.id}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex items-center gap-2"
                                onClick={() => {
                                  setCreateAssignUserId(p.id);
                                  setCreateProfileSearch("");
                                  setCreateProfileOpen(false);
                                }}
                              >
                                <span className="text-gray-900">{p.full_name || "—"}</span>
                                <span className="text-xs text-gray-400">({p.role})</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                  <button onClick={closeCreateModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button
                    onClick={createSchool} disabled={creating || !createName.trim()}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {creating ? "Creating…" : "Create"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Manage school panel */}
      {managedSchool && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
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

              {/* Admin Registration Link */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <LinkIcon size={14} className="text-orange-500" />
                  <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Admin Registration Link</p>
                </div>
                {adminInviteLink === undefined && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-400">Loading…</span>
                  </div>
                )}
                {adminInviteLink === null && (
                  <button
                    onClick={() => generateAdminInvite(managedSchool.id)}
                    disabled={generatingLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    <Plus size={12} /> {generatingLink ? "Generating…" : "Generate Admin Link"}
                  </button>
                )}
                {typeof adminInviteLink === "string" && (
                  <>
                    <p className="text-xs text-gray-600 break-all font-mono bg-white border border-orange-100 rounded px-2 py-1.5">
                      {adminInviteLink}
                    </p>
                    <button
                      onClick={() => copyLink(adminInviteLink, setLinkCopied)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                    >
                      {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                      {linkCopied ? "Copied!" : "Copy Link"}
                    </button>
                    <p className="text-xs text-gray-400">This link never expires and can be reused.</p>
                  </>
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

              {/* Assign existing user */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Assign existing admin</p>
                <div className="flex gap-2" ref={assignRef}>
                  <div className="relative flex-1">
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      placeholder="Search by name…"
                      value={assignProfileId
                        ? (allProfiles.find(p => p.id === assignProfileId)?.full_name ?? assignProfileSearch)
                        : assignProfileSearch}
                      onChange={e => {
                        setAssignProfileSearch(e.target.value);
                        setAssignProfileId("");
                        setAssignProfileOpen(true);
                        setInviteError("");
                      }}
                      onFocus={() => setAssignProfileOpen(true)}
                    />
                    {assignProfileId && (
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        onClick={() => { setAssignProfileId(""); setAssignProfileSearch(""); }}
                      >
                        <X size={14} />
                      </button>
                    )}
                    {assignProfileOpen && !assignProfileId && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {assignFilteredProfiles.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-gray-400">No users found</p>
                        ) : (
                          assignFilteredProfiles.map(p => (
                            <button
                              key={p.id}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex items-center gap-2"
                              onClick={() => {
                                setAssignProfileId(p.id);
                                setAssignProfileSearch("");
                                setAssignProfileOpen(false);
                              }}
                            >
                              <span className="text-gray-900">{p.full_name || "—"}</span>
                              <span className="text-xs text-gray-400">({p.role})</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={inviteAdmin}
                    disabled={inviting || !assignProfileId}
                    className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
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

      {/* Remove confirmation modal */}
      {removeConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Remove user from school?</h3>
              <p className="text-sm text-gray-600">
                Remove <span className="font-medium">{removeConfirm.profileName}</span> from{" "}
                <span className="font-medium">{removeConfirm.schoolName}</span>? This will revoke their access.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setRemoveConfirm(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  disabled={removing}
                >
                  Cancel
                </button>
                <button
                  onClick={() => removeUserFromSchool(removeConfirm.profileId, removeConfirm.schoolId)}
                  disabled={removing}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {removing ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* InviteDialog for Users tab — per-row invite (kept for manage school) */}
      {inviteTarget && (
        <InviteDialog
          schoolId={inviteTarget.schoolId}
          schoolName={inviteTarget.schoolName}
          defaultRole={inviteTarget.role}
          allowedRoles={["admin", "staff", "parent"]}
          onClose={() => setInviteTarget(null)}
          zIndex="z-[60]"
        />
      )}

      {/* Invite User dialog — top-right button, school + role dropdowns */}
      {showInviteUserDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Invite User</h2>
              <button onClick={() => { setShowInviteUserDialog(false); setInviteUserSchool(""); setInviteUserRole("admin"); }}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">School</label>
                <select
                  className="input w-full"
                  value={inviteUserSchool}
                  onChange={e => setInviteUserSchool(e.target.value)}
                >
                  <option value="">Select a school…</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Role</label>
                <select
                  className="input w-full"
                  value={inviteUserRole}
                  onChange={e => setInviteUserRole(e.target.value as "admin"|"staff"|"parent")}
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowInviteUserDialog(false); setInviteUserSchool(""); }} className="btn-secondary text-sm">Cancel</button>
              <button
                disabled={!inviteUserSchool}
                onClick={() => {
                  const school = schools.find(s => s.id === inviteUserSchool);
                  if (!school) return;
                  setShowInviteUserDialog(false);
                  setInviteTarget({ schoolId: school.id, schoolName: school.name, role: inviteUserRole });
                }}
                className="btn-primary text-sm disabled:opacity-50"
              >
                Next: Generate Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
