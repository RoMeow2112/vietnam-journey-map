import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Map } from "lucide-react";

import { supabase } from "@/lib/supabase";

type Mode = "login" | "register";

type AuthUserLike = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
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

async function syncUserProfile() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) return null;

  const userEmail = getUserEmail(user);
  const fullName = getFullName(user);
  const displayName = getDisplayName(user);
  const avatarUrl = getAvatarUrl(user);

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id,email,full_name,display_name,avatar_url,role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("[load existing profile error]", existingError);
    return null;
  }

  if (!existingProfile) {
    const { data, error } = await supabase
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
      .select("id,email,display_name,role,is_active")
      .single();

    if (error) {
      console.error("[insert profile error]", error);
      return null;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      email: existingProfile.email || userEmail,
      full_name: existingProfile.full_name || fullName,
      display_name: existingProfile.display_name || displayName,
      avatar_url: existingProfile.avatar_url || avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id,email,display_name,role,is_active")
    .single();

  if (error) {
    console.error("[syncUserProfile update error]", error);
    return null;
  }

  return data;
}

export default function UserLogin() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setMessage("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const profile = await syncUserProfile();

    if (!profile?.is_active) {
      await supabase.auth.signOut({ scope: "local" });

      setMessage("Tài khoản đang chờ admin verify.");
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate("/");
  }

  async function handleRegister() {
    if (!email.trim() || !password.trim()) {
      setMessage("Vui lòng nhập email và mật khẩu.");
      return;
    }

    if (password.length < 6) {
      setMessage("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    setLoading(true);
    setMessage("");

    const normalizedEmail = email.trim();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          email: normalizedEmail,
          display_name: normalizedEmail.split("@")[0],
          full_name: normalizedEmail.split("@")[0],
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await syncUserProfile();
    }

    setMessage("Đăng ký thành công. Tài khoản đang chờ admin verify.");
    setMode("login");
    setPassword("");
    setLoading(false);
  }

  function handleForgotPassword() {
    setMessage("Vui lòng liên hệ Admin để được cấp lại mật khẩu.");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-orange-50 text-orange-600 shadow-sm">
              <LogIn className="h-7 w-7" />
            </div>

            <h1 className="mb-2 text-3xl font-bold text-slate-900">
              {mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </h1>

            <p className="text-sm leading-relaxed text-slate-500">
              Tham gia cộng đồng du lịch Việt Nam và khám phá hành trình của bạn.
            </p>
          </div>

          <button
            onClick={loginWithGoogle}
            className="mb-5 flex h-12 w-full items-center justify-center gap-3 rounded-3xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="h-5 w-5"
            >
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15.3 18.9 12 24 12c3 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.7 39.6 16.3 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6.1 7.1l.1-.1 6.3 5.3C35.2 40.6 44 34 44 24c0-1.3-.1-2.3-.4-3.5z"
              />
            </svg>

            Continue with Google
          </button>

          <div className="mb-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <div className="text-sm text-slate-400">Đăng nhập bằng Email</div>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-full bg-slate-100 p-1">
            <button
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              className={
                mode === "login"
                  ? "rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm"
                  : "rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
              }
            >
              Đăng nhập
            </button>

            <button
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
              className={
                mode === "register"
                  ? "rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm"
                  : "rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
              }
            >
              Đăng ký
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Mật khẩu"
              className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                Ghi nhớ đăng nhập
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-orange-500 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              onClick={mode === "login" ? handleLogin : handleRegister}
              disabled={loading}
              className="h-12 w-full rounded-3xl bg-orange-500 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
              {loading
                ? "Đang xử lý..."
                : mode === "login"
                  ? "Đăng nhập"
                  : "Đăng ký"}
            </button>

            {message && (
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
                {message}
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 hover:underline"
            >
              <Map className="h-4 w-4" />
              Tiếp tục dùng bản đồ không cần đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}