import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Home, LogOut, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: Home },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Data Dashboard", path: "/admin/data-dashboard", icon: BarChart3 },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* SIDEBAR */}
      <aside className="w-64 border-r bg-white flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b">
          <p className="text-lg font-bold text-slate-900">
            Vietnam Admin
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Map Management
          </p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition",
                    isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">
            Admin Panel
          </h1>
        </div>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}