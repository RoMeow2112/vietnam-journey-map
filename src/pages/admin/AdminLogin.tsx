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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 rounded-[40px] bg-white/70 p-6 shadow-2xl backdrop-blur-xl md:p-10 lg:flex-row">
        <div className="flex-1 rounded-[32px] bg-gradient-to-br from-emerald-600 to-slate-900 p-10 text-white shadow-xl">
          <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm uppercase tracking-[0.28em] text-emerald-100/90">
            Admin Portal
          </span>
          <h1 className="mt-8 text-4xl font-semibold leading-tight">
            Welcome back, Admin
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-100/85">
            Truy cập trang quản trị để duyệt dữ liệu, quản lý user và kiểm tra chất lượng nội dung.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl"
        >
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-slate-900">Admin Login</h1>
            <p className="mt-2 text-sm text-slate-500">
              Đăng nhập để truy cập trang quản trị.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {errorMessage && (
              <div className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}