import { Navbar } from "@/components/Navbar";
import GoongMap from "@/components/GoongMap";
import { Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navbar />

      <section className="container mx-auto px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-soft text-primary text-sm font-medium mb-5">
          <Sparkles className="w-4 h-4" />
          Interactive Travel Map
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
          Discover{" "}
          <span className="bg-gradient-hero bg-clip-text text-transparent">
            Vietnam
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-muted-foreground text-lg leading-relaxed">
          Explore Vietnam through curated destinations, iconic sights, and local flavors.
        </p>
      </section>

      <section id="map" className="container mx-auto px-4 pb-16">
        <GoongMap />
      </section>

      <section
        id="about"
        className="container mx-auto px-4 pb-20 text-center max-w-2xl"
      >
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Plan your next journey
        </h2>

        <p className="text-muted-foreground">
          Select destinations on the map, review local highlights, and build your Vietnam journey.
        </p>
      </section>
    </div>
  );
};

export default Index;