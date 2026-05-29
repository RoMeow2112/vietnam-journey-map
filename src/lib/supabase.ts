import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "user-auth-session",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "admin-auth-session",
    persistSession: true,
    autoRefreshToken: true,

    // Rất quan trọng:
    // Admin không dùng OAuth callback, nên không được đọc session từ URL.
    // Nếu bật true, khi user login Google ở /auth/callback,
    // adminSupabase có thể bị ghi đè session admin bằng session user.
    detectSessionInUrl: false,
  },
});