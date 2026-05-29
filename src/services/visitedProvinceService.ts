import { supabase } from "@/lib/supabase";

export type VisitedProvince = {
  id: string;
  user_id: string;
  province_key: string;
  province_name: string;
  visited_at: string;
};

export async function getMyVisitedProvinces() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return [];

  const { data, error } = await supabase
    .from("user_visited_provinces")
    .select("*")
    .eq("user_id", session.user.id)
    .order("visited_at", { ascending: false });

  if (error) throw error;

  return data as VisitedProvince[];
}

export async function markProvinceVisited(
  provinceKey: string,
  provinceName: string,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { data, error } = await supabase
    .from("user_visited_provinces")
    .upsert(
      {
        user_id: session.user.id,
        province_key: provinceKey,
        province_name: provinceName,
      },
      {
        onConflict: "user_id,province_key",
      },
    )
    .select()
    .single();

  if (error) throw error;

  window.dispatchEvent(new Event("visited-provinces-updated"));

  return data as VisitedProvince;
}