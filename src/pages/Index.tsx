import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { VietnamMap } from "@/components/VietnamMap";
import { ProvinceModal } from "@/components/ProvinceModal";
import { PROVINCES, type Province } from "@/constants/mapData";
import { MapPin, Sparkles } from "lucide-react";

const Index = () => {
  const [selected, setSelected] = useState<Province | null>(null);

  const regions = [
    { name: "North", count: PROVINCES.filter(p => p.region === "North").length, color: "from-emerald-400 to-teal-500" },
    { name: "Central", count: PROVINCES.filter(p => p.region === "Central").length, color: "from-amber-400 to-orange-500" },
    { name: "South", count: PROVINCES.filter(p => p.region === "South").length, color: "from-cyan-400 to-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-soft text-primary text-sm font-medium mb-5">
          <Sparkles className="w-4 h-4" />
          Interactive Travel Map
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
          Discover <span className="bg-gradient-hero bg-clip-text text-transparent">Vietnam</span>
        </h1>
        <p className="max-w-2xl mx-auto text-muted-foreground text-lg leading-relaxed">
          From misty northern karsts to Mekong deltas — tap any province to uncover its iconic sights and beloved local flavors.
        </p>
      </section>

      {/* Region stats */}
      <section id="regions" className="container mx-auto px-4 mb-8">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
          {regions.map((r) => (
            <div
              key={r.name}
              className="bg-card border border-border rounded-xl p-4 text-center shadow-soft"
            >
              <div className="text-2xl font-bold text-foreground">{r.count}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{r.name} Vietnam</div>
            </div>
          ))}
        </div>
      </section>

      {/* Map */}
      <section id="map" className="container mx-auto px-4 pb-16">
        <div className="bg-card rounded-3xl shadow-soft border border-border p-4 sm:p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-4">
            <MapPin className="w-4 h-4 text-primary" />
            Hover to highlight, click to explore
          </div>
          <VietnamMap onSelectProvince={setSelected} />
        </div>
      </section>

      {/* About */}
      <section id="about" className="container mx-auto px-4 pb-20 text-center max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground mb-3">Plan your next journey</h2>
        <p className="text-muted-foreground">
          {PROVINCES.length} curated provinces. Real attractions. Iconic dishes. A starting point for your next Vietnam adventure.
        </p>
      </section>

      <ProvinceModal province={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Index;
