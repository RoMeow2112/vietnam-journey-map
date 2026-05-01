import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email: string;
  role: "admin" | "viewer";
  is_active: boolean;
};

export default function AdminGuard() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: sessionData } = await supabase.auth.getSession();

      const user = sessionData.session?.user;

      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id,email,role,is_active")
        .eq("id", user.id)
        .single<Profile>();

      if (error || !profile) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(profile.role === "admin" && profile.is_active);
      setLoading(false);
    }

    checkAuth();

    const { data } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}