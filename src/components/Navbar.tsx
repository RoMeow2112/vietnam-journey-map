import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, User } from "lucide-react";

import { supabase } from "@/lib/supabase";

type AuthUser = {
  id: string;
  email?: string;
};

export function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitedProvinceCount, setVisitedProvinceCount] = useState(0);

  const totalProvinceCount = 63;
  const progressPercent =
    totalProvinceCount > 0
      ? (visitedProvinceCount / totalProvinceCount) * 100
      : 0;

  async function loadVisitedProvinceCount(userId?: string) {
    if (!userId) {
      setVisitedProvinceCount(0);
      return;
    }

    const { count, error } = await supabase
      .from("user_visited_provinces")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    setVisitedProvinceCount(count || 0);
  }

  async function loadUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sessionUser = session?.user;

    if (sessionUser) {
      setUser({
        id: sessionUser.id,
        email: sessionUser.email,
      });

      await loadVisitedProvinceCount(sessionUser.id);
    } else {
      setUser(null);
      setVisitedProvinceCount(0);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    setUser(null);
    setVisitedProvinceCount(0);

    navigate("/", {
      replace: true,
    });
  }

  function getUserDisplayName() {
    if (!user?.email) return "Guest";

    return user.email.split("@")[0];
  }

  function getUserInitial() {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  }

  useEffect(() => {
    loadUser();

    const handleVisitedUpdated = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await loadVisitedProvinceCount(session?.user?.id);
    };

    window.addEventListener(
      "visited-provinces-updated",
      handleVisitedUpdated,
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;

      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email,
        });

        loadVisitedProvinceCount(sessionUser.id);
      } else {
        setUser(null);
        setVisitedProvinceCount(0);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();

      window.removeEventListener(
        "visited-provinces-updated",
        handleVisitedUpdated,
      );
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-500 text-base font-semibold text-white shadow-sm">
            {!loading && user ? getUserInitial() : <User className="h-5 w-5" />}
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-foreground">
              {!loading && user ? getUserDisplayName() : "Vietnam Discovery"}
            </div>

            <div className="mt-0.5 text-xs text-muted-foreground">
              Hành trình khám phá Việt Nam
            </div>
          </div>
        </Link>

        <div className="hidden flex-1 items-center justify-center px-8 md:flex">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-medium leading-none text-orange-500">
                {visitedProvinceCount}/{totalProvinceCount}
              </div>

              <div className="mt-1.5 text-sm text-muted-foreground">
                Tỉnh thành
              </div>
            </div>

            <div className="h-10 w-px bg-border" />

            <div className="text-center">
              <div className="text-2xl font-medium leading-none text-orange-500">
                {progressPercent.toFixed(2)} %
              </div>

              <div className="mt-1.5 text-sm text-muted-foreground">
                Việt Nam
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!loading && !user && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}

          {!loading && user && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-white px-4 py-3 md:hidden">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              Tỉnh thành đã đi
            </span>

            <span className="font-semibold text-orange-500">
              {visitedProvinceCount}/{totalProvinceCount}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}