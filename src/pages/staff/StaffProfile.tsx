import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Profile, StaffProfile as StaffProfileType } from "@/lib/types";

export default function StaffProfile() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<Profile | null>(null);
  const [staffDetail, setStaffDetail] = useState<StaffProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase.from("staff_profiles").select("*").eq("id", id).single(),
    ]).then(([{ data: p }, { data: s }]) => {
      setPerson(p);
      setStaffDetail(s);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Layout><div className="p-10 text-center text-gray-400">Loading...</div></Layout>;
  if (!person) return <Layout><div className="p-10 text-center text-gray-400">Staff member not found</div></Layout>;

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <Link to="/staff" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to Staff
        </Link>

        <div className="card p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-2xl">
            {person.full_name?.[0] ?? "?"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{person.full_name ?? "Unnamed"}</h1>
            <p className="text-gray-500 text-sm capitalize">{person.role} · {person.phone ?? "No phone"}</p>
          </div>
        </div>

        {staffDetail && (
          <div className="card p-6 grid grid-cols-2 gap-5">
            {[
              ["Hire Date", staffDetail.hire_date],
              ["Birthday", staffDetail.birthday],
              ["Degree", staffDetail.degree],
              ["Certification", staffDetail.certification],
              ["ECE Credits", staffDetail.ece_credits],
              ["Infant/Toddler Credits", staffDetail.infant_toddler_credits],
            ].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
                <p className="text-sm text-gray-900 mt-0.5">{val ?? "—"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
