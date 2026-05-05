import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { LogIn, Map } from "lucide-react";

export default function UserLogin() {
  async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) alert(error.message);
}

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <LogIn className="h-7 w-7" />
            </div>

            <h1 className="text-3xl font-bold text-foreground">User Login</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Đăng nhập bằng Google. Tài khoản mới cần admin verify trước khi sử dụng.
            </p>
          </div>

          <button
            onClick={loginWithGoogle}
            className="w-full rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-slate-50"
          >
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
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