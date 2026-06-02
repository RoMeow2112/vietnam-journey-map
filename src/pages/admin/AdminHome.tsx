import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  MapPin,
  MessageSquare,
  Users,
  UserCheck,
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
  const [totalReviews, setTotalReviews] = useState(0);

  async function handleLogout() {
    await adminSupabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  async function loadDashboard() {
    try {
      setLoading(true);

      const { data: users, error } = await adminSupabase
        .from("profiles")
        .select("id,email,role,is_active");

      if (error) {
        console.error(error);
        return;
      }

      const userList = (users || []) as Profile[];

      setTotalUsers(userList.length);
      setActiveUsers(userList.filter((u) => u.is_active).length);
      setPendingUsers(userList.filter((u) => !u.is_active).length);

      const response = await fetch(`${API_URL}?action=places`);
      const json = await response.json();
      const places = (json.places || []) as Place[];

      setTotalPlaces(places.length);

      const { count: reviewCount, error: reviewError } = await adminSupabase
        .from("place_reviews")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null);

      if (reviewError) {
        console.error(reviewError);
      } else {
        setTotalReviews(reviewCount || 0);
      }
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
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-500">
              Tổng quan hệ thống Vietnam Discovery.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-5">
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

            <StatCard
              title="Total Reviews"
              value={totalReviews}
              icon={<MessageSquare className="h-5 w-5" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">Quick Actions</h2>
              <div className="space-y-4">
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

                <QuickLink
                  to="/admin/reviews"
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Manage Reviews"
                  desc="Xem và xoá mềm review spam"
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