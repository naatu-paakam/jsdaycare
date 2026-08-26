import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Baby } from "lucide-react";

interface Invitation {
  id: string;
  school_id: string;
  email: string;
  role: string;
  expires_at: string;
  used_at: string | null;
  school_name: string;
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(true);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("no_token");
      setLoadingInvite(false);
      return;
    }
    loadInvitation();
  }, [token]);

  async function loadInvitation() {
    const { data, error } = await supabase.rpc("get_invitation_by_token", { p_token: token });
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      setLoadError("invalid");
      setLoadingInvite(false);
      return;
    }
    const inv: Invitation = Array.isArray(data) ? data[0] : data;
    setInvitation(inv);
    setLoadingInvite(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: invitation!.email,
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (signUpErr || !signUpData.user) {
      setFormError(signUpErr?.message ?? "Sign up failed. Please try again.");
      setSubmitting(false);
      return;
    }

    const userId = signUpData.user.id;

    // Upsert profile
    await supabase.from("profiles").upsert(
      { id: userId, school_id: invitation!.school_id, role: invitation!.role, full_name: fullName.trim() },
      { onConflict: "id" }
    );

    // Add school membership
    await supabase.from("school_memberships").upsert(
      { profile_id: userId, school_id: invitation!.school_id, role: invitation!.role },
      { onConflict: "profile_id,school_id" }
    );

    // Mark invitation used
    await supabase.rpc("use_invitation", { p_token: token });

    setSuccess(true);
    setTimeout(() => {
      if (invitation!.role === "parent") {
        navigate("/parent");
      } else {
        navigate("/home");
      }
    }, 1500);
  }

  const roleLabel = invitation?.role
    ? invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)
    : "";

  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4">
            <Baby size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DayCarePortal</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your account</p>
        </div>

        {/* Error states */}
        {loadError === "no_token" && (
          <div className="card p-8 text-center space-y-3">
            <p className="text-gray-700 font-medium">Please use your invitation link</p>
            <p className="text-sm text-gray-500">
              Registration requires a valid invitation. Ask your admin to send you an invite link.
            </p>
            <Link to="/login" className="text-sm text-orange-500 hover:underline">Back to login</Link>
          </div>
        )}

        {loadError === "invalid" && (
          <div className="card p-8 text-center space-y-3">
            <p className="text-red-600 font-medium">Invalid or expired invitation link</p>
            <p className="text-sm text-gray-500">This invitation link is not valid. Please request a new one from your admin.</p>
            <Link to="/login" className="text-sm text-orange-500 hover:underline">Back to login</Link>
          </div>
        )}

        {!loadError && invitation && (
          <>
            {invitation.used_at && (
              <div className="card p-8 text-center space-y-3">
                <p className="text-amber-600 font-medium">This invitation has already been used</p>
                <p className="text-sm text-gray-500">If you already registered, sign in below.</p>
                <Link to="/login" className="text-sm text-orange-500 hover:underline">Sign in</Link>
              </div>
            )}

            {!invitation.used_at && new Date(invitation.expires_at) < new Date() && (
              <div className="card p-8 text-center space-y-3">
                <p className="text-red-600 font-medium">This invitation has expired</p>
                <p className="text-sm text-gray-500">Contact your admin to send a new invitation.</p>
                <Link to="/login" className="text-sm text-orange-500 hover:underline">Back to login</Link>
              </div>
            )}

            {!invitation.used_at && new Date(invitation.expires_at) >= new Date() && (
              <div className="card p-8">
                {success ? (
                  <div className="text-center py-6 space-y-2">
                    <div className="text-4xl">🎉</div>
                    <p className="font-semibold text-gray-900">Account created!</p>
                    <p className="text-sm text-gray-500">Redirecting you now…</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Read-only info badges */}
                    <div className="flex flex-wrap gap-2 pb-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium rounded-full">
                        {invitation.school_name}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium rounded-full">
                        {roleLabel}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={invitation.email}
                        readOnly
                        className="input bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="input"
                        placeholder="Jane Smith"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input"
                        placeholder="Min 8 characters"
                        required
                        minLength={8}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="input"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    {formError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                        {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full justify-center flex items-center gap-2 py-2.5"
                    >
                      {submitting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : null}
                      {submitting ? "Creating account…" : "Create Account"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
