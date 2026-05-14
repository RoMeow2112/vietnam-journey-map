import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang xử lý đăng nhập...");

  useEffect(() => {
    async function handleAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session?.user) {
          setMessage("Không lấy được thông tin đăng nhập.");
          return;
        }

        const user = session.user;

        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id,is_active")
          .eq("id", user.id)
          .maybeSingle();

        let profile = existingProfile;

        // fallback: nếu trigger chưa tạo profile thì tạo bằng FE
        if (!profile && !profileError) {
          const { data: insertedProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              role: "user",
              is_active: false,
            })
            .select("id,is_active")
            .single();

          if (insertError) {
            console.error(insertError);
            setMessage("Không tạo được profile.");
            await supabase.auth.signOut();
            return;
          }

          profile = insertedProfile;
        }

        if (profileError) {
          console.error(profileError);
          setMessage("Không kiểm tra được profile.");
          await supabase.auth.signOut();
          return;
        }

        if (!profile?.is_active) {
          await supabase.auth.signOut();
          setMessage("Tài khoản đang chờ admin verify.");

          setTimeout(() => {
            navigate("/login");
          }, 2000);

          return;
        }

        setMessage("Đăng nhập thành công...");

        setTimeout(() => {
          navigate("/");
        }, 800);
      } catch (err) {
        console.error(err);
        await supabase.auth.signOut();
        setMessage("Có lỗi xảy ra.");
      }
    }

    handleAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="rounded-xl border bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
        {message}
      </div>
    </div>
  );
}