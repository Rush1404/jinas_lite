import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

// We cast through 'any' because our Database types are documentation-only.
// Supabase's gen types CLI can produce a proper generic later.
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);