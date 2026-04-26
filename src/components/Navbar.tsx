import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Compass, LogIn, LogOut, User } from "lucide-react";

export const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center shadow-soft">
            <Compass className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-foreground">Vietnam Discovery</div>
            <div className="text-xs text-muted-foreground hidden sm:block">Explore the S-shaped country</div>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#map" className="hover:text-primary transition-smooth">Map</a>
          <a href="#regions" className="hover:text-primary transition-smooth">Regions</a>
          <a href="#about" className="hover:text-primary transition-smooth">About</a>
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft">
                <div className="w-7 h-7 rounded-full bg-gradient-hero flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:inline">Traveler</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsLoggedIn(false)}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsLoggedIn(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft"
            >
              <LogIn className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
