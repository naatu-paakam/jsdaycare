import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, DoorOpen, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Room, Student } from "@/lib/types";

interface RoomCard extends Room {
  students: Pick<Student, "id" | "first_name" | "last_name" | "photo_url">[];
  checkedInIds: Set<string>; // student IDs currently checked in
}

function ageRange(min: number | null, max: number | null) {
  if (!min && !max) return "";
  const fmt = (m: number) => m < 24 ? `${m}mo` : `${Math.floor(m / 12)}y`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export default function RoomList() {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<RoomCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", capacity: "", ratio_staff: "1", ratio_children: "4" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;
    fetchRooms().finally(() => setLoading(false));
  }, [profile?.school_id]);

  async function fetchRooms() {
    const { data: roomData } = await supabase
      .from("rooms")
      .select("*")
      .eq("school_id", profile!.school_id!)
      .order("name");

    if (!roomData) return;

    const cards: RoomCard[] = await Promise.all(
      roomData.map(async room => {
        const today = new Date().toISOString().split("T")[0];
        const [{ data: students }, { data: attendance }] = await Promise.all([
          supabase
            .from("students")
            .select("id, first_name, last_name, photo_url")
            .eq("homeroom_id", room.id)
            .eq("enrollment_status", "active"),
          supabase
            .from("attendance")
            .select("student_id, status")
            .eq("room_id", room.id)
            .eq("date", today)
            .eq("status", "checked_in"),
        ]);
        const checkedInIds = new Set<string>((attendance ?? []).map(a => a.student_id));
        return { ...room, students: students ?? [], checkedInIds };
      })
    );

    setRooms(cards);
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.school_id) return;
    setSaving(true);

    await supabase.from("rooms").insert({
      school_id: profile.school_id,
      name: newRoom.name,
      capacity: parseInt(newRoom.capacity) || null,
      ratio_staff: parseInt(newRoom.ratio_staff),
      ratio_children: parseInt(newRoom.ratio_children),
    });

    setShowNew(false);
    setNewRoom({ name: "", capacity: "", ratio_staff: "1", ratio_children: "4" });
    setSaving(false);
    fetchRooms();
  }

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
            <p className="text-sm text-gray-500 mt-0.5">{rooms.length} rooms</p>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Room
          </button>
        </div>

        {/* New Room Modal */}
        {showNew && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="font-bold text-gray-900 text-lg mb-4">New Room</h2>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Name <span className="text-red-500">*</span></label>
                  <input value={newRoom.name} onChange={e => setNewRoom(r => ({ ...r, name: e.target.value }))} className="input" required />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity</label>
                    <input type="number" value={newRoom.capacity} onChange={e => setNewRoom(r => ({ ...r, capacity: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ratio Staff</label>
                    <input type="number" value={newRoom.ratio_staff} onChange={e => setNewRoom(r => ({ ...r, ratio_staff: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ratio Children</label>
                    <input type="number" value={newRoom.ratio_children} onChange={e => setNewRoom(r => ({ ...r, ratio_children: e.target.value }))} className="input" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowNew(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary">{saving ? "Creating..." : "Create Room"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Room Cards */}
        {loading ? (
          <p className="text-gray-400 text-center py-10">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <div className="card p-12 text-center">
            <DoorOpen size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No rooms yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first room to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => (
              <Link key={room.id} to={`/rooms/${room.id}`} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{room.name}</h3>
                    {(room.age_range_min_months || room.age_range_max_months) && (
                      <p className="text-xs text-gray-400 mt-0.5">{ageRange(room.age_range_min_months, room.age_range_max_months)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-500">{room.students.length}</p>
                    <p className="text-xs text-gray-400">{room.capacity ? `/ ${room.capacity}` : "students"}</p>
                  </div>
                </div>

                {/* Student avatars — green dot if currently checked in */}
                <div className="flex items-center gap-1 flex-wrap">
                  {room.students.slice(0, 8).map(s => {
                    const isIn = room.checkedInIds.has(s.id);
                    return (
                      <div key={s.id} className="relative">
                        {s.photo_url ? (
                          <img src={s.photo_url} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                        ) : (
                          <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center font-semibold text-[10px] ${isIn ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-500"}`}>
                            {s.first_name[0]}{s.last_name[0]}
                          </div>
                        )}
                        {isIn && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" title="Present" />
                        )}
                      </div>
                    );
                  })}
                  {room.students.length > 8 && (
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-medium">
                      +{room.students.length - 8}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Users size={12} /> {room.ratio_staff}:{room.ratio_children} ratio</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
