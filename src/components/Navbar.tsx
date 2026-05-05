import { Link } from "react-router-dom";
import { LogIn, MapPin } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <div className="font-bold text-foreground">Vietnam Discovery</div>
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
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}