import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { School } from "@/lib/types";
import { Building2, Users, UserCheck, Plus, X, ChevronRight, Pencil, Trash2, Copy, Check, Link as LinkIcon } from "lucide-react";

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

export default function PortalAdmin() {
  const { signOut } = useAuth();
  const [schools, setSchools] = useState<SchoolWithAdmins[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStudents: 0, totalStaff: 0 });
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

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

  // Filter profiles for dropdowns
  const createFilteredProfiles = allProfiles.filter(p =>
    (p.full_name ?? "").toLowerCase().includes(createProfileSearch.toLowerCase())
  );

  const managedAdminIds = new Set(managedSchool?.admins.map(a => a.id) ?? []);
  const assignFilteredProfiles = allProfiles.filter(p =>
    !managedAdminIds.has(p.id) &&
    (p.full_name ?? "").toLowerCase().includes(assignProfileSearch.toLowerCase())
  );

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
    </div>
  );
}
