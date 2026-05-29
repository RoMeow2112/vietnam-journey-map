import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

function getDisplayName(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  return (
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User"
  );
}

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
        const displayName = getDisplayName(user);

        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id,display_name,is_active")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("[profileError]", profileError);
          setMessage("Không kiểm tra được profile.");
          await supabase.auth.signOut({ scope: "local" });
          return;
        }

        let profile = existingProfile;

        if (!profile) {
          const { data: insertedProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              display_name: displayName,
              role: "user",
              is_active: false,
            })
            .select("id,display_name,is_active")
            .single();

          if (insertError) {
            console.error("[insertProfileError]", insertError);
            setMessage("Không tạo được profile.");
            await supabase.auth.signOut({ scope: "local" });
            return;
          }

          profile = insertedProfile;
        } else if (!profile.display_name) {
          const { data: updatedProfile, error: updateError } = await supabase
            .from("profiles")
            .update({
              display_name: displayName,
            })
            .eq("id", user.id)
            .select("id,display_name,is_active")
            .single();

          if (updateError) {
            console.error("[updateProfileError]", updateError);
            setMessage("Không cập nhật được tên user.");
            await supabase.auth.signOut({ scope: "local" });
            return;
          }

          profile = updatedProfile;
        }

        if (!profile?.is_active) {
          await supabase.auth.signOut({ scope: "local" });
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
        console.error("[AuthCallback error]", err);
        await supabase.auth.signOut({ scope: "local" });
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