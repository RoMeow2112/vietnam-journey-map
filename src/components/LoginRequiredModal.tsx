import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type LoginRequiredModalProps = {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
};

type Mode = "login" | "register";

export default function LoginRequiredModal({
  open,
  onClose,
  onLoginSuccess,
}: LoginRequiredModalProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!open) return null;

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

  async function checkVerified(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    return data?.is_active === true;
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setMessage("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    try {
      const verified = await checkVerified(data.user.id);

      if (!verified) {
        await supabase.auth.signOut();
        setMessage("Tài khoản đang chờ admin verify.");
        setLoading(false);
        return;
      }

      setMessage("");
      onLoginSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      await supabase.auth.signOut();
      setMessage("Không kiểm tra được trạng thái tài khoản.");
    }

    setLoading(false);
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

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Đăng ký thành công. Tài khoản đang chờ admin verify.");
      setMode("login");
      setPassword("");
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <h2 className="mb-3 text-3xl font-bold uppercase text-slate-900">
            {mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </h2>

          <p className="text-sm leading-relaxed text-slate-500">
            Tham gia ngay cộng đồng du lịch Việt Nam và xem thông tin chi tiết của từng địa điểm.
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
                d="M6.3 14.7l6.6 4.8C14.7 15.3 18.9 12 24 12c3 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"
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
          <span className="text-sm text-slate-400">Đăng nhập bằng Email</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className={
              mode === "login"
                ? "rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm text-slate-900"
                : "rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
            }
          >
            Đăng nhập
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("register");
              setMessage("");
            }}
            className={
              mode === "register"
                ? "rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm text-slate-900"
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
            className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-500">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950" />
              Ghi nhớ đăng nhập
            </label>

            <button type="button" className="text-slate-900 hover:underline">
              Quên mật khẩu?
            </button>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={mode === "login" ? handleLogin : handleRegister}
            className="h-12 w-full rounded-3xl bg-slate-950 text-sm font-semibold uppercase text-white transition hover:bg-slate-900 disabled:opacity-60"
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
      </div>
    </div>
  );
}