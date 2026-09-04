import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
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
  activeStudents: number;
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

// ─── Edit / Manage User Modal ─────────────────────────────────────────────────
function EditUserModal({ user, memberships, schools, onSave, onRemoveFromSchool, onAssignSchool, onClose }: {
  user: UserProfile;
  memberships: { school_id: string; schools?: { name: string } | null }[];
  schools: { id: string; name: string }[];
  onSave: (userId: string, updates: { full_name: string; role: string; phone: string }) => Promise<{ message: string } | null | undefined>;
  onRemoveFromSchool: (schoolId: string, schoolName: string) => void;
  onAssignSchool: (schoolId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [fullName, setFullName]     = useState(user.full_name ?? "");
  const [role, setRole]             = useState(user.role);
  const [phone, setPhone]           = useState(user.phone ?? "");
  const [assignSchoolId, setAssignSchoolId] = useState("");
  const [assigning, setAssigning]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const currentSchoolIds = new Set(memberships.map(m => m.school_id));
  const availableSchools = schools.filter(s => !currentSchoolIds.has(s.id));

  async function handleAssign() {
    if (!assignSchoolId) return;
    setAssigning(true);
    await onAssignSchool(assignSchoolId);
    setAssignSchoolId("");
    setAssigning(false);
  }

  async function handleSave() {
    if (!fullName.trim()) { setError("Name is required"); return; }
    setSaving(true);
    const err = await onSave(user.id, { full_name: fullName, role, phone });
    setSaving(false);
    if (err) setError(err.message);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Manage User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 555-1234" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          {/* Schools — only for admin/staff (parents get school from student contacts) */}
          {role !== "parent" && <div>
            <label className="label">Schools</label>
            <div className="space-y-1.5">
              {memberships.map(m => (
                <div key={m.school_id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{m.schools?.name ?? m.school_id}</span>
                  <button
                    onClick={() => onRemoveFromSchool(m.school_id, m.schools?.name ?? m.school_id)}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {memberships.length === 0 && (
                <p className="text-xs text-gray-400 px-3 py-2">No schools assigned</p>
              )}
            </div>
            {availableSchools.length > 0 && (
              <div className="flex gap-2 mt-2">
                <select
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={assignSchoolId}
                  onChange={e => setAssignSchoolId(e.target.value)}
                >
                  <option value="">+ Assign to school…</option>
                  {availableSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!assignSchoolId || assigning}
                  className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {assigning ? "…" : "Assign"}
                </button>
              </div>
            )}
          </div>}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [inviteTarget, setInviteTarget] = useState<InviteTarget | null>(null);
  const [showInviteUserDialog, setShowInviteUserDialog] = useState(false);
  const [inviteUserSchool, setInviteUserSchool] = useState("");
  const [inviteUserRole, setInviteUserRole] = useState<"admin"|"staff"|"parent">("admin");

  // Create school modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createTz, setCreateTz] = useState("America/New_York");
  const [createPhone, setCreatePhone] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createAddress, setCreateAddress] = useState({ street: "", city: "", state: "", zip: "" });
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
  const [schoolSearch, setSchoolSearch] = useState("");
  const [deleteSchoolConfirm, setDeleteSchoolConfirm] = useState<SchoolWithAdmins | null>(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<UserProfile | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [editName, setEditName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editSchoolPhone, setEditSchoolPhone] = useState("");
  const [editSchoolEmail, setEditSchoolEmail] = useState("");
  const [editSchoolAddress, setEditSchoolAddress] = useState({ street: "", city: "", state: "", zip: "" });
  const [savingSchoolDetails, setSavingSchoolDetails] = useState(false);
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
      // Use supabaseAdmin for student/staff counts — portal admin is RLS-blocked from cross-school reads
      const db = supabaseAdmin ?? supabase;
      const [{ data: memberAdmins }, { count: students }, { count: staff }, { count: activeStudents }] = await Promise.all([
        supabase.from("school_memberships").select("profile_id, profiles(id, full_name, phone)").eq("school_id", s.id).eq("role", "admin"),
        db.from("students").select("id", { count: "exact", head: true }).eq("school_id", s.id),
        db.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", s.id).eq("role", "staff"),
        db.from("students").select("id", { count: "exact", head: true }).eq("school_id", s.id).eq("enrollment_status", "active"),
      ]);
      const admins: SchoolAdmin[] = (memberAdmins ?? []).map((m: any) => m.profiles).filter(Boolean);
      enriched.push({ ...s, admins, activeStudents: activeStudents ?? 0 });
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
      .insert({
        name: createName.trim(), timezone: createTz,
        phone: createPhone.trim() || null, email: createEmail.trim() || null,
        address: (createAddress.street || createAddress.city) ? createAddress : null,
      })
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

  async function saveUserEdit(userId: string, updates: { full_name: string; role: string; phone: string }) {
    const { error } = await supabase.from("profiles").update({
      full_name: updates.full_name.trim() || null,
      role: updates.role,
      phone: updates.phone.trim() || null,
    }).eq("id", userId);
    if (!error) {
      setUserProfiles(prev => prev.map((u: UserProfile) => u.id === userId ? { ...u, ...updates, full_name: updates.full_name.trim() || null, phone: updates.phone.trim() || null } : u));
      setEditingUser(null);
    }
    return error;
  }

  async function assignUserToSchool(userId: string, schoolId: string) {
    await supabase.from("school_memberships").upsert({ profile_id: userId, school_id: schoolId, role: editingUser?.role ?? "staff" });
    // Refresh memberships by reloading users
    const { data } = await supabase.from("school_memberships")
      .select("profile_id, school_id, schools(name)")
      .eq("profile_id", userId);
    if (data) {
      setMemberships(prev => {
        const filtered = prev.filter(m => m.profile_id !== userId);
        return [...filtered, ...(data as unknown as typeof prev)];
      });
    }
  }

  async function saveSchoolDetails() {
    if (!managedSchool) return;
    setSavingSchoolDetails(true);
    const address = (editSchoolAddress.street || editSchoolAddress.city) ? editSchoolAddress : null;
    await supabase.from("schools").update({
      phone: editSchoolPhone.trim() || null,
      email: editSchoolEmail.trim() || null,
      address,
    }).eq("id", managedSchool.id);
    setSchools(prev => prev.map(s => s.id === managedSchool.id ? { ...s, phone: editSchoolPhone.trim() || null, email: editSchoolEmail.trim() || null, address } : s));
    setManagedSchool(prev => prev ? { ...prev, phone: editSchoolPhone.trim() || null, email: editSchoolEmail.trim() || null, address } : null);
    setSavingSchoolDetails(false);
  }

  async function deleteUser(userId: string) {
    // Use security-definer RPC: nullifies loose refs, removes memberships, deletes profile
    await supabase.rpc("delete_portal_user", { p_user_id: userId });
    // Auth user deletion (service role via admin API — best-effort)
    await supabase.auth.admin.deleteUser(userId).catch(() => {});
    setUserProfiles(prev => prev.filter(u => u.id !== userId));
    setMemberships(prev => prev.filter(m => m.profile_id !== userId));
    setDeleteUserConfirm(null);
  }

  async function deleteSchool(schoolId: string) {
    // Use security-definer RPC: nullifies profiles.school_id, deletes students cascade, then school cascade
    await supabase.rpc("delete_school_cascade", { p_school_id: schoolId });
    setSchools(prev => prev.filter(s => s.id !== schoolId));
    setUserProfiles(prev => prev.map(u => u.school_id === schoolId ? { ...u, school_id: null } : u));
    setDeleteSchoolConfirm(null);
  }

  async function deleteInvite(inviteId: string) {
    await supabase.from("invitations").delete().eq("id", inviteId);
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
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
            <div className="px-5 py-4 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Schools</h2>
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  <Plus size={14} /> Create school
                </button>
              </div>
              <input
                value={schoolSearch}
                onChange={e => setSchoolSearch(e.target.value)}
                placeholder="Search schools..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {(() => {
              const filteredSchools = schools.filter(s =>
                s.name.toLowerCase().includes(schoolSearch.toLowerCase())
              );
              return filteredSchools.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No schools found</p>
              ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Timezone</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Address</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Students</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Admins</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
                    <th className="px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchools.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-5 py-3 text-gray-500">{s.timezone}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {s.address ? `${s.address.city ?? ""}${s.address.state ? ", " + s.address.state : ""}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{s.phone ?? "—"}</td>
                      <td className="px-5 py-3">
                        {s.activeStudents > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            {s.activeStudents} active
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-500">{s.admins.length}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            title="Manage school"
                            onClick={() => {
                              setManagedSchool(s);
                              setEditName(s.name);
                              setEditingName(false);
                              setEditSchoolPhone(s.phone ?? "");
                              setEditSchoolEmail(s.email ?? "");
                              const a2 = (s.address as {street?:string;city?:string;state?:string;zip?:string}|null) ?? {};
                              setEditSchoolAddress({ street: a2.street ?? "", city: a2.city ?? "", state: a2.state ?? "", zip: a2.zip ?? "" });
                              setAssignProfileId("");
                              setAssignProfileSearch("");
                              setInviteError("");
                              loadAdminInvite(s.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            title={s.activeStudents > 0 ? `${s.activeStudents} active students — deleting will remove them` : "Delete school"}
                            onClick={() => setDeleteSchoolConfirm(s)}
                            className={`p-1.5 rounded-lg transition-colors ${s.activeStudents > 0 ? "text-amber-400 hover:text-amber-600 hover:bg-amber-50" : "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              );
            })()}
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
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              title="Manage user"
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              title="Delete user"
                              onClick={() => setDeleteUserConfirm(u)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
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
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">
                              {inv.expires_at ? `Expires ${new Date(inv.expires_at).toLocaleDateString()}` : "—"}
                            </span>
                            <button
                              onClick={() => deleteInvite(inv.id)}
                              title="Delete invite"
                              className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={createPhone} onChange={e => setCreatePhone(e.target.value)} placeholder="e.g. 555-1234" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="info@school.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 mb-2"
                      value={createAddress.street} onChange={e => setCreateAddress(a => ({ ...a, street: e.target.value }))} placeholder="Street address" />
                    <div className="grid grid-cols-3 gap-2">
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={createAddress.city} onChange={e => setCreateAddress(a => ({ ...a, city: e.target.value }))} placeholder="City" />
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={createAddress.state} onChange={e => setCreateAddress(a => ({ ...a, state: e.target.value }))} placeholder="State" />
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={createAddress.zip} onChange={e => setCreateAddress(a => ({ ...a, zip: e.target.value }))} placeholder="ZIP" />
                    </div>
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

              {/* Contact & Address */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact & Address</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                    <input className="input text-sm w-full" value={editSchoolPhone} onChange={e => setEditSchoolPhone(e.target.value)} placeholder="e.g. 555-1234" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Email</label>
                    <input className="input text-sm w-full" value={editSchoolEmail} onChange={e => setEditSchoolEmail(e.target.value)} placeholder="info@school.com" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Street address</label>
                  <input className="input text-sm w-full mb-2" value={editSchoolAddress.street} onChange={e => setEditSchoolAddress(a => ({...a, street: e.target.value}))} placeholder="Street address" />
                  <div className="grid grid-cols-3 gap-2">
                    <input className="input text-sm" value={editSchoolAddress.city} onChange={e => setEditSchoolAddress(a => ({...a, city: e.target.value}))} placeholder="City" />
                    <input className="input text-sm" value={editSchoolAddress.state} onChange={e => setEditSchoolAddress(a => ({...a, state: e.target.value}))} placeholder="State" />
                    <input className="input text-sm" value={editSchoolAddress.zip} onChange={e => setEditSchoolAddress(a => ({...a, zip: e.target.value}))} placeholder="ZIP" />
                  </div>
                </div>
                <button onClick={saveSchoolDetails} disabled={savingSchoolDetails} className="btn-primary text-sm">
                  {savingSchoolDetails ? "Saving…" : "Save Contact Info"}
                </button>
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

      {/* Edit / Manage User modal */}
      {editingUser && (() => {
        const userMemberships = memberships.filter(m => m.profile_id === editingUser.id);
        return (
          <EditUserModal
            user={editingUser}
            memberships={userMemberships}
            schools={schools}
            onSave={saveUserEdit}
            onRemoveFromSchool={(schoolId, schoolName) => {
              setEditingUser(null);
              setRemoveConfirm({ profileId: editingUser.id, profileName: editingUser.full_name ?? "User", schoolId, schoolName });
            }}
            onAssignSchool={schoolId => assignUserToSchool(editingUser.id, schoolId)}
            onClose={() => setEditingUser(null)}
          />
        );
      })()}

      {/* Delete school confirmation */}
      {deleteSchoolConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Delete school?</h3>
            <p className="text-sm text-gray-600">
              Delete <span className="font-medium">{deleteSchoolConfirm.name}</span>? This will permanently remove the school and all associated data.
            </p>
            {deleteSchoolConfirm.activeStudents > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠ This school has <strong>{deleteSchoolConfirm.activeStudents} active student{deleteSchoolConfirm.activeStudents > 1 ? "s" : ""}</strong>. Deleting will permanently remove their profiles, contacts, immunizations, and activity history.
              </p>
            )}
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠ This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteSchoolConfirm(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => deleteSchool(deleteSchoolConfirm.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Delete School
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete user confirmation */}
      {deleteUserConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Delete user?</h3>
            <p className="text-sm text-gray-600">
              Permanently delete <span className="font-medium">{deleteUserConfirm.full_name ?? deleteUserConfirm.login_id ?? "this user"}</span>? They will lose all access immediately.
            </p>
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠ This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteUserConfirm(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => deleteUser(deleteUserConfirm.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Delete User
              </button>
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
