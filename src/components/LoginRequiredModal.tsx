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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <h2 className="mb-3 text-3xl font-bold uppercase text-slate-900">
            Đăng nhập
          </h2>

          <p className="text-sm leading-relaxed text-slate-500">
            Tham gia ngay cộng đồng du lịch Việt Nam và xem thông tin chi tiết
            của từng địa điểm.
          </p>
        </div>

        <button
          type="button"
          onClick={loginWithGoogle}
          className="mb-5 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <span className="text-xl font-bold">G</span>
          Đăng nhập bằng Google
        </button>

        <div className="mb-5 flex items-center gap-4">
          <div className="h-px flex-1 border-t border-dashed border-slate-300" />
          <span className="text-sm text-slate-400">Đăng nhập bằng Email</span>
          <div className="h-px flex-1 border-t border-dashed border-slate-300" />
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className={
              mode === "login"
                ? "rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-sm"
                : "rounded-lg px-4 py-2 text-sm text-slate-500"
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
                ? "rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-sm"
                : "rounded-lg px-4 py-2 text-sm text-slate-500"
            }
          >
            Đăng ký
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="h-12 w-full rounded-xl border px-4 text-sm outline-none focus:border-emerald-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            className="h-12 w-full rounded-xl border px-4 text-sm outline-none focus:border-emerald-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-500">
              <input type="checkbox" />
              Ghi nhớ đăng nhập
            </label>

            <button type="button" className="text-orange-500 hover:underline">
              Quên mật khẩu?
            </button>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={mode === "login" ? handleLogin : handleRegister}
            className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-semibold uppercase text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading
              ? "Đang xử lý..."
              : mode === "login"
                ? "Đăng nhập"
                : "Đăng ký"}
          </button>

          {message && (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}