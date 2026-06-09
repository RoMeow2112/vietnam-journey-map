import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type AuthUserLike = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
};

function getMetaString(
  metadata: Record<string, unknown> | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getUserEmail(user: AuthUserLike) {
  return (
    user.email ||
    getMetaString(user.user_metadata, "email") ||
    `${user.id}@no-email.local`
  );
}

function getFullName(user: AuthUserLike) {
  return (
    getMetaString(user.user_metadata, "full_name") ||
    getMetaString(user.user_metadata, "name") ||
    null
  );
}

function getDisplayName(user: AuthUserLike) {
  return (
    getMetaString(user.user_metadata, "display_name") ||
    getMetaString(user.user_metadata, "full_name") ||
    getMetaString(user.user_metadata, "name") ||
    user.email?.split("@")[0] ||
    "User"
  );
}

function getAvatarUrl(user: AuthUserLike) {
  return (
    getMetaString(user.user_metadata, "avatar_url") ||
    getMetaString(user.user_metadata, "picture") ||
    null
  );
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang xử lý đăng nhập...");

  useEffect(() => {
    let mounted = true;

    async function handleAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("[getSession error]", error);
          setMessage("Không lấy được thông tin đăng nhập.");
          return;
        }

        if (!session?.user) {
          setMessage("Không tìm thấy phiên đăng nhập.");
          return;
        }

        const user = session.user;

        const userEmail = getUserEmail(user);
        const fullName = getFullName(user);
        const displayName = getDisplayName(user);
        const avatarUrl = getAvatarUrl(user);

        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id,email,full_name,display_name,avatar_url,is_active")
          .eq("id", user.id)
          .maybeSingle<Profile>();

        if (!mounted) return;

        if (profileError) {
          console.error("[profileError]", profileError);
          setMessage("Không kiểm tra được profile. Vui lòng thử lại.");
          return;
        }

        let profile = existingProfile;

        if (!profile) {
          const { data: insertedProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: userEmail,
              full_name: fullName,
              display_name: displayName,
              avatar_url: avatarUrl,
              role: "user",
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .select("id,email,full_name,display_name,avatar_url,is_active")
            .single<Profile>();

          if (!mounted) return;

          if (insertError) {
            console.error("[insertProfileError]", insertError);
            setMessage("Không tạo được profile. Vui lòng thử lại.");
            return;
          }

          profile = insertedProfile;
        } else {
          const shouldUpdateProfile =
            !profile.email ||
            !profile.full_name ||
            !profile.display_name ||
            !profile.avatar_url;

          if (shouldUpdateProfile) {
            const { data: updatedProfile, error: updateError } = await supabase
              .from("profiles")
              .update({
                email: profile.email || userEmail,
                full_name: profile.full_name || fullName,
                display_name: profile.display_name || displayName,
                avatar_url: profile.avatar_url || avatarUrl,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id)
              .select("id,email,full_name,display_name,avatar_url,is_active")
              .single<Profile>();

            if (!mounted) return;

            if (updateError) {
              console.error("[updateProfileError]", updateError);
              setMessage("Không cập nhật được profile. Vui lòng thử lại.");
              return;
            }

            profile = updatedProfile;
          }
        }

        // Chỉ signOut khi chắc chắn profile tồn tại và bị inactive.
        if (profile && profile.is_active === false) {
          await supabase.auth.signOut({ scope: "local" });

          if (!mounted) return;

          setMessage("Tài khoản đang chờ admin verify.");

          setTimeout(() => {
            navigate("/login");
          }, 2000);

          return;
        }

        if (!profile) {
          setMessage("Không tìm thấy profile. Vui lòng thử lại.");
          return;
        }

        setMessage("Đăng nhập thành công...");

        setTimeout(() => {
          navigate("/");
        }, 800);
      } catch (err) {
        console.error("[AuthCallback error]", err);

        if (!mounted) return;

        // Không signOut trong catch để tránh F5/callback lỗi tạm thời làm mất account.
        setMessage("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    }

    handleAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="rounded-xl border bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
        {message}
      </div>
    </div>
  );
}