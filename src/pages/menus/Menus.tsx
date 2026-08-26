import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { FoodItem, FoodCategory } from "@/lib/types";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
type Day = typeof DAYS[number];
const DAY_LABELS: Record<Day, string> = { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday" };
const MEALS = ["breakfast", "am_snack", "lunch", "pm_snack"] as const;
type Meal = typeof MEALS[number];
const MEAL_LABELS: Record<Meal, string> = { breakfast: "Breakfast", am_snack: "AM Snack", lunch: "Lunch", pm_snack: "PM Snack" };
const CATEGORY_COLORS: Record<FoodCategory, string> = {
  grain: "bg-amber-100 text-amber-700",
  protein: "bg-red-100 text-red-700",
  fruit: "bg-pink-100 text-pink-700",
  vegetable: "bg-green-100 text-green-700",
  dairy: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-600",
};

type MenuGrid = Record<Day, Record<Meal, string[]>>;

function emptyGrid(): MenuGrid {
  const grid = {} as MenuGrid;
  for (const day of DAYS) {
    grid[day] = {} as Record<Meal, string[]>;
    for (const meal of MEALS) grid[day][meal] = [];
  }
  return grid;
}

function getMondayOfWeek(d: Date): string {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  return copy.toISOString().split("T")[0];
}

function fmtWeekRange(monday: string): string {
  const start = new Date(monday + "T12:00:00");
  const end = new Date(monday + "T12:00:00");
  end.setDate(end.getDate() + 4);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function addWeeks(monday: string, n: number): string {
  const d = new Date(monday + "T12:00:00");
  d.setDate(d.getDate() + n * 7);
  return d.toISOString().split("T")[0];
}

export default function Menus() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [tab, setTab] = useState<"menu" | "library">("menu");

  // Weekly menu state
  const [weekStart, setWeekStart] = useState<string>(getMondayOfWeek(new Date()));
  const [menuGrid, setMenuGrid] = useState<MenuGrid | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);

  // Create/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftGrid, setDraftGrid] = useState<MenuGrid>(emptyGrid());
  const [saving, setSaving] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  // per-cell dropdown state: "day|meal" -> input value
  const [cellInputs, setCellInputs] = useState<Record<string, string>>({});
  const [cellDropdownOpen, setCellDropdownOpen] = useState<string | null>(null);

  // Library state
  const [newItem, setNewItem] = useState({ name: "", category: "fruit" as FoodCategory, allergens: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;
    fetchFoodItems();
  }, [profile?.school_id]);

  useEffect(() => {
    if (!profile?.school_id) return;
    fetchWeekMenu();
  }, [profile?.school_id, weekStart]);

  async function fetchWeekMenu() {
    setMenuLoading(true);
    const { data } = await supabase
      .from("weekly_menus")
      .select("*")
      .eq("school_id", profile!.school_id!)
      .eq("week_start", weekStart)
      .single();
    if (data?.overrides) {
      setMenuGrid(data.overrides as MenuGrid);
    } else {
      setMenuGrid(null);
    }
    setMenuLoading(false);
  }

  async function fetchFoodItems() {
    const { data } = await supabase
      .from("food_items")
      .select("*")
      .eq("school_id", profile!.school_id!)
      .order("category").order("name");
    setFoodItems(data ?? []);
  }

  function openCreateDialog() {
    setDraftGrid(menuGrid ? JSON.parse(JSON.stringify(menuGrid)) : emptyGrid());
    setCellInputs({});
    setCellDropdownOpen(null);
    setDialogOpen(true);
  }

  async function saveMenu() {
    if (!profile?.school_id) return;
    setSaving(true);
    const { data: existing } = await supabase
      .from("weekly_menus")
      .select("id")
      .eq("school_id", profile.school_id)
      .eq("week_start", weekStart)
      .single();

    if (existing) {
      await supabase.from("weekly_menus").update({ overrides: draftGrid }).eq("id", existing.id);
    } else {
      await supabase.from("weekly_menus").insert({ school_id: profile.school_id, week_start: weekStart, overrides: draftGrid });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchWeekMenu();
  }

  function addChip(day: Day, meal: Meal, value: string) {
    const v = value.trim();
    if (!v) return;
    setDraftGrid(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as MenuGrid;
      if (!next[day][meal].includes(v)) next[day][meal].push(v);
      return next;
    });
    const key = `${day}|${meal}`;
    setCellInputs(prev => ({ ...prev, [key]: "" }));
    setCellDropdownOpen(null);
  }

  function removeChip(day: Day, meal: Meal, idx: number) {
    setDraftGrid(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as MenuGrid;
      next[day][meal].splice(idx, 1);
      return next;
    });
  }

  // Food library functions
  async function addFoodItem() {
    if (!newItem.name) return;
    setAdding(true);
    const allergens = newItem.allergens.split(",").map(s => s.trim()).filter(Boolean);
    await supabase.from("food_items").insert({ ...newItem, allergens, school_id: profile!.school_id! });
    setNewItem({ name: "", category: "fruit", allergens: "" });
    fetchFoodItems();
    setAdding(false);
  }

  async function deleteFoodItem(id: string) {
    await supabase.from("food_items").delete().eq("id", id);
    fetchFoodItems();
  }

  const groupedItems: Partial<Record<FoodCategory, FoodItem[]>> = {};
  foodItems.forEach(item => {
    const cat = item.category ?? "other";
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat]!.push(item);
  });

  const visibleTabs = isAdmin ? (["menu", "library"] as const) : (["menu"] as const);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Menus</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {visibleTabs.map(t => (
            <button key={t} onClick={() => setTab(t as "menu" | "library")}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-orange-500 text-orange-500" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              {t === "library" ? "Food Item Library" : "Weekly Menu"}
            </button>
          ))}
        </div>

        {/* Weekly Menu tab */}
        {tab === "menu" && (
          <div className="space-y-4">
            {/* Header row: week nav + create button */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setWeekStart(w => addWeeks(w, -1))}
                  className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-500">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[180px] text-center">
                  {fmtWeekRange(weekStart)}
                </span>
                <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
                  className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-500">
                  <ChevronRight size={16} />
                </button>
              </div>
              {isAdmin && (
                <button onClick={openCreateDialog} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus size={15} />
                  {menuGrid ? "Edit This Week's Menu" : "Create Menu"}
                </button>
              )}
            </div>

            {/* Read-only table */}
            <div className="card overflow-auto">
              {menuLoading ? (
                <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
              ) : menuGrid ? (
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 w-28">Day</th>
                      {MEALS.map(m => <th key={m} className="px-4 py-3 text-left text-xs font-medium text-gray-400">{MEAL_LABELS[m]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-600 text-xs">{DAY_LABELS[day]}</td>
                        {MEALS.map(meal => (
                          <td key={meal} className="px-4 py-3">
                            {menuGrid[day]?.[meal]?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {menuGrid[day][meal].map((item, i) => (
                                  <span key={i} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">{item}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300 italic">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-10 text-center text-sm text-gray-400">
                  {isAdmin ? "No menu set — click \"Create Menu\" to add." : "Menu not available yet."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Food Item Library tab (admin only) */}
        {tab === "library" && isAdmin && (
          <div className="space-y-4">
            <div className="card p-4 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Item name</label>
                <input className="input w-full" placeholder="e.g. Brown rice" value={newItem.name}
                  onChange={e => setNewItem(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                <select className="input" value={newItem.category}
                  onChange={e => setNewItem(f => ({ ...f, category: e.target.value as FoodCategory }))}>
                  {(["grain", "protein", "fruit", "vegetable", "dairy", "other"] as FoodCategory[]).map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-40">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Allergens (comma-separated)</label>
                <input className="input w-full" placeholder="e.g. gluten, dairy" value={newItem.allergens}
                  onChange={e => setNewItem(f => ({ ...f, allergens: e.target.value }))} />
              </div>
              <button onClick={addFoodItem} disabled={adding} className="btn-primary flex items-center gap-2">
                <Plus size={15} />{adding ? "Adding..." : "Add Item"}
              </button>
            </div>

            <div className="space-y-4">
              {(Object.entries(groupedItems) as [FoodCategory, FoodItem[]][]).map(([cat, items]) => (
                <div key={cat} className="card overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[cat]}`}>{cat}</span>
                    <span className="text-xs text-gray-400">{items.length} items</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map(item => (
                      <div key={item.id} className="px-5 py-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-800">{item.name}</span>
                          {item.allergens && item.allergens.length > 0 && (
                            <span className="ml-2 text-xs text-red-600">⚠ {item.allergens.join(", ")}</span>
                          )}
                        </div>
                        <button onClick={() => deleteFoodItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {foodItems.length === 0 && (
                <div className="text-center text-gray-400 py-12 text-sm">No food items yet. Add your first item above.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Menu Dialog */}
      {dialogOpen && (
        <MenuDialog
          weekStart={weekStart}
          draftGrid={draftGrid}
          setDraftGrid={setDraftGrid}
          foodItems={foodItems}
          cellInputs={cellInputs}
          setCellInputs={setCellInputs}
          cellDropdownOpen={cellDropdownOpen}
          setCellDropdownOpen={setCellDropdownOpen}
          saving={saving}
          onSave={saveMenu}
          onClose={() => setDialogOpen(false)}
          addChip={addChip}
          removeChip={removeChip}
        />
      )}
    </Layout>
  );
}

interface DialogProps {
  weekStart: string;
  draftGrid: MenuGrid;
  setDraftGrid: React.Dispatch<React.SetStateAction<MenuGrid>>;
  foodItems: FoodItem[];
  cellInputs: Record<string, string>;
  setCellInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  cellDropdownOpen: string | null;
  setCellDropdownOpen: React.Dispatch<React.SetStateAction<string | null>>;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  addChip: (day: Day, meal: Meal, value: string) => void;
  removeChip: (day: Day, meal: Meal, idx: number) => void;
}

function MenuDialog({
  weekStart, draftGrid, foodItems,
  cellInputs, setCellInputs, cellDropdownOpen, setCellDropdownOpen,
  saving, onSave, onClose, addChip, removeChip,
}: DialogProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  function getCellKey(day: Day, meal: Meal) { return `${day}|${meal}`; }

  function getFiltered(day: Day, meal: Meal) {
    const key = getCellKey(day, meal);
    const input = (cellInputs[key] ?? "").toLowerCase();
    const existing = draftGrid[day][meal];
    return foodItems
      .filter(fi => !existing.includes(fi.name) && fi.name.toLowerCase().includes(input))
      .slice(0, 8);
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mt-8 mb-8 flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Weekly Menu</h2>
            <p className="text-sm text-gray-500 mt-0.5">{fmtWeekRange(weekStart)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-auto flex-1 px-6 py-4">
          <table className="w-full text-sm min-w-[700px] border-collapse">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 w-28 border border-gray-100 bg-gray-50">Meal / Day</th>
                {DAYS.map(d => (
                  <th key={d} className="px-3 py-2 text-left text-xs font-medium text-gray-500 border border-gray-100 bg-gray-50">
                    {DAY_LABELS[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEALS.map(meal => (
                <tr key={meal}>
                  <td className="px-3 py-2 font-semibold text-xs text-gray-500 border border-gray-100 bg-gray-50 align-top whitespace-nowrap">
                    {MEAL_LABELS[meal]}
                  </td>
                  {DAYS.map(day => {
                    const key = getCellKey(day, meal);
                    const chips = draftGrid[day][meal];
                    const inputVal = cellInputs[key] ?? "";
                    const filtered = getFiltered(day, meal);
                    const isOpen = cellDropdownOpen === key;
                    return (
                      <td key={day} className="border border-gray-100 px-2 py-2 align-top min-w-[120px]">
                        {/* Chips */}
                        <div className="flex flex-wrap gap-1 mb-1">
                          {chips.map((chip, i) => (
                            <span key={i} className="flex items-center gap-0.5 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">
                              {chip}
                              <button onClick={() => removeChip(day, meal, i)} className="ml-0.5 text-orange-400 hover:text-orange-700">
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                        {/* Input + dropdown */}
                        <div className="relative">
                          <input
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-orange-400"
                            placeholder="Type or pick…"
                            value={inputVal}
                            onChange={e => {
                              setCellInputs(prev => ({ ...prev, [key]: e.target.value }));
                              setCellDropdownOpen(key);
                            }}
                            onFocus={() => setCellDropdownOpen(key)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                addChip(day, meal, inputVal);
                              }
                              if (e.key === "Escape") setCellDropdownOpen(null);
                            }}
                          />
                          {isOpen && (filtered.length > 0 || inputVal.trim()) && (
                            <div className="absolute top-full left-0 z-10 mt-0.5 w-full bg-white border border-gray-200 rounded shadow-lg max-h-36 overflow-y-auto">
                              {inputVal.trim() && !filtered.find(f => f.name.toLowerCase() === inputVal.toLowerCase()) && (
                                <button
                                  className="w-full text-left px-2 py-1.5 text-xs text-orange-600 hover:bg-orange-50 border-b border-gray-100"
                                  onMouseDown={e => { e.preventDefault(); addChip(day, meal, inputVal); }}>
                                  + Add "{inputVal.trim()}"
                                </button>
                              )}
                              {filtered.map(fi => (
                                <button
                                  key={fi.id}
                                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-orange-50 text-gray-700"
                                  onMouseDown={e => { e.preventDefault(); addChip(day, meal, fi.name); }}>
                                  {fi.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={onSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
            {saving ? "Saving…" : "Save Menu"}
          </button>
        </div>
      </div>
    </div>
  );
}
