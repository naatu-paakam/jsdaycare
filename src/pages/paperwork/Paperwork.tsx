import { useEffect, useState } from "react";
import { Plus, FileText, Share2, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Form, FormStatus } from "@/lib/types";

const STATUS_STYLES: Record<FormStatus, string> = {
  unshared: "bg-gray-100 text-gray-600",
  shared: "bg-emerald-100 text-emerald-700",
  closed: "bg-red-100 text-red-600",
};

const STATUS_ICONS: Record<FormStatus, React.ReactNode> = {
  unshared: <Lock size={12} />,
  shared: <Share2 size={12} />,
  closed: <Lock size={12} />,
};

export default function Paperwork() {
  const { profile } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FormStatus | "all">("all");

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase
      .from("forms")
      .select("*")
      .eq("school_id", profile.school_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setForms(data ?? []);
        setLoading(false);
      });
  }, [profile?.school_id]);

  const filtered = tab === "all" ? forms : forms.filter(f => f.status === tab);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paperwork</h1>
            <p className="text-sm text-gray-500 mt-0.5">Forms, requests, and sign-ups</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Form
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(["all", "unshared", "shared", "closed"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize
                ${tab === t ? "border-orange-500 text-orange-500" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-10">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No forms yet</p>
            <p className="text-gray-400 text-sm mt-1">Create a form to share with parents</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(form => (
              <div key={form.id} className="card p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
                  <FileText size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{form.name}</h3>
                      {form.description && <p className="text-sm text-gray-500 mt-0.5">{form.description}</p>}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[form.status]}`}>
                      {STATUS_ICONS[form.status]} {form.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span className="capitalize">{form.form_type ?? "form"}</span>
                    {form.due_date && <span>Due: {new Date(form.due_date).toLocaleDateString()}</span>}
                    {form.requires_review && <span className="text-amber-600">Requires review</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
