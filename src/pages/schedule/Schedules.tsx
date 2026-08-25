import Layout from "@/components/Layout";
import { Calendar } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Schedules() {
  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage staff and student schedules</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-gray-900">Staff Schedules</h2>
            </div>
            <p className="text-sm text-gray-400">Staff scheduling by room and day of week. Full scheduler coming soon.</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-purple-600" />
              <h2 className="font-semibold text-gray-900">Student Schedules</h2>
            </div>
            <p className="text-sm text-gray-400">Student attendance schedules (full/half/AM/PM). Full scheduler coming soon.</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Weekly Overview</h2>
          </div>
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {DAYS.map(day => (
              <div key={day} className="p-3">
                <p className="text-xs font-semibold text-gray-500 text-center">{day.slice(0, 3)}</p>
                <div className="mt-3 space-y-1">
                  <div className="h-16 bg-gray-50 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-300">No entries</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
