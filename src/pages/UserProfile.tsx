import { useEffect, useMemo, useState } from "react";
import { Camera, Lock, Save, User, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email?: string | null;
};

const AVATAR_BUCKET = "avatars";

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return avatarUrl;
  }, [avatarFile, avatarUrl]);

  async function loadProfile() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setErrorMessage("Vui lòng đăng nhập để xem profile.");
      setLoading(false);
      return;
    }

    const user = session.user;

    setUserId(user.id);
    setEmail(user.email || "");

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,display_name,avatar_url")
      .eq("id", user.id)
      .maybeSingle<Profile>();

    if (error) {
      console.error(error);
      setErrorMessage("Không tải được profile.");
      setLoading(false);
      return;
    }

    setDisplayName(
      profile?.display_name ||
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "",
    );

    setAvatarUrl(profile?.avatar_url || null);
    setLoading(false);
  }

  function validateAvatar(file: File) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Avatar chỉ hỗ trợ JPG, PNG hoặc WEBP.");
    }

    if (file.size > 3 * 1024 * 1024) {
      throw new Error("Avatar tối đa 3MB.");
    }
  }

  async function uploadAvatar(file: File, currentUserId: string) {
    validateAvatar(file);

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${currentUserId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSaveProfile() {
    if (!userId) {
      setErrorMessage("Không tìm thấy user hiện tại.");
      return;
    }

    if (!displayName.trim()) {
      setErrorMessage("Tên hiển thị không được để trống.");
      return;
    }

    setSavingProfile(true);
    setMessage("");
    setErrorMessage("");

    try {
      let nextAvatarUrl = avatarUrl;

      if (avatarFile) {
        nextAvatarUrl = await uploadAvatar(avatarFile, userId);
      }

      const { error } = await supabase.rpc("update_my_profile", {
        new_display_name: displayName.trim(),
        new_avatar_url: nextAvatarUrl || "",
      });

      if (error) throw error;

      await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          avatar_url: nextAvatarUrl,
        },
      });

      setAvatarUrl(nextAvatarUrl);
      setAvatarFile(null);
      setMessage("Cập nhật profile thành công.");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Không cập nhật được profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) {
      setErrorMessage("Vui lòng nhập đầy đủ mật khẩu mới.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSavingPassword(true);
    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      setMessage("Đổi mật khẩu thành công.");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Không đổi được mật khẩu.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-xl border bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Đang tải profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Cập nhật avatar, tên hiển thị và mật khẩu của bạn.
          </p>
        </div>

        {(message || errorMessage) && (
          <div
            className={
              errorMessage
                ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            }
          >
            {errorMessage || message}
          </div>
        )}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-700" />
            <h2 className="text-xl font-semibold text-slate-900">
              Thông tin cá nhân
            </h2>
          </div>

          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border bg-slate-100">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-slate-400">
                    {displayName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Camera className="h-4 w-4" />
                Đổi avatar

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (!file) return;

                    try {
                      validateAvatar(file);
                      setAvatarFile(file);
                      setErrorMessage("");
                    } catch (error) {
                      setErrorMessage(
                        error instanceof Error
                          ? error.message
                          : "Avatar không hợp lệ.",
                      );
                    }
                  }}
                />
              </label>

              {avatarFile && (
                <button
                  type="button"
                  onClick={() => setAvatarFile(null)}
                  className="inline-flex items-center gap-1 text-sm text-red-500 hover:underline"
                >
                  <X className="h-4 w-4" />
                  Huỷ ảnh đã chọn
                </button>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  value={email}
                  disabled
                  className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tên hiển thị
                </label>

                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Nhập tên hiển thị"
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {savingProfile ? "Đang lưu..." : "Lưu profile"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-700" />
            <h2 className="text-xl font-semibold text-slate-900">
              Đổi mật khẩu
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Mật khẩu mới
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Xác nhận mật khẩu
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Lock className="h-4 w-4" />
            {savingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
        </div>
      </div>
    </div>
  );
}