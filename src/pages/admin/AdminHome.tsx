import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  MapPin,
  Users,
  UserCheck,
  LogOut,
} from "lucide-react";

import { adminSupabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
};

type Place = {
  id: string;
};

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

export default function AdminHome() {
  const [loading, setLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);

  const [totalPlaces, setTotalPlaces] = useState(0);

  async function handleLogout() {
    await adminSupabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  async function loadDashboard() {
    try {
      setLoading(true);

      // USERS
      const { data: users, error } = await adminSupabase
        .from("profiles")
        .select("id,email,role,is_active");

      if (error) {
        console.error(error);
        return;
      }

      const userList = (users || []) as Profile[];

      setTotalUsers(userList.length);

      setActiveUsers(
        userList.filter((u) => u.is_active).length,
      );

      setPendingUsers(
        userList.filter((u) => !u.is_active).length,
      );

      // PLACES
      const response = await fetch(`${API_URL}?action=places`);
      const json = await response.json();

      const places = (json.places || []) as Place[];

      setTotalPlaces(places.length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Tổng quan hệ thống Vietnam Discovery.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Logout
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Total Users"
              value={totalUsers}
              icon={<Users className="h-5 w-5" />}
            />

            <StatCard
              title="Active Users"
              value={activeUsers}
              icon={<UserCheck className="h-5 w-5" />}
            />

            <StatCard
              title="Pending Verify"
              value={pendingUsers}
              icon={<Users className="h-5 w-5" />}
            />

            <StatCard
              title="Total Places"
              value={totalPlaces}
              icon={<MapPin className="h-5 w-5" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">
                Quick Actions
              </h2>

              <div className="space-y-3">
                <QuickLink
                  to="/admin/users"
                  icon={<Users className="h-5 w-5" />}
                  title="Manage Users"
                  desc="CRUD và verify user"
                />

                <QuickLink
                  to="/admin/data-dashboard"
                  icon={<Database className="h-5 w-5" />}
                  title="Data Dashboard"
                  desc="Kiểm tra dữ liệu map"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icon}
      </div>

      <div className="text-sm text-slate-500">{title}</div>

      <div className="mt-1 text-3xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-xl border p-4 hover:bg-slate-50"
    >
      <div className="mt-1 text-emerald-700">{icon}</div>

      <div>
        <div className="font-semibold text-slate-900">
          {title}
        </div>

        <div className="text-sm text-slate-500">
          {desc}
        </div>
      </div>
    </Link>
  );
}