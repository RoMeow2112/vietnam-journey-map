import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang xử lý đăng nhập...");

  useEffect(() => {
    async function handleAuth() {
      try {
        // lấy session sau khi Google redirect về
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session?.user) {
          setMessage("Không lấy được thông tin đăng nhập.");
          return;
        }

        const userId = session.user.id;

        // check profile (đã được trigger tạo)
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("is_active")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error(profileError);
          setMessage("Không tìm thấy profile.");
          return;
        }

        // ❌ chưa được verify
        if (!data?.is_active) {
          await supabase.auth.signOut();

          setMessage("Tài khoản đang chờ admin verify.");

          setTimeout(() => {
            navigate("/login");
          }, 2000);

          return;
        }

        // ✅ OK → vào hệ thống
        setMessage("Đăng nhập thành công...");

        setTimeout(() => {
          navigate("/");
        }, 1000);
      } catch (err) {
        console.error(err);
        setMessage("Có lỗi xảy ra.");
      }
    }

    handleAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-xl border px-6 py-4 text-sm text-slate-600">
        {message}
      </div>
    </div>
  );
}