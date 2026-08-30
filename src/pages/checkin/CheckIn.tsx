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

type StudentWithStatus = StudentRow & {
  status: string | null;
  checkin_time?: string | null;
};

type Step = "pin" | "students" | "done";

function statusLabel(s: StudentWithStatus): { text: string; color: string } {
  if (s.status === "checked_in") {
    const time = s.checkin_time
      ? new Date(s.checkin_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "";
    return { text: `✓ Present${time ? " since " + time : ""}`, color: "text-green-700 bg-green-50" };
  }
  if (s.status === "checked_out") return { text: "Checked out", color: "text-gray-500 bg-gray-100" };
  if (s.status === "absent") return { text: "Absent", color: "text-red-600 bg-red-50" };
  return { text: "Not recorded", color: "text-gray-400 bg-gray-50" };
}

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
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
        // Try to get checkin_time from attendance table
        const { data: att } = await supabase
          .from("attendance")
          .select("checkin_time")
          .eq("student_id", r.student_id)
          .eq("date", today)
          .maybeSingle();
        return { ...r, status: (st as string | null) ?? null, checkin_time: att?.checkin_time ?? null };
      })
    );
    setStudents(withStatus);
    setSelected(new Set(withStatus.map(s => s.student_id)));
    setStep("students");
  }

  const allSelected = students.length > 0 && selected.size === students.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map(s => s.student_id)));
    }
  }

  function toggleStudent(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedStudents = students.filter(s => selected.has(s.student_id));
  const allSelectedCheckedIn = selectedStudents.length > 0 && selectedStudents.every(s => s.status === "checked_in");
  const bulkLabel = allSelectedCheckedIn ? "Check Out All Selected" : "Check In All Selected";

  async function handleBulkAction() {
    if (selectedStudents.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    setLoading(true);
    let checkedInCount = 0;
    let checkedOutCount = 0;
    for (const student of selectedStudents) {
      const { data, error: rpcErr } = await supabase.rpc("checkin_student", {
        p_student_id: student.student_id,
        p_room_id: student.homeroom_id,
        p_contact_id: student.contact_id,
        p_date: today,
      });
      if (!rpcErr) {
        if (data === "checked_in") checkedInCount++;
        else checkedOutCount++;
      }
    }
    setLoading(false);
    if (checkedInCount > 0 && checkedOutCount === 0) {
      setDoneMsg(`Checked In (${checkedInCount} student${checkedInCount > 1 ? "s" : ""})`);
    } else if (checkedOutCount > 0 && checkedInCount === 0) {
      setDoneMsg(`Checked Out (${checkedOutCount} student${checkedOutCount > 1 ? "s" : ""})`);
    } else {
      setDoneMsg(`Done! (${checkedInCount} in, ${checkedOutCount} out)`);
    }
    setStep("done");
    setTimeout(() => {
      setPin("");
      setStudents([]);
      setContactName("");
      setError("");
      setDoneMsg("");
      setSelected(new Set());
      setStep("pin");
    }, 2500);
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
      setSelected(new Set());
      setStep("pin");
    }, 2500);
  }

  function handlePinKey(key: string) {
    if (key === "back") { setPin(p => p.slice(0, -1)); return; }
    if (pin.length < 6) setPin(p => p + key);
  }

  const isMulti = students.length > 1;

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
              <p className="text-sm text-gray-500">
                {isMulti ? "Select students to check in or out" : "Tap to check in or out"}
              </p>
            </div>

            {/* Select all toggle for multi-kid */}
            {isMulti && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-gray-500 font-medium">
                  {selected.size} of {students.length} selected
                </span>
                <button
                  onClick={toggleSelectAll}
                  className="text-xs text-orange-600 font-semibold hover:underline"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </div>
            )}

            {students.map((s) => {
              const isCheckedIn = s.status === "checked_in";
              const isAbsent = s.status === "absent";
              const badge = statusLabel(s);
              const isSelected = selected.has(s.student_id);

              return (
                <div
                  key={s.student_id}
                  className={`border rounded-xl p-4 space-y-3 transition-colors ${
                    isSelected && isMulti ? "border-orange-300 bg-orange-50/40" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox for multi-kid */}
                    {isMulti && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleStudent(s.student_id)}
                        disabled={isAbsent}
                        className="mt-1 w-4 h-4 accent-orange-500 cursor-pointer"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{s.first_name} {s.last_name}</p>
                      {s.room_name && <p className="text-xs text-gray-500">{s.room_name}</p>}
                      {/* Status badge */}
                      <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                        {badge.text}
                      </span>
                    </div>
                  </div>

                  {/* Per-student action button (single-kid flow or individual toggle) */}
                  {!isMulti && (
                    isAbsent ? (
                      <span className="block w-full py-2 text-center rounded-lg text-sm font-medium bg-red-50 text-red-400">
                        Marked absent
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAction(s)}
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold text-sm transition-all active:scale-95 ${
                          isCheckedIn
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {isCheckedIn ? "→ Check Out" : "✓ Check In"}
                      </button>
                    )
                  )}
                </div>
              );
            })}

            {/* Bulk action button for multi-kid */}
            {isMulti && (
              <button
                onClick={handleBulkAction}
                disabled={loading || selected.size === 0}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                  selected.size === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : allSelectedCheckedIn
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {loading ? "Processing…" : bulkLabel}
              </button>
            )}

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
            <div className="text-6xl">{doneMsg.startsWith("Checked In") ? "✅" : doneMsg.startsWith("Checked Out") ? "👋" : "✅"}</div>
            <p className="text-2xl font-bold text-gray-900">{doneMsg}</p>
            <p className="text-sm text-gray-500">Returning to PIN entry…</p>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">Powered by JsDayCare</p>
    </div>
  );
}
