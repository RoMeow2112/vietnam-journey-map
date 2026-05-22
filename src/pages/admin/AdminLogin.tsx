import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminSupabase } from "@/lib/supabase";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { data, error } = await adminSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setErrorMessage(error?.message || "Login failed");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", data.user.id)
      .single();

    if (
      profileError ||
      !profile ||
      profile.role !== "admin" ||
      !profile.is_active
    ) {
      await adminSupabase.auth.signOut({ scope: "local" });
      setErrorMessage("Tài khoản không có quyền admin.");
      setLoading(false);
      return;
    }

    navigate("/admin", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>

        <p className="mt-1 text-sm text-slate-500">
          Đăng nhập để truy cập trang quản trị.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-emerald-500"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-emerald-500"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </div>
      </form>
    </div>
  );
}