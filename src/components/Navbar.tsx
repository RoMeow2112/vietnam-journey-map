import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LogIn,
  LogOut,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type AuthUser = {
  id: string;
  email?: string;
};

export function Navbar() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
      });
    } else {
      setUser(null);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <div className="font-bold text-foreground">
              Vietnam Discovery
            </div>

            <div className="text-xs text-muted-foreground">
              Explore the S-shaped country
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="/#map" className="hover:text-foreground">
            Map
          </a>

          <a href="/#about" className="hover:text-foreground">
            About
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {!loading && !user && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}

          {!loading && user && (
            <>
              <div className="hidden items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm md:flex">
                <User className="h-4 w-4 text-slate-500" />

                <span className="max-w-[180px] truncate text-slate-700">
                  {user.email}
                </span>
              </div>

              {/* <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link> */}

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}