import { SupabaseClient } from "@supabase/supabase-js";

const supabase = new SupabaseClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_SECRET || ""
);

export default supabase;