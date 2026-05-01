import { supabase } from "@/lib/supabase";

export default function AdminHome() {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              User CRUD và Data Dashboard sẽ làm ở bước sau.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}