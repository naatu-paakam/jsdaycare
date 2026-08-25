import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Phone, FileText, Syringe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Student, StudentContact, StudentEmergencyContact, StudentImmunization } from "@/lib/types";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [contacts, setContacts] = useState<StudentContact[]>([]);
  const [emergency, setEmergency] = useState<StudentEmergencyContact[]>([]);
  const [immunizations, setImmunizations] = useState<StudentImmunization[]>([]);
  const [tab, setTab] = useState<"profile" | "contacts" | "health" | "docs">("profile");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("students").select("*").eq("id", id).single(),
      supabase.from("student_contacts").select("*").eq("student_id", id).order("is_primary", { ascending: false }),
      supabase.from("student_emergency_contacts").select("*").eq("student_id", id),
      supabase.from("student_immunizations").select("*").eq("student_id", id).order("vaccine_name"),
    ]).then(([{ data: s }, { data: c }, { data: e }, { data: imm }]) => {
      setStudent(s);
      setContacts(c ?? []);
      setEmergency(e ?? []);
      setImmunizations(imm ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Layout><div className="p-10 text-center text-gray-400">Loading...</div></Layout>;
  if (!student) return <Layout><div className="p-10 text-center text-gray-400">Student not found</div></Layout>;

  const tabs = [
    { id: "profile", label: "Profile", icon: <User size={15} /> },
    { id: "contacts", label: "Contacts", icon: <Phone size={15} /> },
    { id: "health", label: "Health", icon: <Syringe size={15} /> },
    { id: "docs", label: "Documents", icon: <FileText size={15} /> },
  ] as const;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        {/* Back */}
        <Link to="/students" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to Students
        </Link>

        {/* Header */}
        <div className="card p-6 flex items-start gap-5">
          {student.photo_url ? (
            <img src={student.photo_url} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
              {student.first_name[0]}{student.last_name[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {student.first_name} {student.last_name}
              {student.preferred_name && <span className="text-gray-400 font-normal text-lg ml-2">"{student.preferred_name}"</span>}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {student.dob ? `DOB: ${new Date(student.dob).toLocaleDateString()}` : ""}
              {student.enrollment_status && (
                <span className={`ml-3 inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize
                  ${student.enrollment_status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                  {student.enrollment_status}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                ${tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "profile" && (
          <div className="card p-6 grid grid-cols-2 gap-5">
            {[
              ["Gender", student.gender],
              ["Race", student.race],
              ["Ethnicity", student.ethnicity],
              ["Start Date", student.start_date],
              ["Meal Type", student.meal_type],
              ["Doctor", student.doctor_name],
              ["Doctor Phone", student.doctor_phone],
            ].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
                <p className="text-sm text-gray-900 mt-0.5">{val || "—"}</p>
              </div>
            ))}
            {student.allergies && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Allergies</p>
                <p className="text-sm text-red-700 mt-0.5 bg-red-50 rounded-lg px-3 py-2">{student.allergies}</p>
              </div>
            )}
            {student.medications && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Medications</p>
                <p className="text-sm text-amber-700 mt-0.5 bg-amber-50 rounded-lg px-3 py-2">{student.medications}</p>
              </div>
            )}
          </div>
        )}

        {tab === "contacts" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 text-sm">Contacts</h3>
            {contacts.map(c => (
              <div key={c.id} className="card p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                  {c.full_name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{c.full_name}
                    {c.is_primary && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">Primary</span>}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{c.type} · {c.can_pickup ? "Can pickup" : "Cannot pickup"}</p>
                  {c.email && <p className="text-sm text-gray-600 mt-0.5">{c.email}</p>}
                  {c.phone && <p className="text-sm text-gray-600">{c.phone}</p>}
                </div>
              </div>
            ))}
            {emergency.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-700 text-sm mt-4">Emergency Contacts</h3>
                {emergency.map(e => (
                  <div key={e.id} className="card p-4">
                    <p className="font-medium text-gray-900">{e.full_name}</p>
                    <p className="text-sm text-gray-500">{e.relationship} · {e.phone}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {tab === "health" && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Immunizations</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 font-medium">Vaccine</th>
                  <th className="px-5 py-3 font-medium">Dose</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Exempt</th>
                </tr>
              </thead>
              <tbody>
                {immunizations.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-400">No immunization records</td></tr>
                ) : (
                  immunizations.map(imm => (
                    <tr key={imm.id} className="border-b border-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{imm.vaccine_name}</td>
                      <td className="px-5 py-3 text-gray-600">{imm.dose_number ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-600">{imm.administered_date ? new Date(imm.administered_date).toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-3">
                        {imm.exempt ? (
                          <span className="text-amber-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-emerald-600">No</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "docs" && (
          <div className="card p-6 text-center text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Document management coming soon</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
