import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Plus, Shield, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import {
  Student, StudentContact, StudentEmergencyContact,
  StudentImmunization, StudentEnrollmentDetails, Room,
} from "@/lib/types";

// ─── CDC Vaccine schedule ─────────────────────────────────────────────────────
const CDC_VACCINES = [
  { name: "Hep B — Hepatitis B",                 doses: 3,  schedule: ["Birth","1-2 mos","6-18 mos"] },
  { name: "DTaP — Diphtheria, Tetanus, Pertussis",doses: 5, schedule: ["2 mos","4 mos","6 mos","15-18 mos","4-6 yrs"] },
  { name: "Hib — Haemophilus Influenzae Type B",  doses: 4,  schedule: ["2 mos","4 mos","6 mos","12-15 mos"] },
  { name: "PCV — Pneumococcal Conjugate",         doses: 4,  schedule: ["2 mos","4 mos","6 mos","12-15 mos"] },
  { name: "Polio",                                doses: 4,  schedule: ["2 mos","4 mos","6-18 mos","4-6 yrs"] },
  { name: "Rotavirus",                            doses: 3,  schedule: ["2 mos","4 mos","6 mos"] },
  { name: "Covid — Coronavirus",                  doses: 2,  schedule: ["6 mos","6-8 wks later"] },
  { name: "Flu — Seasonal Influenza",             doses: 1,  schedule: ["Yearly"] },
  { name: "MMR — Measles, Mumps, Rubella",        doses: 2,  schedule: ["12-15 mos","4-6 yrs"] },
  { name: "VAR — Varicella",                      doses: 2,  schedule: ["12-15 mos","4-6 yrs"] },
  { name: "Hep A — Hepatitis A",                  doses: 2,  schedule: ["12-23 mos","6-18 mos later"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function age(dob: string | null) {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 24) return `${months} months`;
  const y = Math.floor(months / 12), m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y} years`;
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Field({ label, value, warn }: { label: string; value?: string | null; warn?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
      {warn && value ? (
        <p className="text-sm font-medium text-red-700 bg-red-50 rounded px-2 py-1 flex items-center gap-1.5">
          <AlertTriangle size={12} />{value}
        </p>
      ) : (
        <p className="text-sm text-gray-900">{value || "—"}</p>
      )}
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
      <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      {badge && (
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Shield size={11} />{badge}
        </span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type Tab = "profile" | "contacts" | "immunizations" | "daily_report" | "documents";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const { profile: authProfile } = useAuth();
  const isAdmin = authProfile?.role === "admin";

  const [student, setStudent]       = useState<Student | null>(null);
  const [room, setRoom]             = useState<Room | null>(null);
  const [contacts, setContacts]     = useState<StudentContact[]>([]);
  const [emergency, setEmergency]   = useState<StudentEmergencyContact[]>([]);
  const [enrollment, setEnrollment] = useState<StudentEnrollmentDetails | null>(null);
  const [immunizations, setImmunizations] = useState<StudentImmunization[]>([]);
  const [tab, setTab]               = useState<Tab>("profile");
  const [loading, setLoading]       = useState(true);
  const [revealPin, setRevealPin]   = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("students").select("*").eq("id", id).single(),
      supabase.from("student_contacts").select("*").eq("student_id", id).order("is_primary", { ascending: false }),
      supabase.from("student_emergency_contacts").select("*").eq("student_id", id),
      supabase.from("student_enrollment_details").select("*").eq("student_id", id).single(),
      supabase.from("student_immunizations").select("*").eq("student_id", id).order("vaccine_name"),
    ]).then(([{ data: s }, { data: c }, { data: e }, { data: enr }, { data: imm }]) => {
      setStudent(s);
      setContacts(c ?? []);
      setEmergency(e ?? []);
      setEnrollment(enr ?? null);
      setImmunizations(imm ?? []);
      if (s?.homeroom_id) {
        supabase.from("rooms").select("*").eq("id", s.homeroom_id).single()
          .then(({ data: r }) => setRoom(r));
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Layout><div className="p-10 text-center text-gray-400">Loading student profile...</div></Layout>;
  if (!student) return <Layout><div className="p-10 text-center text-gray-400">Student not found</div></Layout>;

  const TABS: { id: Tab; label: string }[] = [
    { id: "profile",       label: "Profile" },
    { id: "contacts",      label: "Contacts" },
    { id: "immunizations", label: "Immunizations" },
    { id: "daily_report",  label: "Daily Report" },
    { id: "documents",     label: "Documents" },
  ];

  // Build immunization lookup: vaccine+dose → record
  const immMap: Record<string, StudentImmunization> = {};
  immunizations.forEach(i => { immMap[`${i.vaccine_name}:${i.dose_number}`] = i; });

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* Back */}
        <Link to="/students" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to Students
        </Link>

        {/* Header card */}
        <div className="card p-5 flex items-center gap-5">
          {student.photo_url ? (
            <img src={student.photo_url} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
              {student.first_name[0]}{student.last_name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                {student.first_name} {student.last_name}
                {student.preferred_name && <span className="text-gray-400 font-normal text-base ml-2">"{student.preferred_name}"</span>}
              </h1>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize
                ${student.enrollment_status === "active"   ? "bg-emerald-100 text-emerald-700" :
                  student.enrollment_status === "waitlist" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-600"}`}>
                {student.enrollment_status}
              </span>
              {student.allergies && student.allergies !== "None" && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                  <AlertTriangle size={11} /> Allergy
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {student.dob && <>Born {fmt(student.dob)} · Age {age(student.dob)}</>}
              {room && <span className="ml-3 text-indigo-600">📍 {room.name}</span>}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap
                ${tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ──────────────────────────────────────────────────────── */}
        {tab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left column */}
            <div className="space-y-5">
              {/* Personal info */}
              <div className="card p-5">
                <SectionHeader title="Personal information" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Name"      value={`${student.first_name} ${student.last_name}`} />
                  <Field label="Birthday"  value={fmt(student.dob)} />
                  <Field label="Age"       value={age(student.dob)} />
                  <Field label="Gender"    value={student.gender} />
                  <Field label="Race"      value={student.race} />
                  <Field label="Ethnicity" value={student.ethnicity} />
                  <div className="col-span-2">
                    <Field label="Allergies" value={student.allergies} warn={!!(student.allergies && student.allergies !== "None")} />
                  </div>
                  <div className="col-span-2">
                    <Field label="Notes" value={student.notes} />
                  </div>
                  <div className="col-span-2">
                    <Field label="Medications" value={student.medications} />
                  </div>
                  <Field label="Doctor"       value={student.doctor_name} />
                  <Field label="Doctor phone" value={student.doctor_phone} />
                </div>
              </div>

              {/* Address */}
              <div className="card p-5">
                <SectionHeader title="Address" />
                {student.address ? (
                  <div className="text-sm text-gray-900 space-y-0.5">
                    <p>{(student.address as Record<string, string>).street}</p>
                    <p>{(student.address as Record<string, string>).city}, {(student.address as Record<string, string>).state} {(student.address as Record<string, string>).zip}</p>
                  </div>
                ) : <p className="text-sm text-gray-400">—</p>}
              </div>

              {/* Financial details — admin only */}
              {isAdmin && (
                <div className="card p-5">
                  <SectionHeader title="Financial details" badge="Not visible to parents" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Field label="Family income" value={enrollment?.family_income ? `$${enrollment.family_income.toLocaleString()}/yr` : null} />
                    </div>
                    <Field label="Subsidy" value={enrollment?.subsidy === true ? "Yes" : enrollment?.subsidy === false ? "No" : null} />
                    <Field label="Subsidy details" value={enrollment?.subsidy_details} />
                  </div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Rooms — admin only */}
              {isAdmin && (
                <div className="card p-5">
                  <SectionHeader title="Rooms" badge="Not visible to parents" />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Homeroom" value={room?.name} />
                    <Field label="Others"   value="—" />
                  </div>
                </div>
              )}

              {/* School details — admin only */}
              {isAdmin && (
                <div className="card p-5">
                  <SectionHeader title="School details" badge="Not visible to parents" />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Status"     value={student.enrollment_status} />
                    <Field label="Meal type"  value={student.meal_type?.replace(/_/g, " ")} />
                    <Field label="Student ID" value={student.student_id_internal} />
                    <Field label="Schedule"   value={student.schedule_days?.join(", ")} />
                  </div>
                </div>
              )}

              {/* Enrollment details — admin only */}
              {isAdmin && (
                <div className="card p-5">
                  <SectionHeader title="Enrollment details" badge="Not visible to parents" />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="First contact date"  value={fmt(enrollment?.first_contact_date ?? null)} />
                    <Field label="Toured date"         value={fmt(enrollment?.toured_date ?? null)} />
                    <Field label="Paperwork date"      value={fmt(enrollment?.paperwork_date ?? null)} />
                    <Field label="Desired start date"  value={fmt(enrollment?.desired_start_date ?? null)} />
                    <Field label="Start date"          value={fmt(student.start_date ?? null)} />
                    <Field label="Graduation date"     value={fmt(enrollment?.graduation_date ?? null)} />
                    <Field label="Expected birth date" value={fmt(enrollment?.expected_birth_date ?? null)} />
                    <Field label="Sibling attending"   value={enrollment?.sibling_name} />
                    <div className="col-span-2">
                      <Field label="Programs"           value={enrollment?.programs} />
                    </div>
                    <div className="col-span-2">
                      <Field label="Additional details" value={enrollment?.additional_details} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONTACTS TAB ─────────────────────────────────────────────────────── */}
        {tab === "contacts" && (
          <div className="space-y-5">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Contacts</h3>
                {isAdmin && (
                  <button className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                    <Plus size={13} /> Add a contact
                  </button>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 font-medium">Contact</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Phone</th>
                    <th className="px-5 py-3 font-medium">Can Pickup</th>
                    {isAdmin && <th className="px-5 py-3 font-medium">Code</th>}
                    <th className="px-5 py-3 font-medium">Portal</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No contacts added</td></tr>
                  ) : contacts.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                            {c.full_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {c.full_name}
                              {c.is_primary && <span className="ml-1.5 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">Primary</span>}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">{c.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{c.email || "—"}</td>
                      <td className="px-5 py-3 text-gray-600">{c.phone || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.can_pickup ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {c.can_pickup ? "Yes" : "No"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-900">
                              {revealPin[c.id] ? c.pin_code ?? "—" : "••••"}
                            </span>
                            <button onClick={() => setRevealPin(p => ({...p, [c.id]: !p[c.id]}))}
                              className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1 border border-indigo-200 rounded px-1.5 py-0.5">
                              {revealPin[c.id] ? <><EyeOff size={11} />Hide</> : <><Eye size={11} />Reveal</>}
                            </button>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize
                          ${c.portal_status === "signed_up"    ? "bg-emerald-100 text-emerald-700" :
                            c.portal_status === "invited"      ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-500"}`}>
                          {(c.portal_status ?? "not_signed_up").replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Emergency contacts */}
            {emergency.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">Emergency Contacts</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Relationship</th>
                      <th className="px-5 py-3 font-medium">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergency.map(e => (
                      <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{e.full_name}</td>
                        <td className="px-5 py-3 text-gray-600">{e.relationship}</td>
                        <td className="px-5 py-3 text-gray-600">{e.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── IMMUNIZATIONS TAB ────────────────────────────────────────────────── */}
        {tab === "immunizations" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 inline-block" />Overdue</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 inline-block" />Completed</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 inline-block" />No record</span>
            </div>

            {CDC_VACCINES.map(vaccine => {
              const exempt = immunizations.find(i => i.vaccine_name.startsWith(vaccine.name.split(" ")[0]))?.exempt;
              return (
                <div key={vaccine.name} className="card overflow-hidden">
                  <div className={`px-5 py-3 flex items-center justify-between ${exempt ? "bg-amber-50" : "bg-indigo-900"}`}>
                    <span className={`text-sm font-semibold ${exempt ? "text-amber-800" : "text-white"}`}>{vaccine.name}</span>
                    {exempt && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">Exempt</span>}
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <td className="px-5 py-2 text-gray-400 font-medium w-40">Source</td>
                        {Array.from({ length: vaccine.doses }, (_, i) => (
                          <td key={i} className="px-4 py-2 text-gray-400 font-medium text-center">Dose {i + 1}</td>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-700">Student record</td>
                        {Array.from({ length: vaccine.doses }, (_, i) => {
                          const rec = immMap[`${vaccine.name}:${i + 1}`];
                          if (!rec) return <td key={i} className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">Overdue</span></td>;
                          if (rec.administered_date) return <td key={i} className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 font-medium">{new Date(rec.administered_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"})}</span></td>;
                          return <td key={i} className="px-4 py-3 text-center text-gray-300">—</td>;
                        })}
                      </tr>
                      <tr>
                        <td className="px-5 py-2 text-gray-400">CDC schedule</td>
                        {vaccine.schedule.map((s, i) => (
                          <td key={i} className="px-4 py-2 text-center text-gray-400">{s}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DAILY REPORT TAB ─────────────────────────────────────────────────── */}
        {tab === "daily_report" && (
          <div className="card p-6 text-center text-gray-400 space-y-2">
            <p className="text-sm font-medium text-gray-600">Daily Report</p>
            <p className="text-sm">View this child's activity feed from the room view.</p>
            {student.homeroom_id && (
              <Link to={`/rooms/${student.homeroom_id}`} className="text-indigo-600 text-sm hover:underline inline-block mt-2">
                Go to {room?.name ?? "room"} feed →
              </Link>
            )}
          </div>
        )}

        {/* ── DOCUMENTS TAB ────────────────────────────────────────────────────── */}
        {tab === "documents" && (
          <div className="card p-6 text-center text-gray-400 space-y-2">
            <p className="text-sm font-medium text-gray-600">Documents</p>
            <p className="text-sm">Immunization records, signed forms, and medical action plans.</p>
            <p className="text-xs text-gray-300 mt-2">Document uploads coming soon.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
