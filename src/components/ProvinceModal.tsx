import { AnimatePresence, motion } from "framer-motion";
import { X, MapPin, Utensils, Camera } from "lucide-react";
import type { Province, PlaceItem } from "@/constants/mapData";
import { useEffect } from "react";

interface ProvinceModalProps {
  province: Province | null;
  onClose: () => void;
}

const Card = ({ item }: { item: PlaceItem }) => (
  <div className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-elevated transition-smooth">
    <div className="aspect-[4/3] overflow-hidden bg-muted">
      <img
        src={item.image}
        alt={item.name}
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=70";
        }}
        className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
      />
    </div>
    <div className="p-4">
      <h4 className="font-semibold text-foreground mb-1">{item.name}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
    </div>
  </div>
);

export const ProvinceModal = ({ province, onClose }: ProvinceModalProps) => {
  useEffect(() => {
    if (!province) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [province, onClose]);

  return (
    <AnimatePresence>
      {province && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-elevated border border-border"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-hero text-primary-foreground p-6 sm:p-8">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 p-2 rounded-full bg-background/20 hover:bg-background/30 transition-smooth"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-2">
                <MapPin className="w-4 h-4" />
                <span>{province.region} Vietnam</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{province.name}</h2>
              <p className="mt-2 text-primary-foreground/90">
                Discover {province.attractions.length} attractions and {province.foods.length} local dishes.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-10">
              {/* Attractions */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Famous Attractions</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {province.attractions.map((a) => (
                    <Card key={a.name} item={a} />
                  ))}
                </div>
              </section>

              {/* Foods */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Utensils className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Local Specialties</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {province.foods.map((f) => (
                    <Card key={f.name} item={f} />
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
