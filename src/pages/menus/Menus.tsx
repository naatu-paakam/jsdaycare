import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { FoodItem, FoodCategory } from "@/lib/types";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const MEALS = ["breakfast","am_snack","lunch","pm_snack"] as const;
const MEAL_LABELS: Record<string, string> = { breakfast: "Breakfast", am_snack: "AM Snack", lunch: "Lunch", pm_snack: "PM Snack" };
const CATEGORY_COLORS: Record<FoodCategory, string> = {
  grain: "bg-amber-100 text-amber-700",
  protein: "bg-red-100 text-red-700",
  fruit: "bg-pink-100 text-pink-700",
  vegetable: "bg-green-100 text-green-700",
  dairy: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-600",
};

export default function Menus() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<"menu" | "library">("menu");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [newItem, setNewItem] = useState({ name: "", category: "fruit" as FoodCategory, allergens: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;
    fetchFoodItems();
  }, [profile?.school_id]);

  async function fetchFoodItems() {
    const { data } = await supabase
      .from("food_items")
      .select("*")
      .eq("school_id", profile!.school_id!)
      .order("category").order("name");
    setFoodItems(data ?? []);
  }

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

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Menus</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(["menu","library"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              {t === "library" ? "Food Item Library" : "Weekly Menu"}
            </button>
          ))}
        </div>

        {/* Weekly Menu tab */}
        {tab === "menu" && (
          <div className="card overflow-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 w-28">Meal</th>
                  {DAYS.map(d => <th key={d} className="px-4 py-3 text-left text-xs font-medium text-gray-400">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {MEALS.map(meal => (
                  <tr key={meal} className="border-b border-gray-50">
                    <td className="px-4 py-4 font-medium text-gray-600 text-xs">{MEAL_LABELS[meal]}</td>
                    {DAYS.map(day => (
                      <td key={day} className="px-4 py-4">
                        <div className="text-xs text-gray-400 italic">— not set</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 p-4 border-t border-gray-100">
              Weekly menu templates coming in R1. Use the Food Item Library to manage available items.
            </p>
          </div>
        )}

        {/* Food Item Library tab */}
        {tab === "library" && (
          <div className="space-y-4">
            {/* Add new item */}
            <div className="card p-4 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Item name</label>
                <input className="input w-full" placeholder="e.g. Brown rice" value={newItem.name} onChange={e => setNewItem(f => ({...f, name: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                <select className="input" value={newItem.category} onChange={e => setNewItem(f => ({...f, category: e.target.value as FoodCategory}))}>
                  {(["grain","protein","fruit","vegetable","dairy","other"] as FoodCategory[]).map(c => (
                    <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-40">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Allergens (comma-separated)</label>
                <input className="input w-full" placeholder="e.g. gluten, dairy" value={newItem.allergens} onChange={e => setNewItem(f => ({...f, allergens: e.target.value}))} />
              </div>
              <button onClick={addFoodItem} disabled={adding} className="btn-primary flex items-center gap-2">
                <Plus size={15} />{adding ? "Adding..." : "Add Item"}
              </button>
            </div>

            {/* Grouped list */}
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
    </Layout>
  );
}
