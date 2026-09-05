import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Plus, Pencil, Trash2, X, Copy, Check, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtPhone } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Profile } from "@/lib/types";

// ─── Add Staff Dialog ─────────────────────────────────────────────────────────
function AddStaffDialog({ schoolId, onClose, onAdded }: {
  schoolId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [role, setRole]           = useState<"staff" | "admin">("staff");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError]         = useState("");

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleGenerate() {
    if (!fullName.trim()) { setError("Full name is required"); return; }
    if (!email.trim()) { setError("Email is required to generate an invite link"); return; }
    setError(""); setGenerating(true);

    // Upload photo if provided
    let avatarUrl: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `staff-avatars/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, photoFile, { upsert: true });
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = publicUrl;
      }
    }

    // Create invitation — email + role + school
    const { data, error: invErr } = await supabase.from("invitations")
      .insert({ school_id: schoolId, email: email.trim(), role, invited_by: user?.id, permanent: false })
      .select("token")
      .single();

    if (invErr || !data) {
      setError(invErr?.message ?? "Failed to generate invite");
      setGenerating(false);
      return;
    }

    // Store the pre-filled profile info in the invitation metadata so registration page can pre-fill it
    await supabase.from("invitations").update({
      metadata: { full_name: fullName.trim(), phone: phone.trim() || null, avatar_url: avatarUrl },
    }).eq("token", data.token);

    setInviteLink(`${window.location.origin}/register?token=${data.token}`);
    setGenerating(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Staff Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Photo */}
          <div className="flex justify-center">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="relative w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-orange-400 transition-colors group">
              {photoPreview
                ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                : <Camera size={24} className="text-gray-400 group-hover:text-orange-400" />
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Sarah Johnson" />
          </div>
          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@example.com" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 555-1234" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value as "staff" | "admin")}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {inviteLink && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <p className="text-xs text-green-700 font-medium">Invite link generated! Share it with {fullName || "the staff member"}.</p>
              <div className="flex gap-2">
                <input readOnly value={inviteLink} onClick={e => (e.target as HTMLInputElement).select()}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono bg-white" />
                <button onClick={copyLink}
                  className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600">
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-gray-400">Link expires in 7 days. They'll create their login on the registration page.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">{inviteLink ? "Done" : "Cancel"}</button>
          {!inviteLink && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary">
              {generating ? "Generating…" : "Generate Invite Link"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Staff Modal ─────────────────────────────────────────────────────────
function EditStaffModal({ member, onClose, onSaved }: {
  member: Profile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(member.full_name ?? "");
  const [phone, setPhone]       = useState(member.phone ?? "");
  const [role, setRole]         = useState(member.role ?? "staff");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function save() {
    if (!fullName.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    const { error: err } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      role,
    }).eq("id", member.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Edit Staff Member</h2>
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
            <select className="input" value={role} onChange={e => setRole(e.target.value as "admin" | "staff")}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Staff List ───────────────────────────────────────────────────────────────
export default function StaffList() {
  const { profile } = useAuth();
  const [staff, setStaff]         = useState<Profile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [editing, setEditing]     = useState<Profile | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!profile?.school_id) return;
    fetchStaff();
  }, [profile?.school_id]);

  async function fetchStaff() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("school_id", profile!.school_id!)
      .in("role", ["admin", "staff"])
      .order("full_name");
    setStaff(data ?? []);
    setLoading(false);
  }

  async function deleteStaff(id: string) {
    setDeleting(true);
    // Remove from school_memberships (soft-remove from school)
    await supabase.from("school_memberships").delete().eq("profile_id", id).eq("school_id", profile!.school_id!);
    // Clear school_id on profile so they lose access
    await supabase.from("profiles").update({ school_id: null }).eq("id", id);
    setDeleting(false);
    setConfirmDel(null);
    fetchStaff();
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff & Payroll</h1>
            <p className="text-sm text-gray-500 mt-0.5">{staff.length} team members</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus size={14} /> Add Staff
            </button>
          )}
        </div>

        {showAdd && profile?.school_id && (
          <AddStaffDialog
            schoolId={profile.school_id}
            onClose={() => setShowAdd(false)}
            onAdded={() => { setShowAdd(false); fetchStaff(); }}
          />
        )}

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                {isAdmin && <th className="px-5 py-3 font-medium w-24">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 4 : 3} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={isAdmin ? 4 : 3} className="px-5 py-10 text-center text-gray-400">No staff found</td></tr>
              ) : staff.map(s => {
                const isConfirming = confirmDel === s.id;
                const isSelf = s.id === profile?.id;
                return (
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
                    <td className="px-5 py-3 text-gray-500">
                      {s.phone ? <span className="flex items-center gap-1"><Phone size={12} />{s.phone}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        {isConfirming ? (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-red-600 font-medium">Remove?</span>
                            <button onClick={() => deleteStaff(s.id)} disabled={deleting}
                              className="text-red-600 font-medium hover:underline">Yes</button>
                            <button onClick={() => setConfirmDel(null)} className="text-gray-400 hover:underline">No</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditing(s)} title="Edit"
                              className="p-1 text-gray-400 hover:text-orange-500 rounded transition-colors">
                              <Pencil size={14} />
                            </button>
                            {!isSelf && (
                              <button onClick={() => setConfirmDel(s.id)} title="Remove from school"
                                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditStaffModal
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchStaff(); }}
        />
      )}
    </Layout>
  );
}
