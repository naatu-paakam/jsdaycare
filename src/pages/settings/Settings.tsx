import { useEffect, useRef, useState } from "react";
import { Save, Copy, Download } from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { School } from "@/lib/types";

const TIMEZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export default function Settings() {
  const { profile } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [form, setForm] = useState({ name: "", timezone: "America/Los_Angeles" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase.from("schools").select("*").eq("id", profile.school_id).single()
      .then(({ data }) => {
        if (data) { setSchool(data); setForm({ name: data.name, timezone: data.timezone ?? "America/Los_Angeles" }); }
      });
  }, [profile?.school_id]);

  const checkinUrl = profile?.school_id
    ? `${window.location.origin}/checkin?school=${profile.school_id}`
    : "";

  function copyLink() {
    navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQR() {
    const canvas = qrCanvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "checkin-qr.png";
    a.click();
  }

  async function saveSettings() {
    if (!school) return;
    setSaving(true);
    await supabase.from("schools").update({ name: form.name, timezone: form.timezone }).eq("id", school.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        {/* School info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">School Information</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">School Name</label>
            <input className="input w-full" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Timezone</label>
            <select className="input w-full" value={form.timezone} onChange={e => setForm(f => ({...f, timezone: e.target.value}))}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <button onClick={saveSettings} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={15} />{saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Ratio rules */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Staff-to-Child Ratio Rules</h2>
          <p className="text-sm text-gray-500">Configure per-room in Room Settings. Default rules apply if not set per room.</p>
          <div className="divide-y divide-gray-100 text-sm">
            {[["Infants (0–12 mo)", "1:4"],["Toddlers (12–36 mo)", "1:6"],["Pre-K (3–5 yr)", "1:10"]].map(([label, ratio]) => (
              <div key={label} className="py-2.5 flex justify-between items-center">
                <span className="text-gray-700">{label}</span>
                <span className="font-mono text-orange-500 font-medium">{ratio}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Forms & Compliance config */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Forms & Compliance</h2>
          <p className="text-sm text-gray-500">Manage required enrollment forms and compliance alert rules in <strong>Paperwork → Settings</strong>.</p>
          <a href="/paperwork" className="text-sm text-orange-500 hover:underline">Go to Paperwork →</a>
        </div>

        {/* Front Desk QR Code */}
        {profile?.school_id && (
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Front Desk QR Code</h2>
            <p className="text-sm text-gray-500">Display this at your front desk. Parents and staff scan it to check in/out.</p>
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                <QRCodeSVG value={checkinUrl} size={180} />
              </div>
              {/* Hidden canvas for download */}
              <div ref={qrCanvasRef} className="hidden">
                <QRCodeCanvas value={checkinUrl} size={512} />
              </div>
              <div className="flex gap-3">
                <button onClick={downloadQR} className="btn-primary flex items-center gap-2 text-sm">
                  <Download size={14} /> Download QR Code
                </button>
                <button onClick={copyLink} className="btn-secondary flex items-center gap-2 text-sm">
                  <Copy size={14} /> {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
              <p className="text-xs text-gray-400 break-all text-center max-w-xs">{checkinUrl}</p>
            </div>
          </div>
        )}

        {/* Account */}
        <div className="card p-6 space-y-3">
          <h2 className="font-semibold text-gray-800">Account</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Name:</span> {profile?.full_name}</p>
            <p><span className="font-medium">Role:</span> <span className="capitalize">{profile?.role}</span></p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
