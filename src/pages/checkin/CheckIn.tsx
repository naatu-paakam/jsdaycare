import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type StudentRow = {
  contact_id: string;
  contact_name: string;
  student_id: string;
  first_name: string;
  last_name: string;
  homeroom_id: string | null;
  room_name: string | null;
};

type StudentWithStatus = StudentRow & { status: string | null };

type Step = "pin" | "students" | "done";

export default function CheckIn() {
  const [params] = useSearchParams();
  const schoolId = params.get("school") ?? "";

  const [schoolName, setSchoolName] = useState<string>("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<Step>("pin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<StudentWithStatus[]>([]);
  const [contactName, setContactName] = useState("");
  const [doneMsg, setDoneMsg] = useState("");

  useEffect(() => {
    if (!schoolId) return;
    supabase.rpc("get_school_name", { p_school_id: schoolId }).then(({ data }) => {
      if (data) setSchoolName(data as string);
    });
  }, [schoolId]);

  async function handleLookup() {
    if (pin.length !== 6) { setError("Please enter your 6-digit PIN."); return; }
    setLoading(true);
    setError("");
    const { data, error: rpcErr } = await supabase.rpc("get_students_by_pin", {
      p_pin: pin,
      p_school_id: schoolId,
    });
    setLoading(false);
    if (rpcErr || !data || (data as StudentRow[]).length === 0) {
      setError("PIN not found. Please check your code and try again.");
      return;
    }
    const rows = data as StudentRow[];
    setContactName(rows[0].contact_name);

    const today = new Date().toISOString().slice(0, 10);
    const withStatus: StudentWithStatus[] = await Promise.all(
      rows.map(async (r) => {
        const { data: st } = await supabase.rpc("get_student_attendance_today", {
          p_student_id: r.student_id,
          p_date: today,
        });
        return { ...r, status: (st as string | null) ?? null };
      })
    );
    setStudents(withStatus);
    setStep("students");
  }

  async function handleAction(student: StudentWithStatus) {
    const today = new Date().toISOString().slice(0, 10);
    setLoading(true);
    const { data, error: rpcErr } = await supabase.rpc("checkin_student", {
      p_student_id: student.student_id,
      p_room_id: student.homeroom_id,
      p_contact_id: student.contact_id,
      p_date: today,
    });
    setLoading(false);
    if (rpcErr) { setError("Something went wrong. Please try again."); return; }
    const result = data as string;
    setDoneMsg(result === "checked_in" ? "Checked In!" : "Checked Out!");
    setStep("done");
    setTimeout(() => {
      setPin("");
      setStudents([]);
      setContactName("");
      setError("");
      setDoneMsg("");
      setStep("pin");
    }, 2500);
  }

  function handlePinKey(key: string) {
    if (key === "back") { setPin(p => p.slice(0, -1)); return; }
    if (pin.length < 6) setPin(p => p + key);
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-start pt-8 px-4">
      {/* Header */}
      <div className="w-full max-w-sm mb-6 text-center">
        <div className="text-3xl font-bold text-orange-500 mb-1">🏫</div>
        <h1 className="text-xl font-bold text-gray-900">{schoolName || "Daycare Check-In"}</h1>
        <p className="text-sm text-gray-500 mt-1">QR Check-In / Check-Out</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">
        {/* Step: PIN */}
        {step === "pin" && (
          <div className="space-y-5">
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-lg">Enter your 6-digit PIN</p>
              <p className="text-sm text-gray-500 mt-1">Your PIN was provided by the school</p>
            </div>

            {/* PIN display */}
            <div className="flex justify-center gap-2 my-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-bold ${
                    pin[i] ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 bg-gray-50 text-gray-300"
                  }`}
                >
                  {pin[i] ? "•" : "–"}
                </div>
              ))}
            </div>

            {/* Numeric pad */}
            <div className="grid grid-cols-3 gap-3">
              {["1","2","3","4","5","6","7","8","9","back","0","✓"].map((key) => {
                const isBack = key === "back";
                const isSubmit = key === "✓";
                return (
                  <button
                    key={key}
                    onClick={() => isSubmit ? handleLookup() : handlePinKey(isBack ? "back" : key)}
                    disabled={loading}
                    className={`h-14 rounded-xl text-lg font-semibold transition-all active:scale-95 ${
                      isSubmit
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : isBack
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {isBack ? "⌫" : key}
                  </button>
                );
              })}
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {loading && <p className="text-center text-orange-500 text-sm">Looking up…</p>}
          </div>
        )}

        {/* Step: Students */}
        {step === "students" && (
          <div className="space-y-4">
            <div className="text-center pb-2 border-b border-gray-100">
              <p className="text-lg font-bold text-gray-900">Welcome, {contactName}!</p>
              <p className="text-sm text-gray-500">Select a student to check in or out</p>
            </div>

            {students.map((s) => {
              const isCheckedIn = s.status === "checked_in";
              const isAbsent = s.status === "absent";
              return (
                <div key={s.student_id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{s.first_name} {s.last_name}</p>
                      {s.room_name && <p className="text-xs text-gray-500">{s.room_name}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      isCheckedIn ? "bg-green-100 text-green-700"
                      : isAbsent ? "bg-red-100 text-red-600"
                      : s.status === "checked_out" ? "bg-gray-100 text-gray-600"
                      : "bg-gray-100 text-gray-400"
                    }`}>
                      {isCheckedIn ? "Checked In" : isAbsent ? "Absent" : s.status === "checked_out" ? "Checked Out" : "Not Here"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAction(s)}
                    disabled={isAbsent || loading}
                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-all active:scale-95 ${
                      isAbsent
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : isCheckedIn
                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {isAbsent ? "Already marked absent" : isCheckedIn ? "→ Check Out" : "✓ Check In"}
                  </button>
                </div>
              );
            })}

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              onClick={() => { setStep("pin"); setPin(""); setError(""); }}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="text-center py-8 space-y-3">
            <div className="text-6xl">{doneMsg === "Checked In!" ? "✅" : "👋"}</div>
            <p className="text-2xl font-bold text-gray-900">{doneMsg}</p>
            <p className="text-sm text-gray-500">Returning to PIN entry…</p>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">Powered by JsDayCare</p>
    </div>
  );
}
