import { useEffect, useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

// Check-in code lives on profiles.checkin_code for ALL roles (parent and staff).
// Uniqueness is global — no school_id filter on the uniqueness check.
export default function CheckinCodeCard() {
  const { user, profile } = useAuth();

  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [newCode,     setNewCode]     = useState("");
  const [visible,     setVisible]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);

  useEffect(() => {
    if (!user?.id || !profile) return;
    loadCurrentCode();
  }, [user?.id, profile?.role]);

  async function loadCurrentCode() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("checkin_code")
      .eq("id", user!.id)
      .maybeSingle();
    setCurrentCode(data?.checkin_code ?? null);
    setLoading(false);
  }

  if (!profile || !["staff", "parent"].includes(profile.role)) return null;

  const maskedCode = currentCode
    ? (visible ? currentCode : "•".repeat(currentCode.length))
    : null;

  async function handleSave() {
    setError("");
    setSuccess(false);

    const trimmed = newCode.trim();
    if (!/^\d{4,6}$/.test(trimmed)) {
      setError("Code must be 4–6 digits (numbers only).");
      return;
    }

    setSaving(true);

    // Rely on the DB global unique constraint (profiles_checkin_code_global_unique).
    // A client-side pre-check would fail for parents whose RLS only allows reading their own row.
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ checkin_code: trimmed })
      .eq("id", profile!.id);

    setSaving(false);

    if (updateErr) {
      const isConflict = updateErr.message.includes("unique") || updateErr.message.includes("duplicate") || updateErr.message.includes("23505");
      setError(isConflict ? "This code is already used, please enter a different one." : updateErr.message);
      return;
    }

    setCurrentCode(trimmed);
    setNewCode("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="card" data-testid="checkin-code-card">
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <KeyRound size={16} className="text-orange-500" />
        <h2 className="font-semibold text-gray-900 text-sm">My Check-in Code</h2>
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-end gap-6 flex-wrap">
          {/* Current code */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Current code</p>
            {loading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : currentCode ? (
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-2xl font-bold tracking-widest text-gray-900"
                  data-testid="current-code-display"
                >
                  {maskedCode}
                </span>
                <button
                  onClick={() => setVisible(v => !v)}
                  className="text-gray-400 hover:text-orange-500"
                  title={visible ? "Hide code" : "Show code"}
                >
                  {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Not set</p>
            )}
          </div>

          {/* Change / set code */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500" htmlFor="checkin-code-input">
              {currentCode ? "Change code" : "Set a new code"}
            </label>
          <div className="flex gap-2">
            <input
              id="checkin-code-input"
              data-testid="checkin-code-input"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              value={newCode}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "");
                setNewCode(v);
                setError("");
                setSuccess(false);
              }}
              placeholder="4–6 digits"
              className="input w-32 font-mono tracking-widest text-center"
            />
            <button
              onClick={handleSave}
              disabled={saving || newCode.length < 4}
              data-testid="save-checkin-code-btn"
              className="btn-primary disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600" data-testid="checkin-code-error">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-600" data-testid="checkin-code-success">
            Code saved successfully!
          </p>
        )}
      </div>
    </div>
  );
}
