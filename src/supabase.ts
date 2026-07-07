import { createClient } from "@supabase/supabase-js";

// Retrieve keys from environment variables or use the user's provided credentials as a direct fallback
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "https://ojfgsbybgdzddxorswvg.supabase.co";
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "sb_publishable_xqgWOzGd7HI6V-XkCXjOvw_CBs-PRfx";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Checks if a database table exists or is accessible.
 * Useful for displaying helpful setup instructions to the user.
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.from("products").select("id").limit(1);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}
