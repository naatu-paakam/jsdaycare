/**
 * Global teardown — runs after the full Playwright suite completes.
 * Purges all TC-* test data created during the run so the DB stays clean
 * between test runs. This prevents accumulation of duplicate test records.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env" });

export default async function globalTeardown() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_KEY!,
  );

  const results = await Promise.all([
    // Test students (TC- prefix)
    supabase.from("students").delete().ilike("first_name", "TC-%"),
    // Test food items
    supabase.from("food_items").delete().ilike("name", "TC-%"),
    // Test invitations
    supabase.from("invitations").delete().ilike("email", "tc-%"),
    // Orphaned test schedules for TC- students are cascade-deleted with students
  ]);

  const errors = results.filter(r => r.error).map(r => r.error!.message);
  if (errors.length) {
    console.warn("[teardown] Some cleanup failed:", errors.join(", "));
  } else {
    console.log("[teardown] TC-* test data purged from DB.");
  }
}
