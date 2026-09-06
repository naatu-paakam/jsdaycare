import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Baby } from "lucide-react";

interface Invitation {
  id: string;
  school_id: string;
  email: string | null;
  role: string;
  expires_at: string | null;
  used_at: string | null;
  school_name: string;
  permanent: boolean;
  metadata?: { first_name?: string; last_name?: string; phone?: string; email?: string } | null;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "School Admin",
  staff: "Staff",
  parent: "Parent",
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(true);

  // Form fields
  const [loginId, setLoginId]         = useState(""); // username / user ID
  const [firstName, setFirstName]     = useState("");
  const [lastName, setLastName]       = useState("");
  const [email, setEmail]             = useState(""); // optional if loginId provided
  const [phone, setPhone]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");
  const [success, setSuccess]         = useState(false);

  useEffect(() => {
    if (!token) { setLoadError("no_token"); setLoadingInvite(false); return; }
    loadInvitation();
  }, [token]);

  async function loadInvitation() {
    const { data, error } = await supabase.rpc("get_invitation_by_token", { p_token: token });
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      setLoadError("invalid"); setLoadingInvite(false); return;
    }
    const inv = Array.isArray(data) ? data[0] : data;
    if (!inv.permanent && inv.used_at) { setLoadError("used"); setLoadingInvite(false); return; }
    if (!inv.permanent && inv.expires_at && new Date(inv.expires_at) < new Date()) {
      setLoadError("expired"); setLoadingInvite(false); return;
    }
    // Pre-fill contact info from invitation email and metadata
    if (inv.email) setEmail(inv.email);
    if (inv.metadata?.first_name) setFirstName(inv.metadata.first_name);
    if (inv.metadata?.last_name)  setLastName(inv.metadata.last_name);
    if (inv.metadata?.phone)      setPhone(inv.metadata.phone);
    // Also fetch from student_contacts if email matches (fallback for invites without metadata)
    if (inv.email && (!inv.metadata?.first_name)) {
      const { data: contact } = await supabase
        .from("student_contacts")
        .select("full_name, phone")
        .eq("email", inv.email)
        .eq("school_id", inv.school_id)
        .maybeSingle();
      if (contact?.full_name) {
        const parts = contact.full_name.trim().split(" ");
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" ") || "");
      }
      if (contact?.phone) setPhone(contact.phone);
    }
    setInvitation(inv as Invitation);
    setLoadingInvite(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    // Validate
    if (!loginId.trim()) { setFormError("User ID is required."); return; }
    if (!/^[a-zA-Z0-9_.-]+$/.test(loginId)) { setFormError("User ID can only contain letters, numbers, underscores, dots and hyphens."); return; }
    if (!firstName.trim()) { setFormError("First name is required."); return; }
    if (!lastName.trim()) { setFormError("Last name is required."); return; }
    if (!email.trim() && !loginId.trim()) { setFormError("Email or User ID is required."); return; }
    if (password.length < 8) { setFormError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setFormError("Passwords do not match."); return; }

    setSubmitting(true);

    // Determine auth email: use provided email, or generate internal one from loginId
    // Call /api/register-user — handled by:
    //   localhost: Vite dev middleware (vite.config.ts localRegisterPlugin)
    //   production: Netlify serverless function
    // Both run in Node.js context where sb_secret_* key is allowed
    const res = await fetch("/api/register-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loginId: loginId.trim(), firstName: firstName.trim(), lastName: lastName.trim(),
        email: email.trim(), phone: phone.trim(), password,
        invitationToken: token, schoolId: invitation!.school_id,
        role: invitation!.role, permanent: invitation!.permanent,
      }),
    });

    const result = await res.json();
    if (!res.ok || result.error) {
      setFormError(result.error ?? "Registration failed. Please try again.");
      setSubmitting(false);
      return;
    }

    const authEmail = result.authEmail;

    // Sign in immediately (user was created with email_confirm=true on server)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: authEmail, password });
    if (signInErr) {
      // Fallback: show success and redirect to login
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } else {
      navigate(invitation!.role === "parent" ? "/parent" : "/home");
    }

    setSubmitting(false);
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loadingInvite) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Error states ──────────────────────────────────────────────────────────
  const ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
    no_token:  { title: "Please use your invitation link", body: "Registration requires a valid invitation. Ask your admin to send you an invite link." },
    invalid:   { title: "Invalid invitation", body: "This invitation link is not valid or could not be found." },
    used:      { title: "Already used", body: "This invitation link has already been used to create an account." },
    expired:   { title: "Invitation expired", body: "This invitation link has expired. Ask your admin to generate a new one." },
  };

  if (loadError) {
    const msg = ERROR_MESSAGES[loadError] ?? ERROR_MESSAGES.invalid;
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
          <Baby size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Daycare Portal</h1>
        <p className="text-sm text-gray-500 mb-6">Create your account</p>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-sm text-center space-y-3">
          <p className="font-semibold text-gray-900">{msg.title}</p>
          <p className="text-sm text-gray-500">{msg.body}</p>
          <Link to="/login" className="text-sm text-orange-500 hover:underline block">Back to login</Link>
        </div>
      </div>
    );
  }

  // ─── Success ────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center space-y-3">
          <div className="text-4xl">✅</div>
          <p className="font-semibold text-gray-900">Account created!</p>
          <p className="text-sm text-gray-500">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  // ─── Registration form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
        <Baby size={24} className="text-white" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Daycare Portal</h1>
      <p className="text-sm text-gray-500 mb-6">Create your account</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-md space-y-4">
        {/* School + role badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
            🏫 {invitation?.school_name}
          </span>
          <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">
            {ROLE_LABEL[invitation?.role ?? ""] ?? invitation?.role}
          </span>
        </div>

        {formError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
        )}

        {/* User ID */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            User ID <span className="text-red-500">*</span>
            <span className="text-xs text-gray-400 font-normal ml-1">(your login username)</span>
          </label>
          <input
            className="input w-full"
            placeholder="e.g. jaya.bijjala"
            value={loginId}
            onChange={e => setLoginId(e.target.value)}
            autoComplete="username"
          />
          <p className="text-xs text-gray-400 mt-0.5">Letters, numbers, underscores, dots and hyphens only</p>
        </div>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">First name <span className="text-red-500">*</span></label>
            <input className="input w-full" placeholder="Jaya" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Last name <span className="text-red-500">*</span></label>
            <input className="input w-full" placeholder="Bijjala" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>

        {/* Email — optional if loginId is set */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Email
            <span className="text-xs text-gray-400 font-normal ml-1">(optional — use User ID to login if not provided)</span>
          </label>
          <input
            type="email"
            className="input w-full"
            placeholder="jaya@jsjoy.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Phone <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
          <input className="input w-full" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        {/* Password */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Password <span className="text-red-500">*</span></label>
          <input type="password" className="input w-full" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm password <span className="text-red-500">*</span></label>
          <input type="password" className="input w-full" placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
          {submitting ? "Creating account…" : "Create Account"}
        </button>

        <p className="text-center text-xs text-gray-400">
          Already have an account? <Link to="/login" className="text-orange-500 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
